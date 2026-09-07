import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (p: P): P => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  ...p,
});

/** Feeding bottle with cap and graduation marks. */
export const BottleIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M10 2h4v2.5h-4z" fill="currentColor" stroke="none" />
    <path d="M8.5 4.5h7l.5 3.5h-8z" />
    <path d="M6.5 8h11v10a3.5 3.5 0 0 1-3.5 3.5h-4A3.5 3.5 0 0 1 6.5 18z" />
    <path d="M6.5 11.5h3.5M6.5 14.5h3.5M6.5 17.5h3.5" />
  </svg>
);

/** Breast with a milk drop. */
export const BreastIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 14.5c0-5.5 3.2-9.5 7.5-10 3.5 0 6 2.5 6 6 0 2.5-1 4.3-3 5.5" />
    <path d="M4 14.5c0 3 2 5 5 5" />
    <circle cx="14" cy="13.5" r="1" fill="currentColor" stroke="none" />
    <path d="M17.5 14.5c-1.3 1.8-2.2 3-2.2 4.2a2.2 2.2 0 0 0 4.4 0c0-1.2-.9-2.4-2.2-4.2z" />
  </svg>
);

/** Crescent moon with two stars. */
export const MoonIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M13.5 3a8.5 8.5 0 1 0 7.5 12.5A7.5 7.5 0 0 1 13.5 3z" />
    <path d="M18.5 4v4M16.5 6h4" />
  </svg>
);

/** Cloud with z's for a nap. */
export const NapIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M6.5 19h10a4 4 0 0 0 .5-8 5.5 5.5 0 0 0-10.6-1.4A4.7 4.7 0 0 0 6.5 19z" />
    <path d="M14.5 3.5h4l-4 4.5h4" />
  </svg>
);

/** Sun for awake. */
export const SunIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
  </svg>
);

/** Bell for wake up. */
export const BellIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M6.5 16.5v-6a5.5 5.5 0 0 1 11 0v6l1.5 2h-14z" />
    <path d="M10 20.5a2 2 0 0 0 4 0" />
    <path d="M12 3v2" />
    <path d="M3.5 8.5c.4-1.8 1.3-3.3 2.6-4.4M20.5 8.5c-.4-1.8-1.3-3.3-2.6-4.4" />
  </svg>
);

export const ClockIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const UndoIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M8.5 6.5 4.5 10.5l4 4" />
    <path d="M4.5 10.5h9a5 5 0 0 1 0 10H10" />
  </svg>
);

export const CheckIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export const CloseIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const TrashIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l.8 12.5h9.4L17.5 7" />
    <path d="M10 11v5M14 11v5" />
  </svg>
);

export const MinusIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 12h12" />
  </svg>
);

export const PlusIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 6v12M6 12h12" />
  </svg>
);

/** Folded diaper. */
export const DiaperIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M3.5 7h17v4.5A8.5 8.5 0 0 1 12 20a8.5 8.5 0 0 1-8.5-8.5z" />
    <path d="M3.5 11.5c3 0 5.5 2 6.5 5M20.5 11.5c-3 0-5.5 2-6.5 5" />
    <path d="M7 7V5.5M17 7V5.5" />
  </svg>
);

export const GearIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
    <circle cx="9" cy="7" r="2" fill="var(--color-card)" />
    <circle cx="15" cy="12" r="2" fill="var(--color-card)" />
    <circle cx="8" cy="17" r="2" fill="var(--color-card)" />
  </svg>
);

export const DownloadIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M4.5 19.5h15" />
  </svg>
);

export const ThermometerIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M10 4.5a2 2 0 0 1 4 0v9.3a4 4 0 1 1-4 0z" />
    <path d="M12 9v6" />
    <circle cx="12" cy="17" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

export const PillIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="8.5" width="17" height="7" rx="3.5" transform="rotate(-40 12 12)" />
    <path d="M9.5 8.5l5 7" transform="rotate(-40 12 12)" />
  </svg>
);

/** Baby on its tummy, head up. */
export const TummyIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="18" cy="9" r="3" />
    <path d="M15.5 11.5c-2 2-5 3-8.5 3H4" />
    <path d="M7 14.5c1 1.5 2.5 2.5 4.5 3" />
    <path d="M3.5 19.5h17" />
  </svg>
);

export const BathIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 12.5h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" />
    <path d="M6 12.5V6.5a2 2 0 0 1 4 0" />
    <path d="M7 19.5v1.5M17 19.5v1.5" />
    <path d="M13.5 8.5v1M16 7v1M18.5 8.5v1" strokeWidth={1.5} />
  </svg>
);

export const StarIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.9l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.8z" />
  </svg>
);

export const NoteIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 4.5h9l4 4v11H6z" />
    <path d="M15 4.5v4h4" />
    <path d="M9 12h6M9 15.5h4" />
  </svg>
);

export const ScaleIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <path d="M8.5 10.5a4 4 0 0 1 7 0" />
    <path d="M12 12.5l1.8-2.2" />
  </svg>
);

export const RulerIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="8.5" width="18" height="7" rx="1.5" />
    <path d="M7 8.5v2.5M10.5 8.5v3.5M14 8.5v2.5M17.5 8.5v3.5" />
  </svg>
);

export const MoreIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="6.5" cy="6.5" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="12" cy="6.5" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="17.5" cy="6.5" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="6.5" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="17.5" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="6.5" cy="17.5" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="12" cy="17.5" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="17.5" cy="17.5" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);

export const ShareIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5v11M8 7l4-3.5L16 7" />
    <path d="M6.5 11.5H5.5v9h13v-9h-1" />
  </svg>
);

export const CopyIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="2.5" />
    <path d="M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5" />
  </svg>
);

export const ListIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 6.5h12M8 12h12M8 17.5h12" />
    <circle cx="4.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    <circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="4.5" cy="17.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const ChartIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 19.5h16" />
    <path d="M4.5 15c3-1 5-6 8-6.5s4.5 3 7.5 1.5" />
    <circle cx="12.5" cy="8.5" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

export const ICON = {
  bottle: BottleIcon,
  breast: BreastIcon,
  sleep: MoonIcon,
  nap: NapIcon,
  awake: SunIcon,
  wake: BellIcon,
  diaper: DiaperIcon,
  temperature: ThermometerIcon,
  medicine: PillIcon,
  tummy: TummyIcon,
  bath: BathIcon,
  milestone: StarIcon,
  note: NoteIcon,
  weight: ScaleIcon,
  length: RulerIcon,
  other: MoreIcon,
} as const;
