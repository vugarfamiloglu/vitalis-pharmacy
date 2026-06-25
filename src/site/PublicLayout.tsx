import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";

import { Logo, ThemeToggle } from "../components/ThemeToggle.tsx";

function navClass({ isActive }: { isActive: boolean }): string {
  return `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
    isActive ? "text-primary" : "text-muted hover:text-ink"
  }`;
}

export function PublicLayout() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  return (
    <div className="flex min-h-screen flex-col">
      <header
        className="sticky top-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "color-mix(in oklab, var(--bg) 82%, transparent)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? "1px solid var(--line)" : "1px solid transparent",
        }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/">
            <Logo />
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={navClass}>
              Home
            </NavLink>
            <NavLink to="/catalog" className={navClass}>
              Catalog
            </NavLink>
            <span className="mx-1.5 h-5 w-px bg-line" />
            <ThemeToggle />
            <Link to="/admin" className="btn btn-primary btn-sm ml-1">
              Staff login
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-20 border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-10 sm:flex-row">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Logo />
            <p className="mt-2 max-w-xs text-sm text-muted">
              Trusted neighbourhood pharmacy — prescriptions, advice and everyday health, with care.
            </p>
          </motion.div>
          <div className="text-sm text-faint">
            <p>Open Mon–Sun · 08:00–23:00</p>
            <p className="font-mono">© 2026 Vitalis Pharmacy</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
