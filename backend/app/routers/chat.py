"""Chat Router - RAG-based Q&A with source attribution"""
import re
from fastapi import APIRouter, HTTPException
from app.models import ChatRequest, ChatResponse, SourceReference
from app.services import embedder, vectorstore, llm

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    RAG-based chat: retrieves relevant context and generates an answer with source attribution.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    try:
        # Embed query
        query_embedding = embedder.embed_query(request.query)

        # Retrieve relevant chunks and filter noise/garbage OCR
        raw_chunks = vectorstore.search(query_embedding, top_k=request.top_k)
        context_chunks = [
            c for c in raw_chunks 
            if c["score"] >= 0.10 
            and not re.search(r'(.)\1{15,}', c["chunk_text"])
            and not re.search(r'(.{2,4}?)\1{10,}', c["chunk_text"])
            and c["chunk_text"].count('\ufffd') < 3
        ]

        # Generate answer with sources
        result = llm.generate_answer(
            query=request.query,
            context_chunks=context_chunks,
            conversation_history=request.conversation_history,
        )

        # Format sources
        sources = [
            SourceReference(
                document_name=s["document_name"],
                chunk_text=s["chunk_text"],
                relevance_score=s["relevance_score"],
            )
            for s in result.get("sources", [])
        ]

        return ChatResponse(
            answer=result["answer"],
            sources=sources,
            confidence=result.get("confidence", 0.0),
            query=request.query,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")
