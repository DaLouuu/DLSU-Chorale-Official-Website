import { useRouter, useTheme } from '../../App';
import { FONTS } from '../../theme';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { Icon } from '../ui/Icon';
import { CURRENT_MEMBER } from '../../data';

export function PendingVerification() {
  const { go } = useRouter();
  const { theme } = useTheme();

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.cream,
        fontFamily: FONTS.sans,
      }}
    >
      <Card pad={48} style={{ width: 560, textAlign: 'center' }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: theme.greenSoft,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.green,
          }}
        >
          <Icon name="clock" size={28} />
        </div>
        <h2 style={{ fontFamily: FONTS.serif, fontSize: 32, margin: '22px 0 8px', fontWeight: 500 }}>Awaiting verification</h2>
        <p style={{ color: theme.dim, fontSize: 14, lineHeight: 1.55, margin: 0 }}>
          Your registration has been submitted. Your Section Head will confirm your membership within 2 working days. You'll get an email when your account is
          live.
        </p>
        <div
          style={{
            marginTop: 28,
            padding: 16,
            background: theme.cream,
            border: `1px solid ${theme.line}`,
            borderRadius: 10,
            textAlign: 'left',
            fontSize: 13,
          }}
        >
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 10.5,
              letterSpacing: 1.2,
              color: theme.dim,
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Status
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Google sign-in</span> <Chip tone="green">Complete</Chip>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span>Section Head review</span> <Chip tone="amber">Pending</Chip>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span>Welcome email</span> <Chip tone="neutral">Queued</Chip>
          </div>
        </div>
        <div style={{ marginTop: 24, display: 'flex', gap: 10, justifyContent: 'center' }}>
          <Button variant="outline" onClick={() => go('landing')}>
            Back to home
          </Button>
          <Button onClick={() => go('login', { role: 'member', user: CURRENT_MEMBER })}>Demo: Sign in anyway</Button>
        </div>
      </Card>
    </div>
  );
}
