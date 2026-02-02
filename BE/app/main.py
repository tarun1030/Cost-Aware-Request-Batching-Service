"""FastAPI application entry point with streaming support."""

import logging
import asyncio
import json

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from app.batch_processor import BatchProcessor
from app.chat_store import get_analytics, get_chats
from app.config import settings
from app.llm_client import LLMClient
from app.models import (
    AnalyticsResponse,
    GenerationRequest,
    GenerationResponse,
    HealthResponse,
    PriorityThreshold,
    SettingsResponse,
    SettingsUpdate,
)
from app.queue_manager import QueueManager
from app.settings_store import get_settings, get_thresholds, update_settings

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# Shared queue and processor
queue_manager: QueueManager | None = None
batch_processor: BatchProcessor | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start queue and batch processor on startup; stop on shutdown."""
    global queue_manager, batch_processor
    llm_client = LLMClient()
    batch_processor = BatchProcessor(llm_client)
    queue_manager = QueueManager(batch_processor)
    yield
    queue_manager = None
    batch_processor = None


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse()


@app.post("/v1/query")
async def complete(request: GenerationRequest):
    """Stream LLM response to client word by word."""
    if queue_manager is None:
        raise RuntimeError("Queue manager not initialized.")

    async def generate_stream():
        try:
            # Timeout from configured latency (ms) + buffer for queue and LLM
            th = get_thresholds(request.priority.name)
            timeout_seconds = th["latency_ms"] / 1000.0 + 30.0

            response = await asyncio.wait_for(
                queue_manager.enqueue(request),
                timeout=timeout_seconds
            )

            # Stream the response text word by word
            words = response.text.split()
            for i, word in enumerate(words):
                chunk = {
                    "type": "text",
                    "content": word + (" " if i < len(words) - 1 else ""),
                }
                yield f"data: {json.dumps(chunk)}\n\n"
                await asyncio.sleep(0.05)  # Small delay between words for streaming effect

            # Send final metadata
            final_chunk = {
                "type": "done",
                "request_id": response.request_id,
                "username": response.username,
                "tokens_used": response.tokens_used,
                "latency_ms": response.latency_ms,
                "created_at": response.created_at.isoformat(),
                "completed_at": response.completed_at.isoformat(),
            }
            yield f"data: {json.dumps(final_chunk)}\n\n"

        except asyncio.TimeoutError:
            error_chunk = {
                "type": "error",
                "message": f"Request timed out after {timeout_seconds}s. Please try again."
            }
            yield f"data: {json.dumps(error_chunk)}\n\n"
        except Exception as e:
            error_chunk = {
                "type": "error",
                "message": str(e)
            }
            yield f"data: {json.dumps(error_chunk)}\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@app.get("/v1/chat")
async def chat() -> dict:
    """Retrieve all stored chat request/response pairs from the JSON file."""
    chats = get_chats()
    return {"chats": chats, "count": len(chats)}


@app.get("/v1/settings", response_model=SettingsResponse)
async def get_settings_route() -> SettingsResponse:
    """Return current configuration (API key masked). For Settings page."""
    s = get_settings()
    return SettingsResponse(
        api_key=s["api_key"],
        high_priority=PriorityThreshold(**s["high_priority"]),
        medium_priority=PriorityThreshold(**s["medium_priority"]),
        low_priority=PriorityThreshold(**s["low_priority"]),
    )


@app.put("/v1/settings", response_model=SettingsResponse)
async def put_settings_route(body: SettingsUpdate) -> SettingsResponse:
    """Update configuration from Settings page. Partial update supported."""
    updates = body.model_dump(exclude_none=True)
    s = update_settings(updates)
    return SettingsResponse(
        api_key=s["api_key"],
        high_priority=PriorityThreshold(**s["high_priority"]),
        medium_priority=PriorityThreshold(**s["medium_priority"]),
        low_priority=PriorityThreshold(**s["low_priority"]),
    )


@app.get("/v1/analytics", response_model=AnalyticsResponse)
async def analytics() -> AnalyticsResponse:
    """Return analytics for the dashboard: totals, priority counts, time-series, distribution."""
    data = get_analytics()
    return AnalyticsResponse(
        total_requests=data["total_requests"],
        high_priority=data["high_priority"],
        medium_priority=data["medium_priority"],
        low_priority=data["low_priority"],
        request_count_over_time=data["request_count_over_time"],
        priority_distribution=data["priority_distribution"],
    )