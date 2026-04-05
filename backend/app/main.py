"""DATA-WEAVE - AI-Powered Enterprise Knowledge Retrieval System"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import ingest, search, chat, documents

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Powered Enterprise Knowledge Retrieval System",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(ingest.router)
app.include_router(search.router)
app.include_router(chat.router)
app.include_router(documents.router)


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "mode": "openai" if settings.USE_OPENAI else "demo",
        "endpoints": {
            "ingest": "/api/ingest",
            "search": "/api/search",
            "chat": "/api/chat",
            "documents": "/api/documents",
            "stats": "/api/stats",
        }
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
