import numpy as np
import functools
from app.config import settings

# Global model cache
_model = None


def _get_model():
    """Lazy-load the sentence-transformers model."""
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer(settings.EMBEDDING_MODEL)
        print(f"[DATA-WEAVE] Loaded embedding model: {settings.EMBEDDING_MODEL}")
    return _model


def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for a list of texts.
    Uses sentence-transformers in demo mode, OpenAI in production.
    """
    if settings.USE_OPENAI and settings.OPENAI_API_KEY:
        return _embed_openai(texts)
    else:
        return _embed_local(texts)


@functools.lru_cache(maxsize=1000)
def embed_query(query: str) -> list[float]:
    """Generate embedding for a single query (Uses extreme-speed caching)."""
    result = embed_texts([query])
    return result[0]


def _embed_local(texts: list[str]) -> list[list[float]]:
    """Use sentence-transformers for local embeddings with batching for large docs."""
    model = _get_model()
    BATCH_SIZE = 32
    all_embeddings = []

    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i:i + BATCH_SIZE]
        print(f"[DATA-WEAVE] Embedding batch {i // BATCH_SIZE + 1}/{(len(texts) + BATCH_SIZE - 1) // BATCH_SIZE} ({len(batch)} chunks)")
        batch_embeddings = model.encode(batch, show_progress_bar=False, normalize_embeddings=True)
        all_embeddings.extend(batch_embeddings.tolist())

    return all_embeddings


def _embed_openai(texts: list[str]) -> list[list[float]]:
    """Use OpenAI for cloud embeddings."""
    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.embeddings.create(
            input=texts,
            model="text-embedding-3-small"
        )
        return [item.embedding for item in response.data]
    except Exception as e:
        print(f"[DATA-WEAVE] OpenAI embedding failed, falling back to local: {e}")
        return _embed_local(texts)
