import { ReactNode } from 'react';
import { useTheme } from '../../App';
import { FONTS } from '../../theme';

type PageHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHeader({ eyebrow, title, subtitle, actions }: PageHeaderProps) {
  const { theme } = useTheme();

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingBottom: 20,
        marginBottom: 24,
        borderBottom: `1px solid ${theme.line}`,
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <div>
        {eyebrow && (
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 11,
              letterSpacing: 2,
              color: theme.green,
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            {eyebrow}
          </div>
        )}
        <h1
          style={{
            fontFamily: FONTS.serif,
            fontSize: 42,
            fontWeight: 500,
            margin: 0,
            color: theme.ink,
            letterSpacing: -0.5,
            lineHeight: 1.05,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontFamily: FONTS.sans,
              fontSize: 15,
              color: theme.dim,
              margin: '10px 0 0 0',
              maxWidth: 620,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div style={{ display: 'flex', gap: 10 }}>{actions}</div>}
    </div>
  );
}
