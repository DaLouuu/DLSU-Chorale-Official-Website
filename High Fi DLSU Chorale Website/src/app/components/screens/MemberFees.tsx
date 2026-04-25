import { useState } from 'react';
import { useTheme, useApp, useRouter } from '../../App';
import { FONTS } from '../../theme';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusPill } from '../ui/Chip';
import { Icon } from '../ui/Icon';

type FeeRecord = {
  id: string;
  date: string;
  type: string;
  reference: string;
  amount: number;
  status: 'paid' | 'unpaid';
  paidAt?: string;
};

type FeeRule = {
  id: string;
  type: string;
  amount: number;
};

declare global {
  interface Window {
    FEE_RULES: FeeRule[];
  }
}

export function MemberFees() {
  const app = useApp();
  const { theme } = useTheme();
  const { user } = useRouter();
  const fees = app.fees as FeeRecord[];
  const outstanding = fees.filter(f => f.status === 'unpaid').reduce((s, f) => s + f.amount, 0);
  const paid = fees.filter(f => f.status === 'paid').reduce((s, f) => s + f.amount, 0);
  const [payingFee, setPayingFee] = useState<FeeRecord | null>(null);

  return (
    <>
      <PageHeader eyebrow="Module 8" title="Fees & Payments" subtitle="Outstanding balances, payment history, and the current fee schedule." />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div>
          <Card variant={outstanding > 0 ? 'paper' : 'green'} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 10.5,
                    letterSpacing: 2,
                    color: outstanding > 0 ? theme.red : theme.greenDeep,
                    textTransform: 'uppercase',
                  }}
                >
                  Outstanding balance
                </div>
                <div
                  style={{
                    fontFamily: FONTS.serif,
                    fontSize: 56,
                    fontWeight: 500,
                    lineHeight: 1,
                    color: outstanding > 0 ? theme.red : theme.greenDeep,
                    marginTop: 6,
                  }}
                >
                  ₱{outstanding.toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: theme.dim, marginTop: 6 }}>Due April 30, 2026 · Pay in studio or via GCash</div>
              </div>
              {outstanding > 0 && (
                <Button
                  size="lg"
                  icon="wallet"
                  onClick={() => {
                    const firstUnpaid = fees.find(f => f.status === 'unpaid');
                    if (firstUnpaid) setPayingFee(firstUnpaid);
                  }}
                >
                  Pay now
                </Button>
              )}
            </div>
          </Card>

          <Card>
            <h3 style={{ fontFamily: FONTS.serif, fontSize: 22, margin: '0 0 14px', fontWeight: 500 }}>Itemized fees</h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {fees.map((f, i) => (
                <div
                  key={f.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '90px 1fr 120px 90px 100px',
                    gap: 14,
                    alignItems: 'center',
                    padding: '14px 0',
                    borderTop: i === 0 ? 'none' : `1px solid ${theme.line}`,
                  }}
                >
                  <div style={{ fontFamily: FONTS.mono, fontSize: 12, color: theme.dim }}>{f.date}</div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{f.type}</div>
                    <div style={{ fontSize: 11.5, color: theme.dim, marginTop: 2 }}>{f.reference}</div>
                  </div>
                  <div style={{ fontFamily: FONTS.serif, fontSize: 18, fontWeight: 500 }}>₱{f.amount}</div>
                  <StatusPill status={f.status} />
                  {f.status === 'unpaid' ? (
                    <Button size="sm" onClick={() => setPayingFee(f)}>
                      Pay
                    </Button>
                  ) : f.status === 'pending' ? (
                    <span style={{ fontSize: 11, color: theme.amber, fontFamily: FONTS.mono }}>Awaiting approval</span>
                  ) : (
                    <span style={{ fontSize: 11, color: theme.dim, fontFamily: FONTS.mono }}>Paid {f.paidAt}</span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card variant="cream">
            <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' }}>Year-to-date</div>
            <div style={{ fontFamily: FONTS.serif, fontSize: 34, marginTop: 6, fontWeight: 500 }}>₱{paid.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: theme.dim }}>settled · 2026 AY</div>
          </Card>
          <Card>
            <h3 style={{ fontFamily: FONTS.serif, fontSize: 18, margin: '0 0 12px', fontWeight: 500 }}>Fee schedule</h3>
            {window.FEE_RULES.map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${theme.line}` }}>
                <span style={{ fontSize: 13, color: theme.ink }}>{r.type}</span>
                <span style={{ fontFamily: FONTS.serif, fontSize: 16, fontWeight: 500 }}>₱{r.amount}</span>
              </div>
            ))}
            <div style={{ fontSize: 11, color: theme.dim, fontFamily: FONTS.mono, marginTop: 12 }}>EFFECTIVE JAN 1, 2026</div>
          </Card>
          <Card variant="green">
            <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.greenDeep, textTransform: 'uppercase' }}>How to pay</div>
            <ol style={{ margin: '10px 0 0 0', paddingLeft: 20, fontSize: 12.5, color: theme.greenDeep, lineHeight: 1.7 }}>
              <li>In studio — cash to Finance (Isabela Cruz)</li>
              <li>GCash — 0917-xxx-xxxx · include your name</li>
              <li>Upload receipt after transfer for auto-reconciliation</li>
            </ol>
          </Card>
        </div>
      </div>

      {payingFee && (
        <PaymentModal
          fee={payingFee}
          user={user}
          onClose={() => setPayingFee(null)}
          onSubmit={(paymentData) => {
            app.payFee(payingFee.id, paymentData);
            app.showToast(`Payment submitted for ₱${payingFee.amount}`);
            setPayingFee(null);
          }}
        />
      )}
    </>
  );
}

function PaymentModal({
  fee,
  user,
  onClose,
  onSubmit,
}: {
  fee: FeeRecord;
  user: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  const { theme } = useTheme();
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [senderAccount, setSenderAccount] = useState('');
  const [senderAccountName, setSenderAccountName] = useState(user?.name || '');
  const [receiverAccount, setReceiverAccount] = useState('0917-123-4567 (GCash - Isabela Cruz)');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofFileName, setProofFileName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      paymentDate,
      senderAccount,
      senderAccountName,
      receiverAccount,
      referenceNumber,
      proofFileName,
      amount: fee.amount,
    });
  };

  const inputStyle = {
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

  const labelStyle = {
    fontSize: 11.5,
    fontFamily: FONTS.mono,
    letterSpacing: 1,
    color: theme.dim,
    textTransform: 'uppercase' as const,
    display: 'block',
    marginBottom: 5,
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
        zIndex: 100,
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: theme.paper,
          color: theme.ink,
          borderRadius: 14,
          width: 680,
          maxHeight: '90vh',
          overflowY: 'auto',
          border: `1px solid ${theme.line}`,
        }}
      >
        {/* Header */}
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${theme.line}`, background: theme.cream }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' }}>
            Submit Payment
          </div>
          <h3 style={{ fontFamily: FONTS.serif, fontSize: 24, margin: '6px 0 0', fontWeight: 500 }}>Pay Fee</h3>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12 }}>
            <div style={{ fontSize: 13, color: theme.dim }}>{fee.type}</div>
            <span style={{ color: theme.dim }}>·</span>
            <div style={{ fontFamily: FONTS.serif, fontSize: 20, fontWeight: 500, color: theme.red }}>₱{fee.amount}</div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Payment Date *</label>
              <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Amount</label>
              <input type="text" value={`₱${fee.amount}`} disabled style={{ ...inputStyle, opacity: 0.6 }} />
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>Your Account Name *</label>
            <input
              type="text"
              value={senderAccountName}
              onChange={(e) => setSenderAccountName(e.target.value)}
              placeholder="Full name as shown in your account"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>Your Account Number / Mobile *</label>
            <input
              type="text"
              value={senderAccount}
              onChange={(e) => setSenderAccount(e.target.value)}
              placeholder="e.g., 0917-123-4567 or account number"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>Receiver Account *</label>
            <input
              type="text"
              value={receiverAccount}
              onChange={(e) => setReceiverAccount(e.target.value)}
              placeholder="Finance officer account details"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>Reference / Transaction Number *</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g., GCash ref #, bank transaction ID"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>Proof of Payment (Screenshot/Receipt) *</label>
            <div
              style={{
                border: `2px dashed ${theme.line}`,
                borderRadius: 10,
                padding: 20,
                textAlign: 'center',
                background: theme.cream,
                position: 'relative',
              }}
            >
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setProofFile(file);
                    setProofFileName(file.name);
                  }
                }}
                required
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  cursor: 'pointer',
                  width: '100%',
                }}
              />
              <Icon name="download" size={32} stroke={theme.dim} />
              <div style={{ marginTop: 10, fontSize: 13, color: theme.ink }}>
                {proofFileName ? (
                  <span style={{ fontWeight: 500, color: theme.green }}>{proofFileName}</span>
                ) : (
                  'Click to upload or drag and drop'
                )}
              </div>
              <div style={{ fontSize: 11, color: theme.dim, marginTop: 4 }}>PNG, JPG, or PDF up to 10MB</div>
            </div>
          </div>

          <div
            style={{
              marginTop: 20,
              padding: 14,
              background: theme.cream,
              border: `1px solid ${theme.line}`,
              borderRadius: 10,
              fontSize: 12.5,
              color: theme.dim,
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <Icon name="alert" size={14} stroke={theme.amber} />
            <div>
              <strong style={{ color: theme.ink }}>Note:</strong> Your payment will be verified by the Finance team within 24-48 hours. You'll
              receive a confirmation email once approved.
            </div>
          </div>

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" icon="check">
              Submit Payment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
