import { motion } from "framer-motion";

import { useThemeCtx } from "../context/ThemeContext.tsx";

export function ThemeToggle() {
  const { dark, toggle } = useThemeCtx();
  return (
    <button onClick={toggle} className="btn btn-ghost btn-sm !px-2.5" aria-label="Toggle theme" title="Toggle theme">
      <motion.span
        key={dark ? "sun" : "moon"}
        initial={{ rotate: -40, opacity: 0, scale: 0.7 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        className="text-base leading-none"
      >
        {dark ? "☀️" : "🌙"}
      </motion.span>
    </button>
  );
}

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="grid place-items-center rounded-xl text-white"
        style={{ width: size, height: size, background: "linear-gradient(135deg, var(--primary), var(--primary-2))" }}
      >
        <span style={{ fontSize: size * 0.5 }}>✛</span>
      </span>
      <span className="font-display text-lg font-semibold tracking-tight text-ink">Vitalis</span>
    </span>
  );
}
