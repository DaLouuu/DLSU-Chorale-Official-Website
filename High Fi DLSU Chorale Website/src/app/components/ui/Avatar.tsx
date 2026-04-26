import { useTheme } from '../../App';
import { FONTS } from '../../theme';

type Member = {
  id?: number | string;
  section?: string;
  avatar?: string;
};

type AvatarProps = {
  member: Member;
  size?: number;
  src?: string;
};

export function Avatar({ member, size = 36, src }: AvatarProps) {
  const { theme } = useTheme();

  const colorFor = (s?: string) =>
    ({
      Soprano: '#B04A5F',
      Alto: '#9B6B2F',
      Tenor: '#2C5B8E',
      Bass: theme.greenDeep,
    }[s || ''] || theme.greenDeep);

  const savedUrl = member?.id
    ? (() => { try { return localStorage.getItem(`avatar_${member.id}`) || ''; } catch { return ''; } })()
    : '';

  const imgUrl = src || savedUrl;

  if (imgUrl) {
    return (
      <img
        src={imgUrl}
        alt={member?.avatar || '?'}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          display: 'inline-block',
        }}
      />
    );
  }

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
