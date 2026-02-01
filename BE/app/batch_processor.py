# batch_processor.py
import logging
import os
import uuid
from datetime import datetime, timezone
from app.chat_store import append_chat
from app.settings_store import get_thresholds
from app.models import (
    GenerationRequest,
    GenerationResponse,
    BatchedLLMResponse,
)

logger = logging.getLogger(__name__)

INDIVIDUAL_LOG_DIR = "logs"
INDIVIDUAL_LOG_FILE = "individual_request_response.log"


def _write_individual_log(request: GenerationRequest, response: GenerationResponse) -> None:
    """Append one request/response pair to the individual log file."""
    try:
        os.makedirs(INDIVIDUAL_LOG_DIR, exist_ok=True)
        path = os.path.join(INDIVIDUAL_LOG_DIR, INDIVIDUAL_LOG_FILE)
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        with open(path, "a", encoding="utf-8") as f:
            f.write(f"\n{'='*80}\n")
            f.write(f"Individual Request/Response — {ts}\n")
            f.write(f"{'='*80}\n\n")
            f.write("REQUEST:\n")
            f.write("-" * 40 + "\n")
            f.write(f"  request_id:  {request.request_id}\n")
            f.write(f"  username:    {request.username}\n")
            f.write(f"  priority:    {request.priority.name}\n")
            f.write(f"  created_at:   {request.created_at}\n")
            f.write(f"  prompt:      {request.prompt}\n")
            f.write("\n")
            f.write("RESPONSE:\n")
            f.write("-" * 40 + "\n")
            f.write(f"  request_id:   {response.request_id}\n")
            f.write(f"  tokens_used:  {response.tokens_used}\n")
            f.write(f"  latency_ms:   {response.latency_ms:.2f}\n")
            f.write(f"  completed_at: {response.completed_at}\n")
            f.write(f"  text:        {response.text}\n")
            f.write("\n")
    except OSError as e:
        logger.warning("Failed to write individual request/response to log file: %s", e)


class BatchProcessor:
    def __init__(self, llm_client):
        self.llm_client = llm_client

    async def process(self, batch_items):
        try:
            prompts = [item.request.prompt for item in batch_items]
            priorities = [item.request.priority for item in batch_items]
            request_ids = [item.request.request_id for item in batch_items]
            
            logger.info(f"[BATCH_START] Processing batch of {len(batch_items)} requests: {request_ids}")

            priority_name = batch_items[0].request.priority.name
            max_tokens = get_thresholds(priority_name)["tokens"]

            llm_response: BatchedLLMResponse = await self.llm_client.generate_batch(
                prompts=prompts,
                priorities=priorities,
                max_tokens=max_tokens,
                request_ids=request_ids,
            )

            now = datetime.now(timezone.utc)
            logger.info(f"[BATCH_COMPLETE] Batch processing completed in {llm_response.model_latency_ms:.2f}ms")

            batch_id = str(uuid.uuid4())
            for idx, item in enumerate(batch_items):
                llm_item = llm_response.results[idx]

                latency_ms = (
                    now - item.request.created_at
                ).total_seconds() * 1000

                response = GenerationResponse(
                    request_id=item.request.request_id,
                    username=item.request.username,
                    text=llm_item.text,
                    tokens_used=llm_item.tokens_used,
                    latency_ms=latency_ms,
                    created_at=item.request.created_at,
                    completed_at=now
                )

                _write_individual_log(item.request, response)

                try:
                    req_dict = item.request.model_dump(mode="json")
                    resp_dict = response.model_dump(mode="json")
                    append_chat(req_dict, resp_dict, batch_id=batch_id)
                except Exception as e:
                    logger.warning("Failed to append chat to store: %s", e)

                if not item.future.done():
                    item.future.set_result(response)

        except Exception as e:
            for item in batch_items:
                if not item.future.done():
                    item.future.set_exception(e)
