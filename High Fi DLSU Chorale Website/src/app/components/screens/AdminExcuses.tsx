import { useState } from 'react';
import { useRouter, useTheme, useApp } from '../../App';
import { FONTS } from '../../theme';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { SectionTag } from '../ui/SectionTag';
import { Chip, StatusPill } from '../ui/Chip';
import { MEMBERS } from '../../data';
import { supabase } from '../../supabase';
import { notifyExcuseDecision } from '../../utils/email';

function memberEmail(memberId: string | number): string {
  const m = MEMBERS.find(x => String(x.id) === String(memberId));
  return m?.email ?? '';
}

type Excuse = {
  id: string | number;
  memberId: string | number;
  memberName: string;
  section: string;
  type: string;
  date: string;
  reason: string;
  status: string;
  submittedAt?: string;
  eta?: string;
  notes?: string;
  approvedBy?: string;
};

export function AdminExcuses() {
  const { user } = useRouter();
  const app = useApp();
  const { theme } = useTheme();
  const [filter, setFilter] = useState('Pending');
  const [section, setSection] = useState('All');
  const [declineFor, setDeclineFor] = useState<Excuse | null>(null);
  const [declineNote, setDeclineNote] = useState('');
  const [actioning, setActioning] = useState<string | number | null>(null);

  const rows = (app.excuses as Excuse[]).filter(
    e => (filter === 'All' || e.status === filter) && (section === 'All' || e.section === section)
  );

  const handleApprove = async (e: Excuse) => {
    setActioning(e.id);
    // Persist to Supabase
    await supabase
      .from('excuse_requests')
      .update({ status: 'Approved' })
      .eq('request_id', e.id);
    // Update local state immediately
    app.updateExcuse(e.id, { status: 'Approved', approvedBy: user?.name ?? 'Admin', notes: 'Approved.' });
    app.showToast(`Approved · ${e.memberName}`);
    notifyExcuseDecision({ email: memberEmail(e.memberId), name: e.memberName, excuseType: e.type, date: e.date, status: 'Approved', notes: 'Approved.' });
    setActioning(null);
  };

  const handleDecline = async () => {
    if (!declineFor) return;
    setActioning(declineFor.id);
    await supabase
      .from('excuse_requests')
      .update({ status: 'Declined' })
      .eq('request_id', declineFor.id);
    const note = declineNote || 'Declined.';
    app.updateExcuse(declineFor.id, { status: 'Declined', approvedBy: user?.name ?? 'Admin', notes: note });
    notifyExcuseDecision({ email: memberEmail(declineFor.memberId), name: declineFor.memberName, excuseType: declineFor.type, date: declineFor.date, status: 'Declined', notes: note });
    app.showToast('Declined — member notified', 'error');
    setDeclineFor(null);
    setDeclineNote('');
    setActioning(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Excuse Approvals"
        subtitle="Review and decide on excuse requests. Status changes are saved to the database."
      />

      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        {['Pending', 'Approved', 'Declined', 'All'].map(f => {
          const count = f === 'All' ? app.excuses.length : (app.excuses as Excuse[]).filter(e => e.status === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px', borderRadius: 999, fontSize: 12.5,
                background: filter === f ? theme.ink : 'transparent',
                color: filter === f ? '#fff' : theme.ink,
                border: `1px solid ${filter === f ? theme.ink : theme.lineDark}`,
                cursor: 'pointer', fontFamily: FONTS.sans,
              }}
            >
              {f} · {count}
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <select
          value={section}
          onChange={e => setSection(e.target.value)}
          style={{ padding: '8px 12px', border: `1px solid ${theme.lineDark}`, borderRadius: 8, background: theme.paper, color: theme.ink, fontFamily: FONTS.sans, fontSize: 13, outline: 'none' }}
        >
          {['All', 'Soprano', 'Alto', 'Tenor', 'Bass'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {rows.length === 0 ? (
        <Card>
          <div style={{ padding: 32, textAlign: 'center', color: theme.dim, fontSize: 14 }}>
            No {filter === 'All' ? '' : filter.toLowerCase()} excuse requests.
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map(e => {
            const m = MEMBERS.find(mm => mm.id === e.memberId || String(mm.id) === String(e.memberId));
            const isActioning = actioning === e.id;
            return (
              <Card key={e.id}>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 20, alignItems: 'center' }}>
                  <Avatar member={m ?? { id: 0, name: e.memberName, section: e.section }} size={42} />
                  <div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 15, fontWeight: 500 }}>{e.memberName}</span>
                      <SectionTag section={e.section} />
                      <Chip tone="neutral">{e.type}</Chip>
                      {e.eta && <Chip tone="neutral" icon="clock">ETA {e.eta}</Chip>}
                    </div>
                    <div style={{ fontSize: 13, color: theme.ink, lineHeight: 1.5, marginBottom: 4 }}>{e.reason}</div>
                    <div style={{ fontSize: 11, color: theme.dim, fontFamily: FONTS.mono, letterSpacing: 0.3 }}>
                      FOR {e.date} · FILED {e.submittedAt?.slice(0, 10)}
                    </div>
                    {e.notes && e.status !== 'Pending' && (
                      <div style={{ marginTop: 10, padding: '8px 12px', background: theme.cream, borderLeft: `3px solid ${theme.green}`, borderRadius: 4, fontSize: 12.5 }}>
                        {e.approvedBy && <strong>{e.approvedBy}: </strong>}
                        {e.notes}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <StatusPill status={e.status} />
                    {e.status === 'Pending' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Button size="sm" variant="outline" onClick={() => setDeclineFor(e)} disabled={isActioning}>
                          Decline
                        </Button>
                        <Button size="sm" onClick={() => handleApprove(e)} disabled={isActioning}>
                          {isActioning ? '…' : 'Approve'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {declineFor && (
        <div
          onClick={() => setDeclineFor(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(8,32,26,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: theme.paper, color: theme.ink, borderRadius: 14, width: '100%', maxWidth: 480, padding: 28, border: `1px solid ${theme.line}` }}
          >
            <h3 style={{ fontFamily: FONTS.serif, fontSize: 22, margin: 0, fontWeight: 500 }}>Decline excuse</h3>
            <p style={{ fontSize: 13, color: theme.dim, marginTop: 6 }}>A decline note is required. The member will see this.</p>
            <div style={{ marginTop: 14, padding: 12, background: theme.cream, borderRadius: 8, fontSize: 12.5 }}>
              <strong>{declineFor.memberName}</strong> · {declineFor.type} for {declineFor.date}
              <br />
              <span style={{ color: theme.dim }}>{declineFor.reason}</span>
            </div>
            <textarea
              value={declineNote}
              onChange={e => setDeclineNote(e.target.value)}
              rows={4}
              placeholder="Reason for declining…"
              style={{ width: '100%', marginTop: 14, padding: 12, border: `1px solid ${theme.lineDark}`, borderRadius: 10, fontSize: 14, fontFamily: FONTS.sans, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button variant="outline" onClick={() => { setDeclineFor(null); setDeclineNote(''); }}>Cancel</Button>
              <Button
                variant="danger"
                disabled={!declineNote.trim() || actioning === declineFor.id}
                onClick={handleDecline}
              >
                {actioning === declineFor.id ? 'Saving…' : 'Decline & notify'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
