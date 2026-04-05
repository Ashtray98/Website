"""Text Chunker Service - Splits documents into overlapping chunks"""
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.config import settings


def chunk_text(text: str, source_name: str, source_type: str) -> list[dict]:
    """
    Split text into overlapping chunks with metadata.

    Returns list of dicts with keys: text, metadata
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    chunks = splitter.split_text(text)

    result = []
    for i, chunk in enumerate(chunks):
        result.append({
            "text": chunk,
            "metadata": {
                "source": source_name,
                "source_type": source_type,
                "chunk_index": i,
                "total_chunks": len(chunks),
            }
        })

    return result
