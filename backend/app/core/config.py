from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Project basic information
    PROJECT_NAME: str = "AI Smart Operations Assistant"
    API_V1_STR: str = "/api/v1"
    
    # AI Engine Configuration
    # These must be provided in the .env file
    OPENAI_API_KEY: str
    MODEL_NAME: str = "gpt-4o"
    
    # Security and Authentication
    SECRET_KEY: str = "placeholder_for_security_reasons"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 1 week
    
    # Database Configuration
    DATABASE_URL: Optional[str] = None

    # Load configuration from .env file
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

# Global settings object to be imported in other modules
settings = Settings()