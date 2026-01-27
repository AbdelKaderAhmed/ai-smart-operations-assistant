from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    
    GROQ_API_KEY: str
    MODEL_NAME: str = "llama-3.1-8b-instant" 
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "AI Smart Operations Assistant"

    model_config = SettingsConfigDict(
        env_file=".env", 
        case_sensitive=True,
        extra='ignore' 
    )

settings = Settings()