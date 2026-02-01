"""Tests for FastAPI endpoints."""

from datetime import datetime

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app, lifespan


@pytest.fixture
async def client():
    """Async client with app lifespan running so queue and processor are active."""
    async with lifespan(app):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as c:
            yield c


@pytest.mark.asyncio
async def test_health(client):
    """Health endpoint returns ok."""
    r = await client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert "version" in data


def _query_payload(**overrides):
    base = {
        "username": "testuser",
        "request_id": "req-1",
        "prompt": "Hello world",
        "created_at": datetime.utcnow().isoformat() + "Z",
        "priority": "LOW",
    }
    base.update(overrides)
    return base


@pytest.mark.asyncio
async def test_query_returns_200(client):
    """POST /v1/query returns 200 with a GenerationResponse."""
    r = await client.post(
        "/v1/query",
        json=_query_payload(),
    )
    assert r.status_code == 200
    data = r.json()
    assert "text" in data
    assert data["request_id"] == "req-1"
    assert data["username"] == "testuser"
    assert "tokens_used" in data
    assert "latency_ms" in data
