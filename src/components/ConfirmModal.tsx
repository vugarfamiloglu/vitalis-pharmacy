import { AnimatePresence, motion } from "framer-motion";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ open, title, message, confirmLabel = "Confirm", danger, onConfirm, onCancel }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] grid place-items-center bg-black/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            className="card w-full max-w-sm p-6 shadow-2xl"
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg">{title}</h3>
            <p className="mt-2 text-sm text-muted">{message}</p>
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn btn-ghost btn-sm" onClick={onCancel}>
                Cancel
              </button>
              <button
                className="btn btn-sm text-white"
                style={{ background: danger ? "var(--rose)" : "var(--primary)" }}
                onClick={onConfirm}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
