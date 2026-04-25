import { useTheme } from '../../App';
import { FONTS } from '../../theme';

type FieldProps = {
  label: string;
  select?: boolean;
  options?: string[];
  type?: string;
  value?: string | number;
  onChange?: (e: any) => void;
  placeholder?: string;
  readOnly?: boolean;
};

export function Field({ label, select, options, type = 'text', value, onChange, placeholder, readOnly }: FieldProps) {
  const { theme } = useTheme();

  const base = {
    width: '100%',
    padding: '11px 14px',
    border: `1px solid ${theme.lineDark}`,
    borderRadius: 10,
    fontSize: 14,
    fontFamily: FONTS.sans,
    background: readOnly ? theme.cream : '#fff',
    color: theme.ink,
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  return (
    <div>
      <label style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase' }}>{label}</label>
      <div style={{ marginTop: 6 }}>
        {select ? (
          <select style={base} value={value} onChange={onChange}>
            {options?.map(o => (
              <option key={o}>{o}</option>
            ))}
          </select>
        ) : (
          <input style={base} type={type} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly} />
        )}
      </div>
    </div>
  );
}
