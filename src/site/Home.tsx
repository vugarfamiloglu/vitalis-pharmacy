import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { get } from "../lib/api.ts";
import { fadeUp, stagger } from "../lib/motion.ts";
import { MedicineCard, type Med } from "./MedicineCard.tsx";

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  count: number;
}

const float = (delay: number) => ({
  animate: { y: [0, -18, 0], rotate: [0, 6, 0] },
  transition: { duration: 6, repeat: Infinity, ease: "easeInOut" as const, delay },
});

export function Home() {
  const [cats, setCats] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Med[]>([]);
  const [q, setQ] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    get<Category[]>("/api/categories").then(setCats).catch(() => {});
    get<Med[]>("/api/featured").then(setFeatured).catch(() => {});
  }, []);

  const headline = "Health, delivered with care.".split(" ");

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden grain">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <motion.div {...float(0)} className="absolute left-[8%] top-24 h-16 w-16 rounded-2xl" style={{ background: "var(--primary-soft)" }} />
          <motion.div {...float(1.2)} className="absolute right-[12%] top-40 h-12 w-12 rounded-full" style={{ background: "var(--accent-soft)" }} />
          <motion.div {...float(2)} className="absolute right-[26%] top-16 grid h-14 w-14 place-items-center rounded-2xl text-2xl" style={{ background: "var(--surface)" }}>
            💊
          </motion.div>
          <motion.div {...float(0.6)} className="absolute left-[20%] bottom-10 grid h-12 w-12 place-items-center rounded-full text-xl" style={{ background: "var(--surface)" }}>
            🩺
          </motion.div>
        </div>

        <div className="mx-auto max-w-6xl px-5 pb-20 pt-16 text-center sm:pt-24">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="chip mb-5 !text-primary"
            style={{ background: "var(--primary-soft)" }}
          >
            ✛ Licensed pharmacy · 520+ medicines in stock
          </motion.span>

          <h1 className="mx-auto max-w-3xl text-5xl leading-[1.05] sm:text-6xl">
            {headline.map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className={`inline-block ${word === "care." ? "text-primary" : "text-ink"} mr-[0.25em]`}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mx-auto mt-5 max-w-xl text-lg text-muted"
          >
            Browse our catalogue, scan a prescription, and pick up your medicines —
            with friendly pharmacists who know your name.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            onSubmit={(e) => {
              e.preventDefault();
              nav(`/catalog?search=${encodeURIComponent(q)}`);
            }}
            className="card mx-auto mt-8 flex max-w-lg items-center gap-2 p-2 pl-4 shadow-lg"
          >
            <span className="text-lg">🔍</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search Paracetamol, Amoxicillin, Vitamin D…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-faint"
            />
            <button className="btn btn-primary btn-sm">Search</button>
          </motion.form>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-muted">
            <span>✓ Genuine medicines</span>
            <span>✓ Pharmacist advice</span>
            <span>✓ QR prescription pickup</span>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="label">Browse</p>
            <h2 className="mt-1 text-2xl">Shop by category</h2>
          </div>
          <Link to="/catalog" className="text-sm font-medium text-primary hover:underline">
            View all →
          </Link>
        </div>
        <motion.div
          variants={stagger(0, 0.05)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        >
          {cats.map((c) => (
            <motion.div key={c.id} variants={fadeUp}>
              <Link
                to={`/catalog?category=${c.slug}`}
                className="card group flex flex-col gap-2 p-4 transition-all hover:-translate-y-1 hover:border-primary"
              >
                <span className="text-2xl transition-transform group-hover:scale-110">{c.icon}</span>
                <span className="text-sm font-semibold text-ink">{c.name}</span>
                <span className="font-mono text-xs text-faint">{c.count} items</span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-6">
          <p className="label">Popular right now</p>
          <h2 className="mt-1 text-2xl">Featured medicines</h2>
        </div>
        <motion.div
          variants={stagger(0, 0.05)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
        >
          {featured.map((m) => (
            <MedicineCard key={m.id} m={m} />
          ))}
        </motion.div>
      </section>

      {/* Feature callout: prescription + QR */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="card relative overflow-hidden p-8 sm:p-12"
          style={{ background: "linear-gradient(120deg, var(--primary-soft), var(--surface))" }}
        >
          <div className="grid items-center gap-8 sm:grid-cols-2">
            <div>
              <p className="label !text-primary">Faster pickup</p>
              <h2 className="mt-2 text-3xl">Scan your prescription QR</h2>
              <p className="mt-3 max-w-md text-muted">
                Got an e-prescription? Our staff scan its QR code at the counter,
                your medicines are dispensed in seconds — no queues, no paperwork.
              </p>
              <div className="mt-6 flex gap-3">
                <Link to="/catalog" className="btn btn-primary">
                  Browse catalogue
                </Link>
                <Link to="/admin" className="btn btn-ghost">
                  Staff POS →
                </Link>
              </div>
            </div>
            <div className="flex justify-center">
              <motion.div
                animate={{ rotate: [0, 2, -2, 0] }}
                transition={{ duration: 8, repeat: Infinity }}
                className="card grid h-44 w-44 place-items-center p-4 shadow-xl"
              >
                <div className="grid grid-cols-5 gap-1">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <span
                      key={i}
                      className="h-5 w-5 rounded-[3px]"
                      style={{ background: (i * 7 + 3) % 3 === 0 ? "var(--ink)" : "transparent" }}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
