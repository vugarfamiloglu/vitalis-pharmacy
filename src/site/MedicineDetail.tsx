import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { get } from "../lib/api.ts";
import { money, shortDate } from "../lib/format.ts";

interface Detail {
  id: number;
  sku: string;
  name: string;
  generic_name: string;
  category: string;
  icon: string;
  manufacturer: string;
  form: string;
  strength: string;
  price: number;
  stock: number;
  expiry: string;
  prescription_required: number;
  description: string;
}

export function MedicineDetail() {
  const { id } = useParams();
  const [m, setM] = useState<Detail | null>(null);
  const [qr, setQr] = useState("");

  useEffect(() => {
    get<Detail>(`/api/medicines/${id}`)
      .then((d) => {
        setM(d);
        get<{ dataUrl: string }>(`/api/qr?text=${encodeURIComponent(d.sku)}`).then((r) => setQr(r.dataUrl)).catch(() => {});
      })
      .catch(() => {});
  }, [id]);

  if (!m) return <div className="mx-auto max-w-4xl px-5 py-20 text-center text-muted">Loading…</div>;

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <Link to="/catalog" className="text-sm text-muted hover:text-ink">
        ← Back to catalogue
      </Link>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card mt-4 grid gap-8 p-6 sm:grid-cols-[1fr_auto] sm:p-8"
      >
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-2xl text-3xl" style={{ background: "var(--primary-soft)" }}>
              {m.icon}
            </span>
            <div>
              <p className="label">{m.category}</p>
              <h1 className="text-2xl">{m.name}</h1>
            </div>
          </div>

          {m.prescription_required ? (
            <div className="mt-4 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
              <span>⚠️</span> Prescription required — present a valid prescription to purchase.
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
              <span>✓</span> Available over the counter.
            </div>
          )}

          <p className="mt-5 text-muted">{m.description}</p>

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Row k="Generic name" v={m.generic_name} />
            <Row k="Manufacturer" v={m.manufacturer} />
            <Row k="Form" v={m.form} />
            <Row k="Strength" v={m.strength} />
            <Row k="SKU" v={m.sku} mono />
            <Row k="Expiry" v={shortDate(m.expiry)} mono />
          </dl>

          <div className="mt-7 flex items-center gap-4">
            <span className="font-mono text-2xl font-semibold text-ink">{money(m.price)}</span>
            {m.stock > 0 ? (
              <span className="chip !text-primary" style={{ background: "var(--primary-soft)" }}>
                {m.stock} in stock
              </span>
            ) : (
              <span className="chip !text-rose">Out of stock</span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 sm:border-l sm:border-line sm:pl-8">
          {qr && <img src={qr} alt="Medicine QR" className="h-40 w-40 rounded-xl bg-white p-2" />}
          <p className="text-center text-xs text-faint">Scan at the counter</p>
        </div>
      </motion.div>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-faint">{k}</dt>
      <dd className={`mt-0.5 capitalize text-ink ${mono ? "font-mono text-[13px] normal-case" : ""}`}>{v || "—"}</dd>
    </div>
  );
}
