import { useTheme } from '../../App';
import { FONTS } from '../../theme';

type SectionTagProps = {
  section?: string;
};

export function SectionTag({ section }: SectionTagProps) {
  const { theme } = useTheme();

  const color =
    {
      Soprano: '#B04A5F',
      Alto: '#9B6B2F',
      Tenor: '#2C5B8E',
      Bass: theme.greenDeep,
    }[section || ''] || theme.dim;

  return (
    <span
      style={{
        fontSize: 10,
        fontFamily: FONTS.mono,
        letterSpacing: 1,
        textTransform: 'uppercase',
        color,
        fontWeight: 600,
        padding: '2px 6px',
        border: `1px solid ${color}`,
        borderRadius: 4,
      }}
    >
      {section?.slice(0, 3).toUpperCase()}
    </span>
  );
}
