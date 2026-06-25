import { AnimatePresence, motion } from "framer-motion";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type Kind = "success" | "error" | "info";
interface Toast {
  id: number;
  kind: Kind;
  msg: string;
}

const Ctx = createContext<(kind: Kind, msg: string) => void>(() => {});
export const useToast = (): ((kind: Kind, msg: string) => void) => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((kind: Kind, msg: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((t) => [...t, { id, kind, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  }, []);

  const icon = (k: Kind): string => (k === "success" ? "✅" : k === "error" ? "⚠️" : "ℹ️");

  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 50, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="card pointer-events-auto flex items-center gap-2.5 px-4 py-3 text-sm shadow-xl"
            >
              <span>{icon(t.kind)}</span>
              <span className="text-ink">{t.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
