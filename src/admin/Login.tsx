import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ThemeToggle } from "../components/ThemeToggle.tsx";
import { useToast } from "../components/Toast.tsx";
import { useAuth } from "../context/AuthContext.tsx";

export function Login() {
  const { login, user } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("Vitalis2026!");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) nav("/admin", { replace: true });
  }, [user, nav]);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    try {
      await login(username, password);
      nav("/admin", { replace: true });
    } catch (err) {
      toast("error", (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-bg p-4" style={{ backgroundImage: "radial-gradient(900px 500px at 50% -10%, var(--primary-soft), transparent)" }}>
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }} className="card w-full max-w-sm p-8">
        <div className="flex justify-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl text-2xl text-white" style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-2))" }}>
            ✛
          </span>
        </div>
        <h1 className="mt-4 text-center text-2xl">Vitalis Staff</h1>
        <p className="mt-1 text-center text-sm text-muted">Sign in to the pharmacy console</p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <div>
            <label className="label">Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="input mt-1.5" autoFocus />
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative mt-1.5">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pr-11"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-muted hover:text-ink"
                aria-label="Toggle password"
              >
                {show ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          <button disabled={busy} className="btn btn-primary w-full disabled:opacity-60">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-5 text-center text-xs text-faint">Demo: admin / Vitalis2026!</p>
      </motion.div>
    </div>
  );
}
