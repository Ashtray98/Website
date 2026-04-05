import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, FileText, Loader, Sparkles, RotateCcw, Box, User, PanelRightOpen, PanelRightClose, Plus, Database, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { chatQuery } from '../api/client';

export default function Chat() {
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState([]);
  const [showSources, setShowSources] = useState(false);
  const [systemMode, setSystemMode] = useState('demo');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    import('../api/client').then(({ getStatus }) => {
      getStatus().then(status => setSystemMode(status.mode)).catch(() => {});
    });
  }, []);

  useEffect(() => {
    if (location.state?.initialQuery) {
      const q = location.state.initialQuery;
      setInput(q);
      // Auto-trigger if coming from home
      setTimeout(() => handleSend(null, q), 100);
    }
  }, [location.state]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e, forceInput) => {
    e?.preventDefault();
    const q = (forceInput || input).trim();
    if (!q || loading) return;

    const userMsg = { role: 'user', content: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const data = await chatQuery(q, history);

      const aiMsg = {
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        confidence: data.confidence,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setSources(data.sources || []);
      if (data.sources?.length > 0) setShowSources(true);
    } catch (err) {
      const errorMsg = {
        role: 'assistant',
        content: 'I encountered an error analyzing your documents. Please ensure the backend is running.',
        sources: [],
        confidence: 0,
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
    setLoading(false);
    inputRef.current?.focus();
  };

  const clearChat = () => {
    setMessages([]);
    setSources([]);
    setShowSources(false);
    setInput('');
  };

  return (
    <div className="flex flex-1 h-screen overflow-hidden relative bg-[var(--bg-primary)]">
      {/* Main Chat Container (Centered) */}
      <div className="flex-1 flex flex-col items-center relative z-10 w-full overflow-hidden">
        
        {/* Transparent Header */}
        <header className="w-full max-w-5xl px-8 py-6 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-4 pointer-events-auto">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-2xl glass-pill border-none p-0" style={{ background: 'linear-gradient(135deg, var(--color-cobalt-600), var(--color-violet-600))' }}>
              <Box size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-[var(--text-primary)] font-display">Analyst Studio</h2>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border ${
                  systemMode === 'openai' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                }`}>
                  {systemMode === 'openai' ? 'AI MODE' : 'DEMO MODE'}
                </span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-widest opacity-60">RAG Intelligence Node</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 pointer-events-auto">
             <button 
              onClick={() => setShowSources(!showSources)} 
              className={`p-2.5 rounded-xl border border-[var(--border-primary)] transition-all ${showSources ? 'bg-[var(--color-cobalt-500)] text-white border-transparent shadow-lg' : 'bg-white/5 text-[var(--text-muted)] hover:text-white'}`}
              title="Toggle Sources"
            >
              {showSources ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
            </button>
            <button onClick={clearChat} className="p-2.5 rounded-xl border border-[var(--border-primary)] bg-white/5 text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-all">
              <RotateCcw size={18} />
            </button>
          </div>
        </header>

        {/* Message Stream */}
        <main className="flex-1 w-full max-w-3xl overflow-y-auto px-6 py-8 space-y-10 scrollbar-hide no-scrollbar scroll-mask mt-4 mb-24">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-20 animate-fade-in opacity-80">
              <div className="w-20 h-20 rounded-[40px] flex items-center justify-center mb-8 relative">
                 <Sparkles size={48} className="text-[var(--color-cobalt-500)] relative z-10" />
              </div>
              <h1 className="text-3xl font-black mb-4 tracking-tighter font-display leading-tight">
                Analyze your data universe.
              </h1>
              <p className="text-base text-[var(--text-muted)] max-w-sm mb-12 leading-relaxed text-balance">
                Unlock insights hidden in your documents with industrial-grade RAG analysis.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {[
                  "Perform a strategic summary",
                  "Identify key risk factors",
                  "Contrast 2022 vs 2024 performance",
                  "List tactical action items"
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSend(null, suggestion)}
                    className="text-sm px-6 py-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[var(--color-cobalt-500)] hover:bg-white/10 text-left transition-all group"
                  >
                    <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-slide-in-up`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-center gap-2 mb-2 px-2 opacity-40 uppercase tracking-widest text-[9px] font-black">
                {msg.role === 'user' ? <><span className="text-[var(--text-muted)]">COMMANDER</span> <User size={10} /></> : <><Bot size={10} /> <span className="text-[var(--text-muted)]">ANALYST ENGINE</span></>}
              </div>
              <div className={`max-w-[90%] md:max-w-[85%] ${msg.role === 'user' ? 'fluid-message-user' : 'fluid-message-ai'} ${msg.role === 'assistant' && i === messages.length - 1 ? 'typewriter-text' : ''}`}>
                {msg.role === 'assistant' ? (
                  <div className="chat-markdown prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                    {msg.confidence > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-white/30 uppercase">Precision Score</span>
                            <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                               <div className="h-full bg-[var(--color-cobalt-500)] shadow-[0_0_8px_var(--color-cobalt-500)]" style={{ width: `${msg.confidence * 100}%` }} />
                            </div>
                         </div>
                         <span className="text-[10px] font-mono text-[var(--color-cobalt-400)] font-bold">{(msg.confidence * 100).toFixed(0)}%</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex flex-col items-start animate-fade-in">
              <div className="flex items-center gap-2 mb-2 px-2 opacity-40 uppercase tracking-widest text-[9px] font-black">
                <Bot size={10} /> <span className="text-[var(--text-muted)]">CORE REASONING...</span>
              </div>
              <div className="fluid-message-ai px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="dot-loader">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className="text-xs font-medium text-[var(--text-muted)] animate-pulse">Scanning knowledge nodes</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-12" />
        </main>

        {/* Floating Input Pill */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-20">
          <form 
            onSubmit={handleSend} 
            className="chat-input-container glass-pill p-1.5 pl-6"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Query the Analyst Hub..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-white/30 h-10"
              disabled={loading}
            />
            <div className="flex items-center gap-1">
               <button 
                type="button" 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all"
                title="Context Settings"
              >
                <Plus size={18} />
              </button>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="btn-pill-send"
              >
                {loading ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Floating Modern Sources Panel */}
      {showSources && (
        <aside className="source-panel-floating flex flex-col border-none shadow-[25px_0_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-[40px]">
          <div className="px-6 py-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/50 flex items-center gap-2">
              <FileText size={14} className="text-[var(--color-cobalt-500)]" />
              Verified Nodes
            </h3>
            <button onClick={() => setShowSources(false)} className="text-white/20 hover:text-white">
               <Plus size={18} className="rotate-45" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 no-scrollbar">
            {sources.length === 0 ? (
              <div className="text-center py-20 opacity-30">
                <Database size={32} className="mx-auto mb-4" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Awaiting Analysis</p>
              </div>
            ) : (
              sources.map((source, i) => (
                <div
                  key={i}
                  className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-all group"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={12} className="text-[var(--color-cobalt-500)]" />
                    <span className="text-[10px] font-bold truncate text-white/80">{source.document_name}</span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">{source.chunk_text}</p>
                  <div className="mt-4 flex items-center justify-between opacity-40 group-hover:opacity-100 transition-all">
                     <span className="text-[9px] font-black uppercase tracking-widest">Node Hit Score</span>
                     <span className="text-[10px] font-mono font-bold">{(source.relevance_score * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
