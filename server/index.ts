// Single-process server: Express handles /api/* (with node:sqlite) and serves
// the React app — via Vite middleware in dev, from dist/ in production.

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import express from "express";

import { registerApi } from "./api.ts";
import { getDb } from "./db.ts";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const isProd = process.argv.includes("--prod") || process.env.NODE_ENV === "production";
const PORT = Number(process.env.PORT ?? 5300);

async function main(): Promise<void> {
  getDb(); // open + migrate
  const app = express();
  app.use(express.json({ limit: "12mb" }));

  registerApi(app);

  if (isProd) {
    app.use(express.static(resolve(root, "dist")));
    app.get("*", (_req, res) => res.sendFile(resolve(root, "dist", "index.html")));
  } else {
    const { createServer } = await import("vite");
    const vite = await createServer({
      root,
      appType: "spa",
      server: { middlewareMode: true },
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    process.stdout.write(
      `\n  Vitalis Pharmacy ${isProd ? "(production)" : "(dev)"}\n` +
        `  http://localhost:${PORT}\n` +
        `  admin login: admin / Vitalis2026!\n\n`,
    );
  });
}

main().catch((err) => {
  console.error("fatal:", err);
  process.exit(1);
});
