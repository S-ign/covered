"use client";

import { useEffect, useRef, useState } from "react";
import { usd } from "./format";

/** Counts from `from` to `to` once it is on screen. Server render and reduced motion show the final value. */
export function CountUp({ from, to, duration = 1600, delay = 250, className }: { from: number; to: number; duration?: number; delay?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(to);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || from === to) return;
    let raf = 0;
    let timer = 0;
    setValue(from);
    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 4);
        setValue(Math.round(from + (to - from) * eased));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const el = ref.current;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); timer = window.setTimeout(run, delay); }
    }, { threshold: 0.3 });
    if (el) io.observe(el);
    return () => { io.disconnect(); window.clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [from, to, duration, delay]);

  return <span ref={ref} className={className} aria-label={usd(to)}><span aria-hidden="true">{usd(value)}</span></span>;
}
