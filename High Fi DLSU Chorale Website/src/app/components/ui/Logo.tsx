import logoSrc from '@/imports/dlsu-chorale-logo.png';

type LogoProps = {
  size?: number;
  color?: 'default' | 'white';
};

export function Logo({ size = 36, color = 'default' }: LogoProps) {
  return (
    <img
      src={logoSrc}
      alt="DLSU Chorale"
      style={{
        height: size,
        width: 'auto',
        display: 'block',
        filter: color === 'white' ? 'brightness(0) invert(1)' : 'none',
      }}
    />
  );
}
