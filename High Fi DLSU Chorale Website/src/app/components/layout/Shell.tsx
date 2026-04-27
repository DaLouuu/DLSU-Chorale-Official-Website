import { ReactNode, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useTheme, useApp } from '../../App';
import { FONTS } from '../../theme';
import { Icon } from '../ui/Icon';
import { Avatar } from '../ui/Avatar';
import { NotificationBell } from '../ui/NotificationBell';
import logo from '../../../imports/dlsu-chorale-logo.png';
import { MEMBERS } from '../../data';

function useViewportWidth() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

const MEMBER_NAV = [
  { key: 'member-home', label: 'Home', icon: 'home' },
  { key: 'member-attendance', label: 'My Attendance', icon: 'clock' },
  { key: 'member-excuses', label: 'Excuse Requests', icon: 'ticket' },
  { key: 'member-performances', label: 'Events', icon: 'music' },
  { key: 'member-music', label: 'Music Library', icon: 'folder' },
  { key: 'member-fees', label: 'Fees & Payments', icon: 'wallet' },
  { key: 'member-announcements', label: 'Announcements', icon: 'megaphone' },
  { key: 'member-profile', label: 'Profile', icon: 'user' },
];

const ADMIN_NAV = [
  { key: 'admin-home', label: 'Dashboard', icon: 'home' },
  { key: 'admin-events', label: 'Events', icon: 'music' },
  { key: 'admin-attendance', label: 'Attendance Overview', icon: 'clock' },
  { key: 'admin-excuses', label: 'Excuse Approvals', icon: 'ticket' },
  { key: 'admin-music', label: 'Music Library', icon: 'folder' },
  { key: 'admin-fees', label: 'Fee Management', icon: 'wallet' },
  { key: 'admin-analytics', label: 'Analytics', icon: 'chart' },
  { key: 'admin-members', label: 'Members', icon: 'users' },
  { key: 'rfid', label: 'Launch Kiosk', icon: 'check' },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const { route, role, go } = useRouter();
  const { theme } = useTheme();
  const items = role === 'admin' ? ADMIN_NAV : MEMBER_NAV;

  const navigate = (key: string) => {
    go(key as any);
    onClose?.();
  };

  return (
    <aside
      style={{
        width: 240,
        background: theme.greenDark,
        color: '#F1EFEA',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        fontFamily: FONTS.sans,
        height: '100%',
      }}
    >
      <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={logo} alt="DLSU Chorale" style={{ height: 38, width: 'auto', filter: 'brightness(0) invert(1)' }} />
          <div>
            <div style={{ fontFamily: FONTS.serif, fontSize: 18, lineHeight: 1, letterSpacing: 0.5 }}>DLSU</div>
            <div style={{ fontFamily: FONTS.serif, fontSize: 18, lineHeight: 1, letterSpacing: 0.5 }}>Chorale</div>
          </div>
        </div>
        <div style={{ marginTop: 14, fontSize: 10, fontFamily: FONTS.mono, letterSpacing: 2, opacity: 0.6, textTransform: 'uppercase' }}>
          {role === 'admin' ? 'Admin Console' : 'Official Website'}
        </div>
      </div>

      <nav style={{ padding: 10, flex: 1 }}>
        {items.map(it => {
          const active = route === it.key;
          return (
            <button
              key={it.key}
              onClick={() => navigate(it.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                width: '100%',
                padding: '11px 14px',
                border: 'none',
                background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: active ? '#fff' : '#D6D4CE',
                borderRadius: 8,
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: 13.5,
                fontWeight: active ? 500 : 400,
                marginBottom: 2,
                borderLeft: active ? `3px solid ${theme.greenMid}` : '3px solid transparent',
              }}
            >
              <Icon name={it.icon as any} size={16} />
              <span>{it.label}</span>
            </button>
          );
        })}
      </nav>

      <div style={{ padding: 14, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={() => {
            try { localStorage.removeItem('chorale_session'); } catch {}
            go('landing');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: '#D6D4CE',
            padding: '10px 12px',
            cursor: 'pointer',
            fontSize: 13,
            borderRadius: 8,
          }}
        >
          <Icon name="logout" size={15} /> Sign out
        </button>
      </div>
    </aside>
  );
}

function Topbar({ onMenuClick, isMobile }: { onMenuClick?: () => void; isMobile?: boolean }) {
  const { user, role, go } = useRouter();
  const { theme, mode, setMode } = useTheme();
  const app = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [sessionExpiry, setSessionExpiry] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('chorale_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (new Date(parsed.expiresAt) > new Date()) setSessionExpiry(parsed.expiresAt);
      }
    } catch {}
  }, []);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const results = (() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const allResults: Array<{ type: string; title: string; subtitle: string; route: any }> = [];

    if (role === 'admin') {
      // Search members
      MEMBERS.filter(m =>
        m.name.toLowerCase().includes(query) ||
        m.section.toLowerCase().includes(query) ||
        String(m.id).includes(query)
      ).forEach(m => {
        allResults.push({
          type: 'Member',
          title: m.name,
          subtitle: `${m.section} · ID ${m.id}`,
          route: 'admin-members',
        });
      });

      // Search excuses
      app.excuses.filter(e =>
        e.memberName.toLowerCase().includes(query) ||
        e.reason.toLowerCase().includes(query) ||
        e.section.toLowerCase().includes(query)
      ).slice(0, 5).forEach(e => {
        allResults.push({
          type: 'Excuse',
          title: `${e.memberName} - ${e.type}`,
          subtitle: e.reason.slice(0, 50),
          route: 'admin-excuses',
        });
      });
    } else {
      // Member search
      app.excuses.filter(e =>
        e.memberId === user.id &&
        (e.reason.toLowerCase().includes(query) || e.type.toLowerCase().includes(query))
      ).slice(0, 5).forEach(e => {
        allResults.push({
          type: 'My Excuse',
          title: e.type,
          subtitle: e.reason.slice(0, 50),
          route: 'member-excuses',
        });
      });
    }

    // Search events (both)
    app.events.filter(e =>
      e.name.toLowerCase().includes(query) ||
      e.venue.toLowerCase().includes(query)
    ).slice(0, 5).forEach(e => {
      allResults.push({
        type: 'Event',
        title: e.name,
        subtitle: `${e.venue} · ${new Date(e.date).toLocaleDateString()}`,
        route: role === 'admin' ? 'admin-performances' : 'member-performances',
      });
    });

    return allResults.slice(0, 8);
  })();

  return (
    <div
      style={{
        height: 68,
        borderBottom: `1px solid ${theme.line}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 28px',
        background: theme.paper,
        fontFamily: FONTS.sans,
        gap: 18,
        flexShrink: 0,
      }}
    >
      {isMobile && (
        <button
          onClick={onMenuClick}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
            marginRight: 4,
          }}
        >
          <span style={{ display: 'block', width: 20, height: 2, background: theme.ink, borderRadius: 2 }} />
          <span style={{ display: 'block', width: 20, height: 2, background: theme.ink, borderRadius: 2 }} />
          <span style={{ display: 'block', width: 20, height: 2, background: theme.ink, borderRadius: 2 }} />
        </button>
      )}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
        {!isMobile && <div ref={searchRef} style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              background: theme.cream,
              border: `1px solid ${theme.line}`,
              borderRadius: 10,
            }}
          >
            <Icon name="search" size={14} stroke={theme.dim} />
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              placeholder={role === 'admin' ? 'Search members, excuses, events…' : 'Search events, excuses, fees…'}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: 13,
                color: theme.ink,
                fontFamily: FONTS.sans,
              }}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowResults(false);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center',
                  color: theme.dim,
                }}
              >
                <Icon name="x" size={12} />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showResults && searchQuery && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                right: 0,
                background: theme.paper,
                border: `1px solid ${theme.line}`,
                borderRadius: 10,
                boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                maxHeight: 400,
                overflowY: 'auto',
                zIndex: 100,
              }}
            >
              {results.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: theme.dim, fontSize: 13 }}>
                  No results found for "{searchQuery}"
                </div>
              ) : (
                <div>
                  {results.map((result, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        go(result.route);
                        setShowResults(false);
                        setSearchQuery('');
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: i === results.length - 1 ? 'none' : `1px solid ${theme.line}`,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLButtonElement).style.background = theme.cream;
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLButtonElement).style.background = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            fontSize: 9,
                            fontFamily: FONTS.mono,
                            letterSpacing: 1,
                            textTransform: 'uppercase',
                            color: theme.green,
                            fontWeight: 600,
                          }}
                        >
                          {result.type}
                        </span>
                        <span style={{ fontSize: 13.5, fontWeight: 500, color: theme.ink }}>{result.title}</span>
                      </div>
                      <div style={{ fontSize: 12, color: theme.dim }}>{result.subtitle}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>}
      </div>

      <NotificationBell />

      <button
        onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
        title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        style={{
          background: 'transparent',
          border: `1px solid ${theme.line}`,
          borderRadius: 8,
          padding: '6px 8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          color: theme.dim,
          flexShrink: 0,
        }}
      >
        <Icon name={mode === 'light' ? 'moon' : 'sun'} size={15} stroke={theme.dim} />
      </button>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '4px 10px 4px 4px',
          border: `1px solid ${theme.line}`,
          borderRadius: 999,
        }}
      >
        <Avatar member={user} size={30} />
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: theme.ink }}>{user?.name}</div>
          <div style={{ fontSize: 10.5, color: theme.dim, fontFamily: FONTS.mono, letterSpacing: 0.3 }}>
            {user?.section} · {role === 'admin' ? 'Admin' : 'Member'}
          </div>
          {sessionExpiry && (
            <div
              title={`Session expires ${new Date(sessionExpiry).toLocaleString()}`}
              style={{ fontSize: 9.5, color: theme.dim, fontFamily: FONTS.mono, letterSpacing: 0.2, marginTop: 2, opacity: 0.7 }}
            >
              Until {new Date(sessionExpiry).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type ShellProps = {
  children: ReactNode;
};

export function Shell({ children }: ShellProps) {
  const { theme } = useTheme();
  const vw = useViewportWidth();
  const isMobile = vw < 768;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  // Close sidebar on route change (any click that triggers navigate already calls onClose)
  useEffect(() => { if (!isMobile) setSidebarOpen(false); }, [isMobile]);

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        minHeight: '100vh',
        background: theme.cream,
        color: theme.ink,
        fontFamily: FONTS.sans,
        position: 'relative',
      }}
    >
      {/* Desktop sidebar — always visible */}
      {!isMobile && (
        <div style={{ width: 240, flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
          <Sidebar />
        </div>
      )}

      {/* Mobile sidebar — overlay drawer */}
      {isMobile && sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={closeSidebar}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
              zIndex: 40,
            }}
          />
          {/* Drawer */}
          <div
            style={{
              position: 'fixed', top: 0, left: 0, bottom: 0,
              width: 240, zIndex: 50,
              overflowY: 'auto',
            }}
          >
            <Sidebar onClose={closeSidebar} />
          </div>
        </>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar onMenuClick={() => setSidebarOpen(o => !o)} isMobile={isMobile} />
        <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? '20px 16px' : '32px 40px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
