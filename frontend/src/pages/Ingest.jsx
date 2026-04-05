import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload, FileText, Globe, CheckCircle, AlertCircle, X, Loader,
  Zap, ArrowRight
} from 'lucide-react';
import { ingestFile, ingestURL } from '../api/client';

const FILE_TYPES = [
  { ext: '.pdf', label: 'PDF', color: '#dc2626', bg: 'var(--bg-secondary)' },
  { ext: '.docx', label: 'DOCX', color: '#2563eb', bg: 'var(--bg-secondary)' },
  { ext: '.txt', label: 'TXT', color: '#059669', bg: 'var(--bg-secondary)' },
  { ext: '.md', label: 'Markdown', color: '#d97706', bg: 'var(--bg-secondary)' },
];

export default function Ingest() {
  const [url, setUrl] = useState('');
  const [uploads, setUploads] = useState([]);
  const [urlLoading, setUrlLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const addUpload = (entry) => {
    setUploads((prev) => [entry, ...prev]);
  };

  const updateUpload = (id, updates) => {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
  };

  const formatSize = (bytes) => {
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const handleFiles = async (files) => {
    if (isProcessing) return;
    setIsProcessing(true);

    for (const file of files) {
      const id = Date.now() + Math.random();
      addUpload({
        id,
        name: file.name,
        size: formatSize(file.size),
        status: 'uploading',
        progress: 0,
        stage: 'Uploading...',
      });

      try {
        const onProgress = (pct) => {
          updateUpload(id, {
            progress: Math.min(pct * 0.3, 30),
            stage: pct < 100 ? `Uploading... ${pct}%` : 'Processing (parsing, chunking, embedding)...',
          });
        };

        updateUpload(id, { progress: 5, stage: 'Uploading...' });
        const data = await ingestFile(file, onProgress);
        updateUpload(id, {
          status: 'success',
          progress: 100,
          stage: 'Complete',
          chunks: data.chunk_count,
          docId: data.document_id,
        });
      } catch (err) {
        updateUpload(id, {
          status: 'error',
          progress: 0,
          stage: err.response?.data?.detail || err.mesviolet || 'Upload failed',
        });
      }
    }

    setIsProcessing(false);
  };

  const handleURL = async (e) => {
    e.preventDefault();
    if (!url.trim() || urlLoading) return;

    const id = Date.now();
    setUrlLoading(true);
    addUpload({
      id,
      name: url,
      size: 'URL',
      status: 'uploading',
      progress: 0,
      stage: 'Fetching URL...',
    });

    try {
      updateUpload(id, { progress: 30, stage: 'Parsing content...' });
      const data = await ingestURL(url);
      updateUpload(id, {
        status: 'success',
        progress: 100,
        stage: 'Complete',
        chunks: data.chunk_count,
        docId: data.document_id,
      });
      setUrl('');
    } catch (err) {
      updateUpload(id, {
        status: 'error',
        progress: 0,
        stage: err.response?.data?.detail || 'URL ingestion failed',
      });
    }
    setUrlLoading(false);
  };

  const onDrop = useCallback(
    (acceptedFiles) => {
      handleFiles(acceptedFiles);
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
    multiple: true,
  });

  const removeUpload = (id) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border border-[var(--border-primary)]"
            style={{ background: 'var(--bg-elevated)' }}
          >
            <Upload size={20} style={{ color: 'var(--color-cobalt-600)' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              Ingest Documents
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Upload files or paste a URL to grow your knowledge base.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* File Upload */}
        <div className="animate-slide-in-up">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <FileText size={15} style={{ color: 'var(--color-cobalt-600)' }} />
            File Upload
          </h3>
          <div
            {...getRootProps()}
            className={`upload-zone glass-card ${isDragActive ? 'active' : ''}`}
            style={{
              padding: '48px 32px',
              borderStyle: 'dashed',
              borderWidth: '2px',
            }}
          >
            <input {...getInputProps()} />
            <div className="mb-6">
              <div
                className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110"
                style={{
                  background: isDragActive ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-secondary)',
                  border: `1px solid ${isDragActive ? 'var(--color-cobalt-500)' : 'var(--border-primary)'}`,
                }}
              >
                <Upload size={28} style={{ color: isDragActive ? 'var(--color-cobalt-500)' : 'var(--text-muted)' }} />
              </div>
              <p className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                {isDragActive ? 'Drop files to ingest' : 'Drag & drop your knowledge'}
              </p>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>PDF, DOCX, TXT, MD up to 25MB</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {FILE_TYPES.map((ft) => (
                <span
                  key={ft.ext}
                  className="text-[0.7rem] px-2.5 py-1 rounded-md font-medium border border-[var(--border-primary)]"
                  style={{
                    background: ft.bg,
                    color: ft.color,
                  }}
                >
                  {ft.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* URL Ingestion */}
        <div className="animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Globe size={15} style={{ color: 'var(--color-violet)' }} />
            URL Ingestion
          </h3>
          <div className="glass-card p-8 border-t-4 border-t-[var(--color-violet-500)]">
            <p className="text-sm font-medium mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Enter a website URL to automatically crawl, parse, and ingest its content directly into your vector store.
            </p>
            <form onSubmit={handleURL} className="space-y-4">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/docs/page"
                className="input-field"
              />
              <button
                type="submit"
                disabled={urlLoading || !url.trim()}
                className="btn-primary w-full justify-center"
              >
                {urlLoading ? (
                  <>
                    <Loader size={15} className="animate-spin" /> Fetching...
                  </>
                ) : (
                  <>
                    <Globe size={15} /> Fetch & Ingest
                  </>
                )}
              </button>
            </form>

            {/* Processing pipeline */}
            <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--border-primary)' }}>
              <p className="text-[11px] uppercase tracking-wider mb-3 font-medium" style={{ color: 'var(--text-muted)' }}>Processing Pipeline</p>
              <div className="flex items-center gap-1.5 text-[0.7rem]">
                <span className="stat-badge stat-badge-cobalt">1. Parse</span>
                <ArrowRight size={10} style={{ color: 'var(--text-muted)' }} />
                <span className="stat-badge stat-badge-violet">2. Chunk</span>
                <ArrowRight size={10} style={{ color: 'var(--text-muted)' }} />
                <span className="stat-badge stat-badge-cobalt">3. Embed</span>
                <ArrowRight size={10} style={{ color: 'var(--text-muted)' }} />
                <span className="stat-badge stat-badge-violet-400">4. Store</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload History */}
      {uploads.length > 0 && (
        <div className="mt-8 animate-fade-in">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Uploads</h3>
          <div className="space-y-3 stagger-children">
            {uploads.map((upload) => (
              <div key={upload.id} className="glass-card p-5 flex items-center gap-5">
                {/* Icon */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border border-[var(--border-primary)]"
                  style={{
                    background: upload.status === 'success' ? 'var(--color-cobalt-50)' :
                      upload.status === 'error' ? 'rgba(248,113,113,0.05)' : 'var(--bg-elevated)',
                  }}
                >
                  {upload.status === 'success' ? (
                    <CheckCircle size={16} style={{ color: 'var(--color-cobalt-600)' }} />
                  ) : upload.status === 'error' ? (
                    <AlertCircle size={16} style={{ color: 'var(--color-error)' }} />
                  ) : (
                    <Loader size={16} className="animate-spin" style={{ color: 'var(--color-cobalt-500)' }} />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{upload.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-mono" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{upload.size}</span>
                    <span
                      className="text-xs"
                      style={{
                        color: upload.status === 'success' ? 'var(--color-cobalt-600)' :
                          upload.status === 'error' ? 'var(--color-error)' : 'var(--text-secondary)',
                      }}
                    >
                      {upload.stage}
                    </span>
                    {upload.chunks && (
                      <span className="stat-badge stat-badge-cobalt text-[0.6rem]">{upload.chunks} chunks</span>
                    )}
                  </div>
                  {upload.status === 'uploading' && (
                    <div className="progress-bar mt-2">
                      <div className="progress-fill" style={{ width: `${upload.progress}%` }} />
                    </div>
                  )}
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeUpload(upload.id)}
                  className="p-1.5 transition-colors rounded-md text-[var(--text-muted)] hover:text-[var(--color-error)] hover:bg-transparent"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
