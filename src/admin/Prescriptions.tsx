import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { useToast } from "../components/Toast.tsx";
import { get, post } from "../lib/api.ts";
import { fadeUp, stagger } from "../lib/motion.ts";
import { QrScanner } from "./QrScanner.tsx";

interface Rx {
  id: number;
  code: string;
  patient_name: string;
  doctor: string;
  status: string;
  created_at: string;
  items: Array<{ medicine_name: string; qty: number; dosage: string }>;
}
interface Found {
  id: number;
  name: string;
  price: number;
}

export function Prescriptions() {
  const toast = useToast();
  const [list, setList] = useState<Rx[]>([]);
  const [scan, setScan] = useState(false);
  const [highlight, setHighlight] = useState("");
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [ocrFound, setOcrFound] = useState<Found[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  function load(): void {
    get<Rx[]>("/api/admin/prescriptions").then(setList).catch(() => {});
  }
  useEffect(load, []);

  async function dispense(id: number): Promise<void> {
    await post(`/api/admin/prescriptions/${id}/dispense`, {});
    toast("success", "Prescription dispensed");
    load();
  }

  async function onScan(code: string): Promise<void> {
    setScan(false);
    try {
      const p = await get<Rx>(`/api/admin/prescriptions/code/${encodeURIComponent(code)}`);
      setHighlight(p.code);
      toast("success", `Found ${p.code} — ${p.patient_name}`);
      document.getElementById(`rx-${p.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (e) {
      toast("error", (e as Error).message);
    }
  }

  // OCR: read a prescription image, extract text, match medicine names.
  async function onFile(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrBusy(true);
    setOcrText("");
    setOcrFound([]);
    try {
      const Tesseract = await import("tesseract.js");
      const { data } = await Tesseract.recognize(file, "eng");
      const text = data.text.trim();
      setOcrText(text);
      const tokens = Array.from(new Set(text.split(/[^A-Za-z]+/).filter((t) => t.length >= 4))).slice(0, 10);
      const matches = new Map<number, Found>();
      for (const tok of tokens) {
        try {
          const r = await get<{ items: Array<Found & { name: string }> }>(`/api/medicines?search=${encodeURIComponent(tok)}&limit=3`);
          for (const m of r.items) matches.set(m.id, { id: m.id, name: m.name, price: m.price });
        } catch {
          /* ignore */
        }
        if (matches.size >= 8) break;
      }
      setOcrFound([...matches.values()]);
      toast(matches.size ? "success" : "info", matches.size ? `Detected ${matches.size} medicines` : "No medicines detected");
    } catch {
      toast("error", "OCR failed — try a clearer image");
    } finally {
      setOcrBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="mb-4 flex items-center gap-2">
          <button onClick={() => setScan(true)} className="btn btn-primary btn-sm">
            ⛶ Scan prescription QR
          </button>
          <span className="chip">{list.length} prescriptions</span>
        </div>
        <motion.div variants={stagger(0, 0.05)} initial="hidden" animate="show" className="space-y-3">
          {list.map((p) => (
            <motion.div
              key={p.id}
              id={`rx-${p.id}`}
              variants={fadeUp}
              className="card p-4 transition"
              style={highlight === p.code ? { borderColor: "var(--primary)", boxShadow: "0 0 0 2px var(--primary-soft)" } : undefined}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-xs text-faint">{p.code}</p>
                  <h3 className="text-base">{p.patient_name}</h3>
                  <p className="text-sm text-muted">{p.doctor}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="chip" style={p.status === "dispensed" ? { background: "var(--primary-soft)", color: "var(--primary)" } : { background: "var(--accent-soft)", color: "var(--accent)" }}>
                    {p.status}
                  </span>
                  {p.status === "pending" && (
                    <button onClick={() => dispense(p.id)} className="btn btn-primary btn-sm">
                      Dispense
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                {p.items.map((it, i) => (
                  <span key={i} className="chip">
                    {it.medicine_name} ×{it.qty} · {it.dosage}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* OCR panel */}
      <div className="card h-fit p-5">
        <p className="label">Prescription reader</p>
        <h3 className="mt-1 text-lg">Read from image</h3>
        <p className="mt-1 text-sm text-muted">Upload a photo of a paper prescription — OCR extracts the text and detects medicines.</p>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
        <button onClick={() => fileRef.current?.click()} disabled={ocrBusy} className="btn btn-ghost mt-4 w-full disabled:opacity-50">
          {ocrBusy ? "Reading…" : "📄 Upload prescription image"}
        </button>

        {ocrFound.length > 0 && (
          <div className="mt-4">
            <p className="label">Detected medicines</p>
            <div className="mt-2 space-y-1">
              {ocrFound.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm" style={{ background: "var(--surface-2)" }}>
                  <span className="truncate text-ink">{m.name}</span>
                  <span className="font-mono text-xs text-muted">{m.price.toFixed(2)} ₼</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {ocrText && (
          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-faint">Raw OCR text</summary>
            <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap rounded-lg p-2 font-mono text-[11px] text-muted" style={{ background: "var(--surface-2)" }}>
              {ocrText}
            </pre>
          </details>
        )}
      </div>

      <QrScanner open={scan} title="Scan prescription QR (RX-…)" onClose={() => setScan(false)} onResult={onScan} />
    </div>
  );
}
