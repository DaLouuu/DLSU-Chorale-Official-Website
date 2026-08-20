import { useState, useEffect, useRef, useMemo } from 'react';
import { useTheme, useApp } from '../../App';
import { supabase } from '../../supabase';
import { MEMBERS, computeFeeSummaries } from '../../data';
import { FONTS } from '../../theme';
import { notifyPaymentDecision } from '../../utils/email';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { SectionTag } from '../ui/SectionTag';
import { Chip } from '../ui/Chip';
import { Icon } from '../ui/Icon';

function PaymentDetailsModal({ payment, onClose, onApprove, onReject }: { payment: any; onClose: () => void; onApprove: () => void; onReject: () => void }) {
  const { theme } = useTheme();
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setVw(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  const isMobile = vw < 768;

  if (!payment) return null;

  const fallbackProofUrl = typeof payment.paymentData?.proofFileName === 'string' &&
    /^(https?:\/\/|data:image\/|\/)/i.test(payment.paymentData.proofFileName)
    ? payment.paymentData.proofFileName
    : null;
  const proofImage = payment.paymentData?.proofDataUrl || fallbackProofUrl;

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
          width: isMobile ? '100%' : 600,
          maxHeight: '85vh',
          overflowY: 'auto',
          border: `1px solid ${theme.line}`,
        }}
      >
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${theme.line}`, background: theme.cream }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' }}>
            Payment Verification
          </div>
          <h3 style={{ fontFamily: FONTS.serif, fontSize: 24, margin: '6px 0 0', fontWeight: 500 }}>Payment Details</h3>
          <p style={{ fontSize: 13, color: theme.dim, margin: '6px 0 0' }}>
            {payment.memberName} · {payment.type}
          </p>
        </div>

        <div style={{ padding: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase' }}>Amount</div>
              <div style={{ fontFamily: FONTS.serif, fontSize: 28, fontWeight: 500, marginTop: 4 }}>₱{payment.amount}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase' }}>Payment Date</div>
              <div style={{ fontSize: 16, marginTop: 4 }}>{payment.paymentData?.paymentDate}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', marginBottom: 4 }}>Sender Account</div>
              <div style={{ fontSize: 14 }}>{payment.paymentData?.senderAccount}</div>
              <div style={{ fontSize: 13, color: theme.dim }}>{payment.paymentData?.senderAccountName}</div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', marginBottom: 4 }}>Receiver Account</div>
              <div style={{ fontSize: 14 }}>{payment.paymentData?.receiverAccount}</div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', marginBottom: 4 }}>Reference Number</div>
              <div style={{ fontSize: 14, fontFamily: FONTS.mono }}>{payment.paymentData?.referenceNumber || '—'}</div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', marginBottom: 4 }}>Proof of Payment</div>
              {proofImage ? (
                <div style={{ borderRadius: 8, border: `1px solid ${theme.line}`, overflow: 'hidden' }}>
                  <img
                    src={proofImage}
                    alt="Proof of payment"
                    style={{ width: '100%', maxHeight: 320, objectFit: 'contain', display: 'block', background: theme.cream }}
                  />
                  <div style={{ padding: '8px 12px', fontSize: 12, color: theme.dim, borderTop: `1px solid ${theme.line}`, fontFamily: FONTS.mono }}>
                    {payment.paymentData.proofFileName}
                  </div>
                </div>
              ) : (
                <div style={{ padding: 12, background: theme.cream, borderRadius: 8, border: `1px solid ${theme.line}`, fontSize: 13, color: theme.dim }}>
                  {payment.paymentData?.proofFileName || 'No file uploaded'}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 28px', borderTop: `1px solid ${theme.line}`, display: 'flex', justifyContent: 'space-between', gap: 10, background: theme.cream }}>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="outline" onClick={onReject}>
              Reject
            </Button>
            <Button onClick={onApprove}>Approve</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChargeFeeModal({ onClose, onCharge }: { onClose: () => void; onCharge: (payload: { memberIds: number[]; type: string; amount: number; date: string; reference: string }) => Promise<void> }) {
  const { theme, mode } = useTheme();
  const app = useApp();
  const feeRules = app.feeRules;
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setVw(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  const isMobile = vw < 640;

  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [ruleId, setRuleId] = useState<string>(feeRules[0]?.id ?? 'custom');
  const [customType, setCustomType] = useState('');
  const [amount, setAmount] = useState(String(feeRules[0]?.amount ?? ''));
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isCustom = ruleId === 'custom';
  const feeType = isCustom ? customType : (feeRules.find((r: any) => r.id === ruleId)?.type ?? '');

  const filteredMembers = MEMBERS.filter((m: any) =>
    (sectionFilter === 'All' || m.section === sectionFilter) &&
    (search.trim() === '' || m.name?.toLowerCase().includes(search.trim().toLowerCase()) || String(m.id).includes(search.trim()))
  );

  const toggleMember = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: `1px solid ${theme.lineDark}`,
    borderRadius: 8, fontSize: 13.5, fontFamily: FONTS.sans, background: theme.paper,
    color: theme.ink, outline: 'none', boxSizing: 'border-box' as const, colorScheme: mode,
  };

  const labelStyle = {
    fontSize: 11, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim,
    textTransform: 'uppercase' as const, display: 'block', marginBottom: 5,
  };

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (selectedIds.size === 0) { setError('Select at least one member.'); return; }
    if (!feeType.trim()) { setError('Enter a fee type.'); return; }
    if (!amt || amt <= 0) { setError('Enter a valid amount.'); return; }
    if (!date) { setError('Select a date.'); return; }
    setError('');
    setSubmitting(true);
    await onCharge({
      memberIds: [...selectedIds],
      type: feeType.trim(),
      amount: amt,
      date,
      reference: reference.trim() || feeType.trim(),
    });
    setSubmitting(false);
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(8,32,26,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: theme.paper, color: theme.ink, borderRadius: 14, width: isMobile ? '100%' : 640, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${theme.line}` }}
      >
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${theme.line}`, background: theme.cream }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' }}>Charge Fee</div>
          <h3 style={{ fontFamily: FONTS.serif, fontSize: 24, margin: '6px 0 0', fontWeight: 500 }}>Charge members</h3>
        </div>

        <div style={{ padding: isMobile ? 20 : 28 }}>
          <label style={labelStyle}>Fee type</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: isCustom ? 10 : 16 }}>
            {feeRules.map((r: any) => (
              <button
                key={r.id}
                onClick={() => { setRuleId(r.id); setAmount(String(r.amount)); }}
                style={{
                  padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12.5, fontFamily: FONTS.sans,
                  border: `1px solid ${ruleId === r.id ? theme.green : theme.lineDark}`,
                  background: ruleId === r.id ? theme.green : theme.paper,
                  color: ruleId === r.id ? '#fff' : theme.ink,
                }}
              >
                {r.type} · ₱{r.amount}
              </button>
            ))}
            <button
              onClick={() => setRuleId('custom')}
              style={{
                padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12.5, fontFamily: FONTS.sans,
                border: `1px solid ${isCustom ? theme.green : theme.lineDark}`,
                background: isCustom ? theme.green : theme.paper,
                color: isCustom ? '#fff' : theme.ink,
              }}
            >
              Custom
            </button>
          </div>
          {isCustom && (
            <input
              value={customType}
              onChange={e => setCustomType(e.target.value)}
              placeholder="e.g. Uniform replacement, Damaged music binder"
              style={{ ...inputStyle, marginBottom: 16 }}
            />
          )}

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Amount (₱)</label>
              <input type="number" min={1} value={amount} onChange={e => setAmount(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <label style={labelStyle}>Reference / reason (optional)</label>
          <input
            value={reference}
            onChange={e => setReference(e.target.value)}
            placeholder={feeType || 'e.g. Rehearsal late arrival (18:24)'}
            style={{ ...inputStyle, marginBottom: 16 }}
          />

          <label style={labelStyle}>Members ({selectedIds.size} selected)</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or ID…"
              style={{ ...inputStyle, flex: 1 }}
            />
            <select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)} style={{ ...inputStyle, width: 130 }}>
              {['All', 'Soprano', 'Alto', 'Tenor', 'Bass'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ border: `1px solid ${theme.line}`, borderRadius: 8, maxHeight: 220, overflowY: 'auto' }}>
            {filteredMembers.length === 0 ? (
              <div style={{ padding: 16, fontSize: 12.5, color: theme.dim, textAlign: 'center' }}>No members match.</div>
            ) : filteredMembers.map((m: any) => (
              <label
                key={m.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', cursor: 'pointer',
                  borderTop: `1px solid ${theme.line}`, background: selectedIds.has(m.id) ? theme.greenSoft : 'transparent',
                }}
              >
                <input type="checkbox" checked={selectedIds.has(m.id)} onChange={() => toggleMember(m.id)} />
                <Avatar member={m} size={24} />
                <span style={{ fontSize: 13, flex: 1 }}>{m.name}</span>
                <SectionTag section={m.section} />
              </label>
            ))}
          </div>

          {error && <div style={{ marginTop: 12, fontSize: 12, color: theme.red }}>{error}</div>}
        </div>

        <div style={{ padding: '16px 28px', borderTop: `1px solid ${theme.line}`, display: 'flex', justifyContent: 'flex-end', gap: 10, background: theme.cream }}>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} icon="check" disabled={submitting}>
            {submitting ? 'Charging…' : `Charge ${selectedIds.size || ''} member${selectedIds.size === 1 ? '' : 's'}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

function FeeRuleModal({ rule, onClose, onSave }: { rule: any | null; onClose: () => void; onSave: (data: { type: string; amount: number; effective: string }) => Promise<void> }) {
  const { theme, mode } = useTheme();
  const isMobile = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)[0] < 640;
  const [type, setType] = useState(rule?.type ?? '');
  const [amount, setAmount] = useState(String(rule?.amount ?? ''));
  const [effective, setEffective] = useState(rule?.effective ?? new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const inputStyle = {
    width: '100%', padding: '11px 14px', border: `1px solid ${theme.lineDark}`,
    borderRadius: 10, fontSize: 14, fontFamily: FONTS.sans, background: theme.paper,
    color: theme.ink, outline: 'none', boxSizing: 'border-box' as const, colorScheme: mode,
  };
  const labelStyle = {
    fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim,
    textTransform: 'uppercase' as const, display: 'block', marginBottom: 5,
  };

  const handleSave = async () => {
    const amt = parseFloat(amount);
    if (!type.trim()) { setError('Enter a fee type.'); return; }
    if (!amt || amt <= 0) { setError('Enter a valid amount.'); return; }
    if (!effective) { setError('Select an effective date.'); return; }
    setError('');
    setSaving(true);
    await onSave({ type: type.trim(), amount: amt, effective });
    setSaving(false);
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(8,32,26,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: theme.paper, color: theme.ink, borderRadius: 14, width: isMobile ? '100%' : 480, maxWidth: '100%', border: `1px solid ${theme.line}` }}>
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${theme.line}`, background: theme.cream }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' }}>Fee Schedule</div>
          <h3 style={{ fontFamily: FONTS.serif, fontSize: 24, margin: '6px 0 0', fontWeight: 500 }}>{rule ? 'Edit fee rule' : 'Add fee rule'}</h3>
        </div>
        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Type</label>
            <input value={type} onChange={e => setType(e.target.value)} placeholder="e.g. Late (Rehearsal)" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Amount (₱)</label>
              <input type="number" min={1} value={amount} onChange={e => setAmount(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Effective date</label>
              <input type="date" value={effective} onChange={e => setEffective(e.target.value)} style={inputStyle} />
            </div>
          </div>
          {error && <div style={{ fontSize: 12, color: theme.red }}>{error}</div>}
        </div>
        <div style={{ padding: '16px 28px', borderTop: `1px solid ${theme.line}`, display: 'flex', justifyContent: 'flex-end', gap: 10, background: theme.cream }}>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} icon="check" disabled={saving}>{saving ? 'Saving…' : rule ? 'Save changes' : 'Add rule'}</Button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, trend, tone = 'neutral' }: { label: string; value: string | number; trend: string; tone?: string }) {
  const { theme } = useTheme();
  const colors: Record<string, string> = { green: theme.green, amber: theme.amber, red: theme.red, blue: theme.blue, neutral: theme.ink };

  return (
    <Card>
      <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 1.5, color: theme.dim, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: FONTS.serif, fontSize: 38, fontWeight: 500, margin: '6px 0 4px', color: colors[tone], lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11.5, color: theme.dim }}>{trend}</div>
    </Card>
  );
}

const thStyle = { padding: '14px 16px', textAlign: 'left' as const, fontWeight: 500 };
const tdStyle = { padding: '12px 16px', verticalAlign: 'middle' as const };

export function AdminFees() {
  const app = useApp();
  const { theme } = useTheme();
  // Derived live from app.fees (not the static data.ts snapshot) so
  // approving a payment or charging a fee updates these numbers
  // immediately instead of only after a page reload.
  const FEE_SUMMARIES = useMemo(() => computeFeeSummaries(app.fees), [app.fees]);
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setVw(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  const isMobile = vw < 768;
  const [tab, setTab] = useState('members');
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [chargingFee, setChargingFee] = useState(false);
  const [editingRule, setEditingRule] = useState<any | null>(null);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showRefreshPrompt, setShowRefreshPrompt] = useState(false);
  const selfChargedIds = useRef<Set<number>>(new Set());

  // Fees can now be auto-charged by a database trigger the moment attendance
  // is logged (late/unexcused-absence — see
  // 20260824_auto_charge_attendance_fees.sql), which this open tab has no
  // other way of knowing about. Realtime tells us a row landed; we just
  // prompt to refresh rather than trying to merge it into local state live.
  useEffect(() => {
    const channel = supabase
      .channel('fee_records_admin_watch')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fee_records' }, (payload: any) => {
        const newId = payload.new?.id;
        if (newId != null && selfChargedIds.current.has(newId)) {
          selfChargedIds.current.delete(newId);
          return;
        }
        setShowRefreshPrompt(true);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const pendingPayments = (app.fees as any[]).filter((f: any) => f.status === 'pending');
  const paidHistory = (app.fees as any[])
    .filter((f: any) => f.status === 'paid')
    .sort((a: any, b: any) => (b.paidAt ?? '').localeCompare(a.paidAt ?? ''));

  const topDebtor = FEE_SUMMARIES.reduce((top: any, f: any) => (f.outstanding > (top?.outstanding ?? 0) ? f : top), null);

  const handleApprovePayment = async (p: any) => {
    const paidAt = p.paymentData?.paymentDate || new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from('fee_records').update({ status: 'paid', paid_at: paidAt }).eq('id', p.id);
    if (error) { app.showToast(`Could not approve payment: ${error.message}`, 'error'); return; }
    app.approvePayment(p.id);
    app.showToast(`Approved payment from ${p.memberName}`);
    const email = MEMBERS.find((m: any) => m.id === p.memberId)?.email;
    if (email) notifyPaymentDecision({ email, name: p.memberName, type: p.type, amount: p.amount, status: 'Approved' });
  };

  const handleRejectPayment = async (p: any, reason: string) => {
    const { error } = await supabase.from('fee_records').update({ status: 'unpaid', rejection_reason: reason }).eq('id', p.id);
    if (error) { app.showToast(`Could not reject payment: ${error.message}`, 'error'); return; }
    app.rejectPayment(p.id, reason);
    app.showToast(`Rejected payment from ${p.memberName}`, 'error');
    const email = MEMBERS.find((m: any) => m.id === p.memberId)?.email;
    if (email) notifyPaymentDecision({ email, name: p.memberName, type: p.type, amount: p.amount, status: 'Rejected', reason });
  };

  const handleChargeFee = async (payload: { memberIds: number[]; type: string; amount: number; date: string; reference: string }) => {
    const rows = payload.memberIds
      .map(id => MEMBERS.find((m: any) => m.id === id))
      .filter((m: any) => !!m?._uuid)
      .map((m: any) => ({
        account_id_fk: m._uuid,
        fee_date: payload.date,
        type: payload.type,
        amount: payload.amount,
        reference: payload.reference,
        status: 'unpaid',
      }));

    if (rows.length === 0) {
      app.showToast("Selected members aren't linked to profiles — contact an admin.", 'error');
      return;
    }

    const { data: inserted, error } = await supabase
      .from('fee_records')
      .insert(rows)
      .select('id, account_id_fk, fee_date, type, amount, status, reference');

    if (error) {
      app.showToast(`Could not charge fee: ${error.message}`, 'error');
      return;
    }

    (inserted ?? []).forEach((row: any) => {
      selfChargedIds.current.add(row.id);
      const m = MEMBERS.find((mm: any) => mm._uuid === row.account_id_fk);
      app.addFee({
        id: row.id,
        date: row.fee_date,
        type: row.type,
        amount: Number(row.amount),
        status: row.status,
        reference: row.reference,
        memberId: m?.id ?? 0,
        memberName: m?.name ?? '',
        section: m?.section ?? '',
      });
    });

    app.showToast(`Charged ${rows.length} member${rows.length === 1 ? '' : 's'} ₱${payload.amount} — ${payload.type}`);
    setChargingFee(false);
  };

  const handleSaveFeeRule = async (data: { type: string; amount: number; effective: string }) => {
    if (editingRule) {
      const { error } = await supabase
        .from('fee_rules')
        .update({ type: data.type, amount: data.amount, effective_date: data.effective })
        .eq('id', editingRule.id);
      if (error) {
        app.showToast(`Could not save fee rule: ${error.message}`, 'error');
        return;
      }
      app.setFeeRules(app.feeRules.map((r: any) => (r.id === editingRule.id ? { ...r, ...data } : r)));
      app.showToast('Fee rule updated');
    } else {
      const { data: inserted, error } = await supabase
        .from('fee_rules')
        .insert({ type: data.type, amount: data.amount, effective_date: data.effective })
        .select('id')
        .single();
      if (error) {
        app.showToast(`Could not add fee rule: ${error.message}`, 'error');
        return;
      }
      app.setFeeRules([...app.feeRules, { id: String(inserted.id), ...data }]);
      app.showToast('Fee rule added');
    }
    setShowRuleModal(false);
    setEditingRule(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Fee Management"
        subtitle="Track balances, approve payments, edit the fee schedule."
        actions={
          <>
            {pendingPayments.length > 0 && (
              <Button variant="outline" icon="clock" onClick={() => setTab('pending')}>
                {pendingPayments.length} Pending {pendingPayments.length === 1 ? 'Payment' : 'Payments'}
              </Button>
            )}
            <Button icon="plus" onClick={() => setChargingFee(true)}>
              Charge Fee
            </Button>
          </>
        }
      />

      {showRefreshPrompt && (
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            padding: '12px 18px', borderRadius: 10, marginBottom: 18,
            background: theme.amberSoft, border: `1px solid ${theme.amber}`, color: theme.ink, fontSize: 13,
          }}
        >
          <span>A new fee was just charged — refresh to see the latest balances.</span>
          <Button size="sm" variant="outline" onClick={() => window.location.reload()}>Refresh</Button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16, marginBottom: 22 }}>
        <StatCard
          label="Total outstanding"
          value={`₱${FEE_SUMMARIES.reduce((s, f) => s + f.outstanding, 0).toLocaleString()}`}
          trend={`${FEE_SUMMARIES.filter(f => f.outstanding > 0).length} members with balance`}
          tone="red"
        />
        <StatCard label="Collected YTD" value={`₱${FEE_SUMMARIES.reduce((s, f) => s + f.paid, 0).toLocaleString()}`} trend="2026 AY" tone="green" />
        <StatCard
          label="Top debtor"
          value={topDebtor ? `₱${topDebtor.outstanding.toLocaleString()}` : '₱0'}
          trend={topDebtor ? `${topDebtor.memberName} (${topDebtor.section})` : 'No outstanding balances'}
          tone="amber"
        />
      </div>

      <div style={{ display: 'flex', gap: 0, marginBottom: 18, borderBottom: `1px solid ${theme.line}`, overflowX: 'auto' }}>
        {[
          { k: 'pending', l: `Pending (${pendingPayments.length})` },
          { k: 'members', l: 'By member' },
          { k: 'rules', l: 'Fee rules' },
          { k: 'payments', l: 'Payment history' },
        ].map(t => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            style={{
              padding: '12px 22px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: FONTS.sans,
              fontSize: 13.5,
              fontWeight: tab === t.k ? 500 : 400,
              color: tab === t.k ? theme.green : theme.dim,
              borderBottom: `2px solid ${tab === t.k ? theme.green : 'transparent'}`,
              marginBottom: -1,
            }}
          >
            {t.l}
          </button>
        ))}
      </div>

      {tab === 'pending' && (
        <Card pad={0}>
          {pendingPayments.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: theme.dim }}>
              <Icon name="check" size={48} stroke={theme.green} />
              <div style={{ marginTop: 16, fontSize: 16, fontWeight: 500 }}>All caught up!</div>
              <div style={{ marginTop: 6, fontSize: 13 }}>No pending payments to review.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 760 }}>
              <thead>
                <tr
                  style={{
                    background: theme.cream,
                    fontFamily: FONTS.mono,
                    fontSize: 10.5,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    color: theme.dim,
                  }}
                >
                  <th style={thStyle}>Member</th>
                  <th style={thStyle}>Fee</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Submitted</th>
                  <th style={thStyle}>Proof</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingPayments.map((p: any) => (
                  <tr key={p.id} style={{ borderTop: `1px solid ${theme.line}` }}>
                    <td style={{ ...tdStyle, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar member={{ name: p.memberName, avatar: p.memberName?.split(' ').map((n: string) => n[0]).join('') }} size={28} />
                      <div>
                        <div style={{ fontWeight: 500 }}>{p.memberName}</div>
                        <div style={{ fontSize: 11, color: theme.dim, fontFamily: FONTS.mono }}>#{p.memberId}</div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: 13 }}>{p.type}</div>
                      <div style={{ fontSize: 11.5, color: theme.dim }}>{p.reference}</div>
                    </td>
                    <td style={{ ...tdStyle, fontFamily: FONTS.serif, fontSize: 18, fontWeight: 500 }}>₱{p.amount}</td>
                    <td style={{ ...tdStyle, fontSize: 12, color: theme.dim, fontFamily: FONTS.mono }}>{p.submittedAt}</td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => setSelectedPayment(p)}
                        style={{
                          fontSize: 12,
                          color: theme.green,
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: 0,
                        }}
                      >
                        View details
                      </button>
                    </td>
                    <td style={{ ...tdStyle, display: 'flex', gap: 6 }}>
                      <Button size="sm" onClick={() => handleApprovePayment(p)}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleRejectPayment(p, 'Invalid receipt')}>
                        Reject
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </Card>
      )}

      {tab === 'members' && (
        <Card pad={0}>
          <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 760 }}>
            <thead>
              <tr
                style={{
                  background: theme.cream,
                  fontFamily: FONTS.mono,
                  fontSize: 10.5,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: theme.dim,
                }}
              >
                <th style={thStyle}>Member</th>
                <th style={thStyle}>Section</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Outstanding</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Paid YTD</th>
                <th style={thStyle}>Last payment</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {FEE_SUMMARIES.map(f => {
                const m = MEMBERS.find(x => x.id === f.memberId);
                return (
                  <tr key={f.memberId} style={{ borderTop: `1px solid ${theme.line}` }}>
                    <td style={{ ...tdStyle, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar member={m} size={26} /> {f.memberName}
                    </td>
                    <td style={tdStyle}>
                      <SectionTag section={f.section} />
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        textAlign: 'right',
                        fontFamily: FONTS.serif,
                        fontSize: 15,
                        fontWeight: 500,
                        color: f.outstanding > 0 ? theme.red : theme.dim,
                      }}
                    >
                      ₱{f.outstanding.toLocaleString()}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: FONTS.mono, color: theme.dim }}>₱{f.paid.toLocaleString()}</td>
                    <td style={{ ...tdStyle, color: theme.dim, fontSize: 12 }}>{f.lastPayment || '—'}</td>
                    <td style={tdStyle}>
                      {f.outstanding > 0 ? (
                        <Chip tone="amber">Outstanding</Chip>
                      ) : (
                        <Chip tone="green">Paid up</Chip>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </Card>
      )}

      {tab === 'rules' && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <Button size="sm" icon="plus" onClick={() => { setEditingRule(null); setShowRuleModal(true); }}>
              Add rule
            </Button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {app.feeRules.map((r: any, i: number) => (
              <div
                key={r.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 140px 140px 100px',
                  gap: 14,
                  padding: '16px 0',
                  alignItems: 'center',
                  borderTop: i === 0 ? 'none' : `1px solid ${theme.line}`,
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{r.type}</div>
                  <div style={{ fontSize: 11.5, color: theme.dim, marginTop: 2, fontFamily: FONTS.mono }}>EFFECTIVE {r.effective}</div>
                </div>
                <div style={{ fontFamily: FONTS.serif, fontSize: 22, fontWeight: 500 }}>₱{r.amount}</div>
                <Chip tone="green">Active</Chip>
                <div style={{ textAlign: 'right' }}>
                  <Button size="sm" variant="outline" onClick={() => { setEditingRule(r); setShowRuleModal(true); }}>
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'payments' && (
        <Card pad={0}>
          {paidHistory.length === 0 ? (
            <div style={{ color: theme.dim, textAlign: 'center', padding: 40 }}>
              No payments have been recorded yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 700 }}>
                <thead>
                  <tr style={{ background: theme.cream, fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase', color: theme.dim }}>
                    <th style={thStyle}>Member</th>
                    <th style={thStyle}>Fee</th>
                    <th style={thStyle}>Amount</th>
                    <th style={thStyle}>Paid</th>
                    <th style={thStyle}>Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {paidHistory.map((p: any) => (
                    <tr key={p.id} style={{ borderTop: `1px solid ${theme.line}` }}>
                      <td style={{ ...tdStyle, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar member={{ name: p.memberName, avatar: p.memberName?.split(' ').map((n: string) => n[0]).join('') }} size={28} />
                        <div>
                          <div style={{ fontWeight: 500 }}>{p.memberName}</div>
                          <div style={{ fontSize: 11, color: theme.dim, fontFamily: FONTS.mono }}>#{p.memberId}</div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: 13 }}>{p.type}</div>
                        <div style={{ fontSize: 11.5, color: theme.dim }}>{p.reference}</div>
                      </td>
                      <td style={{ ...tdStyle, fontFamily: FONTS.serif, fontSize: 18, fontWeight: 500 }}>₱{p.amount}</td>
                      <td style={{ ...tdStyle, fontSize: 12, color: theme.dim, fontFamily: FONTS.mono }}>{p.paidAt ?? '—'}</td>
                      <td style={{ ...tdStyle, fontSize: 12, color: theme.dim, fontFamily: FONTS.mono }}>{p.paymentData?.referenceNumber ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
      {selectedPayment && (
        <PaymentDetailsModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onApprove={() => {
            handleApprovePayment(selectedPayment);
            setSelectedPayment(null);
          }}
          onReject={() => {
            handleRejectPayment(selectedPayment, 'Invalid receipt');
            setSelectedPayment(null);
          }}
        />
      )}
      {chargingFee && (
        <ChargeFeeModal
          onClose={() => setChargingFee(false)}
          onCharge={handleChargeFee}
        />
      )}
      {showRuleModal && (
        <FeeRuleModal
          rule={editingRule}
          onClose={() => { setShowRuleModal(false); setEditingRule(null); }}
          onSave={handleSaveFeeRule}
        />
      )}
    </>
  );
}
