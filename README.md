# DATA-WEAVE 🕸️

### AI-Powered Enterprise Knowledge Retrieval System
*Eclipse 6.0 Hackathon • ID: EC604 • ACM Thapar*

---

## 🎯 Problem Statement

Modern organizations store knowledge across disconnected documents, databases, and internal tools. Employees waste time searching multiple platforms for information that already exists. DATA-WEAVE solves this with a unified, context-aware retrieval interface.

## 🚀 Features

- **📄 Document Ingestion** — Upload PDFs, DOCX, TXT files or paste URLs. Content is automatically parsed, chunked, embedded, and stored.
- **🔍 Semantic Search** — Natural language queries retrieve the most relevant chunks via cosine similarity.
- **💬 RAG-based Q&A Chat** — Ask questions and get AI-generated answers grounded in your documents with source citations.
- **📊 Knowledge Base Dashboard** — View all ingested documents with metadata, stats, and management controls.
- **🎯 Source Attribution** — Every answer shows which documents it came from with relevance scores.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TailwindCSS v4 |
| Backend | Python + FastAPI |
| AI/Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| Vector DB | ChromaDB (persistent, local) |
| File Parsing | PyMuPDF, python-docx, BeautifulSoup |
| LLM (optional) | OpenAI GPT-4o-mini |

## 📁 Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI entry point
│   │   ├── config.py         # Settings & environment
│   │   ├── models.py         # Pydantic models
│   │   ├── routers/          # API endpoints
│   │   │   ├── ingest.py     # POST /api/ingest
│   │   │   ├── search.py     # GET /api/search
│   │   │   ├── chat.py       # POST /api/chat
│   │   │   └── documents.py  # GET/DELETE /api/documents
│   │   └── services/         # Business logic
│   │       ├── parser.py     # Document parsing
│   │       ├── chunker.py    # Text splitting
│   │       ├── embedder.py   # Embedding generation
│   │       ├── vectorstore.py# ChromaDB operations
│   │       └── llm.py        # RAG answer generation
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/            # Home, Chat, Ingest, Dashboard
│   │   ├── components/       # Layout, shared components
│   │   └── api/client.js     # API wrapper
│   └── vite.config.js
└── README.md
```

## ⚡ Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The app will be available at **http://localhost:5173**

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ingest` | Upload file or URL for ingestion |
| GET | `/api/search?q=query` | Semantic search |
| POST | `/api/chat` | RAG-based Q&A with sources |
| GET | `/api/documents` | List all documents |
| DELETE | `/api/documents/{id}` | Remove a document |
| GET | `/api/stats` | Knowledge base statistics |

## 🎨 Design

Dark cyber theme with electric cyan (`#00d4ff`) and purple (`#7c3aed`) accents on deep navy (`#0a0b14`). Features glassmorphism cards, glow effects, and smooth animations.

## 🔑 OpenAI Integration (Optional)

To enable full LLM-powered answers, set your API key in `backend/.env`:
```
USE_OPENAI=true
OPENAI_API_KEY=sk-your-key-here
```

Without an API key, the system runs in **demo mode** using free local sentence-transformers for embeddings and template-based responses with real context.

## 📄 License

Built for Eclipse 6.0 Hackathon
