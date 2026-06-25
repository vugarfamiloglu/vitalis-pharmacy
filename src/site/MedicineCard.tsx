import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import { money } from "../lib/format.ts";
import { fadeUp } from "../lib/motion.ts";

export interface Med {
  id: number;
  name: string;
  generic_name?: string;
  strength: string;
  form: string;
  price: number;
  stock?: number;
  prescription_required: number;
  icon: string;
  category?: string;
}

export function MedicineCard({ m }: { m: Med }) {
  const out = (m.stock ?? 99) <= 0;
  return (
    <motion.div variants={fadeUp}>
      <Link
        to={`/medicine/${m.id}`}
        className="card group block h-full p-4 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
        style={{ boxShadow: "0 1px 0 var(--line)" }}
      >
        <div className="flex items-start justify-between">
          <span className="grid h-11 w-11 place-items-center rounded-xl text-xl" style={{ background: "var(--primary-soft)" }}>
            {m.icon}
          </span>
          {m.prescription_required ? (
            <span className="rx-badge">Rx</span>
          ) : (
            <span className="chip !text-primary" style={{ background: "var(--primary-soft)" }}>
              OTC
            </span>
          )}
        </div>
        <h3 className="mt-3 font-display text-[15px] leading-tight text-ink transition group-hover:text-primary">{m.name}</h3>
        <p className="mt-0.5 text-xs capitalize text-muted">
          {m.form} · {m.strength}
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
          <span className="font-mono text-sm font-semibold text-ink">{money(m.price)}</span>
          {m.stock !== undefined &&
            (out ? <span className="text-[11px] font-medium text-rose">Out of stock</span> : <span className="text-[11px] text-faint">In stock</span>)}
        </div>
      </Link>
    </motion.div>
  );
}
