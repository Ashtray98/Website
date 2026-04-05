"""Vector Store Service - ChromaDB operations for document storage and retrieval"""
import uuid
import json
import os
from datetime import datetime
import chromadb
from app.config import settings

# Global client
_client = None
_collection = None

# Document metadata store (simple JSON file alongside ChromaDB)
METADATA_FILE = os.path.join(settings.CHROMA_PERSIST_DIR, "doc_metadata.json")


def _get_client():
    """Get or create ChromaDB persistent client."""
    global _client, _collection

    if _client is None:
        os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
        _client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
        _collection = _client.get_or_create_collection(
            name="dataweave_kb",
            metadata={"hnsw:space": "cosine"}
        )
        print(f"[DATA-WEAVE] ChromaDB initialized at {settings.CHROMA_PERSIST_DIR}")
        print(f"[DATA-WEAVE] Collection has {_collection.count()} vectors")

    return _client, _collection


def _load_doc_metadata() -> dict:
    """Load document metadata from JSON file."""
    if os.path.exists(METADATA_FILE):
        with open(METADATA_FILE, "r") as f:
            return json.load(f)
    return {}


def _save_doc_metadata(metadata: dict):
    """Save document metadata to JSON file."""
    os.makedirs(os.path.dirname(METADATA_FILE), exist_ok=True)
    with open(METADATA_FILE, "w") as f:
        json.dump(metadata, f, indent=2)


def add_document(
    doc_id: str,
    chunks: list[dict],
    embeddings: list[list[float]],
    filename: str,
    source_type: str,
    file_size: str = "N/A"
):
    """Add document chunks and embeddings to ChromaDB."""
    _, collection = _get_client()

    ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
    documents = [c["text"] for c in chunks]
    metadatas = []
    for c in chunks:
        meta = c["metadata"].copy()
        meta["document_id"] = doc_id
        metadatas.append(meta)

    # Add to ChromaDB in batches
    batch_size = 100
    for i in range(0, len(ids), batch_size):
        end = min(i + batch_size, len(ids))
        collection.add(
            ids=ids[i:end],
            embeddings=embeddings[i:end],
            documents=documents[i:end],
            metadatas=metadatas[i:end],
        )

    # Save document metadata
    doc_meta = _load_doc_metadata()
    doc_meta[doc_id] = {
        "id": doc_id,
        "name": filename,
        "source_type": source_type,
        "upload_date": datetime.now().isoformat(),
        "chunk_count": len(chunks),
        "file_size": file_size,
    }
    _save_doc_metadata(doc_meta)

    print(f"[DATA-WEAVE] Added {len(chunks)} chunks for '{filename}' (ID: {doc_id})")


def search(query_embedding: list[float], top_k: int = 5) -> list[dict]:
    """Search for similar chunks using cosine similarity."""
    _, collection = _get_client()

    if collection.count() == 0:
        return []

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(top_k, collection.count()),
        include=["documents", "metadatas", "distances"],
    )

    search_results = []
    if results and results["documents"] and results["documents"][0]:
        for i in range(len(results["documents"][0])):
            # ChromaDB returns distances; for cosine, similarity = 1 - distance
            distance = results["distances"][0][i]
            score = round(1.0 - distance, 4)

            search_results.append({
                "chunk_text": results["documents"][0][i],
                "score": score,
                "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
            })

    return search_results


def get_all_documents() -> list[dict]:
    """Get metadata for all ingested documents."""
    _get_client()  # Ensure initialized
    doc_meta = _load_doc_metadata()
    return list(doc_meta.values())


def delete_document(doc_id: str) -> bool:
    """Delete a document and all its chunks from ChromaDB."""
    _, collection = _get_client()

    # Find all chunk IDs for this document
    try:
        results = collection.get(
            where={"document_id": doc_id},
            include=[]
        )
        if results and results["ids"]:
            collection.delete(ids=results["ids"])
    except Exception as e:
        print(f"[DATA-WEAVE] Warning during chunk deletion: {e}")
        # Try prefix-based deletion as fallback
        try:
            all_ids = collection.get(include=[])["ids"]
            matching_ids = [id for id in all_ids if id.startswith(doc_id)]
            if matching_ids:
                collection.delete(ids=matching_ids)
        except Exception:
            pass

    # Remove from metadata
    doc_meta = _load_doc_metadata()
    if doc_id in doc_meta:
        del doc_meta[doc_id]
        _save_doc_metadata(doc_meta)
        return True

    return False


def get_stats() -> dict:
    """Get knowledge base statistics."""
    _get_client()
    doc_meta = _load_doc_metadata()
    documents = list(doc_meta.values())

    source_types = {}
    total_chunks = 0
    for doc in documents:
        st = doc.get("source_type", "Unknown")
        source_types[st] = source_types.get(st, 0) + 1
        total_chunks += doc.get("chunk_count", 0)

    last_updated = ""
    if documents:
        dates = [d.get("upload_date", "") for d in documents if d.get("upload_date")]
        if dates:
            last_updated = max(dates)

    return {
        "total_documents": len(documents),
        "total_chunks": total_chunks,
        "source_types": source_types,
        "last_updated": last_updated,
    }


def generate_doc_id() -> str:
    """Generate a unique document ID."""
    return str(uuid.uuid4())[:12]
