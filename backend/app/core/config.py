from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Project basic information
    PROJECT_NAME: str = "AI Smart Operations Assistant"
    API_V1_STR: str = "/api/v1"
    
    # AI Engine Configuration
    # Switching to Groq for free tier access
    OPENAI_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    MODEL_NAME: str = "llama-3.1-8b-instant " # Default Groq model
    
    # Security and Authentication
    SECRET_KEY: str = "placeholder_for_security_reasons"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    
    # Database Configuration
    DATABASE_URL: Optional[str] = None

    # Load configuration from .env file
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()