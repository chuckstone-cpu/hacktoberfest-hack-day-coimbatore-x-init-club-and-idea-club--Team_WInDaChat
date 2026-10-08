"""Configuration loaded from environment variables (.env).

    OLLAMA_HOST     default http://localhost:11434
    OLLAMA_MODEL    default gemma4:e4b
    NUM_CTX         default 16384
    DB_PATH         default data/nectore.db
"""

import os

from dotenv import load_dotenv

load_dotenv()

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma4:e4b")
NUM_CTX = int(os.getenv("NUM_CTX", "16384"))
DB_PATH = os.getenv("DB_PATH", "data/nectore.db")
