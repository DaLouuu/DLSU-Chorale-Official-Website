import { ReactNode, CSSProperties } from 'react';
import { useTheme } from '../../App';
import { FONTS } from '../../theme';
import { Icon } from './Icon';

type ButtonProps = {
  children: ReactNode;
  variant?: 'primary' | 'dark' | 'outline' | 'ghost' | 'danger' | 'success' | 'link';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  icon?: string;
  style?: CSSProperties;
  disabled?: boolean;
  type?: 'button' | 'submit';
};

export function Button({ children, variant = 'primary', size = 'md', onClick, icon, style, disabled, type = 'button' }: ButtonProps) {
  const { theme } = useTheme();

  const sizes = {
    sm: { padding: '6px 12px', fontSize: 12, height: 30 },
    md: { padding: '9px 16px', fontSize: 13, height: 38 },
    lg: { padding: '12px 22px', fontSize: 14, height: 46 },
  };

  const variants = {
    primary: { background: theme.green, color: '#fff', border: `1px solid ${theme.green}` },
    dark: { background: theme.greenDark, color: '#fff', border: `1px solid ${theme.greenDark}` },
    outline: { background: 'transparent', color: theme.ink, border: `1px solid ${theme.lineDark}` },
    ghost: { background: 'transparent', color: theme.ink, border: '1px solid transparent' },
    danger: { background: theme.red, color: '#fff', border: `1px solid ${theme.red}` },
    success: { background: theme.green, color: '#fff', border: `1px solid ${theme.green}` },
    link: { background: 'transparent', color: theme.green, border: '1px solid transparent', textDecoration: 'underline', textUnderlineOffset: 3 },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        borderRadius: 10,
        fontWeight: 500,
        fontFamily: FONTS.sans,
        cursor: disabled ? 'not-allowed' : 'pointer',
        letterSpacing: 0.1,
        whiteSpace: 'nowrap',
        opacity: disabled ? 0.5 : 1,
        ...sizes[size],
        ...variants[variant],
        ...style,
      }}
    >
      {icon && <Icon name={icon as any} size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  );
}
