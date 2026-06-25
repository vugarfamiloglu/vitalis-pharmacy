import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { ConfirmModal } from "../components/ConfirmModal.tsx";
import { ThemeToggle } from "../components/ThemeToggle.tsx";
import { useAuth } from "../context/AuthContext.tsx";

const NAV = [
  { to: "/admin", end: true, label: "Dashboard", icon: "▦" },
  { to: "/admin/inventory", label: "Inventory", icon: "▤" },
  { to: "/admin/pos", label: "POS Terminal", icon: "▣" },
  { to: "/admin/prescriptions", label: "Prescriptions", icon: "℞" },
  { to: "/admin/logs", label: "Activity Log", icon: "≣" },
];

const TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/inventory": "Inventory",
  "/admin/pos": "POS Terminal",
  "/admin/prescriptions": "Prescriptions",
  "/admin/logs": "Activity Log",
};

export function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [confirmOut, setConfirmOut] = useState(false);

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-bg text-muted">Loading…</div>;
  }
  if (!user) {
    nav("/login", { replace: true });
    return null;
  }

  const title = TITLES[loc.pathname] ?? "Console";

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="sticky top-0 flex h-screen flex-col border-r border-line bg-surface"
      >
        <div className="flex h-16 items-center gap-2 px-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white" style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-2))" }}>
            ✛
          </span>
          {!collapsed && <span className="font-display text-lg font-semibold">Vitalis</span>}
        </div>

        <nav className="mt-2 flex flex-1 flex-col gap-1 px-3">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  isActive ? "font-semibold text-primary" : "text-muted hover:bg-surface-2 hover:text-ink"
                }`
              }
              style={({ isActive }) => (isActive ? { background: "var(--primary-soft)" } : undefined)}
            >
              <span className="w-4 text-center text-base">{n.icon}</span>
              {!collapsed && <span>{n.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse control (this project's form: bottom pill toggle) */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="m-3 flex items-center justify-center gap-2 rounded-xl border border-line py-2 text-xs text-muted transition hover:text-ink"
        >
          <motion.span animate={{ rotate: collapsed ? 180 : 0 }}>«</motion.span>
          {!collapsed && <span>Collapse</span>}
        </button>
      </motion.aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-line bg-surface/80 px-6 backdrop-blur">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">VITALIS</span>
          <span className="text-faint">›</span>
          <h1 className="font-display text-lg">{title}</h1>
          <div className="flex-1" />
          <ThemeToggle />
          <div className="flex items-center gap-2 rounded-xl border border-line px-3 py-1.5">
            <span className="grid h-6 w-6 place-items-center rounded-full text-xs text-white" style={{ background: "var(--primary)" }}>
              {user.full_name.charAt(0)}
            </span>
            <span className="hidden text-sm sm:block">{user.full_name}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setConfirmOut(true)}>
            Sign out
          </button>
        </header>

        <main className="flex-1 p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={loc.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <ConfirmModal
        open={confirmOut}
        title="Sign out?"
        message="You'll need to sign in again to access the pharmacy console."
        confirmLabel="Sign out"
        danger
        onCancel={() => setConfirmOut(false)}
        onConfirm={async () => {
          setConfirmOut(false);
          await logout();
          nav("/login");
        }}
      />
    </div>
  );
}
