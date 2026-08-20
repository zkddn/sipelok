import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

const base = (p: P) => {
  const { size = 20, ...rest } = p;
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...rest,
  };
};

/* Marka SIPELOK: loket + grafik batang statistik */
export const LogoMark = (p: P) => (
  <svg {...base(p)} strokeWidth={1.6}>
    <rect x="3" y="4" width="18" height="16" rx="3.5" />
    <path d="M3 9.5h18" />
    <path d="M7 16.5v-3" />
    <path d="M11 16.5v-5" />
    <path d="M15 16.5v-2" />
    <circle cx="18" cy="6.8" r="0.4" fill="currentColor" />
  </svg>
);

export const IconQr = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <path d="M13.5 13.5h3v3h-3zM20.5 13.5v3M17 20.5h3.5M13.5 20.5h.5" />
  </svg>
);

export const IconMonitor = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="4.5" width="18" height="12.5" rx="2" />
    <path d="M9 21h6M12 17v4" />
    <path d="M7 13.5v-3M10.5 13.5V8M14 13.5v-4M17.5 13.5v-2" />
  </svg>
);

export const IconPhoneScan = (p: P) => (
  <svg {...base(p)}>
    <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
    <path d="M10.5 18.5h3" />
    <path d="M2.5 8v-2a2 2 0 0 1 2-2h1.5M2.5 16v2a2 2 0 0 0 2 2h1.5M21.5 8V6a2 2 0 0 0-2-2H18M21.5 16v2a2 2 0 0 1-2 2H18" />
  </svg>
);

export const IconShield = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3 5 5.8v5.4c0 4.5 3 7.8 7 9.3 4-1.5 7-4.8 7-9.3V5.8L12 3Z" />
    <path d="m9 11.5 2.2 2.2L15.5 9" />
  </svg>
);

export const IconCamera = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2L9 4.8h6L16.5 7h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9Z" />
    <circle cx="12" cy="13" r="3.4" />
  </svg>
);

export const IconClock = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const IconCalendar = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
    <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" />
    <path d="M7.5 13.5h3M7.5 16.5h6" />
  </svg>
);

export const IconDownload = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4v10M8 10.5l4 4 4-4" />
    <path d="M4.5 16.5v2A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5v-2" />
  </svg>
);

export const IconUsers = (p: P) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M3.5 19.5c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" />
    <path d="M15.5 5.8a3.2 3.2 0 1 1 0 5.4M17.5 14.9c1.6.7 2.7 2.2 3 4.6" />
  </svg>
);

export const IconCheck = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m8.3 12.3 2.5 2.5 4.9-5.4" />
  </svg>
);

export const IconX = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const IconRefresh = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 12a7.5 7.5 0 0 1 13-5.1L20 9.5M19.5 12a7.5 7.5 0 0 1-13 5.1L4 14.5" />
    <path d="M20 5v4.5h-4.5M4 19v-4.5h4.5" />
  </svg>
);

export const IconSearch = (p: P) => (
  <svg {...base(p)}>
    <circle cx="10.8" cy="10.8" r="6.3" />
    <path d="m15.6 15.6 4.4 4.4" />
  </svg>
);

export const IconTrash = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 6.5h15M9.5 6V4.5A1.5 1.5 0 0 1 11 3h2a1.5 1.5 0 0 1 1.5 1.5V6" />
    <path d="M6.5 6.5 7.4 19a2 2 0 0 0 2 1.9h5.2a2 2 0 0 0 2-1.9l.9-12.5" />
    <path d="M10 10.5v6M14 10.5v6" />
  </svg>
);

export const IconLogout = (p: P) => (
  <svg {...base(p)}>
    <path d="M14 4.5H7A2.5 2.5 0 0 0 4.5 7v10A2.5 2.5 0 0 0 7 19.5h7" />
    <path d="M16 8.5 19.5 12 16 15.5M19 12H9.5" />
  </svg>
);

export const IconPlus = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconArrowRight = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 12h15M13.5 6l6 6-6 6" />
  </svg>
);

export const IconAlert = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4 2.8 19.5h18.4L12 4Z" />
    <path d="M12 10v4.2M12 17.2v.1" />
  </svg>
);

export const IconCopy = (p: P) => (
  <svg {...base(p)}>
    <rect x="8.5" y="8.5" width="12" height="12" rx="2" />
    <path d="M15.5 5.5v-1a2 2 0 0 0-2-2h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h1" transform="translate(1,1)" />
  </svg>
);

export const IconEye = (p: P) => (
  <svg {...base(p)}>
    <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </svg>
);

export const IconChevronDown = (p: P) => (
  <svg {...base(p)}>
    <path d="m6 9.5 6 6 6-6" />
  </svg>
);

export const IconBadgeId = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="3.5" width="16" height="17" rx="2.5" />
    <circle cx="12" cy="9.5" r="2.5" />
    <path d="M7.5 17.5c.7-2.3 2.4-3.5 4.5-3.5s3.8 1.2 4.5 3.5" />
  </svg>
);

export const IconSun = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
  </svg>
);

export const IconPrinter = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 8V3.5h10V8" />
    <rect x="4" y="8" width="16" height="8.5" rx="2" />
    <path d="M7 13.5h10v7H7z" />
    <path d="M17 10.8h.5" />
  </svg>
);

export const IconBook = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
    <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" />
    <path d="M9 7.5h7M9 10.5h5" />
  </svg>
);

export const IconGlobe = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.6 2.3 3.9 5.1 3.9 8.5S14.6 18.2 12 20.5C9.4 18.2 8.1 15.4 8.1 12S9.4 5.8 12 3.5Z" />
  </svg>
);

export const IconDatabase = (p: P) => (
  <svg {...base(p)}>
    <ellipse cx="12" cy="5.5" rx="7.5" ry="2.8" />
    <path d="M4.5 5.5v13c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-13" />
    <path d="M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8" />
  </svg>
);

export const IconRocket = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 15.5c5.5-4 7.5-8.6 7.5-11.9-3.4 0-8 2-11.9 7.5" />
    <path d="M7.6 11.1 4 12.6l3.4 1.9M12.9 16.4l-1.5 3.6-1.9-3.4" />
    <circle cx="14" cy="10" r="1.6" />
    <path d="M6 18c-1 1-1.3 2.6-1.5 3.5.9-.2 2.5-.5 3.5-1.5" />
  </svg>
);

export const IconTerminal = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
    <path d="m7 9.5 3 2.7-3 2.7M12.5 15h4.5" />
  </svg>
);

export const IconSunset = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 15.5a7 7 0 0 1 14 0" />
    <path d="M3 15.5h18M12 4v4M9.5 6.5 12 9l2.5-2.5" />
    <path d="M5 19h14" />
  </svg>
);
