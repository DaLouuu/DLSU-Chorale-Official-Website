import { ReactNode, useEffect, useState } from 'react';
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
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  const isMobile = width < 768;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'flex-end',
        paddingBottom: isMobile ? 16 : 20,
        marginBottom: isMobile ? 18 : 24,
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
              fontSize: isMobile ? 10 : 11,
              letterSpacing: isMobile ? 1.6 : 2,
              color: theme.green,
              textTransform: 'uppercase',
              marginBottom: isMobile ? 6 : 8,
            }}
          >
            {eyebrow}
          </div>
        )}
        <h1
          style={{
            fontFamily: FONTS.serif,
              fontSize: isMobile ? 28 : 42,
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
              fontSize: isMobile ? 14 : 15,
              color: theme.dim,
              margin: `${isMobile ? 8 : 10}px 0 0 0`,
              maxWidth: 620,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>{actions}</div>}
    </div>
  );
}
