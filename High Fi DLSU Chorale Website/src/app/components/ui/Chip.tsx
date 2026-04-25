import { ReactNode } from 'react';
import { useTheme } from '../../App';
import { FONTS } from '../../theme';
import { Icon } from './Icon';

type ChipProps = {
  children: ReactNode;
  tone?: 'neutral' | 'green' | 'amber' | 'red' | 'blue' | 'dark';
  icon?: string;
};

export function Chip({ children, tone = 'neutral', icon }: ChipProps) {
  const { theme } = useTheme();

  const tones = {
    neutral: { bg: '#F1F2EE', fg: theme.ink },
    green: { bg: theme.greenSoft, fg: theme.greenDeep },
    amber: { bg: theme.amberSoft, fg: theme.amber },
    red: { bg: theme.redSoft, fg: theme.red },
    blue: { bg: theme.blueSoft, fg: theme.blue },
    dark: { bg: theme.greenDark, fg: '#fff' },
  };

  const t = tones[tone];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: t.bg,
        color: t.fg,
        borderRadius: 999,
        padding: '3px 10px',
        fontSize: 11,
        fontWeight: 500,
        fontFamily: FONTS.sans,
        letterSpacing: 0.2,
        textTransform: 'uppercase',
      }}
    >
      {icon && <Icon name={icon as any} size={11} />}
      {children}
    </span>
  );
}

type StatusPillProps = {
  status: string;
};

export function StatusPill({ status }: StatusPillProps) {
  const map: Record<string, { tone: 'green' | 'amber' | 'red' | 'blue' | 'neutral'; label: string }> = {
    present: { tone: 'green', label: 'Present' },
    late: { tone: 'amber', label: 'Late' },
    absent: { tone: 'red', label: 'Absent' },
    excused: { tone: 'blue', label: 'Excused' },
    Pending: { tone: 'amber', label: 'Pending' },
    Approved: { tone: 'green', label: 'Approved' },
    Declined: { tone: 'red', label: 'Declined' },
    paid: { tone: 'green', label: 'Paid' },
    unpaid: { tone: 'red', label: 'Unpaid' },
    pending: { tone: 'amber', label: 'Pending Approval' },
  };

  const m = map[status] || { tone: 'neutral', label: status };
  return <Chip tone={m.tone}>{m.label}</Chip>;
}
