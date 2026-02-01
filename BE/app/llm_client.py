"""Gemini LLM API client."""

import asyncio
import json
import logging
import os
import re
import time
from datetime import datetime, timezone

from app.config import settings
from app.models import BatchedLLMResponse, BatchedLLMResponseItem
from app.settings_store import get_api_key, get_thresholds

logger = logging.getLogger(__name__)

# Log file for combined LLM request/response (relative to cwd when server runs)
LLM_LOG_DIR = "logs"
LLM_LOG_FILE = "llm_request_response.log"


def _write_llm_log(combined_request: str, combined_response: str) -> None:
    """Append combined request and response to the LLM log file."""
    try:
        os.makedirs(LLM_LOG_DIR, exist_ok=True)
        path = os.path.join(LLM_LOG_DIR, LLM_LOG_FILE)
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        with open(path, "a", encoding="utf-8") as f:
            f.write(f"\n{'='*80}\n")
            f.write(f"LLM Request/Response — {ts}\n")
            f.write(f"{'='*80}\n\n")
            f.write("REQUEST (combined prompt sent to LLM):\n")
            f.write("-" * 40 + "\n")
            f.write(combined_request)
            f.write("\n\n")
            f.write("RESPONSE (raw response from LLM):\n")
            f.write("-" * 40 + "\n")
            f.write(combined_response)
            f.write("\n\n")
    except OSError as e:
        logger.warning("Failed to write LLM request/response to log file: %s", e)


class LLMClient:
    """Client for calling Gemini API."""

    def __init__(self):
        self._client = None
        self._client_api_key: str | None = None

    def _get_client(self):
        """Lazy-init Gemini client (sync). Uses settings store API key if set. Recreates if key changed."""
        api_key = get_api_key() or settings.gemini_api_key
        if self._client is None or self._client_api_key != api_key:
            from google import genai
            self._client = genai.Client(api_key=api_key)
            self._client_api_key = api_key
        return self._client

    async def generate_batch(
        self,
        prompts: list[str],
        priorities: list,
        max_tokens: int,
        request_ids: list[str] | None = None,
    ) -> BatchedLLMResponse:
        """
        Send all prompts in ONE combined request to the LLM.
        Parse the structured response and split back into individual results by index.
        """
        model = settings.gemini_model
        client = self._get_client()
        n = len(prompts)
        request_ids = request_ids or [str(i) for i in range(n)]

        # All items in a batch have same priority (same queue)
        priority = priorities[0]
        system_instruction = priority.system_instruction
        th = get_thresholds(priority.name)
        priority_max_tokens = th["tokens"]

        # Total tokens needed for combined response (all answers)
        total_max_tokens = min(32768, priority_max_tokens * n)

        # Build ONE combined prompt: list all questions with index and request_id
        questions_block = "\n".join(
            f"Index {i} (request_id: {request_ids[i]}): {prompts[i]}"
            for i in range(n)
        )
        combined_prompt = f"""{system_instruction}

Answer each of the following questions. Return ONLY a valid JSON array. Each element must be an object with exactly two keys: "index" (number) and "response" (string). One element per question, in order. No other text or markdown.

Example format: [{{"index": 0, "response": "..."}}, {{"index": 1, "response": "..."}}]

Questions:
{questions_block}"""

        logger.info(
            f"[LLM_BATCH] Sending 1 combined request for {n} prompts (request_ids={request_ids}). "
            f"max_tokens={total_max_tokens}"
        )
        logger.info(f"[LLM_PROMPT] Combined prompt sent to LLM:\n{combined_prompt}")

        def _single_call():
            try:
                from google.genai import types #type: ignore
                gen_config = types.GenerateContentConfig(
                    max_output_tokens=total_max_tokens,
                    temperature=0.7 if priority.value == 1 else (0.3 if priority.value == 2 else 0.9),
                )
            except (ImportError, AttributeError):
                gen_config = {"max_output_tokens": total_max_tokens}

            response = client.models.generate_content(
                model=model,
                contents=combined_prompt,
                config=gen_config,
            )
            text = getattr(response, "text", None) or ""
            if not text and getattr(response, "candidates", None):
                cand = response.candidates[0]
                parts = getattr(getattr(cand, "content", None), "parts", None) or []
                text = " ".join(getattr(p, "text", "") or "" for p in parts)
            usage = getattr(response, "usage_metadata", None)
            total_tokens = getattr(usage, "total_token_count", None) or 0
            return text.strip(), total_tokens

        start = time.perf_counter()
        loop = asyncio.get_event_loop()
        response_text, total_tokens = await loop.run_in_executor(None, _single_call)
        elapsed_ms = (time.perf_counter() - start) * 1000

        # Log combined request and response to file
        _write_llm_log(combined_prompt, response_text or "(empty response)")

        # Parse JSON from response (strip markdown code block if present)
        parsed = self._parse_batch_response(response_text, n)
        tokens_per_item = total_tokens // n if n else 0
        remainder = total_tokens - (tokens_per_item * n)

        results = []
        for i in range(n):
            text = parsed.get(i, "[failed to parse response for this index]")
            tok = tokens_per_item + (1 if i < remainder else 0)
            results.append(BatchedLLMResponseItem(index=i, text=text, tokens_used=tok))
        results.sort(key=lambda x: x.index)

        logger.info(
            f"[LLM_BATCH] Received 1 response, split into {len(results)} results. "
            f"total_tokens={total_tokens} elapsed_ms={elapsed_ms:.2f}"
        )
        return BatchedLLMResponse(results=results, model_latency_ms=elapsed_ms)

    def _parse_batch_response(self, response_text: str, expected_count: int) -> dict[int, str]:
        """Extract JSON array from LLM response and return index -> response text mapping."""
        if not response_text:
            return {}

        # Remove markdown code block if present
        text = response_text.strip()
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text)
            text = re.sub(r"\s*```$", "", text)
        text = text.strip()

        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            logger.warning(f"[LLM_BATCH] JSON parse failed, raw response (first 500 chars): {response_text[:500]}")
            return {}

        if not isinstance(data, list):
            logger.warning(f"[LLM_BATCH] Expected JSON array, got {type(data)}")
            return {}

        out = {}
        for item in data:
            if not isinstance(item, dict):
                continue
            idx = item.get("index")
            resp = item.get("response")
            if idx is not None and resp is not None:
                out[int(idx)] = str(resp).strip()
        return out
