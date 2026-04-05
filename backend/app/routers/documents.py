"""Documents Router - Knowledge base document management"""
from fastapi import APIRouter, HTTPException
from app.models import DocumentsResponse, DocumentInfo, DeleteResponse, StatsResponse
from app.services import vectorstore

router = APIRouter(prefix="/api", tags=["documents"])


@router.get("/documents", response_model=DocumentsResponse)
async def list_documents():
    """List all ingested documents with metadata."""
    try:
        docs = vectorstore.get_all_documents()
        doc_list = [
            DocumentInfo(
                id=d["id"],
                name=d["name"],
                source_type=d.get("source_type", "Unknown"),
                upload_date=d.get("upload_date", ""),
                chunk_count=d.get("chunk_count", 0),
                file_size=d.get("file_size", "N/A"),
            )
            for d in docs
        ]

        return DocumentsResponse(
            documents=doc_list,
            total_count=len(doc_list),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list documents: {str(e)}")


@router.delete("/documents/{doc_id}", response_model=DeleteResponse)
async def delete_document(doc_id: str):
    """Delete a document and all its chunks from the knowledge base."""
    try:
        success = vectorstore.delete_document(doc_id)

        if success:
            return DeleteResponse(
                status="success",
                message=f"Document {doc_id} deleted successfully",
                document_id=doc_id,
            )
        else:
            raise HTTPException(status_code=404, detail=f"Document {doc_id} not found")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")


@router.get("/stats", response_model=StatsResponse)
async def get_stats():
    """Get knowledge base statistics."""
    try:
        stats = vectorstore.get_stats()
        return StatsResponse(**stats)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")
