import { useTheme } from '../../App';

type DecorativeAccentProps = {
  /** Which corner the blobs anchor to. */
  corner?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Scales the whole accent up/down; 1 = default. */
  scale?: number;
};

/**
 * Soft blurred blobs + a few thin arcs, in the brand green/gold, for large
 * flat dark-green surfaces (auth side panels, sidebar, kiosk) that otherwise
 * have no visual texture. Positioned absolutely inside a `position: relative`
 * parent; pointer-events are disabled so it never blocks clicks.
 */
export function DecorativeAccent({ corner = 'bottom-right', scale = 1 }: DecorativeAccentProps) {
  const { theme } = useTheme();
  const flipX = corner.includes('right') ? 1 : -1;
  const flipY = corner.includes('bottom') ? 1 : -1;
  const posStyle =
    corner === 'top-left' ? { top: 0, left: 0 } :
    corner === 'top-right' ? { top: 0, right: 0 } :
    corner === 'bottom-left' ? { bottom: 0, left: 0 } :
    { bottom: 0, right: 0 };

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        ...posStyle,
        width: 340 * scale,
        height: 340 * scale,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0,
      }}
    >
      <svg
        width="340"
        height="340"
        viewBox="0 0 340 340"
        style={{
          width: '100%',
          height: '100%',
          transform: `scale(${flipX}, ${flipY})`,
        }}
      >
        <circle cx="250" cy="260" r="130" fill={theme.amber} opacity="0.16" style={{ filter: 'blur(2px)' }} />
        <circle cx="150" cy="110" r="90" fill={theme.greenMid} opacity="0.14" style={{ filter: 'blur(1px)' }} />
        <circle cx="290" cy="90" r="46" fill={theme.amber} opacity="0.22" />
        {[0, 1, 2].map(i => (
          <path
            key={i}
            d={`M ${40 + i * 26} 340 C ${100 + i * 26} 260, ${40 + i * 26} 200, ${140 + i * 26} 120`}
            stroke={theme.greenMid}
            strokeWidth="1.5"
            fill="none"
            opacity={0.28 - i * 0.07}
          />
        ))}
      </svg>
    </div>
  );
}
