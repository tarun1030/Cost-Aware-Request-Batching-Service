"""Pydantic models for requests and responses."""

from pydantic import BaseModel, Field
from enum import Enum

# models.py
from enum import Enum
from datetime import datetime
from pydantic import BaseModel


class Priority(Enum):
    HIGH = 2  # Fast response, short and concise
    MEDIUM = 1  # Balanced response
    LOW = 0  # Detailed response, comprehensive

    @property
    def max_tokens(self) -> int:
        if self == Priority.HIGH:
            return 512  # Short response
        elif self == Priority.MEDIUM:
            return 1024  # Balanced response
        elif self == Priority.LOW:
            return 2048  # Detailed response
        return 1024

    @property
    def latency_ms(self) -> float:
        if self == Priority.HIGH:
            return 100  # Fast
        elif self == Priority.MEDIUM:
            return 200  # Medium
        elif self == Priority.LOW:
            return 300  # Slower but detailed
        return 200

    @property
    def system_instruction(self) -> str:
        """Get the system instruction based on priority."""
        if self == Priority.HIGH:
            return "Provide a quick, concise answer. Be brief and to the point. Maximum 2-3 sentences."
        elif self == Priority.MEDIUM:
            return "Provide a balanced answer with moderate detail. Include key points but keep it reasonably concise."
        elif self == Priority.LOW:
            return "Provide a comprehensive, detailed answer. Include explanations, examples, and context. Be thorough."
        return "Provide a balanced answer."


# -------- REQUEST --------
class GenerationRequest(BaseModel):
    username: str
    request_id: str
    prompt: str
    created_at: datetime
    priority: Priority


# -------- USER RESPONSE --------
class GenerationResponse(BaseModel):
    request_id: str
    username: str
    text: str
    tokens_used: int
    latency_ms: float
    created_at: datetime
    completed_at: datetime


# -------- INTERNAL LLM RESPONSE --------
class BatchedLLMResponseItem(BaseModel):
    index: int
    text: str
    tokens_used: int


class BatchedLLMResponse(BaseModel):
    results: list[BatchedLLMResponseItem]
    model_latency_ms: float



class HealthResponse(BaseModel):
    """Health check response."""

    status: str = "ok"
    version: str = "0.1.0"


# -------- CHAT & ANALYTICS --------
class ChatEntry(BaseModel):
    """Single chat entry (request + response) for GET /v1/chat."""

    timestamp: str
    request: dict
    response: dict


class AnalyticsResponse(BaseModel):
    """Analytics for dashboard GET /v1/analytics."""

    total_requests: int
    high_priority: int
    medium_priority: int
    low_priority: int
    request_count_over_time: list[dict]
    priority_distribution: list[dict]


# -------- SETTINGS (FE configuration) --------
class PriorityThreshold(BaseModel):
    tokens: int = 1000
    latency_ms: float = 500


class SettingsResponse(BaseModel):
    """GET /v1/settings response."""

    api_key: str | None
    high_priority: PriorityThreshold
    medium_priority: PriorityThreshold
    low_priority: PriorityThreshold


class SettingsUpdate(BaseModel):
    """PUT /v1/settings body (all optional)."""

    api_key: str | None = None
    high_priority: PriorityThreshold | None = None
    medium_priority: PriorityThreshold | None = None
    low_priority: PriorityThreshold | None = None
