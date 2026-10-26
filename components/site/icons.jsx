// Small inline icons (24×24 grid, stroked in the text colour).
const base = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true }

export const Sun = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
)
export const Moon = (p) => (
  <svg {...base} {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
)
export const Book = (p) => (
  <svg {...base} {...p}><path d="M4 19.5V5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2.5zM20 19v3H6.5" /></svg>
)
export const Download = (p) => (
  <svg {...base} {...p}><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>
)
export const Notebook = (p) => (
  <svg {...base} {...p}><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8l3 3-3 3M13 15h3" /></svg>
)
export const Arrow = (p) => (
  <svg {...base} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
)
export const ArrowLeft = (p) => (
  <svg {...base} {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
)
export const Clock = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
)
export const External = (p) => (
  <svg {...base} {...p}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>
)
export const Flag = (p) => (
  <svg {...base} {...p}><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></svg>
)
export const GitHub = (p) => (
  <svg {...base} fill="currentColor" stroke="none" {...p}>
    <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.4-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5a3.9 3.9 0 0 1 1-2.7c-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7a3.9 3.9 0 0 1 1 2.7c0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2z" />
  </svg>
)
export const Logo = (p) => (
  // three layers of nodes, the shape of the network in Guide 1
  <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true" {...p}>
    <rect width="32" height="32" rx="8" fill="var(--accent)" />
    <g stroke="var(--on-accent)" strokeWidth="1.3" opacity="0.75">
      <path d="M9 10l7-2M9 10l7 8M9 22l7-14M9 22l7-4M16 8l7 8M16 18l7-2M16 24l7-8M9 10l7 14M9 22l7 2" />
    </g>
    <g fill="var(--on-accent)">
      <circle cx="9" cy="10" r="2.3" /><circle cx="9" cy="22" r="2.3" />
      <circle cx="16" cy="8" r="2.3" /><circle cx="16" cy="18" r="2.3" /><circle cx="16" cy="24" r="2.3" />
      <circle cx="23" cy="16" r="2.6" />
    </g>
  </svg>
)
