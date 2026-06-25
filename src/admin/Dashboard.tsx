import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { get } from "../lib/api.ts";
import { money } from "../lib/format.ts";
import { fadeUp, stagger } from "../lib/motion.ts";
import { RevenueChart } from "./RevenueChart.tsx";

interface Stats {
  totalMedicines: number;
  lowStock: number;
  outOfStock: number;
  expiringSoon: number;
  stockValue: number;
  todayRevenue: number;
  monthRevenue: number;
  salesCount: number;
  revenueTrend: Array<{ d: string; total: number }>;
  topSellers: Array<{ name: string; qty: number; revenue: number }>;
  categoryBreakdown: Array<{ name: string; icon: string; count: number }>;
  lowStockList: Array<{ id: number; name: string; stock: number; reorder_level: number }>;
}

export function Dashboard() {
  const [s, setS] = useState<Stats | null>(null);
  useEffect(() => {
    get<Stats>("/api/admin/stats").then(setS).catch(() => {});
  }, []);
  if (!s) return <div className="text-muted">Loading…</div>;

  const kpis = [
    { label: "Medicines", value: String(s.totalMedicines), icon: "💊", tint: "var(--primary)" },
    { label: "Revenue (total)", value: money(s.monthRevenue), icon: "₼", tint: "var(--primary-2)" },
    { label: "Low stock", value: String(s.lowStock + s.outOfStock), icon: "📉", tint: "var(--amber)" },
    { label: "Expiring ≤60d", value: String(s.expiringSoon), icon: "⏳", tint: "var(--rose)" },
  ];
  const maxQty = Math.max(...s.topSellers.map((t) => t.qty), 1);

  return (
    <motion.div variants={stagger(0, 0.06)} initial="hidden" animate="show" className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <motion.div key={k.label} variants={fadeUp} className="card relative overflow-hidden p-5">
            <span className="absolute left-0 top-0 h-full w-1" style={{ background: k.tint }} />
            <div className="flex items-center justify-between">
              <span className="label">{k.label}</span>
              <span className="text-lg">{k.icon}</span>
            </div>
            <p className="mt-3 font-mono text-2xl font-semibold text-ink">{k.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue trend */}
        <motion.div variants={fadeUp} className="card p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="label">Last 14 days</p>
              <h3 className="text-lg">Revenue trend</h3>
            </div>
            <span className="chip">{s.salesCount} sales</span>
          </div>
          <RevenueChart data={s.revenueTrend} />
        </motion.div>

        {/* Top sellers */}
        <motion.div variants={fadeUp} className="card p-5">
          <p className="label">Best sellers</p>
          <h3 className="mb-3 text-lg">Top medicines</h3>
          <div className="space-y-3">
            {s.topSellers.map((t) => (
              <div key={t.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate pr-2 text-ink">{t.name}</span>
                  <span className="font-mono text-xs text-muted">{t.qty}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(t.qty / maxQty) * 100}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: "var(--primary)" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category breakdown */}
        <motion.div variants={fadeUp} className="card p-5">
          <p className="label">Inventory</p>
          <h3 className="mb-3 text-lg">By category</h3>
          <div className="grid grid-cols-2 gap-2">
            {s.categoryBreakdown.map((c) => (
              <div key={c.name} className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: "var(--surface-2)" }}>
                <span className="flex items-center gap-2 text-sm text-ink">
                  <span>{c.icon}</span> {c.name}
                </span>
                <span className="font-mono text-xs text-muted">{c.count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Low stock */}
        <motion.div variants={fadeUp} className="card p-5">
          <p className="label">Needs reorder</p>
          <h3 className="mb-3 text-lg">Low stock alerts</h3>
          <div className="space-y-2">
            {s.lowStockList.length === 0 && <p className="text-sm text-muted">All good — nothing low.</p>}
            {s.lowStockList.map((m) => (
              <div key={m.id} className="flex items-center justify-between border-b border-line pb-2 text-sm">
                <span className="text-ink">{m.name}</span>
                <span className={`font-mono text-xs ${m.stock === 0 ? "text-rose" : "text-amber"}`}>
                  {m.stock} / {m.reorder_level}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
