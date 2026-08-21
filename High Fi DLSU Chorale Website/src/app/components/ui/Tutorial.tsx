import { useState, useEffect, useRef } from 'react';
import { useTheme, useRouter } from '../../App';
import { FONTS } from '../../theme';
import { Button } from './Button';
import { Icon, IconName } from './Icon';

// targetKey matches a Shell.tsx sidebar nav item's `key` (data-tour="...").
// Steps with a targetKey spotlight that real sidebar button instead of
// showing a plain centered card, and the tour auto-advances the moment the
// visitor actually navigates there themselves — clicking through the real
// interface is how the tour is meant to be followed, not just reading text.
// Steps without one (the welcome/closing steps) render as a plain centered
// card like before.
type Step = { icon: IconName; title: string; body: string; targetKey?: string };

const MEMBER_STEPS: Step[] = [
  { icon: 'home', title: 'Welcome to the Member Portal', body: "This is where you'll manage everything Chorale-related — attendance, excuses, events, fees, and more. Click each highlighted item in the sidebar to follow along, or use Next to skip ahead." },
  { icon: 'home', title: 'Home', targetKey: 'member-home', body: 'Your dashboard — a quick look at what\'s due, what\'s coming up, and your recent attendance. Click "Home" in the sidebar to go there now.' },
  { icon: 'clock', title: 'My Attendance', targetKey: 'member-attendance', body: 'Your full attendance record across rehearsals and performances. Click "My Attendance" to see it.' },
  { icon: 'ticket', title: 'Excuse Requests', targetKey: 'member-excuses', body: 'File an absence, late arrival, or stepping-out request here. You can only file one per date, but you can edit it freely until your Section Head decides. Click "Excuse Requests" to open the form.' },
  { icon: 'music', title: 'Events', targetKey: 'member-performances', body: 'Upcoming rehearsals and performances, including sign-ups for performing and non-performing (committee) roles. Click "Events" to browse what\'s coming up.' },
  { icon: 'folder', title: 'Music Library', targetKey: 'member-music', body: 'Scores, study guides, and practice tracks, organized by category. Click "Music Library" to look through it.' },
  { icon: 'wallet', title: 'Fees & Payments', targetKey: 'member-fees', body: "Track what you owe, submit proof of payment, and see your fee history. Unexcused lates/absences count toward the group's petty cash fund automatically — ₱100 at your 2nd, ₱200 at your 4th, ₱300 at your 6th each term. Click \"Fees & Payments\" to check your balance." },
  { icon: 'megaphone', title: 'Announcements', targetKey: 'member-announcements', body: 'Updates posted by the Executive Board — pinned items stay at the top. Click "Announcements" to catch up.' },
  { icon: 'alertTriangle', title: 'Report a Concern', targetKey: 'member-incidents', body: 'Need to report an incident, issue, or concern? This files a confidential testimony that only HR can access — evidence can be a file or a pasted link, and you can submit anonymously. Click "Report a Concern" to see the form.' },
  { icon: 'info', title: 'Rules & Guidelines', targetKey: 'member-rules', body: 'Etiquette, attendance policy, and vocal health documents from the Executive Board, organized by category. Click to browse them.' },
  { icon: 'user', title: 'Profile', targetKey: 'member-profile', body: 'Your personal details, notification preferences, and profile picture live here. Click "Profile" to take a look.' },
  // Last spotlighted step on purpose: clicking "Launch Kiosk" navigates to a
  // full-screen kiosk view outside this dashboard shell entirely, which ends
  // the tour right there (nothing left to lose except the closing note below).
  { icon: 'check', title: 'Attendance Kiosk', targetKey: 'rfid', body: 'Opens the check-in screen for rehearsals and events — check in with your name or ID and the word of the day. Also reachable from the login page without logging in first; exiting always brings you back to wherever you launched it from. Click "Launch Kiosk" to see it.' },
  { icon: 'bell', title: "You're all set", body: 'You can reopen this tutorial anytime with the "?" button in the top bar. Welcome to the Chorale!' },
];

const ADMIN_STEPS: Step[] = [
  { icon: 'home', title: 'Welcome to the Admin Console', body: "A quick tour of what's available to you as an admin. Click each highlighted item in the sidebar to follow along, or use Next to skip ahead. You can reopen this anytime from the \"?\" button in the top bar." },
  { icon: 'home', title: 'Dashboard', targetKey: 'admin-home', body: 'Org-wide overview — click "Dashboard" to go there.' },
  { icon: 'music', title: 'Events', targetKey: 'admin-events', body: 'Create and manage events and rehearsals. Uploading a PDF or .docx request form auto-fills the event; you can also set a reminder email for members who haven\'t signed up, and notify members when an event is added or cancelled. Click "Events" to open it.' },
  { icon: 'clock', title: 'Attendance & Petty Cash Fees', targetKey: 'admin-attendance', body: "The attendance kiosk records check-ins directly. Unexcused lates/absences (combined, across rehearsals and performances) auto-charge the petty cash fund at every 2nd occurrence — ₱100, ₱200, ₱300, and so on. Update the term start date in Fee Management → Fee Rules at the start of each new term. Click \"Attendance Overview\" to see it." },
  { icon: 'ticket', title: 'Excuse Approvals', targetKey: 'admin-excuses', body: 'Review and decide on excuse requests. Declining always requires a reason, which is emailed to the member along with the decision. Click "Excuse Approvals" to open it.' },
  { icon: 'folder', title: 'Music Library', targetKey: 'admin-music', body: 'Manage the sheet music, practice tracks, and study materials members see. Click to open it.' },
  { icon: 'wallet', title: 'Fee Management', targetKey: 'admin-fees', body: 'Approve payments, edit the fee schedule, set the current term\'s start date, or manually charge a one-off fee (uniforms, damages, etc.) to specific members. Click "Fee Management" to open it.' },
  { icon: 'chart', title: 'Analytics', targetKey: 'admin-analytics', body: 'Org-wide stats, including a "Nearing Graduation" breakdown for members with 3 terms left or fewer. Click "Analytics" to see it.' },
  { icon: 'users', title: 'Members', targetKey: 'admin-members', body: 'Add new members (they set their own password on first login), edit member details, and export the roster as CSV. Click "Members" to open the roster.' },
  { icon: 'shield', title: 'Incident Reports', targetKey: 'admin-incidents', body: 'Confidential testimonies filed by members, gated behind a separate HR-only password and an emailed access code — only HR should know this password. Click "Incident Reports" to see it (you\'ll need the HR password to unlock it).' },
  { icon: 'info', title: 'Rules & Guidelines', targetKey: 'admin-rules', body: 'Add, edit, or remove the etiquette and policy documents members see. Click to manage them.' },
  { icon: 'check', title: 'Attendance Kiosk', targetKey: 'rfid', body: 'The same check-in screen members use — useful for running attendance from a shared device at rehearsal. Click "Launch Kiosk" to see it.' },
];

export function getTutorialSteps(role: 'member' | 'admin'): Step[] {
  return role === 'admin' ? ADMIN_STEPS : MEMBER_STEPS;
}

type Rect = { top: number; left: number; width: number; height: number };

function useTargetRect(targetKey: string | undefined): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (!targetKey) { setRect(null); return; }
    let raf = 0;
    const measure = () => {
      const el = document.querySelector(`[data-tour="${targetKey}"]`) as HTMLElement | null;
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else {
        setRect(null);
      }
      raf = requestAnimationFrame(measure);
    };
    raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, [targetKey]);

  return rect;
}

function StepCard({
  step, i, total, isMobile, style, onSkip, onBack, onNext, isLast,
}: {
  step: Step; i: number; total: number; isMobile: boolean;
  style?: React.CSSProperties;
  onSkip: () => void; onBack: () => void; onNext: () => void; isLast: boolean;
}) {
  const { theme } = useTheme();
  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        background: theme.paper, color: theme.ink, borderRadius: 16,
        width: '100%', maxWidth: 380, border: `1px solid ${theme.line}`,
        overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
        pointerEvents: 'auto',
        ...style,
      }}
    >
      <div style={{ padding: '22px 22px 18px', background: theme.greenDark, color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={step.icon} size={18} stroke="#fff" />
          </div>
          <button onClick={onSkip} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 20, padding: 4, lineHeight: 1 }}>×</button>
        </div>
        <h3 style={{ fontFamily: FONTS.serif, fontSize: isMobile ? 18 : 19, margin: '14px 0 0', fontWeight: 500 }}>{step.title}</h3>
      </div>

      <div style={{ padding: 22 }}>
        <p style={{ fontSize: 13.5, color: theme.ink, lineHeight: 1.6, margin: 0 }}>{step.body}</p>

        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', margin: '18px 0' }}>
          {Array.from({ length: total }).map((_, idx) => (
            <div key={idx} style={{ width: idx === i ? 16 : 6, height: 6, borderRadius: 3, background: idx === i ? theme.green : theme.line, transition: 'width 0.2s' }} />
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <button onClick={onSkip} style={{ background: 'transparent', border: 'none', color: theme.dim, cursor: 'pointer', fontSize: 12.5, padding: 0 }}>
            Skip
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            {i > 0 && <Button variant="outline" size="sm" onClick={onBack}>Back</Button>}
            <Button size="sm" onClick={onNext}>{isLast ? 'Done' : 'Next'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Tutorial({
  role, isMobile, onNeedSidebar, onClose,
}: { role: 'member' | 'admin'; isMobile?: boolean; onNeedSidebar?: () => void; onClose: () => void }) {
  const { theme } = useTheme();
  const { route } = useRouter();
  const steps = getTutorialSteps(role);
  const [i, setI] = useState(0);
  const step = steps[i];
  const isLast = i === steps.length - 1;
  const rect = useTargetRect(step.targetKey);
  const prevRouteRef = useRef(route);

  // The whole point: following the real sidebar link advances the tour by
  // itself, same as clicking Next would. Only fires on an actual route
  // *change* into the target — not just already being there when the step
  // appears — so the tour never auto-skips a step nobody acted on yet.
  useEffect(() => {
    const changed = route !== prevRouteRef.current;
    prevRouteRef.current = route;
    if (changed && step.targetKey && route === step.targetKey && !isLast) {
      setI(idx => idx + 1);
    }
  }, [route]);

  // Ask Shell to open the mobile drawer whenever a step needs to spotlight
  // something inside it — the sidebar is hidden behind a hamburger on
  // mobile otherwise, so there'd be nothing to highlight.
  useEffect(() => {
    if (isMobile && step.targetKey) onNeedSidebar?.();
  }, [isMobile, step.targetKey]);

  const next = () => (isLast ? onClose() : setI(idx => idx + 1));
  const back = () => setI(idx => Math.max(0, idx - 1));

  // ── Plain centered card — no target to spotlight ──────────────────────────
  if (!step.targetKey || !rect) {
    return (
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(8,32,26,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 24 }}
      >
        <StepCard step={step} i={i} total={steps.length} isMobile={!!isMobile} onSkip={onClose} onBack={back} onNext={next} isLast={isLast}
          style={{ maxWidth: 460 }}
        />
      </div>
    );
  }

  // ── Spotlight on the real sidebar item ────────────────────────────────────
  const pad = 6;
  const holeStyle: React.CSSProperties = {
    position: 'fixed',
    top: rect.top - pad, left: rect.left - pad,
    width: rect.width + pad * 2, height: rect.height + pad * 2,
    borderRadius: 10,
    // The transparent box itself leaves a real "hole" with nothing covering
    // it — the giant shadow around it is what dims the rest of the page.
    // pointer-events: none on the whole element means clicks pass straight
    // through to the actual sidebar button sitting underneath the hole.
    boxShadow: `0 0 0 9999px rgba(8,32,26,0.68)`,
    border: `2px solid ${theme.greenMid}`,
    zIndex: 300,
    pointerEvents: 'none',
    transition: 'top 0.15s, left 0.15s, width 0.15s, height 0.15s',
  };

  // Card goes beside the sidebar on desktop (sidebar is 240px wide), or
  // below the highlighted item on mobile where the drawer is narrower.
  const cardWidth = 340;
  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800;
  const cardStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        top: Math.min(rect.top + rect.height + 16, viewportH - 260),
        left: 16, right: 16, maxWidth: 'none', width: 'auto',
        zIndex: 301,
      }
    : {
        position: 'fixed',
        top: Math.max(16, Math.min(rect.top - 20, viewportH - 420)),
        left: rect.left + rect.width + 20,
        width: Math.min(cardWidth, viewportW - (rect.left + rect.width + 40)),
        zIndex: 301,
      };

  return (
    <>
      <div style={holeStyle} />
      <StepCard step={step} i={i} total={steps.length} isMobile={!!isMobile} onSkip={onClose} onBack={back} onNext={next} isLast={isLast}
        style={cardStyle}
      />
    </>
  );
}
