import { AnimatePresence, motion } from "framer-motion";
import jsQR from "jsqr";
import { useEffect, useRef, useState } from "react";

interface Props {
  open: boolean;
  title?: string;
  onClose: () => void;
  onResult: (text: string) => void;
}

export function QrScanner({ open, title = "Scan QR code", onClose, onResult }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState("");
  const [manual, setManual] = useState("");

  useEffect(() => {
    if (!open) return;
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    const canvas = document.createElement("canvas");

    const cleanup = (): void => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          await v.play();
        }
        const tick = (): void => {
          if (stopped) return;
          const vid = videoRef.current;
          if (vid && vid.readyState === vid.HAVE_ENOUGH_DATA) {
            canvas.width = vid.videoWidth;
            canvas.height = vid.videoHeight;
            const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
            ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(img.data, img.width, img.height);
            if (code?.data) {
              cleanup();
              onResult(code.data.trim());
              return;
            }
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        setErr("Camera unavailable — type the code instead.");
      }
    })();

    return cleanup;
  }, [open, onResult]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[95] grid place-items-center bg-black/50 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            className="card w-full max-w-sm overflow-hidden p-5"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg">{title}</h3>
            <div className="relative mt-3 aspect-square overflow-hidden rounded-xl bg-black">
              <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
              <motion.div
                className="pointer-events-none absolute inset-x-6 top-6 h-0.5 rounded"
                style={{ background: "var(--primary)" }}
                animate={{ top: ["6%", "92%", "6%"] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="pointer-events-none absolute inset-4 rounded-xl border-2 border-white/40" />
            </div>
            {err && <p className="mt-2 text-xs text-rose">{err}</p>}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (manual.trim()) onResult(manual.trim());
              }}
              className="mt-3 flex gap-2"
            >
              <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="…or enter code (e.g. VP-00001)" className="input" />
              <button className="btn btn-primary btn-sm">Use</button>
            </form>
            <button onClick={onClose} className="btn btn-ghost btn-sm mt-2 w-full">
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
