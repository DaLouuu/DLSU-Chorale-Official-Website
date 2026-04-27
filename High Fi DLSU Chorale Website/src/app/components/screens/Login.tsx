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

const FALLBACK_ADMIN_IDS = new Set(
  (import.meta.env.VITE_ADMIN_SCHOOL_IDS ?? '')
    .split(',')
    .map((s: string) => Number(s.trim()))
    .filter(Boolean)
);

type Screen = 'login' | 'setup' | 'role-select';

type VerifiedUser = {
  schoolId: number;
  email: string;
  name: string;
  section: string;
  profileUuid: string | null;
  isAdmin: boolean;
};

export function Login() {
  const { go } = useRouter();
  const { theme } = useTheme();
  const vw = useViewportWidth();
  const isMobile = vw < 680;

  const [screen, setScreen] = useState<Screen>('login');
  const [verifiedUser, setVerifiedUser] = useState<VerifiedUser | null>(null);

  // ── Login form state ──────────────────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Password setup state ──────────────────────────────────────────────────
  const [memberPw, setMemberPw] = useState('');
  const [memberPwC, setMemberPwC] = useState('');
  const [adminPwNew, setAdminPwNew] = useState('');
  const [adminPwNewC, setAdminPwNewC] = useState('');
  const [showMemberPw, setShowMemberPw] = useState(false);
  const [showMemberPwC, setShowMemberPwC] = useState(false);
  const [showAdminPwNew, setShowAdminPwNew] = useState(false);
  const [showAdminPwNewC, setShowAdminPwNewC] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState('');

  // ── Admin console verify state ────────────────────────────────────────────
  const [adminVerifyExpanded, setAdminVerifyExpanded] = useState(false);
  const [adminVerifyPw, setAdminVerifyPw] = useState('');
  const [showAdminVerifyPw, setShowAdminVerifyPw] = useState(false);
  const [adminVerifyError, setAdminVerifyError] = useState('');
  const [adminVerifyLoading, setAdminVerifyLoading] = useState(false);
  const [adminVerifyAttempts, setAdminVerifyAttempts] = useState(0);

  // ── Keep-me-logged-in state ───────────────────────────────────────────────
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const MAX_LOGIN_ATTEMPTS = 5;

  const SESSION_KEY = 'chorale_session';
  const sessionExpiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });

  const saveSession = (sessionRole: 'member' | 'admin', userObj: any) => {
    if (!keepLoggedIn) return;
    try {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      localStorage.setItem(SESSION_KEY, JSON.stringify({ user: userObj, role: sessionRole, expiresAt }));
    } catch {}
  };

  // ── Shared styles ─────────────────────────────────────────────────────────
  const inputStyle = (hasError = false) => ({
    display: 'block' as const,
    width: '100%',
    padding: '12px 14px',
    border: `1px solid ${hasError ? '#fca5a5' : theme.lineDark}`,
    borderRadius: 10,
    fontSize: 14,
    fontFamily: FONTS.sans,
    background: hasError ? '#fef2f2' : theme.paper,
    color: theme.ink,
    outline: 'none',
    boxSizing: 'border-box' as const,
    marginTop: 6,
  });

  const pwInputStyle = (hasError = false) => ({
    ...inputStyle(hasError),
    padding: '12px 48px 12px 14px',
  });

  const fieldLabel = (text: string) => (
    <label style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase' as const }}>
      {text}
    </label>
  );

  const ErrorBox = ({ msg }: { msg: string }) => (
    <div style={{
      fontSize: 13, color: '#dc2626',
      background: '#fef2f2', border: '1px solid #fecaca',
      borderRadius: 8, padding: '10px 14px', fontFamily: FONTS.sans,
    }}>
      {msg}
    </div>
  );

  const showHideBtn = (show: boolean, toggle: () => void) => (
    <button
      type="button"
      onClick={toggle}
      style={{
        position: 'absolute' as const, right: 12, top: '50%', transform: 'translateY(-50%)',
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: theme.dim, fontSize: 11, fontFamily: FONTS.mono, letterSpacing: 0.5, padding: 4,
      }}
    >
      {show ? 'HIDE' : 'SHOW'}
    </button>
  );

  // ── Green panel (reused across screens) ───────────────────────────────────
  const GreenPanel = () => (
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
  );

  const outerWrap = {
    width: '100%',
    minHeight: '100%',
    background: theme.cream,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: FONTS.sans,
    padding: isMobile ? '24px 16px' : '32px',
    boxSizing: 'border-box' as const,
  };

  const cardStyle = {
    width: '100%',
    maxWidth: isMobile ? 440 : 900,
    display: 'flex',
    flexDirection: isMobile ? 'column' as const : 'row' as const,
    overflow: 'hidden',
    boxShadow: '0 24px 80px rgba(8,50,24,0.15)',
    border: `1px solid ${theme.line}`,
  };

  // ── Login submit ──────────────────────────────────────────────────────────
  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    setError('');
    
    // Prevent attempts if at max
    if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      setError('Too many failed attempts. Your account is temporarily locked. Please try again later or contact an admin.');
      return;
    }
    
    setLoading(true);
    try {
      const schoolId = Number(idNumber.trim());
      if (!email.trim() || !schoolId) {
        setError('Please enter your DLSU email and ID number.');
        return;
      }

      const { data: dir, error: dirErr } = await supabase
        .from('directory')
        .select('school_id, email')
        .eq('email', email.trim().toLowerCase())
        .eq('school_id', schoolId)
        .maybeSingle();

      let resolvedDir = dir;
      if (!dirErr && !dir) {
        const { data: all } = await supabase.from('directory').select('school_id, email').eq('school_id', schoolId);
        const m = all?.find(e => e.email?.toLowerCase() === email.trim().toLowerCase());
        if (m) resolvedDir = m;
      }
      if (dirErr || !resolvedDir) {
        setError('Invalid email or ID number. Please check your credentials.');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, is_admin, first_name, last_name, voice_section')
        .eq('school_id', resolvedDir.school_id)
        .maybeSingle();

      const firstName = profile?.first_name ?? '';
      const lastName = profile?.last_name ?? '';
      const name = [firstName, lastName].filter(Boolean).join(' ')
        || email.trim().split('@')[0].replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

      let isAdmin = false;
      try {
        const { data: r } = await supabase.rpc('get_member_is_admin', { p_school_id: resolvedDir.school_id });
        isAdmin = r === true;
      } catch {}
      if (!isAdmin && profile?.is_admin) isAdmin = true;
      if (!isAdmin && FALLBACK_ADMIN_IDS.has(resolvedDir.school_id)) isAdmin = true;

      const user: VerifiedUser = {
        schoolId: resolvedDir.school_id,
        email: email.trim().toLowerCase(),
        name,
        section: profile?.voice_section ?? '',
        profileUuid: profile?.id ?? null,
        isAdmin,
      };

      // Check if account is locked before attempting password
      try {
        const { data: lockStatus, error: lockErr } = await supabase.rpc('check_account_locked', {
          p_school_id: resolvedDir.school_id,
        });
        if (!lockErr && lockStatus?.is_locked) {
          const until = new Date(lockStatus.locked_until).toLocaleString('en-PH', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
          });
          setError(`Account locked until ${until}. Too many failed attempts. Contact an admin to unlock sooner.`);
          return;
        }
      } catch {}

      // Password check via RPC
      const { data: pwCheck, error: pwErr } = await supabase.rpc('verify_member_password', {
        p_school_id: resolvedDir.school_id,
        p_password: loginPw,
      });

      if (pwErr) {
        if (pwErr.code === '42883') {
          // RPC not set up yet — force password setup for first-time users
          setVerifiedUser(user);
          setScreen('setup');
          return;
        }
        setError('Password check failed. Please try again.');
        return;
      }

      if (pwCheck === null) {
        // No password configured — go to setup
        setVerifiedUser(user);
        setScreen('setup');
        return;
      }

      if (pwCheck === false) {
        // Record failed attempt and show remaining count
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        const remaining = MAX_LOGIN_ATTEMPTS - newAttempts;
        
        try {
          const { data: attemptResult } = await supabase.rpc('record_failed_password_attempt', {
            p_school_id: resolvedDir.school_id,
          });
          if (attemptResult?.locked) {
            setError('Too many failed attempts. Your account has been locked for 2 hours. An admin has been notified.');
          } else {
            if (remaining <= 0) {
              setError('Too many failed attempts. Your account has been locked. An admin has been notified.');
            } else {
              setError(`Incorrect password. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before lockout.`);
            }
          }
        } catch {
          if (remaining <= 0) {
            setError('Too many failed attempts. Your account has been locked.');
          } else {
            setError(`Incorrect password. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
          }
        }
        return;
      }

      // Password correct — reset failed attempts then proceed
      supabase.rpc('reset_failed_password_attempts', { p_school_id: resolvedDir.school_id }).catch(() => {});
      if (profile?.id) await initializeUserData(profile.id, resolvedDir.school_id);
      const userPayload = { id: resolvedDir.school_id, _uuid: profile?.id ?? null, name, section: profile?.voice_section ?? '', email: email.trim().toLowerCase() };
      if (isAdmin) { setVerifiedUser(user); setScreen('role-select'); }
      else {
        saveSession('member', userPayload);
        go('member-home', { role: 'member', user: userPayload });
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Setup submit ──────────────────────────────────────────────────────────
  const submitSetup = async (e?: FormEvent) => {
    e?.preventDefault();
    setSetupError('');

    if (memberPw.length < 8) { setSetupError('Member password must be at least 8 characters.'); return; }
    if (memberPw !== memberPwC) { setSetupError('Member passwords do not match.'); return; }
    if (verifiedUser?.isAdmin) {
      if (adminPwNew.length < 8) { setSetupError('Admin password must be at least 8 characters.'); return; }
      if (adminPwNew !== adminPwNewC) { setSetupError('Admin passwords do not match.'); return; }
    }

    setSetupLoading(true);
    try {
      const { error: e1 } = await supabase.rpc('set_member_password', {
        p_school_id: verifiedUser!.schoolId,
        p_password: memberPw,
      });
      if (e1) throw e1;

      if (verifiedUser?.isAdmin) {
        const { error: e2 } = await supabase.rpc('set_admin_password', {
          p_school_id: verifiedUser!.schoolId,
          p_password: adminPwNew,
        });
        if (e2) throw e2;
      }

      if (verifiedUser?.profileUuid) {
        await initializeUserData(verifiedUser.profileUuid, verifiedUser.schoolId);
      }

      if (verifiedUser?.isAdmin) {
        setScreen('role-select');
      } else {
        const memberPayload = { id: verifiedUser!.schoolId, _uuid: verifiedUser!.profileUuid, name: verifiedUser!.name, section: verifiedUser!.section, email: verifiedUser!.email };
        saveSession('member', memberPayload);
        go('member-home', { role: 'member', user: memberPayload });
      }
    } catch {
      setSetupError('Failed to save password. Please try again.');
    } finally {
      setSetupLoading(false);
    }
  };

  // ── Enter admin console ───────────────────────────────────────────────────
  const MAX_ADMIN_ATTEMPTS = 5;

  const enterAdminConsole = async (e?: FormEvent) => {
    e?.preventDefault();
    setAdminVerifyError('');
    if (!adminVerifyPw) { setAdminVerifyError('Please enter your admin password.'); return; }

    if (adminVerifyAttempts >= MAX_ADMIN_ATTEMPTS) {
      setAdminVerifyError('Too many failed attempts. Please sign in again to retry.');
      return;
    }

    setAdminVerifyLoading(true);
    try {
      const { data: pwCheck, error: pwErr } = await supabase.rpc('verify_admin_password', {
        p_school_id: verifiedUser!.schoolId,
        p_password: adminVerifyPw,
      });

      if (pwErr) throw pwErr;

      if (pwCheck === null) {
        setAdminVerifyError('Admin password not configured. Please contact support.');
        return;
      }
      if (pwCheck === false) {
        const newAttempts = adminVerifyAttempts + 1;
        setAdminVerifyAttempts(newAttempts);
        const remaining = MAX_ADMIN_ATTEMPTS - newAttempts;
        if (remaining <= 0) {
          setAdminVerifyError('Too many failed attempts. Please sign in again to retry.');
        } else {
          setAdminVerifyError(`Incorrect admin password. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
        }
        return;
      }

      const adminPayload = { id: verifiedUser!.schoolId, _uuid: verifiedUser!.profileUuid, name: verifiedUser!.name, section: verifiedUser!.section, email: verifiedUser!.email };
      saveSession('admin', adminPayload);
      go('admin-home', { role: 'admin', user: adminPayload });
    } catch {
      setAdminVerifyError('Something went wrong. Please try again.');
    } finally {
      setAdminVerifyLoading(false);
    }
  };

  const enterAsMember = () => {
    if (!verifiedUser) return;
    const memberPayload = { id: verifiedUser.schoolId, _uuid: verifiedUser.profileUuid, name: verifiedUser.name, section: verifiedUser.section, email: verifiedUser.email };
    saveSession('member', memberPayload);
    go('member-home', { role: 'member', user: memberPayload });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Screen: Password Setup
  // ─────────────────────────────────────────────────────────────────────────
  if (screen === 'setup' && verifiedUser) {
    return (
      <div style={outerWrap}>
        <Card pad={0} style={cardStyle}>
          <GreenPanel />
          <form
            onSubmit={submitSetup}
            style={{
              flex: 1,
              padding: isMobile ? '28px 24px 32px' : '44px 48px',
              display: 'flex',
              flexDirection: 'column',
              gap: isMobile ? 14 : 18,
              boxSizing: 'border-box',
              overflowY: 'auto' as const,
            }}
          >
            {/* Heading */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' as const }}>
                  First-time setup
                </div>
                <h2 style={{ fontFamily: FONTS.serif, fontSize: isMobile ? 24 : 28, margin: '6px 0 0 0', fontWeight: 500 }}>
                  Set your password
                </h2>
                <p style={{ color: theme.dim, fontSize: 13, margin: '6px 0 0 0' }}>
                  Welcome, {verifiedUser.name.split(' ')[0]}. Choose a password to secure your account.
                </p>
              </div>
            </div>

            {/* Member password section */}
            <div style={{
              padding: '16px 18px',
              background: theme.cream,
              borderRadius: 10,
              border: `1px solid ${theme.line}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5, color: theme.green, textTransform: 'uppercase' as const }}>
                {verifiedUser.isAdmin ? 'Member Portal Password' : 'Account Password'}
              </div>
              {verifiedUser.isAdmin && (
                <p style={{ fontSize: 12, color: theme.dim, margin: 0 }}>
                  Used to sign in and access the Member Portal.
                </p>
              )}

              <div>
                {fieldLabel('New password')}
                <div style={{ position: 'relative' }}>
                  <input
                    value={memberPw}
                    onChange={e => setMemberPw(e.target.value)}
                    placeholder="Min. 8 characters"
                    type={showMemberPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    style={pwInputStyle()}
                  />
                  {showHideBtn(showMemberPw, () => setShowMemberPw(s => !s))}
                </div>
              </div>

              <div>
                {fieldLabel('Confirm password')}
                <div style={{ position: 'relative' }}>
                  <input
                    value={memberPwC}
                    onChange={e => setMemberPwC(e.target.value)}
                    placeholder="Re-enter password"
                    type={showMemberPwC ? 'text' : 'password'}
                    autoComplete="new-password"
                    style={pwInputStyle(memberPwC.length > 0 && memberPw !== memberPwC)}
                  />
                  {showHideBtn(showMemberPwC, () => setShowMemberPwC(s => !s))}
                </div>
                {memberPwC.length > 0 && memberPw !== memberPwC && (
                  <div style={{ fontSize: 11.5, color: '#dc2626', marginTop: 4 }}>Passwords do not match</div>
                )}
              </div>
            </div>

            {/* Admin password section — only for admin accounts */}
            {verifiedUser.isAdmin && (
              <div style={{
                padding: '16px 18px',
                background: theme.cream,
                borderRadius: 10,
                border: `1px solid ${theme.line}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}>
                <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5, color: '#c9a84c', textTransform: 'uppercase' as const }}>
                  Admin Console Password
                </div>
                <p style={{ fontSize: 12, color: theme.dim, margin: 0 }}>
                  A separate, stronger password required to access the Admin Console. Keep this confidential.
                </p>

                <div>
                  {fieldLabel('Admin password')}
                  <div style={{ position: 'relative' }}>
                    <input
                      value={adminPwNew}
                      onChange={e => setAdminPwNew(e.target.value)}
                      placeholder="Min. 8 characters"
                      type={showAdminPwNew ? 'text' : 'password'}
                      autoComplete="new-password"
                      style={pwInputStyle()}
                    />
                    {showHideBtn(showAdminPwNew, () => setShowAdminPwNew(s => !s))}
                  </div>
                </div>

                <div>
                  {fieldLabel('Confirm admin password')}
                  <div style={{ position: 'relative' }}>
                    <input
                      value={adminPwNewC}
                      onChange={e => setAdminPwNewC(e.target.value)}
                      placeholder="Re-enter admin password"
                      type={showAdminPwNewC ? 'text' : 'password'}
                      autoComplete="new-password"
                      style={pwInputStyle(adminPwNewC.length > 0 && adminPwNew !== adminPwNewC)}
                    />
                    {showHideBtn(showAdminPwNewC, () => setShowAdminPwNewC(s => !s))}
                  </div>
                  {adminPwNewC.length > 0 && adminPwNew !== adminPwNewC && (
                    <div style={{ fontSize: 11.5, color: '#dc2626', marginTop: 4 }}>Passwords do not match</div>
                  )}
                </div>
              </div>
            )}

            {setupError && <ErrorBox msg={setupError} />}

            <Button
              size="lg"
              type="submit"
              disabled={setupLoading}
              style={{ justifyContent: 'center', width: '100%', opacity: setupLoading ? 0.7 : 1 }}
            >
              {setupLoading ? 'Saving…' : 'Set password & continue'}
            </Button>

            <button
              type="button"
              onClick={() => { setScreen('login'); setVerifiedUser(null); }}
              style={{ background: 'transparent', border: 'none', color: theme.dim, fontSize: 12.5, cursor: 'pointer', fontFamily: FONTS.sans, padding: 0, textAlign: 'left' as const }}
            >
              ← Back to sign in
            </button>
          </form>
        </Card>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Screen: Role Selection (Admin)
  // ─────────────────────────────────────────────────────────────────────────
  if (screen === 'role-select' && verifiedUser) {
    return (
      <div style={{ ...outerWrap, alignItems: 'center' }}>
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
          <div style={{
            padding: '32px 36px 28px',
            background: theme.greenDark,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}>
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
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontFamily: FONTS.serif, fontSize: 22, fontWeight: 500, margin: '0 0 6px 0' }}>
                Welcome, {verifiedUser.name.split(' ')[0]}.
              </h2>
              <p style={{ color: theme.dim, fontSize: 13.5, margin: 0 }}>
                How would you like to sign in?
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Admin Console option */}
              <div>
                <button
                  onClick={() => { setAdminVerifyExpanded(e => !e); setAdminVerifyError(''); setAdminVerifyPw(''); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '18px 20px',
                    border: `1.5px solid ${adminVerifyExpanded ? theme.greenDark : theme.greenDark}`,
                    borderRadius: adminVerifyExpanded ? '12px 12px 0 0' : 12,
                    background: theme.greenDark, color: '#fff',
                    cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: FONTS.sans,
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: 'rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0,
                  }}>
                    ⚙
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>Admin Console</div>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>Manage members, attendance, excuses, and reports</div>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>{adminVerifyExpanded ? '▲' : '▼'}</div>
                </button>

                {/* Inline admin password form */}
                {adminVerifyExpanded && (
                  <form
                    onSubmit={enterAdminConsole}
                    style={{
                      padding: '16px 20px 20px',
                      background: theme.cream,
                      border: `1.5px solid ${theme.greenDark}`,
                      borderTop: `1px solid ${theme.line}`,
                      borderRadius: '0 0 12px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <div style={{ fontSize: 12, color: theme.dim }}>
                      Enter your Admin Console password to continue.
                    </div>
                    <div>
                      {fieldLabel('Admin password')}
                      <div style={{ position: 'relative' }}>
                        <input
                          value={adminVerifyPw}
                          onChange={e => setAdminVerifyPw(e.target.value)}
                          placeholder="Enter admin password"
                          type={showAdminVerifyPw ? 'text' : 'password'}
                          autoComplete="current-password"
                          autoFocus
                          style={pwInputStyle(!!adminVerifyError)}
                        />
                        {showHideBtn(showAdminVerifyPw, () => setShowAdminVerifyPw(s => !s))}
                      </div>
                    </div>
                    {adminVerifyError && <ErrorBox msg={adminVerifyError} />}
                    <Button
                      size="md"
                      type="submit"
                      disabled={adminVerifyLoading}
                      style={{ justifyContent: 'center', opacity: adminVerifyLoading ? 0.7 : 1 }}
                    >
                      {adminVerifyLoading ? 'Verifying…' : 'Enter Admin Console'}
                    </Button>
                  </form>
                )}
              </div>

              {/* Member Portal option */}
              <button
                onClick={enterAsMember}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '18px 20px',
                  border: `1.5px solid ${theme.line}`,
                  borderRadius: 12,
                  background: theme.paper, color: theme.ink,
                  cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: FONTS.sans,
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: theme.cream, border: `1px solid ${theme.line}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0,
                }}>
                  ♪
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>Member Portal</div>
                  <div style={{ fontSize: 12, color: theme.dim }}>View your own attendance, fees, and schedule</div>
                </div>
              </button>
            </div>

            <button
              onClick={() => { setScreen('login'); setVerifiedUser(null); setAdminVerifyExpanded(false); }}
              style={{
                marginTop: 20, background: 'transparent', border: 'none',
                color: theme.dim, fontSize: 12.5, cursor: 'pointer', fontFamily: FONTS.sans, padding: 0,
              }}
            >
              ← Back to sign in
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Screen: Login Form
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={outerWrap}>
      <Card pad={0} style={cardStyle}>
        <GreenPanel />

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
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' as const }}>
                Member Portal
              </div>
              <h2 style={{ fontFamily: FONTS.serif, fontSize: isMobile ? 26 : 32, margin: '6px 0 0 0', fontWeight: 500 }}>
                Sign in
              </h2>
              <p style={{ color: theme.dim, fontSize: 13.5, margin: '6px 0 0 0' }}>
                Enter your DLSU email, ID number, and password.
              </p>
            </div>
            <button
              type="button"
              onClick={() => go('landing')}
              style={{
                background: 'transparent', border: 'none', color: theme.dim,
                fontSize: 12.5, cursor: 'pointer', fontFamily: FONTS.sans,
                padding: '4px 0', whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              ← Home
            </button>
          </div>

          <div>
            {fieldLabel('University email')}
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="juan_delacruz@dlsu.edu.ph"
              type="email"
              autoComplete="email"
              style={inputStyle()}
            />
          </div>

          <div>
            {fieldLabel('ID number')}
            <input
              value={idNumber}
              onChange={e => setIdNumber(e.target.value)}
              placeholder="12012345"
              inputMode="numeric"
              style={{ ...inputStyle(), fontFamily: FONTS.mono, letterSpacing: 1 }}
            />
          </div>

          <div>
            {fieldLabel('Password')}
            <div style={{ position: 'relative' }}>
              <input
                value={loginPw}
                onChange={e => setLoginPw(e.target.value)}
                placeholder="Enter your password"
                type={showLoginPw ? 'text' : 'password'}
                autoComplete="current-password"
                style={pwInputStyle()}
              />
              {showHideBtn(showLoginPw, () => setShowLoginPw(s => !s))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 5 }}>
              <div style={{ fontSize: 11.5, color: theme.dim }}>
                First time signing in? You'll be prompted to set a password.
              </div>
              {loginAttempts > 0 && (
                <div style={{ fontSize: 11.5, color: '#dc2626', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  {MAX_LOGIN_ATTEMPTS - loginAttempts} attempt{MAX_LOGIN_ATTEMPTS - loginAttempts !== 1 ? 's' : ''} left
                </div>
              )}
            </div>
          </div>

          {/* Keep me logged in */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' as const }}>
              <input
                type="checkbox"
                checked={keepLoggedIn}
                onChange={e => setKeepLoggedIn(e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: theme.green, flexShrink: 0 }}
              />
              <span style={{ fontSize: 13.5, color: theme.ink }}>Keep me logged in</span>
            </label>
            {keepLoggedIn && (
              <div style={{ fontSize: 11.5, color: theme.dim, paddingLeft: 26, lineHeight: 1.5 }}>
                Session stays active until <strong>{sessionExpiryDate}</strong>. Avoid on shared or public devices.
              </div>
            )}
          </div>

          {error && <ErrorBox msg={error} />}

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
