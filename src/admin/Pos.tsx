import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { useToast } from "../components/Toast.tsx";
import { get, post } from "../lib/api.ts";
import { money } from "../lib/format.ts";
import { QrScanner } from "./QrScanner.tsx";

interface Med {
  id: number;
  name: string;
  price: number;
  stock: number;
  strength: string;
  form: string;
  prescription_required: number;
}
interface CartLine {
  id: number;
  name: string;
  price: number;
  qty: number;
}
interface Receipt {
  ref: string;
  subtotal: number;
  discount: number;
  total: number;
  method: string;
  items: Array<{ name: string; qty: number; price: number; line: number }>;
}
interface Rx {
  code: string;
  patient_name: string;
  doctor: string;
  items: Array<{ medicine_name: string; qty: number; dosage: string }>;
}

export function Pos() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Med[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [method, setMethod] = useState("cash");
  const [scan, setScan] = useState(false);
  const [rx, setRx] = useState<Rx | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [receiptQr, setReceiptQr] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(timer.current);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(() => {
      get<{ items: Med[] }>(`/api/medicines?search=${encodeURIComponent(q)}&limit=8`)
        .then((r) => setResults(r.items))
        .catch(() => {});
    }, 200);
  }, [q]);

  function addToCart(m: Med): void {
    if (m.stock <= 0) {
      toast("error", `${m.name} is out of stock`);
      return;
    }
    setCart((c) => {
      const ex = c.find((x) => x.id === m.id);
      if (ex) return c.map((x) => (x.id === m.id ? { ...x, qty: x.qty + 1 } : x));
      return [...c, { id: m.id, name: m.name, price: m.price, qty: 1 }];
    });
  }

  function setQty(id: number, delta: number): void {
    setCart((c) => c.map((x) => (x.id === id ? { ...x, qty: Math.max(1, x.qty + delta) } : x)).filter((x) => x.qty > 0));
  }
  const removeLine = (id: number): void => setCart((c) => c.filter((x) => x.id !== id));

  async function onScan(text: string): Promise<void> {
    setScan(false);
    try {
      if (/^RX/i.test(text)) {
        const p = await get<Rx>(`/api/admin/prescriptions/code/${encodeURIComponent(text)}`);
        setRx(p);
        toast("success", `Prescription ${p.code} loaded`);
      } else {
        const m = await get<Med>(`/api/medicines/sku/${encodeURIComponent(text)}`);
        addToCart(m);
        toast("success", `${m.name} added`);
      }
    } catch (e) {
      toast("error", (e as Error).message);
    }
  }

  const subtotal = cart.reduce((s, x) => s + x.price * x.qty, 0);
  const total = Math.max(0, subtotal - discount);

  async function charge(): Promise<void> {
    if (cart.length === 0) return;
    try {
      const r = await post<Receipt>("/api/admin/sales", {
        items: cart.map((c) => ({ id: c.id, qty: c.qty })),
        discount,
        method,
        prescription_code: rx?.code ?? "",
      });
      setReceipt(r);
      get<{ dataUrl: string }>(`/api/qr?text=${encodeURIComponent(r.ref)}`).then((x) => setReceiptQr(x.dataUrl)).catch(() => {});
      setCart([]);
      setDiscount(0);
      setRx(null);
      toast("success", `Sale ${r.ref} completed`);
    } catch (e) {
      toast("error", (e as Error).message);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
      {/* Search / scan */}
      <div className="space-y-4">
        <div className="card flex items-center gap-2 p-2 pl-4">
          <span>🔍</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search medicine to add…" className="flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-faint" />
          <button onClick={() => setScan(true)} className="btn btn-primary btn-sm">
            ⛶ Scan QR
          </button>
        </div>

        {rx && (
          <div className="card p-4" style={{ background: "var(--primary-soft)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="label !text-primary">Prescription {rx.code}</p>
                <p className="text-sm text-ink">{rx.patient_name} · {rx.doctor}</p>
              </div>
              <button onClick={() => setRx(null)} className="text-sm text-muted hover:text-ink">
                ✕
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {rx.items.map((it, i) => (
                <button key={i} onClick={() => setQ(it.medicine_name)} className="chip !bg-surface" title="Search this medicine">
                  {it.medicine_name} ×{it.qty}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="card divide-y divide-line">
          {results.length === 0 && <p className="p-6 text-center text-sm text-muted">Type to search the catalogue, or scan a QR code.</p>}
          {results.map((m) => (
            <button key={m.id} onClick={() => addToCart(m)} className="flex w-full items-center justify-between p-3.5 text-left transition hover:bg-surface-2">
              <div>
                <p className="text-sm font-medium text-ink">
                  {m.name} {m.prescription_required ? <span className="rx-badge ml-1">Rx</span> : null}
                </p>
                <p className="text-xs capitalize text-faint">{m.form} · {m.strength} · stock {m.stock}</p>
              </div>
              <span className="font-mono text-sm text-ink">{money(m.price)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Cart */}
      <div className="card flex h-fit flex-col p-4">
        <h3 className="text-lg">Cart</h3>
        <div className="mt-3 max-h-[42vh] space-y-2 overflow-auto">
          <AnimatePresence initial={false}>
            {cart.map((x) => (
              <motion.div key={x.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex items-center gap-2 rounded-xl p-2" style={{ background: "var(--surface-2)" }}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">{x.name}</p>
                  <p className="font-mono text-xs text-faint">{money(x.price)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setQty(x.id, -1)} className="btn btn-ghost btn-sm !px-2">
                    −
                  </button>
                  <span className="w-6 text-center font-mono text-sm">{x.qty}</span>
                  <button onClick={() => setQty(x.id, 1)} className="btn btn-ghost btn-sm !px-2">
                    +
                  </button>
                </div>
                <span className="w-16 text-right font-mono text-sm text-ink">{money(x.price * x.qty)}</span>
                <button onClick={() => removeLine(x.id)} className="text-faint hover:text-rose">
                  ✕
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {cart.length === 0 && <p className="py-8 text-center text-sm text-muted">Cart is empty.</p>}
        </div>

        <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between text-muted">
            <span>Subtotal</span>
            <span className="font-mono">{money(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Discount</span>
            <input type="number" min={0} value={discount} onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))} className="input w-24 py-1.5 text-right font-mono" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Method</span>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="select w-28 py-1.5">
              <option value="cash">Cash</option>
              <option value="card">Card</option>
            </select>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
            <span>Total</span>
            <span className="font-mono text-primary">{money(total)}</span>
          </div>
        </div>

        <button onClick={charge} disabled={cart.length === 0} className="btn btn-primary mt-4 w-full disabled:opacity-50">
          Charge {money(total)}
        </button>
      </div>

      <QrScanner open={scan} title="Scan medicine or prescription" onClose={() => setScan(false)} onResult={onScan} />

      {/* Receipt */}
      <AnimatePresence>
        {receipt && (
          <motion.div className="fixed inset-0 z-[95] grid place-items-center bg-black/50 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setReceipt(null)}>
            <motion.div className="card w-full max-w-xs p-6" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <div className="text-center">
                <p className="font-display text-xl">Vitalis Pharmacy</p>
                <p className="font-mono text-xs text-muted">{receipt.ref}</p>
              </div>
              <div className="my-4 space-y-1 border-y border-dashed border-line py-3 text-sm">
                {receipt.items.map((it, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="truncate pr-2 text-ink">{it.name} ×{it.qty}</span>
                    <span className="font-mono text-muted">{money(it.line)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm text-muted">
                <span>Discount</span>
                <span className="font-mono">{money(receipt.discount)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <span>Total ({receipt.method})</span>
                <span className="font-mono text-primary">{money(receipt.total)}</span>
              </div>
              {receiptQr && <img src={receiptQr} alt="receipt qr" className="mx-auto mt-4 h-28 w-28 rounded-lg bg-white p-1.5" />}
              <button onClick={() => setReceipt(null)} className="btn btn-primary mt-4 w-full">
                New sale
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
