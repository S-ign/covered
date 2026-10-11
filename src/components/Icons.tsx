import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (p: P): P => ({
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  ...p,
});

export const ArrowRight = (p: P) => (<svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
export const ArrowLeft = (p: P) => (<svg {...base(p)}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>);
export const ArrowUpRight = (p: P) => (<svg {...base(p)}><path d="M7 17 17 7M8 7h9v9" /></svg>);
export const Check = (p: P) => (<svg {...base({ strokeWidth: 2.6, ...p })}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>);
export const Plus = (p: P) => (<svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>);
export const Minus = (p: P) => (<svg {...base(p)}><path d="M5 12h14" /></svg>);
export const Download = (p: P) => (<svg {...base(p)}><path d="M12 4v11M7 11l5 5 5-5M5 20h14" /></svg>);
export const Warning = (p: P) => (<svg {...base(p)}><path d="M12 4 2.8 19.5h18.4L12 4Z" /><path d="M12 10v4.5M12 17.3v.1" /></svg>);
export const Scale = (p: P) => (<svg {...base(p)}><path d="M12 4v16M7 20h10M5 8h14M5 8l-2.5 6a3 3 0 0 0 5 0L5 8Zm14 0-2.5 6a3 3 0 0 0 5 0L19 8Z" /></svg>);
export const Doc = (p: P) => (<svg {...base(p)}><path d="M7 3h7l5 5v13H7V3Z" /><path d="M14 3v5h5M10 13h6M10 17h6" /></svg>);
export const Link2 = (p: P) => (<svg {...base(p)}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>);
export const Shield = (p: P) => (<svg {...base(p)}><path d="M12 3 5 6v6c0 4.3 3 7.5 7 9 4-1.5 7-4.7 7-9V6l-7-3Z" /><path d="m9 12 2.2 2.2L15.5 10" /></svg>);
export const Person = (p: P) => (<svg {...base({ fill: "currentColor", stroke: "none", ...p })}><circle cx="12" cy="7.5" r="3.6" /><path d="M4.5 21c0-4.4 3.2-7.4 7.5-7.4s7.5 3 7.5 7.4H4.5Z" /></svg>);
export const Pin = (p: P) => (<svg {...base(p)}><path d="M12 21s7-6 7-11.5A7 7 0 0 0 5 9.5C5 15 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>);
export const Sparkle = (p: P) => (<svg {...base({ fill: "currentColor", stroke: "none", ...p })}><path d="M12 1.5c.6 5.6 2.4 8.4 9 10.5-6.6 2.1-8.4 4.9-9 10.5C11.4 16.900 9.600 14.100 3 12c6.600-2.100 8.400-4.900 9-10.500Z" /></svg>);
