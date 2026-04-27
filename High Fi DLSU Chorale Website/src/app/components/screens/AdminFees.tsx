import { useState, useEffect } from 'react';
import { useTheme, useApp } from '../../App';
import { FONTS } from '../../theme';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { SectionTag } from '../ui/SectionTag';
import { Chip } from '../ui/Chip';
import { Icon } from '../ui/Icon';

type FeeSummary = {
  memberId: string;
  memberName: string;
  section: string;
  outstanding: number;
  paid: number;
  lastPayment?: string;
};

type FeeRule = {
  id: string;
  type: string;
  amount: number;
  effective: string;
};

declare global {
  interface Window {
    FEE_SUMMARIES: FeeSummary[];
    FEE_RULES: FeeRule[];
    MEMBERS: any[];
  }
}

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
              {payment.paymentData?.proofDataUrl ? (
                <div style={{ borderRadius: 8, border: `1px solid ${theme.line}`, overflow: 'hidden' }}>
                  <img
                    src={payment.paymentData.proofDataUrl}
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
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setVw(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  const isMobile = vw < 768;
  const [tab, setTab] = useState('members');
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);

  const pendingPayments = (app.fees as any[]).filter((f: any) => f.status === 'pending');

  return (
    <>
      <PageHeader
        eyebrow="Module 8"
        title="Fee Management"
        subtitle="Track balances, approve payments, edit the fee schedule."
        actions={
          pendingPayments.length > 0 && (
            <Button variant="outline" icon="clock" onClick={() => setTab('pending')}>
              {pendingPayments.length} Pending {pendingPayments.length === 1 ? 'Payment' : 'Payments'}
            </Button>
          )
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16, marginBottom: 22 }}>
        <StatCard
          label="Total outstanding"
          value={`₱${window.FEE_SUMMARIES.reduce((s, f) => s + f.outstanding, 0).toLocaleString()}`}
          trend={`${window.FEE_SUMMARIES.filter(f => f.outstanding > 0).length} members with balance`}
          tone="red"
        />
        <StatCard label="Collected YTD" value={`₱${window.FEE_SUMMARIES.reduce((s, f) => s + f.paid, 0).toLocaleString()}`} trend="2026 AY" tone="green" />
        <StatCard label="Top debtor" value="₱750" trend="Lorenzo Aquino (Bass)" tone="amber" />
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
              color: tab === t.k ? theme.greenDark : theme.dim,
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
                      <Button
                        size="sm"
                        onClick={() => {
                          app.approvePayment(p.id);
                          app.showToast(`Approved payment from ${p.memberName}`);
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          app.rejectPayment(p.id, 'Invalid receipt');
                          app.showToast(`Rejected payment from ${p.memberName}`, 'error');
                        }}
                      >
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
              {window.FEE_SUMMARIES.map(f => {
                const m = window.MEMBERS.find(x => x.id === f.memberId);
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {window.FEE_RULES.map((r, i) => (
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
                  <Button size="sm" variant="outline">
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'payments' && (
        <Card>
          <div style={{ color: theme.dim, textAlign: 'center', padding: 40 }}>
            Recent payments ledger appears here — uploads from Finance, with auto-matched GCash receipts.
          </div>
        </Card>
      )}
      {selectedPayment && (
        <PaymentDetailsModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onApprove={() => {
            app.approvePayment(selectedPayment.id);
            app.showToast(`Approved payment from ${selectedPayment.memberName}`);
            setSelectedPayment(null);
          }}
          onReject={() => {
            app.rejectPayment(selectedPayment.id, 'Invalid receipt');
            app.showToast(`Rejected payment from ${selectedPayment.memberName}`, 'error');
            setSelectedPayment(null);
          }}
        />
      )}
    </>
  );
}
