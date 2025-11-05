# app/config.py
from pydantic import Field
from pydantic_settings import BaseSettings
import pathlib
from dotenv import load_dotenv

# Charger explicitement le fichier .env
env_path = pathlib.Path(__file__).parent / ".env"
load_dotenv(env_path)

class Settings(BaseSettings):
    # App
    app_name: str = Field("Personal Dashboard API", env="APP_NAME")
    debug: bool = Field(False, env="DEBUG")
    host: str = Field("127.0.0.1", env="HOST")
    port: int = Field(8000, env="PORT")

    # JWT
    jwt_secret_key: str = Field(env="JWT_SECRET_KEY")
    jwt_algorithm: str = Field("HS256", env="JWT_ALGORITHM")
    jwt_expiration_hours: int = Field(24, env="JWT_EXPIRATION_HOURS")

    # Database
    db_host: str = Field("localhost", env="DB_HOST")
    db_port: int = Field(5432, env="DB_PORT")
    db_name: str = Field("", env="DB_NAME")
    db_user: str = Field("", env="DB_USER")
    db_password: str = Field("", env="DB_PASSWORD")

    # CORS
    cors_origins: str = Field("http://localhost:3000", env="CORS_ORIGINS")

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins from comma-separated string to list."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    # Transcription
    openai_api_key: str = Field("", env="OPENAI_API_KEY")
    transcription_mode_default: str = Field("api", env="TRANSCRIPTION_MODE_DEFAULT")

    # LLM Configuration
    anthropic_api_key: str = Field("", env="ANTHROPIC_API_KEY")
    anthropic_model: str = Field("claude-3-5-sonnet-20241022", env="ANTHROPIC_MODEL")
    openai_model: str = Field("gpt-4o", env="OPENAI_MODEL")
    llm_max_tokens: int = Field(1000, env="LLM_MAX_TOKENS")
    llm_temperature: float = Field(0.7, env="LLM_TEMPERATURE")

    # Summarization
    summarization_provider: str = Field("anthropic", env="SUMMARIZATION_PROVIDER")

    class Config:
        env_file = pathlib.Path(__file__).parent / "config/.env"
        env_file_encoding = "utf-8"

settings = Settings()