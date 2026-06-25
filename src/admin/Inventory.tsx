import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { useToast } from "../components/Toast.tsx";
import { get, put } from "../lib/api.ts";
import { money, shortDate, daysUntil } from "../lib/format.ts";

interface Row {
  id: number;
  sku: string;
  name: string;
  strength: string;
  form: string;
  category: string;
  manufacturer: string;
  price: number;
  cost: number;
  stock: number;
  reorder_level: number;
  expiry: string;
  prescription_required: number;
}

const COLS = [
  { key: "sku", label: "SKU", w: 96 },
  { key: "name", label: "Name", w: 220 },
  { key: "category", label: "Category", w: 140 },
  { key: "price", label: "Price", w: 90 },
  { key: "stock", label: "Stock", w: 90 },
  { key: "expiry", label: "Expiry", w: 120 },
  { key: "actions", label: "", w: 80 },
];

export function Inventory() {
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Row | null>(null);
  const [widths, setWidths] = useState<number[]>(COLS.map((c) => c.w));
  const drag = useRef<{ idx: number; startX: number; startW: number } | null>(null);

  function load(): void {
    get<Row[]>(`/api/admin/medicines?search=${encodeURIComponent(q)}`).then(setRows).catch(() => {});
  }
  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const move = (e: MouseEvent): void => {
      if (!drag.current) return;
      const { idx, startX, startW } = drag.current;
      setWidths((w) => w.map((x, i) => (i === idx ? Math.max(60, startW + (e.clientX - startX)) : x)));
    };
    const up = (): void => {
      drag.current = null;
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, []);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="card flex flex-1 items-center gap-2 p-1.5 pl-4">
          <span>🔍</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, SKU or generic…" className="flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:text-faint" />
        </div>
        <span className="chip">{rows.length} items</span>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
          <thead>
            <tr className="border-b border-line">
              {COLS.map((c, i) => (
                <th key={c.key} style={{ width: widths[i] }} className="relative select-none px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-faint">
                  {c.label}
                  {i < COLS.length - 1 && (
                    <span
                      onMouseDown={(e) => {
                        drag.current = { idx: i, startX: e.clientX, startW: widths[i] as number };
                        e.preventDefault();
                      }}
                      className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/40"
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const d = daysUntil(r.expiry);
              return (
                <tr key={r.id} className="border-b border-line transition hover:bg-surface-2">
                  <td className="truncate px-3 py-2.5 font-mono text-xs text-muted">{r.sku}</td>
                  <td className="truncate px-3 py-2.5">
                    <span className="text-ink">{r.name}</span>
                    {r.prescription_required ? <span className="rx-badge ml-1.5">Rx</span> : null}
                  </td>
                  <td className="truncate px-3 py-2.5 text-muted">{r.category}</td>
                  <td className="px-3 py-2.5 font-mono">{money(r.price)}</td>
                  <td className="px-3 py-2.5">
                    <span className={`font-mono ${r.stock === 0 ? "text-rose" : r.stock <= r.reorder_level ? "text-amber" : "text-ink"}`}>{r.stock}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`font-mono text-xs ${d < 60 ? "text-rose" : "text-muted"}`}>{shortDate(r.expiry)}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button onClick={() => setEdit(r)} className="btn btn-ghost btn-sm">
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {edit && (
          <motion.div className="fixed inset-0 z-[90] grid place-items-center bg-black/40 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEdit(null)}>
            <motion.div className="card w-full max-w-sm p-6" initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg">{edit.name}</h3>
              <p className="font-mono text-xs text-muted">{edit.sku}</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Field label="Price (₼)" value={edit.price} onChange={(v) => setEdit({ ...edit, price: v })} />
                <Field label="Stock" value={edit.stock} onChange={(v) => setEdit({ ...edit, stock: v })} />
                <Field label="Reorder level" value={edit.reorder_level} onChange={(v) => setEdit({ ...edit, reorder_level: v })} />
                <div>
                  <label className="label">Expiry</label>
                  <input type="date" value={edit.expiry?.slice(0, 10)} onChange={(e) => setEdit({ ...edit, expiry: e.target.value })} className="input mt-1.5" />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button className="btn btn-ghost btn-sm" onClick={() => setEdit(null)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={async () => {
                    await put(`/api/admin/medicines/${edit.id}`, { price: edit.price, stock: edit.stock, reorder_level: edit.reorder_level, expiry: edit.expiry });
                    toast("success", "Saved");
                    setEdit(null);
                    load();
                  }}
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="input mt-1.5 font-mono" />
    </div>
  );
}
