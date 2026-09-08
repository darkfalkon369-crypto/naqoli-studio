import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const IconGrid = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="1.8" />
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.8" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.8" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.8" />
  </svg>
);

export const IconWand = (p: P) => (
  <svg {...base} {...p}>
    <path d="M15 4V2m0 20v-2m5-15 1.5-1.5M3.5 20.5 5 19m14 0 1.5 1.5M4 4l1.5 1.5M9 6.5 19.5 17 17 19.5 6.5 9z" />
    <path d="M14 9.2 14.8 10" />
  </svg>
);

export const IconClock = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.2 2" />
  </svg>
);

export const IconTiktok = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M16.6 3c.4 2.1 1.8 3.6 3.9 3.9v3c-1.6 0-2.9-.5-3.9-1.2v6.5c0 4.2-3 6.3-5.9 6.3-2.9 0-5.2-2.2-5.2-5.1 0-3.3 2.9-5.6 6.2-5v3.1c-.3-.1-.7-.2-1.1-.2-1.4 0-2.4 1-2.4 2.3s1 2.3 2.4 2.3c1.5 0 2.6-1 2.6-3V3h3.4z" />
  </svg>
);

export const IconTelegram = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M21.7 3.3a1.4 1.4 0 0 0-1.5-.2L3.3 10.4c-1.1.4-1 2 0 2.3l4.3 1.4 1.6 5.1c.3 1 1.5 1.2 2.2.5l2.4-2.4 4.4 3.2c.8.6 2 .2 2.2-.9l2.5-14.8a1.4 1.4 0 0 0-.2-1.5zM9.4 13.5l8.7-6.3c.3-.2.5.2.3.4l-6.9 6.7-.4 3.5-1.7-4.3z" />
  </svg>
);

export const IconGear = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2a2 2 0 1 1-4.1 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1h-.2a2 2 0 1 1 0-4.1h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.6v-.2a2 2 0 1 1 4.1 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6 1h.2a2 2 0 1 1 0 4.1h-.1a1.7 1.7 0 0 0-1.6 1z" />
  </svg>
);

export const IconEye = (p: P) => (
  <svg {...base} {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const IconHeart = (p: P) => (
  <svg {...base} {...p}>
    <path d="M19.5 13.6 12 21l-7.5-7.4a5 5 0 1 1 7-7.1l.5.5.5-.5a5 5 0 1 1 7 7.1z" />
  </svg>
);

export const IconShare = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="17.5" cy="5.5" r="2.5" />
    <circle cx="17.5" cy="18.5" r="2.5" />
    <path d="m8.3 10.8 7-4M8.3 13.2l7 4" />
  </svg>
);

export const IconComment = (p: P) => (
  <svg {...base} {...p}>
    <path d="M21 12a8.5 8.5 0 0 1-8.5 8.5c-1.3 0-2.6-.3-3.7-.8L3 21l1.4-5.3A8.5 8.5 0 1 1 21 12z" />
  </svg>
);

export const IconUsers = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c.8-3 3.4-4.5 6.5-4.5s5.7 1.5 6.5 4.5M16 4.7a3.5 3.5 0 0 1 0 6.6M17.8 15.7c2 .6 3.3 1.9 3.9 4.3" />
  </svg>
);

export const IconFilm = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" />
  </svg>
);

export const IconZap = (p: P) => (
  <svg {...base} {...p}>
    <path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H13z" />
  </svg>
);

export const IconShield = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 2.5 4.5 5.5v6c0 4.5 3.2 8.6 7.5 10 4.3-1.4 7.5-5.5 7.5-10v-6z" />
    <path d="m9 12 2.2 2.2L15.5 9.8" />
  </svg>
);

export const IconSparkle = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 3.5 14 9.5 20 11.5 14 13.5 12 19.5 10 13.5 4 11.5 10 9.5z" />
    <path d="M19 3v3M20.5 4.5h-3" />
  </svg>
);

export const IconTrash = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5m4-5v5" />
  </svg>
);

export const IconSend = (p: P) => (
  <svg {...base} {...p}>
    <path d="m3 11 18-7-7 18-2.5-8.5z" />
    <path d="M21 4 11.5 13.5" />
  </svg>
);

export const IconRefresh = (p: P) => (
  <svg {...base} {...p}>
    <path d="M20.5 12a8.5 8.5 0 1 1-2.5-6M20.5 3v4.5H16" />
  </svg>
);

export const IconPlus = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconCheck = (p: P) => (
  <svg {...base} {...p}>
    <path d="m4.5 12.5 5 5L19.5 7" />
  </svg>
);

export const IconCalendar = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
    <path d="M8 3v4M16 3v4M3.5 10.5h17" />
  </svg>
);

export const IconChart = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 4v16h16" />
    <path d="M8 16v-5M12 16V8M16 16v-3M20 16V6" />
  </svg>
);

export const IconPlay = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M7 4.8v14.4c0 1.2 1.3 1.9 2.3 1.3l11-7.2c.9-.6.9-2 0-2.6l-11-7.2C8.3 2.9 7 3.6 7 4.8z" />
  </svg>
);

export const IconBot = (p: P) => (
  <svg {...base} {...p}>
    <rect x="4" y="8" width="16" height="11" rx="3" />
    <path d="M12 8V5m0 0a1.5 1.5 0 1 0-.01-3.01A1.5 1.5 0 0 0 12 5z" />
    <path d="M9 13v1.5M15 13v1.5M9.5 16.5c.8.7 4.2.7 5 0M2 12.5v3M22 12.5v3" />
  </svg>
);

export const IconBook = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21z" />
    <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" />
    <path d="M9 7.5h6" />
  </svg>
);

export const IconCopy = (p: P) => (
  <svg {...base} {...p}>
    <rect x="9" y="9" width="12" height="12" rx="2.5" />
    <path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5" />
  </svg>
);

export const IconDownload = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 3v12m0 0 4.5-4.5M12 15 7.5 10.5M4 19h16" />
  </svg>
);

export const IconServer = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="4" width="18" height="7" rx="2" />
    <rect x="3" y="13" width="18" height="7" rx="2" />
    <path d="M7 7.5h.01M7 16.5h.01M11 7.5h2m-2 9h2" />
  </svg>
);

export const IconTerminal = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <path d="m7 9 3 3-3 3M13 15h4" />
  </svg>
);

export const IconKey = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="8" cy="14" r="4.5" />
    <path d="m11.5 10.5 8-8M17 5l2.5 2.5M14 8l2 2" />
  </svg>
);

export const IconDice = (p: P) => (
  <svg {...base} {...p}>
    <rect x="4" y="4" width="16" height="16" rx="3.5" />
    <circle cx="9" cy="9" r="0.8" fill="currentColor" />
    <circle cx="15" cy="9" r="0.8" fill="currentColor" />
    <circle cx="9" cy="15" r="0.8" fill="currentColor" />
    <circle cx="15" cy="15" r="0.8" fill="currentColor" />
  </svg>
);
