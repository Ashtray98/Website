"""Document Parser Service - Handles PDF, DOCX, TXT, and URL parsing"""
import io
import os
import tempfile
import requests
from bs4 import BeautifulSoup


def parse_pdf(file_content: bytes) -> str:
    """Parse PDF file content to text using PyMuPDF."""
    import fitz  # PyMuPDF

    text_parts = []
    with fitz.open(stream=file_content, filetype="pdf") as doc:
        for page_num, page in enumerate(doc):
            page_text = page.get_text()
            if page_text.strip():
                text_parts.append(f"[Page {page_num + 1}]\n{page_text}")
    return "\n\n".join(text_parts)


def parse_docx(file_content: bytes) -> str:
    """Parse DOCX file content to text."""
    from docx import Document

    doc = Document(io.BytesIO(file_content))
    paragraphs = []
    for para in doc.paragraphs:
        if para.text.strip():
            paragraphs.append(para.text)
    return "\n\n".join(paragraphs)


def parse_txt(file_content: bytes) -> str:
    """Parse TXT file content to text."""
    try:
        return file_content.decode("utf-8")
    except UnicodeDecodeError:
        return file_content.decode("latin-1")


def parse_url(url: str) -> str:
    """Fetch and parse URL content to text."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    response = requests.get(url, headers=headers, timeout=30)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    # Remove script and style elements
    for element in soup(["script", "style", "nav", "footer", "header"]):
        element.decompose()

    # Get text
    text = soup.get_text(separator="\n", strip=True)

    # Clean up whitespace
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    return "\n".join(lines)


def parse_file(filename: str, content: bytes) -> str:
    """Auto-detect file type and parse accordingly."""
    ext = os.path.splitext(filename)[1].lower()

    if ext == ".pdf":
        return parse_pdf(content)
    elif ext in (".docx", ".doc"):
        return parse_docx(content)
    elif ext in (".txt", ".md", ".csv", ".json"):
        return parse_txt(content)
    else:
        raise ValueError(f"Unsupported file type: {ext}. Supported: .pdf, .docx, .txt, .md")


def detect_source_type(filename: str) -> str:
    """Detect source type from filename."""
    ext = os.path.splitext(filename)[1].lower()
    type_map = {
        ".pdf": "PDF",
        ".docx": "DOCX",
        ".doc": "DOCX",
        ".txt": "TXT",
        ".md": "Markdown",
        ".csv": "CSV",
        ".json": "JSON",
    }
    return type_map.get(ext, "Unknown")
