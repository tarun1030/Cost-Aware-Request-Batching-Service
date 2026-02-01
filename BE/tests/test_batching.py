"""Tests for batching logic."""

import asyncio
from datetime import datetime

import pytest

from app.batch_processor import BatchProcessor
from app.llm_client import LLMClient
from app.models import (
    BatchedLLMResponse,
    GenerationRequest,
    GenerationResponse,
    Priority,
)
from app.queue_manager import QueueItem, QueueManager


@pytest.fixture
def mock_llm():
    return LLMClient(use_mock=True)


@pytest.fixture
def batch_processor(mock_llm):
    return BatchProcessor(mock_llm)


@pytest.fixture
def queue_manager(batch_processor):
    return QueueManager(batch_processor)


@pytest.mark.asyncio
async def test_llm_client_mock_generate_batch(mock_llm):
    """Mock LLM client returns BatchedLLMResponse with one result per prompt."""
    result = await mock_llm.generate_batch(
        prompts=["a", "b"],
        max_tokens=5,
    )
    assert isinstance(result, BatchedLLMResponse)
    assert len(result.results) == 2
    assert result.results[0].index == 0
    assert result.results[1].index == 1
    assert "[mock]" in result.results[0].text
    assert result.model_latency_ms >= 0


@pytest.mark.asyncio
async def test_queue_manager_enqueue_returns_response(queue_manager):
    """Enqueuing a request and having batch processor run returns GenerationResponse."""
    request = GenerationRequest(
        username="testuser",
        request_id="req-1",
        prompt="Hello",
        created_at=datetime.utcnow(),
        priority=Priority.LOW,
    )
    response = await queue_manager.enqueue(request)
    assert isinstance(response, GenerationResponse)
    assert response.request_id == "req-1"
    assert response.username == "testuser"
    assert response.text
    assert response.tokens_used >= 0
    assert response.latency_ms >= 0
