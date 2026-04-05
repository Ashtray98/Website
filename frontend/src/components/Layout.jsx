import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Search,
  MessageSquare,
  Upload,
  LayoutDashboard,
  Box
} from 'lucide-react';
import Particles from './Particles';

const navItems = [
  { path: '/', label: 'Search', icon: Search },
  { path: '/chat', label: 'Chat', icon: MessageSquare },
  { path: '/ingest', label: 'Ingest', icon: Upload },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export default function Layout() {
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      
      {/* Background Particles (Subtle Data Dust) */}
      <Particles />
      
      {/* Dynamic Mouse Spotlight Effect */}
      <div 
        className="pointer-events-none fixed inset-0 z-[200] transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.05) 30%, transparent 70%)`
        }}
      />
      
      {/* Floating Expandable Sidebar */}
      <aside 
        className="group fixed top-0 left-0 h-full z-50 flex flex-col transition-all duration-300 ease-in-out bg-[var(--bg-sidebar)] border-r border-[var(--border-primary)]"
        style={{
          width: '64px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
        onMouseEnter={(e) => e.currentTarget.style.width = '240px'}
        onMouseLeave={(e) => e.currentTarget.style.width = '64px'}
      >
        {/* Brand Area */}
        <div className="flex items-center h-16 w-full flex-shrink-0 border-b border-[var(--border-primary)] overflow-hidden px-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg flex-shrink-0">
            <Box size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            <h1 className="text-[15px] font-extrabold tracking-wide font-display text-white">DATA-WEAVE</h1>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-x-hidden overflow-y-auto py-6 px-3 space-y-2">
          <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[var(--text-muted)] px-1 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            Menu
          </p>
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `flex items-center h-10 w-full rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-[var(--bg-hover)] text-[var(--text-accent)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-white'
                }`
              }
              title={label}
            >
              {({ isActive }) => (
                <>
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className={isActive ? 'text-[var(--color-cobalt-500)]' : ''} />
                  </div>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-medium text-sm whitespace-nowrap">
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer Area */}
        <div className="p-4 border-t border-[var(--border-primary)] flex items-center overflow-hidden whitespace-nowrap">
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-success)] animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          </div>
          <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs font-mono text-[var(--text-muted)] tracking-widest uppercase">
            System Online
          </span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative min-w-0" style={{ paddingLeft: '64px' }}>
        <Outlet />
      </main>

    </div>
  );
}
