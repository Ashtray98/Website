import { useState, useEffect } from 'react';
import {
  LayoutDashboard, FileText, Database, Layers, Clock, Trash2, RefreshCw,
  TrendingUp, FileType2, Globe, Loader
} from 'lucide-react';
import { getDocuments, getStats, deleteDocument } from '../api/client';

const typeIcons = {
  PDF: { icon: FileText, color: '#dc2626', bg: 'var(--bg-secondary)' },
  DOCX: { icon: FileType2, color: '#2563eb', bg: 'var(--bg-secondary)' },
  TXT: { icon: FileText, color: '#059669', bg: 'var(--bg-secondary)' },
  Markdown: { icon: FileText, color: '#d97706', bg: 'var(--bg-secondary)' },
  URL: { icon: Globe, color: '#7c3aed', bg: 'var(--bg-secondary)' },
  Unknown: { icon: FileText, color: '#6b7280', bg: 'var(--bg-secondary)' },
};

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [docsRes, statsRes] = await Promise.all([getDocuments(), getStats()]);
      setDocuments(docsRes.documents || []);
      setStats(statsRes);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    setDeleting(docId);
    try {
      await deleteDocument(docId);
      await fetchData();
    } catch (err) {
      console.error('Delete failed:', err);
    }
    setDeleting(null);
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const statCards = [
    {
      icon: Database,
      label: 'Total Documents',
      value: stats?.total_documents ?? '—',
      color: 'var(--color-cobalt-800)',
      bg: 'var(--color-cobalt-100)',
    },
    {
      icon: Layers,
      label: 'Total Chunks',
      value: stats?.total_chunks ?? '—',
      color: 'var(--color-violet)',
      bg: 'rgba(119, 147, 97, 0.1)',
    },
    {
      icon: TrendingUp,
      label: 'Source Types',
      value: stats?.source_types ? Object.keys(stats.source_types).length : '—',
      color: 'var(--color-violet-400-dark)',
      bg: 'rgba(184, 155, 71, 0.1)',
    },
    {
      icon: Clock,
      label: 'Last Updated',
      value: stats?.last_updated ? formatDate(stats.last_updated).split(',')[0] : 'Never',
      color: 'var(--text-muted)',
      bg: 'var(--bg-secondary)',
      isText: true,
    },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border border-[var(--border-primary)]"
            style={{ background: 'var(--bg-elevated)' }}
          >
            <LayoutDashboard size={20} style={{ color: 'var(--color-cobalt-600)' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              Knowledge Base Dashboard
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Overview of your ingested documents and system metrics.</p>
          </div>
        </div>
        <button onClick={fetchData} className="btn-secondary" disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Source Type Distribution */}
      {stats?.source_types && Object.keys(stats.source_types).length > 0 && (
        <div className="glass-card p-6 mb-8 animate-fade-in border-l-4 border-l-[var(--color-cobalt-500)]">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: 'var(--text-muted)' }}>Resource Distribution</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.source_types).map(([type, count]) => {
              const typeInfo = typeIcons[type] || typeIcons.Unknown;
              return (
                <div
                  key={type}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--color-cobalt-500)] transition-colors group"
                >
                  <typeInfo.icon size={16} style={{ color: typeInfo.color }} className="group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{type}</span>
                  <div className="w-px h-4 bg-[var(--border-primary)] mx-1" />
                  <span className="text-sm font-bold font-mono" style={{ color: 'var(--color-cobalt-400)' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Documents Table */}
      <div className="animate-fade-in">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <FileText size={15} style={{ color: 'var(--color-cobalt-600)' }} />
          Ingested Documents
          {documents.length > 0 && (
            <span className="stat-badge stat-badge-cobalt text-[0.6rem]">{documents.length}</span>
          )}
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader size={22} className="animate-spin" style={{ color: 'var(--color-cobalt-600)' }} />
          </div>
        ) : documents.length === 0 ? (
          <div className="surface-card p-12 text-center">
            <div
              className="w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center border border-[var(--border-primary)]"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <Database size={28} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="mb-1" style={{ color: 'var(--text-secondary)' }}>No documents ingested yet</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Go to the Ingest page to upload documents.</p>
          </div>
        ) : (
          <div className="space-y-1.5 stagger-children">
            {/* Table Header */}
            <div
              className="grid gap-4 px-5 py-2.5 text-[11px] font-medium uppercase tracking-wider"
              style={{
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto',
                color: 'var(--text-muted)',
              }}
            >
              <span>Name</span>
              <span>Type</span>
              <span>Size</span>
              <span>Chunks</span>
              <span>Uploaded</span>
              <span></span>
            </div>

            {/* Rows */}
            {documents.map((doc) => {
              const typeInfo = typeIcons[doc.source_type] || typeIcons.Unknown;
              const TypeIcon = typeInfo.icon;
              return (
                <div
                  key={doc.id}
                  className="surface-card grid gap-4 px-5 py-3.5 items-center"
                  style={{
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto',
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <TypeIcon size={15} style={{ color: typeInfo.color }} className="flex-shrink-0" />
                    <span className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{doc.name}</span>
                  </div>
                  <span
                    className="text-xs font-medium px-2 py-1 rounded-md w-fit border border-[var(--border-primary)]"
                    style={{
                      background: typeInfo.bg,
                      color: typeInfo.color,
                    }}
                  >
                    {doc.source_type}
                  </span>
                  <span className="text-sm font-mono" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{doc.file_size}</span>
                  <span className="text-sm font-mono" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{doc.chunk_count}</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(doc.upload_date)}</span>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deleting === doc.id}
                    className="btn-danger text-xs py-1.5 px-3"
                  >
                    {deleting === doc.id ? (
                      <Loader size={12} className="animate-spin" />
                    ) : (
                      <Trash2 size={12} />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg, isText = false }) {
  return (
    <div className="glass-card p-6 relative overflow-hidden group">
      <div className="flex items-center justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center border border-[var(--border-primary)] bg-[var(--bg-secondary)] group-hover:scale-110 transition-transform duration-300"
        >
          <Icon size={20} style={{ color }} />
        </div>
        <TrendingUp size={14} className="text-[var(--color-success)] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div>
        <p
          className={`font-bold tracking-tight mb-1 ${isText ? 'text-lg' : 'text-3xl'}`}
          style={{ color: 'var(--text-primary)', fontFamily: isText ? 'var(--font-sans)' : 'var(--font-mono)' }}
        >
          {value}
        </p>
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{label}</p>
      </div>

      {/* Decorative inner glow */}
      <div
        className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20"
        style={{ background: color }}
      />
    </div>
  );
}
