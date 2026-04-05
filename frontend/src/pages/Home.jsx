import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, MessageSquare, Upload, FileText, BookOpen, Layers, Command } from 'lucide-react';
import { searchKB } from '../api/client';

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = async (e, overrideQuery = null) => {
    if (e) e.preventDefault();
    const activeQuery = overrideQuery || query;
    if (!activeQuery.trim()) return;

    setLoading(true);
    setSearchPerformed(true);
    try {
      const data = await searchKB(activeQuery);
      setResults(data);
    } catch (err) {
      console.error('Search failed:', err);
      setResults({ query: activeQuery, results: [], total_results: 0 });
    }
    setLoading(false);
  };

  const goToChat = () => {
    navigate('/chat', { state: { initialQuery: query } });
  };

  const features = [
    {
      icon: BookOpen,
      title: 'Semantic Search',
      desc: 'Find relevant passages across all your documents instantly.',
      color: 'var(--color-cobalt-400)',
      bg: 'rgba(59, 130, 246, 0.1)',
    },
    {
      icon: MessageSquare,
      title: 'AI Chat',
      desc: 'Ask questions in natural language for grounded answers.',
      color: 'var(--color-violet-400)',
      bg: 'rgba(139, 92, 246, 0.1)',
    },
    {
      icon: Layers,
      title: 'Smart Ingestion',
      desc: 'Upload PDFs, DOCX, TXT, or web URLs securely.',
      color: 'var(--text-muted)',
      bg: 'var(--bg-elevated)',
    },
  ];

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">

      {/* Ambient background glow */}
      <div className="ambient-glow" />

      {/* Main Content / Search Area */}
      <div className="relative z-10 w-full max-w-3xl px-6 pt-12 flex-1 flex flex-col items-center justify-center">

        {!searchPerformed && (
          <div className="text-center mb-10 animate-fade-in -translate-y-[12vh]">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 font-display drop-shadow-sm">
              <span className="gradient-text">Unify</span> your<br />organization's knowledge.
            </h1>
          </div>
        )}

        {searchPerformed && (
          <div className="w-full flex justify-center mb-10 animate-fade-in">
            <h2 className="text-2xl font-bold font-display text-white tracking-widest uppercase">
              DATA-WEAVE
            </h2>
          </div>
        )}

        {/* Massive Search Bar */}
        <form onSubmit={handleSearch} className="w-full animate-fade-in shell" style={{ animationDelay: '0.1s' }}>
          <div className="relative group">
            <div
              className={`relative flex items-center transition-all duration-300 ease-out frosted-glass ${searchPerformed ? 'rounded-2xl h-14' : 'rounded-[2rem] h-14 md:h-16'} glass-card`}
              style={{
                background: 'rgba(24, 24, 30, 0.45)',
              }}
            >
              <Search size={searchPerformed ? 20 : 24} className="ml-6 flex-shrink-0 text-[var(--text-muted)] group-focus-within:text-[var(--color-cobalt-400)] transition-colors" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask your knowledge base anything..."
                className={`flex-1 bg-transparent border-none outline-none px-5 text-white tracking-wide font-sans placeholder-[var(--text-muted)] ${searchPerformed ? 'text-base' : 'text-base md:text-xl'}`}
              />
              <div className="flex items-center gap-4 mr-4 md:mr-6">
                {!searchPerformed && (
                  <span className="hidden md:flex items-center gap-1 text-[var(--text-muted)] border border-[var(--border-hover)] rounded-md px-3 py-1.5 text-sm font-mono tracking-wider bg-[var(--bg-elevated)]">
                    <Command size={14} /> K
                  </span>
                )}
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className={`flex items-center justify-center rounded-xl transition-all duration-300 ${searchPerformed ? 'w-10 h-10' : 'w-10 h-10 md:w-12 md:h-12'} ${query.trim() && !loading ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_25px_rgba(59,130,246,0.6)]' : 'bg-[var(--bg-surface)] opacity-50'}`}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles size={searchPerformed ? 16 : 20} className="text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Search Results */}
        {searchPerformed && (
          <div className="w-full mt-10 pb-16">
            {loading ? (
              <div className="flex flex-col items-center py-16">
                <div className="w-10 h-10 border-3 rounded-full animate-spin mb-4"
                  style={{ borderColor: 'var(--border-primary)', borderTopColor: 'var(--color-cobalt-500)' }}
                />
                <p className="text-[var(--text-muted)] tracking-wide">Searching entire knowledge graph...</p>
              </div>
            ) : results?.results?.length > 0 ? (
              <>
                <div className="flex flex-col gap-4 mb-6">
                  {results.did_you_mean && (
                    <div className="text-sm animate-fade-in py-2.5 px-5 rounded-xl glass-card flex items-center gap-2 border-l-4 border-l-[var(--color-cobalt-500)]">
                      <span className="text-[var(--text-muted)] font-medium">Did you mean:</span>
                      <button 
                        onClick={() => {
                          setQuery(results.did_you_mean);
                          handleSearch(null, results.did_you_mean);
                        }}
                        className="text-[var(--color-cobalt-400)] font-bold hover:text-white transition-colors cursor-pointer"
                      >
                        {results.did_you_mean}
                      </button>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[var(--text-secondary)] font-medium">
                      Found <span className="text-[var(--color-cobalt-400)] font-bold">{results.total_results}</span> relevant chunks
                    </p>
                    <button onClick={goToChat} className="btn-primary text-sm py-2 rounded-xl">
                      <MessageSquare size={14} /> Discuss Results with AI
                    </button>
                  </div>
                </div>
                <div className="space-y-4 stagger-children">
                  {results.results.map((result, i) => (
                    <div key={i} className="glass-card p-6 group">
                      <div className="flex items-start justify-between mb-4 border-b border-[var(--border-primary)] pb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[var(--bg-surface)] rounded-md border border-[var(--border-primary)]">
                            <FileText size={16} className="text-[var(--color-cobalt-400)]" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[var(--text-primary)]">{result.source_document}</p>
                            <span className="stat-badge stat-badge-emerald text-[0.65rem] mt-1">{result.source_type}</span>
                          </div>
                        </div>
                        <div
                          className="text-xs font-bold px-3 py-1.5 rounded-lg font-mono tracking-wider border"
                          style={{
                            background: result.score > 0.7 ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-secondary)',
                            borderColor: result.score > 0.7 ? 'rgba(59, 130, 246, 0.3)' : 'var(--border-primary)',
                            color: result.score > 0.7 ? 'var(--color-cobalt-400)' : 'var(--text-muted)'
                          }}
                        >
                          {(result.score * 100).toFixed(0)}% MATCH
                        </div>
                      </div>
                      <p className="text-[15px] leading-relaxed text-[var(--text-secondary)] line-clamp-4 font-sans">
                        {result.chunk_text}
                      </p>
                      <div className="mt-4 text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2 py-1 rounded inline-block">
                        chunk_{result.chunk_index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center bg-[var(--bg-surface)] border border-[var(--border-primary)]">
                  <Search size={28} className="text-[var(--text-muted)]" />
                </div>
                <p className="text-xl text-[var(--text-primary)] font-medium mb-2">No results found</p>
                <p className="text-sm text-[var(--text-muted)] mb-8">No documents matched your query. Try a different term or upload new data.</p>
                <button onClick={() => navigate('/ingest')} className="btn-secondary rounded-xl py-3 px-6">
                  <Upload size={16} /> Go to Smart Ingestion
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Features Dock */}
      {!searchPerformed && (
        <div className="absolute bottom-[20vh] left-0 right-0 w-full p-6 flex justify-center z-10 animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl w-full">
            {features.map((f, i) => (
              <div
                key={f.title}
                onClick={() => {
                  if (i === 0) inputRef.current?.focus();
                  else if (i === 1) navigate('/chat');
                  else navigate('/ingest');
                }}
                className="glass-card p-5 flex items-center gap-4 cursor-pointer group"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 border border-[var(--border-primary)]"
                  style={{ background: f.bg }}
                >
                  <f.icon size={22} style={{ color: f.color }} />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-white font-display mb-1">{f.title}</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed pr-2">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
