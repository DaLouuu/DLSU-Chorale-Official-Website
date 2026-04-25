import { useTheme } from '../../App';
import { FONTS } from '../../theme';

type Member = {
  section?: string;
  avatar?: string;
};

type AvatarProps = {
  member: Member;
  size?: number;
};

export function Avatar({ member, size = 36 }: AvatarProps) {
  const { theme } = useTheme();

  const colorFor = (s?: string) =>
    ({
      Soprano: '#B04A5F',
      Alto: '#9B6B2F',
      Tenor: '#2C5B8E',
      Bass: theme.greenDeep,
    }[s || ''] || theme.greenDeep);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: colorFor(member?.section),
        color: '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONTS.sans,
        fontWeight: 600,
        fontSize: size * 0.36,
        flexShrink: 0,
        letterSpacing: 0.5,
      }}
    >
      {member?.avatar || '?'}
    </div>
  );
}
