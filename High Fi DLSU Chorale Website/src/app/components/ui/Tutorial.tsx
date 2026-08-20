import { useState } from 'react';
import { useTheme } from '../../App';
import { FONTS } from '../../theme';
import { Button } from './Button';
import { Icon, IconName } from './Icon';

type Step = { icon: IconName; title: string; body: string };

const MEMBER_STEPS: Step[] = [
  { icon: 'home', title: 'Welcome to the Member Portal', body: "This is where you'll manage everything Chorale-related — attendance, excuses, events, fees, and more. Let's take a quick look around." },
  { icon: 'check', title: 'Attendance Kiosk', body: '"Launch Kiosk" in the sidebar opens the check-in screen for rehearsals and events. Check in with your name or ID and the word of the day — it\'s also reachable from the login page if you don\'t want to log in first.' },
  { icon: 'ticket', title: 'Excuse Requests', body: "File an absence, late arrival, or stepping-out request from \"Excuse Requests.\" You can only file one per date, but you can edit it freely until your Section Head decides on it." },
  { icon: 'music', title: 'Events', body: 'See upcoming rehearsals and performances under "Events," including sign-ups for performing and non-performing (committee) roles.' },
  { icon: 'wallet', title: 'Fees & Payments', body: 'Track what you owe, submit proof of payment, and see your fee history. Late/absence fees are calculated automatically from your attendance.' },
  { icon: 'folder', title: 'Music Library', body: 'Scores, study guides, and practice tracks, organized by category — available any time under "Music Library."' },
  { icon: 'alertTriangle', title: 'Report a Concern', body: 'Need to report an incident, issue, or concern? "Report a Concern" files a confidential testimony that only HR can access — you can submit anonymously if you prefer.' },
  { icon: 'bell', title: "You're all set", body: 'You can reopen this tutorial anytime with the "?" button in the top bar. Welcome to the Chorale!' },
];

const ADMIN_STEPS: Step[] = [
  { icon: 'home', title: 'Welcome to the Admin Console', body: "A quick tour of what's available to you as an admin. You can reopen this anytime from the \"?\" button in the top bar." },
  { icon: 'music', title: 'Events', body: 'Create and manage events and rehearsals. Uploading a PDF or .docx request form auto-fills the event; you can also set an optional reminder email for members who haven\'t signed up yet.' },
  { icon: 'clock', title: 'Attendance & Fees', body: 'The attendance kiosk records check-ins directly — late/unexcused-absence fees are then charged automatically using the current Fee Rules, no manual entry needed.' },
  { icon: 'ticket', title: 'Excuse Approvals', body: 'Review and decide on excuse requests. Declining always requires a reason, which is emailed to the member along with the decision.' },
  { icon: 'wallet', title: 'Fee Management', body: 'Approve payments, edit the fee schedule, or manually charge a one-off fee (uniforms, damages, etc.) to specific members.' },
  { icon: 'users', title: 'Members', body: 'Add new members (they set their own password on first login), edit member details, and export the roster as CSV.' },
  { icon: 'chart', title: 'Analytics', body: 'Org-wide stats, including a "Nearing Graduation" breakdown for members with 3 terms left or fewer.' },
  { icon: 'shield', title: 'Incident Reports', body: 'Confidential testimonies filed by members live here, gated behind a separate HR-only password and an emailed access code — only HR should know this password.' },
];

export function getTutorialSteps(role: 'member' | 'admin'): Step[] {
  return role === 'admin' ? ADMIN_STEPS : MEMBER_STEPS;
}

export function Tutorial({ role, onClose }: { role: 'member' | 'admin'; onClose: () => void }) {
  const { theme } = useTheme();
  const steps = getTutorialSteps(role);
  const [i, setI] = useState(0);
  const step = steps[i];
  const isLast = i === steps.length - 1;

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(8,32,26,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: theme.paper, color: theme.ink, borderRadius: 16, width: '100%', maxWidth: 460, border: `1px solid ${theme.line}`, overflow: 'hidden' }}
      >
        <div style={{ padding: '28px 28px 24px', background: theme.greenDark, color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={step.icon} size={20} stroke="#fff" />
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 22, padding: 4, lineHeight: 1 }}>×</button>
          </div>
          <h3 style={{ fontFamily: FONTS.serif, fontSize: 21, margin: '16px 0 0', fontWeight: 500 }}>{step.title}</h3>
        </div>

        <div style={{ padding: 28 }}>
          <p style={{ fontSize: 14, color: theme.ink, lineHeight: 1.6, margin: 0 }}>{step.body}</p>

          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', margin: '22px 0' }}>
            {steps.map((_, idx) => (
              <div
                key={idx}
                style={{ width: idx === i ? 18 : 6, height: 6, borderRadius: 3, background: idx === i ? theme.green : theme.line, transition: 'width 0.2s' }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: theme.dim, cursor: 'pointer', fontSize: 12.5, padding: 0 }}>
              Skip
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              {i > 0 && (
                <Button variant="outline" size="sm" onClick={() => setI(i - 1)}>Back</Button>
              )}
              <Button size="sm" onClick={() => (isLast ? onClose() : setI(i + 1))}>
                {isLast ? 'Done' : 'Next'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
