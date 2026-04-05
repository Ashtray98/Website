"""DATA-WEAVE Pydantic Models"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# --- Request Models ---

class ChatRequest(BaseModel):
    query: str
    conversation_history: list[dict] = Field(default_factory=list)
    top_k: int = 5


class IngestURLRequest(BaseModel):
    url: str


# --- Response Models ---

class IngestResponse(BaseModel):
    document_id: str
    filename: str
    chunk_count: int
    source_type: str
    status: str = "success"
    message: str = ""


class SearchResult(BaseModel):
    chunk_text: str
    source_document: str
    source_type: str
    score: float
    chunk_index: int = 0
    metadata: dict = Field(default_factory=dict)


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResult]
    total_results: int
    did_you_mean: Optional[str] = None


class SourceReference(BaseModel):
    document_name: str
    chunk_text: str
    relevance_score: float


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceReference]
    confidence: float
    query: str


class DocumentInfo(BaseModel):
    id: str
    name: str
    source_type: str
    upload_date: str
    chunk_count: int
    file_size: str = "N/A"


class DocumentsResponse(BaseModel):
    documents: list[DocumentInfo]
    total_count: int


class DeleteResponse(BaseModel):
    status: str
    message: str
    document_id: str


class StatsResponse(BaseModel):
    total_documents: int
    total_chunks: int
    source_types: dict
    last_updated: str
