import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useTheme } from '../../App';
import { FONTS } from '../../theme';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import { supabase } from '../../supabase';
import { initializeUserData } from '../../data';
import { Moon, Sun } from 'lucide-react';

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

type Screen = 'login' | 'setup' | 'forgot' | 'role-select';

type VerifiedUser = {
  schoolId: number;
  email: string;
  name: string;
  section: string;
  profileUuid: string | null;
  isAdmin: boolean;
};

type RpcErrorLike = { code?: string; message?: string; details?: string | null; hint?: string | null };

function isMissingVerifyPasswordRpcError(error: RpcErrorLike | null | undefined) {
  if (!error) return false;
  if (error.code === '42883' || error.code === 'PGRST202') return true;

  const combined = `${error.message ?? ''} ${error.details ?? ''} ${error.hint ?? ''}`.toLowerCase();
  return combined.includes('verify_member_password') && (
    combined.includes('not found') ||
    combined.includes('does not exist') ||
    combined.includes('could not find')
  );
}

const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 64;
const SECURITY_QUESTIONS = [
  'What is your mother\'s maiden name?',
  'What was the name of your first pet?',
  'What city were you born in?',
  'What is your favorite teacher\'s last name?',
  'What was your childhood nickname?',
  'What is the name of the street you grew up on?',
];

type PasswordPolicyContext = {
  schoolId?: number;
  email?: string;
};

function getPasswordPolicyIssues(password: string, context?: PasswordPolicyContext) {
  const issues: string[] = [];
  if (password.length < MIN_PASSWORD_LENGTH) issues.push(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
  if (password.length > MAX_PASSWORD_LENGTH) issues.push(`Use at most ${MAX_PASSWORD_LENGTH} characters.`);
  if (!/[a-z]/.test(password)) issues.push('Include at least one lowercase letter.');
  if (!/[A-Z]/.test(password)) issues.push('Include at least one uppercase letter.');
  if (!/[0-9]/.test(password)) issues.push('Include at least one number.');
  if (!/[^A-Za-z0-9]/.test(password)) issues.push('Include at least one special character.');
  if (/\s/.test(password)) issues.push('Do not use spaces.');
  if (/(.)\1\1/.test(password)) issues.push('Avoid 3+ repeating characters in a row.');

  const emailLocal = context?.email?.split('@')[0]?.toLowerCase();
  if (emailLocal && emailLocal.length >= 4 && password.toLowerCase().includes(emailLocal)) {
    issues.push('Do not include your email username.');
  }
  if (context?.schoolId && password.includes(String(context.schoolId))) {
    issues.push('Do not include your ID number.');
  }

  return issues;
}

export function Login() {
  const { go } = useRouter();
  const { theme, mode, setMode } = useTheme();
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
  const [notice, setNotice] = useState('');
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
  const [setupQuestion1, setSetupQuestion1] = useState('');
  const [setupAnswer1, setSetupAnswer1] = useState('');
  const [setupQuestion2, setSetupQuestion2] = useState('');
  const [setupAnswer2, setSetupAnswer2] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState('');

  // ── Forgot password state ─────────────────────────────────────────────────
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotIdNumber, setForgotIdNumber] = useState('');
  const [forgotQuestion1, setForgotQuestion1] = useState('');
  const [forgotAnswer1, setForgotAnswer1] = useState('');
  const [forgotQuestion2, setForgotQuestion2] = useState('');
  const [forgotAnswer2, setForgotAnswer2] = useState('');
  const [forgotMemberPw, setForgotMemberPw] = useState('');
  const [forgotMemberPwC, setForgotMemberPwC] = useState('');
  const [forgotAdminPw, setForgotAdminPw] = useState('');
  const [forgotAdminPwC, setForgotAdminPwC] = useState('');
  const [forgotResetAdmin, setForgotResetAdmin] = useState(false);
  const [forgotUserIsAdmin, setForgotUserIsAdmin] = useState(false);
  const [showForgotMemberPw, setShowForgotMemberPw] = useState(false);
  const [showForgotMemberPwC, setShowForgotMemberPwC] = useState(false);
  const [showForgotAdminPw, setShowForgotAdminPw] = useState(false);
  const [showForgotAdminPwC, setShowForgotAdminPwC] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const setupPasswordsMatchAcrossRoles =
    verifiedUser?.isAdmin === true &&
    memberPw.length > 0 &&
    adminPwNew.length > 0 &&
    memberPw === adminPwNew;
  const forgotPasswordsMatchAcrossRoles =
    forgotResetAdmin &&
    forgotMemberPw.length > 0 &&
    forgotAdminPw.length > 0 &&
    forgotMemberPw === forgotAdminPw;
  const setupQuestionsDuplicated =
    setupQuestion1.length > 0 &&
    setupQuestion2.length > 0 &&
    setupQuestion1 === setupQuestion2;

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

  const ThemeToggleButton = () => (
    <button
      type="button"
      onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 100,
        width: 40,
        height: 40,
        borderRadius: '50%',
        border: `1px solid ${theme.line}`,
        background: theme.paper,
        color: theme.ink,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
      aria-label={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {mode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );

  // ── Login submit ──────────────────────────────────────────────────────────
  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    setError('');
    setNotice('');
    let failureStage = 'initial validation';
    
    // Prevent attempts if at max
    if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      setError('Too many failed attempts. Your account is temporarily locked. Please try again later or contact an admin.');
      return;
    }
    
    setLoading(true);
    try {
      failureStage = 'input parsing';
      const schoolId = Number(idNumber.trim());
      if (!email.trim() || !schoolId) {
        setError('Please enter your DLSU email and ID number.');
        return;
      }

      failureStage = 'directory lookup';
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

      failureStage = 'profile lookup';
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
        failureStage = 'admin role lookup';
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
        failureStage = 'lock status check';
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
      failureStage = 'password verification';
      const { data: pwCheck, error: pwErr } = await supabase.rpc('verify_member_password', {
        p_school_id: resolvedDir.school_id,
        p_password: loginPw,
      });

      if (pwErr) {
        if (isMissingVerifyPasswordRpcError(pwErr)) {
          // RPC missing in DB/schema cache; continue with first-time setup flow.
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
      failureStage = 'post-login initialization';
      try {
        await supabase.rpc('reset_failed_password_attempts', { p_school_id: resolvedDir.school_id });
      } catch {
        // Non-blocking: login should continue even if reset fails.
      }
      if (profile?.id) await initializeUserData(profile.id, resolvedDir.school_id);
      const userPayload = { id: resolvedDir.school_id, _uuid: profile?.id ?? null, name, section: profile?.voice_section ?? '', email: email.trim().toLowerCase() };
      failureStage = 'navigation';
      if (isAdmin) { setVerifiedUser(user); setScreen('role-select'); }
      else {
        saveSession('member', userPayload);
        go('member-home', { role: 'member', user: userPayload });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Login failed during ${failureStage}. ${message}`);
    } finally {
      setLoading(false);
    }
  };

  // ── Setup submit ──────────────────────────────────────────────────────────
  const submitSetup = async (e?: FormEvent) => {
    e?.preventDefault();
    setSetupError('');
    if (!setupQuestion1 || !setupQuestion2) { setSetupError('Select both security questions.'); return; }
    if (setupQuestionsDuplicated) { setSetupError('Security questions must be different.'); return; }
    if (setupAnswer1.trim().length < 2 || setupAnswer2.trim().length < 2) {
      setSetupError('Provide answers for both security questions.');
      return;
    }
    const memberPolicyIssues = getPasswordPolicyIssues(memberPw, {
      schoolId: verifiedUser?.schoolId,
      email: verifiedUser?.email,
    });
    if (memberPolicyIssues.length > 0) { setSetupError(memberPolicyIssues[0]); return; }
    if (memberPw !== memberPwC) { setSetupError('Member passwords do not match.'); return; }
    if (verifiedUser?.isAdmin) {
      const adminPolicyIssues = getPasswordPolicyIssues(adminPwNew, {
        schoolId: verifiedUser?.schoolId,
        email: verifiedUser?.email,
      });
      if (adminPolicyIssues.length > 0) { setSetupError(adminPolicyIssues[0]); return; }
      if (adminPwNew !== adminPwNewC) { setSetupError('Admin passwords do not match.'); return; }
      if (memberPw === adminPwNew) {
        setSetupError('Member and Admin Console passwords must be different.');
        return;
      }
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
      const { error: e3 } = await supabase.rpc('set_security_questions', {
        p_school_id: verifiedUser!.schoolId,
        p_question_1: setupQuestion1,
        p_answer_1: setupAnswer1.trim(),
        p_question_2: setupQuestion2,
        p_answer_2: setupAnswer2.trim(),
      });
      if (e3) throw e3;

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

  // ── Forgot password submit ────────────────────────────────────────────────
  const submitForgot = async (e?: FormEvent) => {
    e?.preventDefault();
    setForgotError('');
    const normalizedEmail = forgotEmail.trim().toLowerCase();
    const schoolId = Number(forgotIdNumber.trim());
    if (!normalizedEmail || !schoolId) {
      setForgotError('Enter your DLSU email and ID number.');
      return;
    }
    if (!forgotQuestion1 || !forgotQuestion2) {
      setForgotError('Security questions are not set for this account. Contact an admin.');
      return;
    }
    if (forgotAnswer1.trim().length < 2 || forgotAnswer2.trim().length < 2) {
      setForgotError('Answer both security questions.');
      return;
    }

    const memberPolicyIssues = getPasswordPolicyIssues(forgotMemberPw, {
      schoolId,
      email: normalizedEmail,
    });
    if (memberPolicyIssues.length > 0) { setForgotError(memberPolicyIssues[0]); return; }
    if (forgotMemberPw !== forgotMemberPwC) {
      setForgotError('Member passwords do not match.');
      return;
    }

    if (forgotUserIsAdmin && forgotResetAdmin) {
      const adminPolicyIssues = getPasswordPolicyIssues(forgotAdminPw, {
        schoolId,
        email: normalizedEmail,
      });
      if (adminPolicyIssues.length > 0) { setForgotError(adminPolicyIssues[0]); return; }
      if (forgotAdminPw !== forgotAdminPwC) {
        setForgotError('Admin passwords do not match.');
        return;
      }
      if (forgotMemberPw === forgotAdminPw) {
        setForgotError('Member and Admin Console passwords must be different.');
        return;
      }
    }

    setForgotLoading(true);
    try {
      const { data: dir, error: dirErr } = await supabase
        .from('directory')
        .select('school_id, email')
        .eq('email', normalizedEmail)
        .eq('school_id', schoolId)
        .maybeSingle();

      if (dirErr || !dir) {
        setForgotError('We could not verify your account details.');
        return;
      }

      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('school_id, is_admin')
        .eq('school_id', schoolId)
        .maybeSingle();

      if (profileErr || !profile?.school_id) {
        setForgotError('We could not verify your account details.');
        return;
      }

      const { data: answersValid, error: verifyErr } = await supabase.rpc('verify_security_answers', {
        p_school_id: schoolId,
        p_answer_1: forgotAnswer1.trim(),
        p_answer_2: forgotAnswer2.trim(),
      });
      if (verifyErr) {
        setForgotError('Security answer verification failed. Please try again.');
        return;
      }
      if (answersValid !== true) {
        setForgotError('Security answers do not match our records.');
        return;
      }
      if (forgotResetAdmin && profile.is_admin !== true) {
        setForgotError('This account does not have Admin Console access.');
        return;
      }

      const { error: memberErr } = await supabase.rpc('set_member_password', {
        p_school_id: schoolId,
        p_password: forgotMemberPw,
      });
      if (memberErr) throw memberErr;

      if (profile.is_admin === true && forgotResetAdmin) {
        const { error: adminErr } = await supabase.rpc('set_admin_password', {
          p_school_id: schoolId,
          p_password: forgotAdminPw,
        });
        if (adminErr) throw adminErr;
      }

      try {
        await supabase.rpc('reset_failed_password_attempts', { p_school_id: schoolId });
      } catch {
        // Non-blocking: password reset already succeeded.
      }

      setScreen('login');
      setNotice('Password reset successful. Please sign in with your new password.');
      setEmail(normalizedEmail);
      setIdNumber(String(schoolId));
      setLoginPw('');
      setForgotEmail('');
      setForgotIdNumber('');
      setForgotQuestion1('');
      setForgotAnswer1('');
      setForgotQuestion2('');
      setForgotAnswer2('');
      setForgotMemberPw('');
      setForgotMemberPwC('');
      setForgotAdminPw('');
      setForgotAdminPwC('');
      setForgotResetAdmin(false);
      setForgotUserIsAdmin(false);
    } catch {
      setForgotError('Password reset failed. Ensure password RPCs and columns are deployed in Supabase.');
      if (CAPTCHA_ENABLED) setForgotCaptchaResetNonce(n => n + 1);
    } finally {
      setForgotLoading(false);
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
        <ThemeToggleButton />
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
                <p style={{ color: theme.dim, fontSize: 12, margin: '8px 0 0 0' }}>
                  Use 12-64 chars, upper + lower case, number, symbol, no spaces.
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
                Account Recovery Questions
              </div>
              <p style={{ fontSize: 12, color: theme.dim, margin: 0 }}>
                You will answer these during forgot password recovery.
              </p>
              <div>
                {fieldLabel('Security question 1')}
                <select value={setupQuestion1} onChange={e => setSetupQuestion1(e.target.value)} style={inputStyle()}>
                  <option value="">Select a question…</option>
                  {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
              <div>
                {fieldLabel('Answer 1')}
                <input
                  value={setupAnswer1}
                  onChange={e => setSetupAnswer1(e.target.value)}
                  placeholder="Your answer"
                  autoComplete="off"
                  style={inputStyle()}
                />
              </div>
              <div>
                {fieldLabel('Security question 2')}
                <select value={setupQuestion2} onChange={e => setSetupQuestion2(e.target.value)} style={inputStyle(setupQuestionsDuplicated)}>
                  <option value="">Select a different question…</option>
                  {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
              <div>
                {fieldLabel('Answer 2')}
                <input
                  value={setupAnswer2}
                  onChange={e => setSetupAnswer2(e.target.value)}
                  placeholder="Your answer"
                  autoComplete="off"
                  style={inputStyle()}
                />
              </div>
              {setupQuestionsDuplicated && (
                <div style={{ fontSize: 11.5, color: '#dc2626', marginTop: 2 }}>
                  Security questions must be different.
                </div>
              )}
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
                  {setupPasswordsMatchAcrossRoles && (
                    <div style={{ fontSize: 11.5, color: '#dc2626', marginTop: 4 }}>
                      Member and Admin Console passwords must be different.
                    </div>
                  )}
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
              onClick={() => { setScreen('login'); setVerifiedUser(null); setSetupError(''); }}
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
  // Screen: Forgot Password
  // ─────────────────────────────────────────────────────────────────────────
  if (screen === 'forgot') {
    return (
      <div style={outerWrap}>
        <ThemeToggleButton />
        <Card pad={0} style={cardStyle}>
          <GreenPanel />
          <form
            onSubmit={submitForgot}
            style={{
              flex: 1,
              padding: isMobile ? '28px 24px 32px' : '44px 48px',
              display: 'flex',
              flexDirection: 'column',
              gap: isMobile ? 14 : 16,
              boxSizing: 'border-box',
              overflowY: 'auto' as const,
            }}
          >
            <div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' as const }}>
                Account Recovery
              </div>
              <h2 style={{ fontFamily: FONTS.serif, fontSize: isMobile ? 24 : 28, margin: '6px 0 0 0', fontWeight: 500 }}>
                Forgot password
              </h2>
              <p style={{ color: theme.dim, fontSize: 13, margin: '6px 0 0 0' }}>
                Verify your identity, then set a new password.
              </p>
              <p style={{ color: theme.dim, fontSize: 12, margin: '8px 0 0 0' }}>
                Security policy: 12-64 chars, upper + lower case, number, symbol, no spaces.
              </p>
            </div>

            <div>
              {fieldLabel('University email')}
              <input
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                placeholder="juan_delacruz@dlsu.edu.ph"
                type="email"
                autoComplete="email"
                style={inputStyle()}
              />
            </div>

            <div>
              {fieldLabel('ID number')}
              <input
                value={forgotIdNumber}
                onChange={e => setForgotIdNumber(e.target.value)}
                placeholder="12012345"
                inputMode="numeric"
                style={{ ...inputStyle(), fontFamily: FONTS.mono, letterSpacing: 1 }}
              />
            </div>

            <div style={{ padding: '16px 18px', background: theme.cream, borderRadius: 10, border: `1px solid ${theme.line}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5, color: theme.green, textTransform: 'uppercase' as const }}>
                Security Verification
              </div>
              <div>
                {fieldLabel('Question 1')}
                <input value={forgotQuestion1} readOnly placeholder="Enter email and ID first to load question" style={inputStyle()} />
              </div>
              <div>
                {fieldLabel('Answer 1')}
                <input
                  value={forgotAnswer1}
                  onChange={e => setForgotAnswer1(e.target.value)}
                  placeholder="Your answer"
                  autoComplete="off"
                  style={inputStyle()}
                />
              </div>
              <div>
                {fieldLabel('Question 2')}
                <input value={forgotQuestion2} readOnly placeholder="Enter email and ID first to load question" style={inputStyle()} />
              </div>
              <div>
                {fieldLabel('Answer 2')}
                <input
                  value={forgotAnswer2}
                  onChange={e => setForgotAnswer2(e.target.value)}
                  placeholder="Your answer"
                  autoComplete="off"
                  style={inputStyle()}
                />
              </div>
            </div>

            <div style={{ padding: '16px 18px', background: theme.cream, borderRadius: 10, border: `1px solid ${theme.line}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5, color: theme.green, textTransform: 'uppercase' as const }}>
                New member password
              </div>

              <div>
                {fieldLabel('New password')}
                <div style={{ position: 'relative' }}>
                  <input
                    value={forgotMemberPw}
                    onChange={e => setForgotMemberPw(e.target.value)}
                    placeholder="Create a secure password"
                    type={showForgotMemberPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    style={pwInputStyle()}
                  />
                  {showHideBtn(showForgotMemberPw, () => setShowForgotMemberPw(s => !s))}
                </div>
              </div>

              <div>
                {fieldLabel('Confirm password')}
                <div style={{ position: 'relative' }}>
                  <input
                    value={forgotMemberPwC}
                    onChange={e => setForgotMemberPwC(e.target.value)}
                    placeholder="Re-enter password"
                    type={showForgotMemberPwC ? 'text' : 'password'}
                    autoComplete="new-password"
                    style={pwInputStyle(forgotMemberPwC.length > 0 && forgotMemberPw !== forgotMemberPwC)}
                  />
                  {showHideBtn(showForgotMemberPwC, () => setShowForgotMemberPwC(s => !s))}
                </div>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: theme.ink, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={forgotResetAdmin}
                onChange={e => setForgotResetAdmin(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: theme.green }}
              />
              I also need to reset my Admin Console password
            </label>

            {forgotResetAdmin && (
              <div style={{ padding: '16px 18px', background: theme.cream, borderRadius: 10, border: `1px solid ${theme.line}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5, color: '#c9a84c', textTransform: 'uppercase' as const }}>
                  New admin password
                </div>

                <div>
                  {fieldLabel('Admin password')}
                  <div style={{ position: 'relative' }}>
                    <input
                      value={forgotAdminPw}
                      onChange={e => setForgotAdminPw(e.target.value)}
                      placeholder="Create a secure admin password"
                      type={showForgotAdminPw ? 'text' : 'password'}
                      autoComplete="new-password"
                      style={pwInputStyle()}
                    />
                    {showHideBtn(showForgotAdminPw, () => setShowForgotAdminPw(s => !s))}
                  </div>
                  {forgotPasswordsMatchAcrossRoles && (
                    <div style={{ fontSize: 11.5, color: '#dc2626', marginTop: 4 }}>
                      Member and Admin Console passwords must be different.
                    </div>
                  )}
                </div>

                <div>
                  {fieldLabel('Confirm admin password')}
                  <div style={{ position: 'relative' }}>
                    <input
                      value={forgotAdminPwC}
                      onChange={e => setForgotAdminPwC(e.target.value)}
                      placeholder="Re-enter admin password"
                      type={showForgotAdminPwC ? 'text' : 'password'}
                      autoComplete="new-password"
                      style={pwInputStyle(forgotAdminPwC.length > 0 && forgotAdminPw !== forgotAdminPwC)}
                    />
                    {showHideBtn(showForgotAdminPwC, () => setShowForgotAdminPwC(s => !s))}
                  </div>
                </div>
              </div>
            )}

            {forgotError && <ErrorBox msg={forgotError} />}

            <Button
              size="lg"
              type="submit"
              disabled={forgotLoading}
              style={{ justifyContent: 'center', width: '100%', opacity: forgotLoading ? 0.7 : 1 }}
            >
              {forgotLoading ? 'Resetting…' : 'Reset password'}
            </Button>

            <button
              type="button"
              onClick={() => { setScreen('login'); setForgotError(''); }}
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
        <ThemeToggleButton />
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

            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
              <button
                onClick={() => { setScreen('login'); setVerifiedUser(null); setAdminVerifyExpanded(false); }}
                style={{
                  background: 'transparent', border: 'none',
                  color: theme.dim, fontSize: 12.5, cursor: 'pointer', fontFamily: FONTS.sans, padding: 0,
                }}
              >
                ← Back to sign in
              </button>

              <button
                onClick={() => go('rfid')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: theme.green,
                  fontSize: 12.5,
                  cursor: 'pointer',
                  fontFamily: FONTS.sans,
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                Launch attendance kiosk
              </button>
            </div>
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
      <ThemeToggleButton />
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
                First-time users will be prompted to set a secure password.
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

          {notice && (
            <div style={{
              fontSize: 13, color: '#14532d',
              background: '#ecfdf3', border: '1px solid #86efac',
              borderRadius: 8, padding: '10px 14px', fontFamily: FONTS.sans,
            }}>
              {notice}
            </div>
          )}
          {error && <ErrorBox msg={error} />}

          <Button
            size="lg"
            type="submit"
            disabled={loading}
            style={{ justifyContent: 'center', width: '100%', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>

          <button
            type="button"
            onClick={async () => {
              setForgotError('');
              const normalizedEmail = email.trim().toLowerCase();
              const schoolId = Number(idNumber.trim());
              setForgotEmail(normalizedEmail);
              setForgotIdNumber(schoolId ? String(schoolId) : '');
              setForgotQuestion1('');
              setForgotAnswer1('');
              setForgotQuestion2('');
              setForgotAnswer2('');
              setForgotMemberPw('');
              setForgotMemberPwC('');
              setForgotAdminPw('');
              setForgotAdminPwC('');
              setForgotResetAdmin(false);
              setForgotUserIsAdmin(false);

              if (normalizedEmail && schoolId) {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('is_admin, security_question_1, security_question_2')
                  .eq('school_id', schoolId)
                  .maybeSingle();
                if (profile?.is_admin === true) {
                  setForgotUserIsAdmin(true);
                }
                setForgotQuestion1(profile?.security_question_1 ?? '');
                setForgotQuestion2(profile?.security_question_2 ?? '');
              }

              setScreen('forgot');
            }}
            style={{ background: 'transparent', border: 'none', color: theme.green, cursor: 'pointer', textDecoration: 'underline', fontSize: 12.5, padding: 0, textAlign: 'left' as const, fontFamily: FONTS.sans }}
          >
            Forgot password?
          </button>
        </form>
      </Card>
    </div>
  );
}
