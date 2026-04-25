import { useState } from 'react';
import { useRouter, useTheme, useApp } from '../../App';
import { FONTS } from '../../theme';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { FEE_SUMMARIES, MEMBERS } from '../../data';
import { Field } from '../ui/Field';
import { Icon } from '../ui/Icon';

function BroadcastNoticeModal({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const app = useApp();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);
  const [recipients, setRecipients] = useState('all');

  const handleBroadcast = () => {
    app.showToast(`Notice broadcast to ${recipients === 'all' ? 'all members' : recipients}`);
    onClose();
  };

  const modalInput = {
    width: '100%',
    padding: '11px 14px',
    border: `1px solid ${theme.lineDark}`,
    borderRadius: 10,
    fontSize: 14,
    fontFamily: FONTS.sans,
    background: theme.paper,
    color: theme.ink,
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8,32,26,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: theme.paper,
          borderRadius: 14,
          width: 650,
          maxHeight: '85vh',
          overflowY: 'auto',
          border: `1px solid ${theme.line}`,
        }}
      >
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${theme.line}`, background: theme.cream }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' }}>
            Admin Console
          </div>
          <h3 style={{ fontFamily: FONTS.serif, fontSize: 24, margin: '6px 0 0', fontWeight: 500 }}>Broadcast notice</h3>
          <p style={{ fontSize: 13, color: theme.dim, margin: '6px 0 0' }}>
            Send an announcement to all members or specific sections.
          </p>
        </div>

        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Notice title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Rehearsal schedule update" />

          <div>
            <label style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
              Recipients
            </label>
            <select value={recipients} onChange={e => setRecipients(e.target.value)} style={modalInput}>
              <option value="all">All members (64)</option>
              <option value="Soprano">Soprano section (16)</option>
              <option value="Alto">Alto section (15)</option>
              <option value="Tenor">Tenor section (16)</option>
              <option value="Bass">Bass section (17)</option>
              <option value="exec">Executive board only (8)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
              Message body
            </label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={6}
              placeholder="Write your announcement here..."
              style={{ ...modalInput, resize: 'vertical' }}
            />
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 13,
              padding: 14,
              background: theme.cream,
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} />
            <div>
              <div style={{ fontWeight: 500 }}>Pin this notice</div>
              <div style={{ fontSize: 12, color: theme.dim, marginTop: 2 }}>Pinned notices appear at the top of member announcements</div>
            </div>
          </label>

          <div style={{ padding: 14, background: theme.blueSoft, borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="info" size={16} stroke={theme.blue} />
              <div style={{ fontSize: 12, color: theme.ink }}>
                Recipients will receive this via email and it will appear in their Announcements feed.
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 28px', borderTop: `1px solid ${theme.line}`, display: 'flex', justifyContent: 'space-between', gap: 10, background: theme.cream }}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button icon="megaphone" onClick={handleBroadcast} disabled={!title || !body}>
            Broadcast notice
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, trend, tone = 'neutral' }: any) {
  const { theme } = useTheme();
  const colors = { green: theme.green, amber: theme.amber, red: theme.red, blue: theme.blue, neutral: theme.ink };

  return (
    <Card>
      <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 1.5, color: theme.dim, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: FONTS.serif, fontSize: 38, fontWeight: 500, margin: '6px 0 4px', color: colors[tone], lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11.5, color: theme.dim }}>{trend}</div>
    </Card>
  );
}

export function AdminHome() {
  const { user, go } = useRouter();
  const { theme } = useTheme();
  const app = useApp();
  const [showBroadcast, setShowBroadcast] = useState(false);

  const pending = app.excuses.filter(e => e.status === 'Pending');
  const outstanding = FEE_SUMMARIES.reduce((s, f) => s + f.outstanding, 0);
  const activeEvents = app.events.filter(e => new Date(e.date) > new Date('2026-04-24'));

  return (
    <>
      <PageHeader
        eyebrow={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        title={
          <>
            Admin Console, <em style={{ fontStyle: 'italic', color: theme.green }}>{user.name.split(' ')[0]}</em>.
          </>
        }
        subtitle="Everything happening across the Chorale — at a glance."
        actions={
          <>
            <Button variant="outline" icon="download">
              Weekly report
            </Button>
            <Button icon="megaphone" onClick={() => setShowBroadcast(true)}>Broadcast notice</Button>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label="Active members" value="64" trend="+3 this term" tone="green" />
        <StatCard label="Pending excuses" value={pending.length} trend="requires review" tone="amber" />
        <StatCard label="Outstanding fees" value={`₱${outstanding.toLocaleString()}`} trend={`across ${FEE_SUMMARIES.filter(f => f.outstanding > 0).length} members`} tone="red" />
        <StatCard label="Upcoming events" value={activeEvents.length} trend="next: BCFC in 16d" tone="blue" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' }}>Action needed</div>
              <h3 style={{ fontFamily: FONTS.serif, fontSize: 22, margin: '4px 0 0', fontWeight: 500 }}>Pending excuses · {pending.length}</h3>
            </div>
            <a onClick={() => go('admin-excuses' as any)} style={{ fontSize: 12.5, color: theme.green, cursor: 'pointer', textDecoration: 'underline' }}>
              Review all →
            </a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pending.slice(0, 5).map(e => {
              const m = MEMBERS.find(m => m.id === e.memberId);
              return (
                <div key={e.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 14, alignItems: 'center', padding: 12, background: theme.cream, borderRadius: 10 }}>
                  <Avatar member={m} size={34} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>
                      {e.memberName} · <span style={{ color: theme.dim, fontWeight: 400 }}>{e.type}</span>
                    </div>
                    <div style={{ fontSize: 12, color: theme.dim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.reason}</div>
                  </div>
                  <div style={{ fontSize: 11.5, color: theme.dim, fontFamily: FONTS.mono }}>{e.date}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Button
                      size="sm"
                      onClick={() => {
                        app.updateExcuse(e.id, { status: 'Approved', approvedBy: user.name });
                        app.showToast(`Approved ${e.memberName}'s excuse`);
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        app.updateExcuse(e.id, { status: 'Declined', approvedBy: user.name });
                        app.showToast(`Declined ${e.memberName}'s excuse`, 'error');
                      }}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              );
            })}
            {pending.length === 0 && <div style={{ padding: 30, textAlign: 'center', color: theme.dim }}>🎉 No pending requests.</div>}
          </div>
        </Card>

        <Card>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.green, textTransform: 'uppercase', marginBottom: 12 }}>This week · attendance</div>
          <h3 style={{ fontFamily: FONTS.serif, fontSize: 22, margin: '0 0 16px', fontWeight: 500 }}>Section turnout</h3>
          {[
            { s: 'Soprano', present: 14, total: 16, color: '#B04A5F' },
            { s: 'Alto', present: 13, total: 15, color: '#9B6B2F' },
            { s: 'Tenor', present: 12, total: 16, color: '#2C5B8E' },
            { s: 'Bass', present: 15, total: 17, color: theme.greenDeep },
          ].map(row => (
            <div key={row.s} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                <span>{row.s}</span>
                <span style={{ fontFamily: FONTS.mono, color: theme.dim }}>
                  {row.present}/{row.total} · {Math.round((row.present / row.total) * 100)}%
                </span>
              </div>
              <div style={{ height: 8, background: theme.line, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${(row.present / row.total) * 100}%`, height: '100%', background: row.color }} />
              </div>
            </div>
          ))}
        </Card>
      </div>
      {showBroadcast && <BroadcastNoticeModal onClose={() => setShowBroadcast(false)} />}
    </>
  );
}
