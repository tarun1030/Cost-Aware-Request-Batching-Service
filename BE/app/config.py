"""Configuration settings for the application."""

from pydantic import BaseModel


class Settings(BaseModel):
    """Application configuration."""

    app_name: str = "LLM Batch API"
    debug: bool = False

    # Batching
    batch_size: int = 10
    batch_timeout_seconds: float = 1.0

    # LLM client (Gemini)
    gemini_api_key: str = "AIzaSyDrajsmIVXSu7JFVveeyKiXnaxwuEVwgNE"
    gemini_model: str = "models/gemini-2.5-flash"


settings = Settings()
