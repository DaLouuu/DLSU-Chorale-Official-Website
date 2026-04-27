import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { PALETTES, FONTS, ThemeMode, Theme } from './theme';
import { CURRENT_MEMBER, CURRENT_ADMIN, EXCUSE_REQUESTS, EVENTS, FEE_RECORDS, ANNOUNCEMENTS, initializePublicData, initializeUserData } from './data';
import logo from '../imports/dlsu-chorale-logo.png';
import { Landing } from './components/screens/Landing';
import { Login } from './components/screens/Login';
import { PendingVerification } from './components/screens/PendingVerification';
import { RFIDKiosk } from './components/screens/RFIDKiosk';
import { MemberHome } from './components/screens/MemberHome';
import { MemberAttendance } from './components/screens/MemberAttendance';
import { MemberExcuses } from './components/screens/MemberExcuses';
import { MemberPerformances } from './components/screens/MemberPerformances';
import { MemberFees } from './components/screens/MemberFees';
import { MemberAnnouncements } from './components/screens/MemberAnnouncements';
import { MemberProfile } from './components/screens/MemberProfile';
import { MemberSocialEvents } from './components/screens/MemberSocialEvents';
import { MemberMusicLibrary } from './components/screens/MemberMusicLibrary';
import { MemberCalendar } from './components/screens/MemberCalendar';
import { AdminHome } from './components/screens/AdminHome';
import { AdminAttendance } from './components/screens/AdminAttendance';
import { AdminExcuses } from './components/screens/AdminExcuses';
import { AdminPerformances } from './components/screens/AdminPerformances';
import { AdminFees } from './components/screens/AdminFees';
import { AdminAnalytics } from './components/screens/AdminAnalytics';
import { AdminMembers } from './components/screens/AdminMembers';
import { AdminCalendar } from './components/screens/AdminCalendar';
import { AdminSocialEvents } from './components/screens/AdminSocialEvents';
import { AdminMusicLibrary } from './components/screens/AdminMusicLibrary';
import { AdminEvents } from './components/screens/AdminEvents';
import { Shell } from './components/layout/Shell';

// Router Context
type Route = 'landing' | 'login' | 'pending' | 'rfid' | 'member-home' | 'admin-home' |
  'member-attendance' | 'member-excuses' | 'member-performances' | 'member-fees' | 'member-announcements' | 'member-profile' | 'member-social' | 'member-music' | 'member-calendar' |
  'admin-attendance' | 'admin-excuses' | 'admin-performances' | 'admin-fees' | 'admin-analytics' | 'admin-members' | 'admin-calendar' | 'admin-social' | 'admin-music' | 'admin-events';
type RouterContextType = {
  route: Route;
  role: 'member' | 'admin' | null;
  user: any;
  go: (route: Route, opts?: { role?: 'member' | 'admin'; user?: any }) => void;
};

const RouterContext = createContext<RouterContextType | null>(null);

export const useRouter = () => {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    // Return default router for preview contexts (e.g., Figma Make preview)
    return {
      route: 'member-home' as Route,
      role: 'member' as const,
      user: { id: 12100234, name: 'Preview User', section: 'Soprano', year: '3rd Year', email: 'preview@dlsu.edu.ph' },
      go: () => {}
    };
  }
  return ctx;
};

// Theme Context
const ThemeContext = createContext<{ theme: Theme; mode: ThemeMode; setMode: (mode: ThemeMode) => void } | null>(null);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Return default theme for preview contexts (e.g., Figma Make preview)
    return { theme: PALETTES.light, mode: 'light' as ThemeMode, setMode: () => {} };
  }
  return ctx;
};

function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    try { return (localStorage.getItem('chorale-theme') as ThemeMode) || 'light'; } catch { return 'light'; }
  });
  const theme = PALETTES[mode];

  const handleSetMode = (m: ThemeMode) => {
    try { localStorage.setItem('chorale-theme', m); } catch {}
    setMode(m);
  };

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode: handleSetMode }}>
      <div style={{ background: theme.bodyBg, minHeight: '100vh', color: theme.ink, fontFamily: FONTS.sans }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

// App State Context
type AppStateContextType = {
  excuses: any[];
  events: any[];
  fees: any[];
  announcements: any[];
  showToast: (msg: string, tone?: string) => void;
  addExcuse: (excuse: any) => void;
  updateExcuse: (id: number, patch: any) => void;
  signUpEvent: (id: string) => void;
  updateEventForms: (id: string, forms: any) => void;
  payFee: (id: string, paymentData?: any) => void;
  approvePayment: (id: string) => void;
  rejectPayment: (id: string, reason?: string) => void;
  addAnnouncement: (announcement: any) => void;
};

const AppStateContext = createContext<AppStateContextType | null>(null);

export const useApp = () => {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    // Return default app state for preview contexts (e.g., Figma Make preview)
    return {
      excuses: EXCUSE_REQUESTS,
      events: EVENTS,
      fees: FEE_RECORDS,
      announcements: ANNOUNCEMENTS,
      showToast: () => {},
      addExcuse: () => {},
      updateExcuse: () => {},
      signUpEvent: () => {},
      updateEventForms: () => {},
      payFee: (_id: string, _paymentData?: any) => {},
      approvePayment: (_id: string) => {},
      rejectPayment: (_id: string, _reason?: string) => {},
      addAnnouncement: () => {},
    };
  }
  return ctx;
};

function AppStateProvider({ children }: { children: ReactNode }) {
  const [excuses, setExcuses] = useState(EXCUSE_REQUESTS);
  const [events, setEvents] = useState(EVENTS);
  const [fees, setFees] = useState(FEE_RECORDS);
  const [announcements, setAnnouncements] = useState(ANNOUNCEMENTS);
  const [toast, setToast] = useState<{ msg: string; tone: string; id: number } | null>(null);

  const showToast = (msg: string, tone = 'success') => {
    const t = { msg, tone, id: Date.now() };
    setToast(t);
    setTimeout(() => setToast(null), 3100);
  };

  const addExcuse = (e: any) => {
    const newExcuse = {
      ...e,
      id: Date.now(),
      status: 'Pending',
      submittedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };
    setExcuses(prev => [newExcuse, ...prev]);
  };

  const updateExcuse = (id: number, patch: any) => {
    setExcuses(prev => prev.map(e => (e.id === id ? { ...e, ...patch } : e)));
  };

  const signUpEvent = (id: string) => {
    setEvents(prev =>
      prev.map(e =>
        e.id === id
          ? {
              ...e,
              signedUp: Math.max(0, e.signedUp + (e.mySignup ? -1 : 1)),
              mySignup: e.mySignup ? null : 'Signed up',
            }
          : e
      )
    );
  };

  const updateEventForms = (id: string, forms: any) => {
    setEvents(prev =>
      prev.map(e =>
        e.id === id
          ? { ...e, forms }
          : e
      )
    );
  };

  const payFee = (id: string, paymentData?: any) => {
    setFees(prev =>
      prev.map(f =>
        f.id === id
          ? {
              ...f,
              status: 'pending',
              submittedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
              paymentData: paymentData || null
            }
          : f
      )
    );
  };

  const approvePayment = (id: string) => {
    setFees(prev =>
      prev.map(f =>
        f.id === id
          ? {
              ...f,
              status: 'paid',
              paidAt: f.paymentData?.paymentDate || new Date().toISOString().slice(0, 10),
            }
          : f
      )
    );
  };

  const rejectPayment = (id: string, reason?: string) => {
    setFees(prev =>
      prev.map(f =>
        f.id === id
          ? {
              ...f,
              status: 'unpaid',
              submittedAt: undefined,
              paymentData: { ...f.paymentData, rejectionReason: reason }
            }
          : f
      )
    );
  };

  const addAnnouncement = (announcement: any) => {
    const newAnnouncement = {
      ...announcement,
      id: `a${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
    };
    setAnnouncements(prev => [newAnnouncement, ...prev]);
  };

  return (
    <AppStateContext.Provider
      value={{
        excuses,
        events,
        fees,
        announcements,
        showToast,
        addExcuse,
        updateExcuse,
        signUpEvent,
        updateEventForms,
        payFee,
        approvePayment,
        rejectPayment,
        addAnnouncement,
      }}
    >
      {children}
      {toast && <ToastHost msg={toast.msg} tone={toast.tone} />}
    </AppStateContext.Provider>
  );
}

function ToastHost({ msg, tone }: { msg: string; tone: string }) {
  const { theme } = useTheme();
  const bg = tone === 'success' ? theme.greenDeep : tone === 'error' ? theme.red : theme.ink;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        background: bg,
        color: '#fff',
        padding: '12px 20px',
        borderRadius: 10,
        fontFamily: FONTS.sans,
        fontSize: 13,
        boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
        zIndex: 50,
      }}
    >
      {msg}
    </div>
  );
}

function Router() {
  const { route } = useRouter();

  if (route === 'landing') return <Landing />;
  if (route === 'login') return <Login />;
  if (route === 'pending') return <PendingVerification />;
  if (route === 'rfid') return <RFIDKiosk />;

  // Member screens
  if (route === 'member-home') return <Shell><MemberHome /></Shell>;
  if (route === 'member-attendance') return <Shell><MemberAttendance /></Shell>;
  if (route === 'member-excuses') return <Shell><MemberExcuses /></Shell>;
  if (route === 'member-performances') return <Shell><MemberPerformances /></Shell>;
  if (route === 'member-fees') return <Shell><MemberFees /></Shell>;
  if (route === 'member-announcements') return <Shell><MemberAnnouncements /></Shell>;
  if (route === 'member-profile') return <Shell><MemberProfile /></Shell>;
  if (route === 'member-social') return <Shell><MemberSocialEvents /></Shell>;
  if (route === 'member-music') return <Shell><MemberMusicLibrary /></Shell>;
  if (route === 'member-calendar') return <Shell><MemberHome /></Shell>;

  // Admin screens
  if (route === 'admin-home') return <Shell><AdminHome /></Shell>;
  if (route === 'admin-attendance') return <Shell><AdminAttendance /></Shell>;
  if (route === 'admin-excuses') return <Shell><AdminExcuses /></Shell>;
  if (route === 'admin-performances') return <Shell><AdminPerformances /></Shell>;
  if (route === 'admin-fees') return <Shell><AdminFees /></Shell>;
  if (route === 'admin-analytics') return <Shell><AdminAnalytics /></Shell>;
  if (route === 'admin-members') return <Shell><AdminMembers /></Shell>;
  if (route === 'admin-calendar') return <Shell><AdminHome /></Shell>;
  if (route === 'admin-social') return <Shell><AdminSocialEvents /></Shell>;
  if (route === 'admin-music') return <Shell><AdminMusicLibrary /></Shell>;
  if (route === 'admin-events') return <Shell><AdminEvents /></Shell>;

  return <Landing />;
}

function PlaceholderScreen({ title }: { title: string }) {
  const { theme } = useTheme();
  return (
    <div style={{ textAlign: 'center', padding: 80, color: theme.dim }}>
      <h2 style={{ fontFamily: FONTS.serif, fontSize: 48, marginBottom: 16, color: theme.ink }}>{title}</h2>
      <p>This screen is coming soon.</p>
    </div>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [route, setRoute] = useState<Route>('landing');
  const [role, setRole] = useState<'member' | 'admin' | null>(null);
  const [user, setUser] = useState<any>(null);

  // Set browser tab title and favicon from the imported logo asset
  useEffect(() => {
    document.title = 'DLSU Chorale Official Website';
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/png';
    link.href = logo as string;
  }, []);

  // Load public data + restore persisted session from localStorage
  useEffect(() => {
    let savedSession: { user: any; role: 'member' | 'admin'; expiresAt: string } | null = null;
    try {
      const raw = localStorage.getItem('chorale_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (new Date(parsed.expiresAt) > new Date()) {
          savedSession = parsed;
        } else {
          localStorage.removeItem('chorale_session');
        }
      }
    } catch {}

    initializePublicData()
      .then(async () => {
        if (savedSession?.user?._uuid && savedSession.user.id) {
          await initializeUserData(savedSession.user._uuid, savedSession.user.id).catch(() => {});
        }
      })
      .finally(() => {
        if (savedSession) {
          setUser(savedSession.user);
          setRole(savedSession.role);
          setRoute(savedSession.role === 'admin' ? 'admin-home' : 'member-home');
        }
        setReady(true);
      });
  }, []);

  const go = (r: Route, opts: { role?: 'member' | 'admin'; user?: any } = {}) => {
    if (opts.role) setRole(opts.role);
    if (opts.user !== undefined) setUser(opts.user);
    setRoute(r);
  };

  if (!ready) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#09331f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 12,
        fontFamily: FONTS.sans,
      }}>
        <div style={{ fontFamily: FONTS.serif, fontSize: 22, color: '#c9a84c', letterSpacing: 0.5 }}>
          DLSU Chorale
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>
          Loading…
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <RouterContext.Provider value={{ route, role, user, go }}>
        <AppStateProvider>
          <Router />
        </AppStateProvider>
      </RouterContext.Provider>
    </ThemeProvider>
  );
}
