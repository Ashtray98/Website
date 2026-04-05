"""Ingest Router - Document upload and URL ingestion"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from app.models import IngestResponse, IngestURLRequest
from app.services import parser, chunker, embedder, vectorstore

router = APIRouter(prefix="/api", tags=["ingest"])


@router.post("/ingest", response_model=IngestResponse)
async def ingest_document(
    file: Optional[UploadFile] = File(None),
    url: Optional[str] = Form(None),
):
    """
    Ingest a document (file upload) or URL.
    Parses, chunks, embeds, and stores in vector DB.
    """
    if not file and not url:
        raise HTTPException(status_code=400, detail="Provide either a file or a URL")

    try:
        if file:
            # File upload
            content = await file.read()
            filename = file.filename or "unknown"
            source_type = parser.detect_source_type(filename)
            file_size = f"{len(content) / 1024:.1f} KB"

            # Parse
            text = parser.parse_file(filename, content)

        else:
            # URL ingestion
            filename = url[:80]
            source_type = "URL"
            file_size = "N/A"

            # Parse
            text = parser.parse_url(url)

        if not text or len(text.strip()) < 10:
            raise HTTPException(status_code=400, detail="Could not extract meaningful text from the source")

        # Chunk
        chunks = chunker.chunk_text(text, filename, source_type)

        if not chunks:
            raise HTTPException(status_code=400, detail="No chunks generated from the document")

        # Embed
        chunk_texts = [c["text"] for c in chunks]
        embeddings = embedder.embed_texts(chunk_texts)

        # Store
        doc_id = vectorstore.generate_doc_id()
        vectorstore.add_document(
            doc_id=doc_id,
            chunks=chunks,
            embeddings=embeddings,
            filename=filename,
            source_type=source_type,
            file_size=file_size,
        )

        return IngestResponse(
            document_id=doc_id,
            filename=filename,
            chunk_count=len(chunks),
            source_type=source_type,
            status="success",
            message=f"Successfully ingested {len(chunks)} chunks from '{filename}'",
        )

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")


@router.post("/ingest/url", response_model=IngestResponse)
async def ingest_url(request: IngestURLRequest):
    """Ingest content from a URL (JSON body alternative)."""
    try:
        filename = request.url[:80]
        source_type = "URL"

        text = parser.parse_url(request.url)

        if not text or len(text.strip()) < 10:
            raise HTTPException(status_code=400, detail="Could not extract text from URL")

        chunks = chunker.chunk_text(text, filename, source_type)
        chunk_texts = [c["text"] for c in chunks]
        embeddings = embedder.embed_texts(chunk_texts)

        doc_id = vectorstore.generate_doc_id()
        vectorstore.add_document(
            doc_id=doc_id,
            chunks=chunks,
            embeddings=embeddings,
            filename=filename,
            source_type=source_type,
        )

        return IngestResponse(
            document_id=doc_id,
            filename=filename,
            chunk_count=len(chunks),
            source_type=source_type,
            status="success",
            message=f"Successfully ingested {len(chunks)} chunks from URL",
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"URL ingestion failed: {str(e)}")
