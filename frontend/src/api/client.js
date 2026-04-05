import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 600000, // 10 min for large files
  headers: {
    'Accept': 'application/json',
  },
  maxContentLength: 100 * 1024 * 1024, // 100MB
  maxBodyLength: 100 * 1024 * 1024,
});

// === Ingest ===
export async function ingestFile(file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/ingest', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 600000, // 10 min for large PDFs
    onUploadProgress: onProgress
      ? (e) => onProgress(Math.round((e.loaded * 100) / e.total))
      : undefined,
  });
  return res.data;
}

export async function ingestURL(url) {
  const formData = new FormData();
  formData.append('url', url);
  const res = await api.post('/ingest', formData);
  return res.data;
}

// === Search ===
export async function searchKB(query, topK = 5) {
  const res = await api.get('/search', { params: { q: query, top_k: topK } });
  return res.data;
}

// === Chat ===
export async function chatQuery(query, conversationHistory = [], topK = 5) {
  const res = await api.post('/chat', {
    query,
    conversation_history: conversationHistory,
    top_k: topK,
  });
  return res.data;
}

// === Documents ===
export async function getDocuments() {
  const res = await api.get('/documents');
  return res.data;
}

export async function deleteDocument(docId) {
  const res = await api.delete(`/documents/${docId}`);
  return res.data;
}

// === Stats ===
export async function getStats() {
  const res = await api.get('/stats');
  return res.data;
}
