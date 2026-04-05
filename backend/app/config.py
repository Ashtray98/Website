"""DATA-WEAVE Backend Configuration"""
import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    # API
    APP_NAME: str = "DATA-WEAVE"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # OpenAI
    OPENAI_API_KEY: str = ""
    USE_OPENAI: bool = False
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    LLM_MODEL: str = "gpt-4o-mini"

    # ChromaDB
    CHROMA_PERSIST_DIR: str = "./app/data/chromadb"

    # Chunking
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200

    # Search
    TOP_K: int = 5

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
