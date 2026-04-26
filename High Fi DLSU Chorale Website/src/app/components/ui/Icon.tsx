import { CSSProperties } from 'react';

type IconName =
  | 'home' | 'calendar' | 'music' | 'user' | 'ticket' | 'bell' | 'wallet'
  | 'chart' | 'users' | 'settings' | 'logout' | 'check' | 'x' | 'plus'
  | 'clock' | 'search' | 'filter' | 'download' | 'chevronRight' | 'chevronLeft'
  | 'chevronDown' | 'mapPin' | 'dollar' | 'mail' | 'menu' | 'megaphone'
  | 'shield' | 'rfid' | 'wifi' | 'wifiOff' | 'alert' | 'refresh' | 'heart'
  | 'folder' | 'info' | 'file' | 'externalLink' | 'edit' | 'trash' | 'image'
  | 'camera' | 'alertTriangle' | 'userPlus' | 'sun' | 'moon';

type IconProps = {
  name: IconName;
  size?: number;
  stroke?: string;
  fill?: string;
  style?: CSSProperties;
};

export function Icon({ name, size = 18, stroke = 'currentColor', fill = 'none', style }: IconProps) {
  const p = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill,
    stroke,
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    style,
  };

  const paths: Record<IconName, JSX.Element> = {
    home: (
      <>
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5 10v10h14V10" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </>
    ),
    music: (
      <>
        <path d="M9 18V5l10-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="16" cy="16" r="3" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
      </>
    ),
    ticket: (
      <>
        <path d="M4 9a2 2 0 0 0 0 4v5h16v-5a2 2 0 0 0 0-4V4H4Z" />
        <path d="M12 5v14" strokeDasharray="2 2" />
      </>
    ),
    bell: (
      <>
        <path d="M6 15V10a6 6 0 1 1 12 0v5l1.5 2.5h-15Z" />
        <path d="M10 19a2 2 0 0 0 4 0" />
      </>
    ),
    wallet: (
      <>
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M16 12h3M3 10h18" />
      </>
    ),
    chart: (
      <>
        <path d="M4 20V8M10 20V4M16 20v-7M22 20H2" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2 20c.8-3 3.6-5 7-5s6.2 2 7 5" />
        <circle cx="18" cy="9" r="2.5" />
        <path d="M16 19c.5-2 2-3.5 4-3.5" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M4 12h2M18 12h2M12 4v2M12 18v2M6 6l1.5 1.5M16.5 16.5 18 18M6 18l1.5-1.5M16.5 7.5 18 6" />
      </>
    ),
    logout: (
      <>
        <path d="M10 17l5-5-5-5M15 12H4M9 4h10v16H9" />
      </>
    ),
    check: <path d="m5 12 5 5 9-11" />,
    x: <path d="M6 6l12 12M18 6 6 18" />,
    plus: <path d="M12 5v14M5 12h14" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 8v4l3 2" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="6" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
    filter: <path d="M4 5h16l-6 8v6l-4-2v-4L4 5Z" />,
    download: (
      <>
        <path d="M12 4v12M7 11l5 5 5-5" />
        <path d="M4 20h16" />
      </>
    ),
    chevronRight: <path d="m9 6 6 6-6 6" />,
    chevronLeft: <path d="m15 6-6 6 6 6" />,
    chevronDown: <path d="m6 9 6 6 6-6" />,
    mapPin: (
      <>
        <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" />
        <circle cx="12" cy="9" r="2.5" />
      </>
    ),
    dollar: (
      <>
        <path d="M12 3v18" />
        <path d="M17 7H9.5a2.5 2.5 0 0 0 0 5h5a2.5 2.5 0 0 1 0 5H7" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 7 9-7" />
      </>
    ),
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    megaphone: (
      <>
        <path d="M3 11v2l2 1v2h2v1l3 2v-4l10-4V7L7 11H3Z" />
      </>
    ),
    shield: (
      <>
        <path d="M12 2 4 6v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V6l-8-4Z" />
      </>
    ),
    rfid: (
      <>
        <rect x="4" y="6" width="16" height="12" rx="2" />
        <circle cx="12" cy="12" r="3" />
        <path d="M8 12a4 4 0 0 1 8 0M6 12a6 6 0 0 1 12 0" />
      </>
    ),
    wifi: (
      <>
        <path d="M5 12.5a10.5 10.5 0 0 1 14 0M8.5 16a6 6 0 0 1 7 0" />
        <circle cx="12" cy="20" r="1" />
      </>
    ),
    wifiOff: (
      <>
        <path d="M5 12.5a10.5 10.5 0 0 1 14 0M8.5 16a6 6 0 0 1 7 0M2 2l20 20" />
        <circle cx="12" cy="20" r="1" />
      </>
    ),
    alert: (
      <>
        <path d="M12 2 2 20h20L12 2Z" />
        <path d="M12 9v5M12 17h0" />
      </>
    ),
    refresh: (
      <>
        <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
      </>
    ),
    heart: (
      <>
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.7 0l-1.1 1-1.1-1a5.5 5.5 0 0 0-7.7 7.8l8.8 8.6 8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
      </>
    ),
    folder: (
      <>
        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.5L9 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8h0M11 12h1v4h1" />
      </>
    ),
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
        <path d="M14 2v6h6" />
      </>
    ),
    externalLink: (
      <>
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
      </>
    ),
    edit: (
      <>
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6M14 11v6" />
      </>
    ),
    image: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </>
    ),
    camera: (
      <>
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
        <circle cx="12" cy="13" r="4" />
      </>
    ),
    alertTriangle: (
      <>
        <path d="M10.3 3.6 1.4 18a2 2 0 0 0 1.7 3h17.8a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v5M12 17h0" />
      </>
    ),
    userPlus: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <path d="M20 8v6M17 11h6" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </>
    ),
    moon: (
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    ),
  };

  return <svg {...p}>{paths[name] || null}</svg>;
}
