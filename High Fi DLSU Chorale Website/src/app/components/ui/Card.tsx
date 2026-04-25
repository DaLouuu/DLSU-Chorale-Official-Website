import { ReactNode, CSSProperties } from 'react';
import { useTheme } from '../../App';

type CardProps = {
  children: ReactNode;
  style?: CSSProperties;
  pad?: number;
  variant?: 'paper' | 'cream' | 'green' | 'dark';
};

export function Card({ children, style, pad = 20, variant = 'paper' }: CardProps) {
  const { theme } = useTheme();

  const styles = {
    paper: { background: theme.paper, border: `1px solid ${theme.line}` },
    cream: { background: theme.cream, border: `1px solid ${theme.line}` },
    green: { background: theme.greenSoft, border: `1px solid ${theme.greenMid}` },
    dark: { background: theme.greenDark, color: '#fff', border: `1px solid ${theme.greenDeep}` },
  };

  return (
    <div
      style={{
        borderRadius: 14,
        padding: pad,
        ...styles[variant],
        ...style,
      }}
    >
      {children}
    </div>
  );
}
