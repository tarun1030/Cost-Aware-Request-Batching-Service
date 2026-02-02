"""Gemini LLM API client with improved JSON parsing for batch responses."""

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
        th = get_thresholds(priority.name)
        priority_max_tokens = th["tokens"]

        # Total tokens needed for combined response (all answers)
        # Add buffer for JSON structure overhead + safety margin
        # Increase buffer significantly to avoid truncation
        total_max_tokens = min(32768, int(priority_max_tokens * n * 1.5) + 500)

        # Build system instruction based on priority
        if priority.value == 2:  # HIGH
            style_instruction = "Keep each answer VERY brief (1-3 sentences max)."
        elif priority.value == 1:  # MEDIUM
            style_instruction = "Keep each answer moderately detailed (2-5 sentences)."
        else:  # LOW
            style_instruction = "Provide detailed, comprehensive answers with explanations."

        # Build ONE combined prompt with strict JSON formatting instructions
        questions_block = "\n".join(
            f"Index {i} (request_id: {request_ids[i]}): {prompts[i]}"
            for i in range(n)
        )
        
        combined_prompt = f"""{style_instruction}

Answer each question below. You MUST return ONLY a valid JSON array with no other text.

CRITICAL FORMATTING RULES:
1. Return ONLY the JSON array - no markdown, no code blocks, no explanations
2. Each array element must have "index" (number) and "response" (string)
3. Escape all special characters in your responses (quotes, newlines, etc.)
4. Keep responses as single-line strings (replace actual newlines with \\n)
5. Do not include any text before or after the JSON array

Example format (follow this EXACTLY):
[{{"index": 0, "response": "Your answer here"}}, {{"index": 1, "response": "Another answer"}}]

Questions:
{questions_block}

Remember: Return ONLY the JSON array, nothing else."""

        logger.info(
            f"[LLM_BATCH] Sending 1 combined request for {n} prompts (request_ids={request_ids}). "
            f"max_tokens={total_max_tokens}, priority={priority.name}"
        )
        logger.debug(f"[LLM_PROMPT] Combined prompt sent to LLM:\n{combined_prompt}")

        def _single_call():
            try:
                from google.genai import types #type: ignore
                # Use lower temperature for better JSON compliance
                # HIGH: 0.3, MEDIUM: 0.5, LOW: 0.7 (reduced from 0.9)
                temp = 0.3 if priority.value == 2 else (0.5 if priority.value == 1 else 0.7)
                gen_config = types.GenerateContentConfig(
                    max_output_tokens=total_max_tokens,
                    temperature=temp,
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
        parsed = self._parse_batch_response(response_text, n, request_ids)
        tokens_per_item = total_tokens // n if n else 0
        remainder = total_tokens - (tokens_per_item * n)

        results = []
        for i in range(n):
            text = parsed.get(i, f"[Error: Failed to parse response for request {request_ids[i]}. Check logs for details.]")
            tok = tokens_per_item + (1 if i < remainder else 0)
            results.append(BatchedLLMResponseItem(index=i, text=text, tokens_used=tok))
        results.sort(key=lambda x: x.index)

        logger.info(
            f"[LLM_BATCH] Received 1 response, split into {len(results)} results. "
            f"total_tokens={total_tokens} elapsed_ms={elapsed_ms:.2f}"
        )
        return BatchedLLMResponse(results=results, model_latency_ms=elapsed_ms)

    def _parse_batch_response(self, response_text: str, expected_count: int, request_ids: list[str]) -> dict[int, str]:
        """Extract JSON array from LLM response and return index -> response text mapping."""
        if not response_text:
            logger.error("[LLM_BATCH] Empty response from LLM")
            return {}

        original_text = response_text
        text = response_text.strip()

        # Try multiple parsing strategies
        
        # Strategy 1: Remove markdown code blocks
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
            text = re.sub(r"\s*```\s*$", "", text, flags=re.MULTILINE)
            text = text.strip()
        
        # Strategy 2: Find JSON array in the text (look for [{ ... }])
        # This handles cases where LLM adds text before/after JSON
        json_match = re.search(r'\[\s*\{.*?\}\s*\]', text, re.DOTALL)
        if json_match:
            text = json_match.group(0)
            logger.debug(f"[LLM_BATCH] Extracted JSON from position {json_match.start()} to {json_match.end()}")
        
        # Strategy 3: Try to fix common JSON issues
        # Remove any trailing commas before closing brackets
        text = re.sub(r',(\s*[}\]])', r'\1', text)
        
        # Strategy 4: Handle truncated JSON (unterminated strings)
        # If response was cut off, try to close the string and array properly
        if not text.endswith(']'):
            logger.warning("[LLM_BATCH] Response appears truncated, attempting to close JSON")
            # Close unterminated string
            if text.count('"') % 2 != 0:
                text += '"'
            # Close object
            if '{' in text and not text.rstrip().endswith('}'):
                text += '}'
            # Close array
            if '[' in text and not text.rstrip().endswith(']'):
                text += ']'
            logger.debug(f"[LLM_BATCH] Attempted to close truncated JSON: {text[-100:]}")
        
        # Try parsing
        try:
            data = json.loads(text)
            logger.info(f"[LLM_BATCH] Successfully parsed JSON response")
        except json.JSONDecodeError as e:
            logger.error(f"[LLM_BATCH] JSON parse failed at position {e.pos}: {e.msg}")
            logger.error(f"[LLM_BATCH] Attempted to parse: {text[:1000]}")
            logger.error(f"[LLM_BATCH] Original response (first 1000 chars): {original_text[:1000]}")
            
            # Last resort: Try to manually extract responses
            return self._manual_extraction_fallback(original_text, expected_count, request_ids)

        if not isinstance(data, list):
            logger.warning(f"[LLM_BATCH] Expected JSON array, got {type(data)}")
            return {}

        out = {}
        for item in data:
            if not isinstance(item, dict):
                logger.warning(f"[LLM_BATCH] Skipping non-dict item: {type(item)}")
                continue
            
            idx = item.get("index")
            resp = item.get("response")
            
            if idx is None:
                logger.warning(f"[LLM_BATCH] Item missing 'index' field: {item}")
                continue
            if resp is None:
                logger.warning(f"[LLM_BATCH] Item missing 'response' field for index {idx}")
                continue
                
            try:
                idx_int = int(idx)
                out[idx_int] = str(resp).strip()
                logger.debug(f"[LLM_BATCH] Parsed response for index {idx_int} (length: {len(str(resp))})")
            except (ValueError, TypeError) as e:
                logger.warning(f"[LLM_BATCH] Could not convert index to int: {idx}, error: {e}")
        
        # Check if we got all expected responses
        missing = [i for i in range(expected_count) if i not in out]
        if missing:
            logger.warning(f"[LLM_BATCH] Missing responses for indices: {missing} (request_ids: {[request_ids[i] for i in missing if i < len(request_ids)]})")
        
        return out
    
    def _manual_extraction_fallback(self, text: str, expected_count: int, request_ids: list[str]) -> dict[int, str]:
        """
        Fallback method to manually extract responses when JSON parsing fails.
        Handles truncated JSON by extracting what's available.
        """
        logger.info("[LLM_BATCH] Attempting manual extraction fallback")
        out = {}
        
        # Strategy 1: Try to extract from partial JSON using regex
        # Look for {"index": N, "response": "text...
        pattern = r'\{"index"\s*:\s*(\d+)\s*,\s*"response"\s*:\s*"([^"]*(?:\\.[^"]*)*)'
        matches = re.finditer(pattern, text, re.DOTALL)
        
        for match in matches:
            try:
                idx = int(match.group(1))
                response = match.group(2)
                # Unescape common escape sequences
                response = response.replace('\\n', '\n').replace('\\"', '"').replace('\\\\', '\\')
                response = response.strip()
                if response:
                    out[idx] = response
                    logger.info(f"[LLM_BATCH] Manually extracted response for index {idx} (length: {len(response)})")
            except (ValueError, IndexError) as e:
                logger.warning(f"[LLM_BATCH] Failed to extract from JSON pattern match: {e}")
        
        # Strategy 2: If that didn't work, try to find Index N: pattern
        if not out:
            pattern2 = r'Index\s+(\d+)(?:\s*\(request_id:\s*[^)]+\))?\s*[:\-]\s*(.+?)(?=Index\s+\d+|$)'
            matches = re.finditer(pattern2, text, re.DOTALL | re.IGNORECASE)
            
            for match in matches:
                try:
                    idx = int(match.group(1))
                    response = match.group(2).strip()
                    # Clean up the response
                    response = response.replace('\n', ' ').strip()
                    if response:
                        out[idx] = response
                        logger.info(f"[LLM_BATCH] Manually extracted response for index {idx} via Index pattern")
                except (ValueError, IndexError) as e:
                    logger.warning(f"[LLM_BATCH] Failed to extract from Index pattern: {e}")
        
        if out:
            logger.info(f"[LLM_BATCH] Manual extraction found {len(out)} responses")
        else:
            logger.error("[LLM_BATCH] Manual extraction failed - no responses found")
        
        return out