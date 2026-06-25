import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { get } from "../lib/api.ts";
import { stagger } from "../lib/motion.ts";
import { MedicineCard, type Med } from "./MedicineCard.tsx";

interface Page {
  items: Med[];
  total: number;
  pages: number;
  page: number;
}
interface Cat {
  slug: string;
  name: string;
  icon: string;
}

export function Catalog() {
  const [params, setParams] = useSearchParams();
  const search = params.get("search") ?? "";
  const category = params.get("category") ?? "";
  const sort = params.get("sort") ?? "name";
  const page = Number(params.get("page") ?? 1);

  const [data, setData] = useState<Page>({ items: [], total: 0, pages: 1, page: 1 });
  const [cats, setCats] = useState<Cat[]>([]);
  const [input, setInput] = useState(search);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get<Cat[]>("/api/categories").then(setCats).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams({ search, category, sort, page: String(page), limit: "24" });
    get<Page>(`/api/medicines?${qs}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, category, sort, page]);

  function update(patch: Record<string, string | undefined>): void {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    if (!("page" in patch)) p.set("page", "1");
    setParams(p);
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <p className="label">Catalogue</p>
      <h1 className="mt-1 text-3xl">All medicines</h1>

      {/* Controls */}
      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              update({ search: input || undefined });
            }}
            className="card flex flex-1 items-center gap-2 p-1.5 pl-3.5"
          >
            <span>🔍</span>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search by name, generic or SKU…"
              className="flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:text-faint"
            />
            <button className="btn btn-primary btn-sm">Search</button>
          </form>
          <select value={sort} onChange={(e) => update({ sort: e.target.value })} className="select max-w-[170px]">
            <option value="name">Name A–Z</option>
            <option value="price-asc">Price ↑</option>
            <option value="price-desc">Price ↓</option>
            <option value="stock">Most in stock</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => update({ category: undefined })}
            className="chip transition"
            style={!category ? { background: "var(--primary)", color: "#fff" } : undefined}
          >
            All
          </button>
          {cats.map((c) => (
            <button
              key={c.slug}
              onClick={() => update({ category: c.slug })}
              className="chip transition"
              style={category === c.slug ? { background: "var(--primary)", color: "#fff" } : undefined}
            >
              <span>{c.icon}</span> {c.name}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-5 text-sm text-muted">
        {loading ? "Loading…" : `${data.total} result${data.total === 1 ? "" : "s"}`}
        {search && ` for “${search}”`}
      </p>

      <motion.div
        key={`${search}-${category}-${sort}-${page}`}
        variants={stagger(0, 0.03)}
        initial="hidden"
        animate="show"
        className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
      >
        {data.items.map((m) => (
          <MedicineCard key={m.id} m={m} />
        ))}
      </motion.div>

      {!loading && data.items.length === 0 && (
        <div className="card mt-6 grid place-items-center gap-2 p-12 text-center">
          <span className="text-3xl">🔎</span>
          <p className="text-muted">No medicines match your search.</p>
        </div>
      )}

      {/* Pagination */}
      {data.pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => update({ page: String(page - 1) })} className="btn btn-ghost btn-sm disabled:opacity-40">
            ← Prev
          </button>
          <span className="px-3 font-mono text-sm text-muted">
            {page} / {data.pages}
          </span>
          <button disabled={page >= data.pages} onClick={() => update({ page: String(page + 1) })} className="btn btn-ghost btn-sm disabled:opacity-40">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
