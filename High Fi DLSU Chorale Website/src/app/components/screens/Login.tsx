import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useTheme } from '../../App';
import { FONTS } from '../../theme';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import { supabase } from '../../supabase';
import { initializeUserData } from '../../data';

function useViewportWidth() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

// Fallback: school IDs that are always admin (from env, comma-separated)
const FALLBACK_ADMIN_IDS = new Set(
  (import.meta.env.VITE_ADMIN_SCHOOL_IDS ?? '')
    .split(',')
    .map((s: string) => Number(s.trim()))
    .filter(Boolean)
);

type PendingUser = {
  schoolId: number;
  email: string;
  name: string;
  section: string;
  profileUuid: string | null;
};

export function Login() {
  const { go } = useRouter();
  const { theme } = useTheme();
  const vw = useViewportWidth();
  const isMobile = vw < 680;

  const [email, setEmail] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Role selection step — set when account is confirmed admin
  const [pendingAdmin, setPendingAdmin] = useState<PendingUser | null>(null);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      const schoolId = Number(idNumber.trim());
      if (!email.trim() || !schoolId) {
        setError('Please enter your DLSU email and ID number.');
        return;
      }

      // 1. Verify credentials against directory table
      const { data: dir, error: dirErr } = await supabase
        .from('directory')
        .select('school_id, email')
        .eq('email', email.trim().toLowerCase())
        .eq('school_id', schoolId)
        .maybeSingle();

      // Fallback: case-insensitive match
      let resolvedDir = dir;
      if (!dirErr && !dir) {
        const { data: allEntries } = await supabase
          .from('directory')
          .select('school_id, email')
          .eq('school_id', schoolId);
        const match = allEntries?.find(e => e.email?.toLowerCase() === email.trim().toLowerCase());
        if (match) resolvedDir = match;
      }

      if (dirErr || !resolvedDir) {
        setError('Invalid email or ID number. Please check your credentials.');
        return;
      }

      // 2. Try to load profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, is_admin, first_name, last_name, voice_section')
        .eq('school_id', resolvedDir.school_id)
        .maybeSingle();

      const firstName = profile?.first_name ?? '';
      const lastName = profile?.last_name ?? '';
      const name = [firstName, lastName].filter(Boolean).join(' ')
        || email.trim().split('@')[0].replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

      // 3. Detect admin — try RPC first (bypasses RLS), fall back to env list
      let isAdmin = false;
      try {
        const { data: rpcResult } = await supabase.rpc('get_member_is_admin', {
          p_school_id: resolvedDir.school_id,
        });
        isAdmin = rpcResult === true;
      } catch {
        // RPC not created yet — use env fallback
      }
      // Also check profile.is_admin if RPC returned false (column may exist)
      if (!isAdmin && profile?.is_admin) isAdmin = true;
      // Final fallback: hardcoded env list
      if (!isAdmin && FALLBACK_ADMIN_IDS.has(resolvedDir.school_id)) isAdmin = true;

      // 4. Load user data
      if (profile?.id) {
        await initializeUserData(profile.id, resolvedDir.school_id);
      }

      const userPayload = {
        id: resolvedDir.school_id,
        _uuid: profile?.id ?? null,
        name,
        section: profile?.voice_section ?? '',
        email: email.trim().toLowerCase(),
      };

      if (isAdmin) {
        // Show role selection — don't navigate yet
        setPendingAdmin({
          schoolId: resolvedDir.school_id,
          email: email.trim().toLowerCase(),
          name,
          section: profile?.voice_section ?? '',
          profileUuid: profile?.id ?? null,
        });
      } else {
        go('member-home', { role: 'member', user: userPayload });
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const enterAs = (role: 'admin' | 'member') => {
    if (!pendingAdmin) return;
    go(role === 'admin' ? 'admin-home' : 'member-home', {
      role,
      user: {
        id: pendingAdmin.schoolId,
        name: pendingAdmin.name,
        section: pendingAdmin.section,
        email: pendingAdmin.email,
        profileUuid: pendingAdmin.profileUuid,
      },
    });
  };

  // ── Role selection screen ────────────────────────────────────────────────
  if (pendingAdmin) {
    return (
      <div
        style={{
          width: '100%',
          minHeight: '100%',
          background: theme.cream,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONTS.sans,
          padding: isMobile ? '24px 16px' : '32px',
          boxSizing: 'border-box',
        }}
      >
        <Card
          pad={0}
          style={{
            width: '100%',
            maxWidth: 480,
            overflow: 'hidden',
            boxShadow: '0 24px 80px rgba(8,50,24,0.15)',
            border: `1px solid ${theme.line}`,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '32px 36px 28px',
              background: theme.greenDark,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <Logo size={36} color="white" />
            <div>
              <div style={{ fontFamily: FONTS.serif, fontSize: 18, letterSpacing: 0.3 }}>DLSU Chorale</div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2, opacity: 0.6, textTransform: 'uppercase', marginTop: 3 }}>
                Admin Account Detected
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: isMobile ? '28px 24px 32px' : '36px 40px 40px' }}>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontFamily: FONTS.serif, fontSize: 22, fontWeight: 500, margin: '0 0 6px 0' }}>
                Welcome, {pendingAdmin.name.split(' ')[0]}.
              </h2>
              <p style={{ color: theme.dim, fontSize: 13.5, margin: 0 }}>
                Your account has admin privileges. How would you like to sign in?
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Admin option */}
              <button
                onClick={() => enterAs('admin')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '18px 20px',
                  border: `1.5px solid ${theme.greenDark}`,
                  borderRadius: 12,
                  background: theme.greenDark,
                  color: '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  fontFamily: FONTS.sans,
                }}
              >
                <div
                  style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: 'rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0,
                  }}
                >
                  ⚙
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>Admin Console</div>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>Manage members, attendance, excuses, and reports</div>
                </div>
              </button>

              {/* Member option */}
              <button
                onClick={() => enterAs('member')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '18px 20px',
                  border: `1.5px solid ${theme.line}`,
                  borderRadius: 12,
                  background: theme.paper,
                  color: theme.ink,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  fontFamily: FONTS.sans,
                }}
              >
                <div
                  style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: theme.cream,
                    border: `1px solid ${theme.line}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0,
                  }}
                >
                  ♪
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>Member Portal</div>
                  <div style={{ fontSize: 12, color: theme.dim }}>View your own attendance, fees, and schedule</div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setPendingAdmin(null)}
              style={{
                marginTop: 20,
                background: 'transparent',
                border: 'none',
                color: theme.dim,
                fontSize: 12.5,
                cursor: 'pointer',
                fontFamily: FONTS.sans,
                padding: 0,
              }}
            >
              ← Back to sign in
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // ── Login form ───────────────────────────────────────────────────────────
  return (
    <div
      style={{
        width: '100%',
        minHeight: '100%',
        background: theme.cream,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONTS.sans,
        padding: isMobile ? '24px 16px' : '32px',
        boxSizing: 'border-box',
      }}
    >
      <Card
        pad={0}
        style={{
          width: '100%',
          maxWidth: isMobile ? 440 : 900,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(8,50,24,0.15)',
          border: `1px solid ${theme.line}`,
        }}
      >
        {/* ── Green panel ── */}
        <div
          style={{
            width: isMobile ? '100%' : 360,
            minHeight: isMobile ? 160 : undefined,
            padding: isMobile ? '28px 28px 24px' : '40px 36px',
            background: theme.greenDark,
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: isMobile ? 'flex-start' : 'space-between',
            gap: isMobile ? 16 : 0,
            backgroundImage: `linear-gradient(180deg, rgba(8,50,24,0.85), rgba(8,50,24,0.95)), url("assets/choir-tcc.png")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Logo size={isMobile ? 32 : 40} color="white" />
            <div style={{ fontFamily: FONTS.serif, fontSize: isMobile ? 16 : 18, letterSpacing: 0.3 }}>
              DLSU Chorale
            </div>
          </div>
          {!isMobile && (
            <div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2, opacity: 0.7, textTransform: 'uppercase', marginBottom: 14 }}>
                Sign in to continue
              </div>
              <div style={{ fontFamily: FONTS.serif, fontSize: 32, lineHeight: 1.1, fontWeight: 500 }}>
                Welcome back,
                <br />
                <em style={{ color: theme.greenMid }}>Chorista.</em>
              </div>
            </div>
          )}
          {!isMobile && (
            <div style={{ fontSize: 11, fontFamily: FONTS.mono, opacity: 0.6, letterSpacing: 0.5 }}>
              New here? Create an account →
            </div>
          )}
        </div>

        {/* ── Form panel ── */}
        <form
          onSubmit={submit}
          style={{
            flex: 1,
            padding: isMobile ? '28px 24px 32px' : '52px 48px',
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? 16 : 20,
            boxSizing: 'border-box',
          }}
        >
          <div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' }}>
              Member Portal
            </div>
            <h2 style={{ fontFamily: FONTS.serif, fontSize: isMobile ? 26 : 32, margin: '6px 0 0 0', fontWeight: 500 }}>
              Sign in
            </h2>
            <p style={{ color: theme.dim, fontSize: 13.5, margin: '6px 0 0 0' }}>
              Enter your DLSU email and ID number to continue.
            </p>
          </div>

          <div>
            <label style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase' }}>
              University email
            </label>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="juan_delacruz@dlsu.edu.ph"
              type="email"
              autoComplete="email"
              style={{
                display: 'block',
                width: '100%',
                marginTop: 6,
                padding: '12px 14px',
                border: `1px solid ${theme.lineDark}`,
                borderRadius: 10,
                fontSize: 14,
                fontFamily: FONTS.sans,
                background: theme.paper,
                color: theme.ink,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase' }}>
              ID number
            </label>
            <input
              value={idNumber}
              onChange={e => setIdNumber(e.target.value)}
              placeholder="12012345"
              inputMode="numeric"
              style={{
                display: 'block',
                width: '100%',
                marginTop: 6,
                padding: '12px 14px',
                border: `1px solid ${theme.lineDark}`,
                borderRadius: 10,
                fontSize: 14,
                fontFamily: FONTS.mono,
                letterSpacing: 1,
                background: theme.paper,
                color: theme.ink,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{
              fontSize: 13,
              color: '#dc2626',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              padding: '10px 14px',
              fontFamily: FONTS.sans,
            }}>
              {error}
            </div>
          )}

          <Button
            size="lg"
            type="submit"
            disabled={loading}
            style={{ justifyContent: 'center', width: '100%', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>

          <div style={{ fontSize: 12, color: theme.dim, textAlign: 'center' }}>
            Need an account?{' '}
            <a
              onClick={() => go('register')}
              style={{ color: theme.green, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Register as a new member
            </a>
          </div>
        </form>
      </Card>
    </div>
  );
}
