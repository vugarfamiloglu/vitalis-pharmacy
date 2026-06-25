// REST API: catalog, auth (HMAC-signed cookie session), and the admin surface
// (inventory CRUD, POS checkout, prescriptions, dashboard stats, QR, logs).

import { createHmac, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import bcrypt from "bcryptjs";
import type { Express, NextFunction, Request, Response } from "express";
import QRCode from "qrcode";

import { audit, getDb } from "./db.ts";

const here = dirname(fileURLToPath(import.meta.url));
const KEY_PATH = resolve(here, "..", "data", ".session-key");

function sessionSecret(): Buffer {
  mkdirSync(dirname(KEY_PATH), { recursive: true });
  if (existsSync(KEY_PATH)) return readFileSync(KEY_PATH);
  const key = randomBytes(32);
  writeFileSync(KEY_PATH, key, { mode: 0o600 });
  return key;
}
const SECRET = sessionSecret();

function sign(username: string): string {
  const payload = Buffer.from(`${username}:${Date.now() + 12 * 3600_000}`).toString("base64url");
  const mac = createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${payload}.${mac}`;
}
function verify(token: string | undefined): { username: string } | null {
  if (!token) return null;
  const [payload, mac] = token.split(".");
  if (!payload || !mac) return null;
  const want = createHmac("sha256", SECRET).update(payload).digest("hex");
  if (mac !== want) return null;
  const [username, expiry] = Buffer.from(payload, "base64url").toString().split(":");
  if (!username || !expiry || Date.now() > Number(expiry)) return null;
  return { username };
}
function cookies(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  (req.headers.cookie ?? "").split(";").forEach((p) => {
    const i = p.indexOf("=");
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

interface AuthedRequest extends Request {
  user?: { username: string; role: string };
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const sess = verify(cookies(req)["vitalis_session"]);
  if (!sess) {
    res.status(401).json({ error: "not authenticated" });
    return;
  }
  const u = getDb().prepare("SELECT username,role FROM users WHERE username=?").get(sess.username) as
    | { username: string; role: string }
    | undefined;
  if (!u) {
    res.status(401).json({ error: "unknown user" });
    return;
  }
  req.user = u;
  next();
}

export function registerApi(app: Express): void {
  const db = getDb();

  // --- public catalog ----------------------------------------------------
  app.get("/api/categories", (_req, res) => {
    res.json(
      db
        .prepare(
          `SELECT c.id,c.name,c.slug,c.icon,COUNT(m.id) AS count
           FROM categories c LEFT JOIN medicines m ON m.category_id=c.id
           GROUP BY c.id ORDER BY c.name`,
        )
        .all(),
    );
  });

  app.get("/api/medicines", (req, res) => {
    const q = String(req.query.search ?? "").trim();
    const cat = String(req.query.category ?? "").trim();
    const sort = String(req.query.sort ?? "name");
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(60, Math.max(6, Number(req.query.limit ?? 24)));
    const where: string[] = [];
    const args: unknown[] = [];
    if (q) {
      where.push("(m.name LIKE ? OR m.generic_name LIKE ? OR m.sku LIKE ?)");
      args.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (cat) {
      where.push("c.slug = ?");
      args.push(cat);
    }
    const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";
    const order =
      sort === "price-asc" ? "m.price ASC" : sort === "price-desc" ? "m.price DESC" : sort === "stock" ? "m.stock DESC" : "m.name ASC";
    const total = (db.prepare(`SELECT COUNT(*) c FROM medicines m JOIN categories c ON m.category_id=c.id ${whereSql}`).get(...args) as { c: number }).c;
    const rows = db
      .prepare(
        `SELECT m.id,m.sku,m.name,m.generic_name,m.form,m.strength,m.price,m.stock,m.prescription_required,
                m.manufacturer,m.expiry,c.name AS category,c.slug AS category_slug,c.icon
         FROM medicines m JOIN categories c ON m.category_id=c.id
         ${whereSql} ORDER BY ${order} LIMIT ? OFFSET ?`,
      )
      .all(...args, limit, (page - 1) * limit);
    res.json({ total, page, limit, pages: Math.ceil(total / limit), items: rows });
  });

  app.get("/api/medicines/:id", (req, res) => {
    const m = db
      .prepare(
        `SELECT m.*, c.name AS category, c.slug AS category_slug, c.icon
         FROM medicines m JOIN categories c ON m.category_id=c.id WHERE m.id=?`,
      )
      .get(Number(req.params.id));
    if (!m) {
      res.status(404).json({ error: "not found" });
      return;
    }
    res.json(m);
  });

  app.get("/api/medicines/sku/:sku", (req, res) => {
    const m = db
      .prepare(`SELECT m.*, c.name AS category, c.icon FROM medicines m JOIN categories c ON m.category_id=c.id WHERE m.sku=?`)
      .get(String(req.params.sku));
    if (!m) {
      res.status(404).json({ error: "not found" });
      return;
    }
    res.json(m);
  });

  app.get("/api/featured", (_req, res) => {
    res.json(
      db
        .prepare(
          `SELECT m.id,m.name,m.strength,m.form,m.price,m.prescription_required,c.icon,c.name AS category
           FROM medicines m JOIN categories c ON m.category_id=c.id
           WHERE m.stock > 20 ORDER BY RANDOM() LIMIT 8`,
        )
        .all(),
    );
  });

  app.get("/api/qr", async (req, res) => {
    const text = String(req.query.text ?? "");
    if (!text) {
      res.status(400).json({ error: "text required" });
      return;
    }
    res.json({ dataUrl: await QRCode.toDataURL(text, { margin: 1, width: 240 }) });
  });

  // --- auth --------------------------------------------------------------
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body ?? {};
    const u = db.prepare("SELECT username,password_hash,full_name,role FROM users WHERE username=?").get(String(username ?? "")) as
      | { username: string; password_hash: string; full_name: string; role: string }
      | undefined;
    if (!u || !bcrypt.compareSync(String(password ?? ""), u.password_hash)) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    res.setHeader(
      "Set-Cookie",
      `vitalis_session=${sign(u.username)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${12 * 3600}`,
    );
    audit(u.username, "login");
    res.json({ username: u.username, full_name: u.full_name, role: u.role });
  });

  app.post("/api/auth/logout", (_req, res) => {
    res.setHeader("Set-Cookie", "vitalis_session=; Path=/; HttpOnly; Max-Age=0");
    res.json({ ok: true });
  });

  app.get("/api/auth/me", (req: AuthedRequest, res) => {
    const sess = verify(cookies(req)["vitalis_session"]);
    if (!sess) {
      res.status(401).json({ error: "not authenticated" });
      return;
    }
    res.json(db.prepare("SELECT username,full_name,role FROM users WHERE username=?").get(sess.username));
  });

  // --- admin: dashboard stats -------------------------------------------
  app.get("/api/admin/stats", requireAuth, (_req, res) => {
    const one = <T>(sql: string, ...a: unknown[]): T => db.prepare(sql).get(...a) as T;
    const totalMedicines = one<{ c: number }>("SELECT COUNT(*) c FROM medicines").c;
    const lowStock = one<{ c: number }>("SELECT COUNT(*) c FROM medicines WHERE stock>0 AND stock<=reorder_level").c;
    const outOfStock = one<{ c: number }>("SELECT COUNT(*) c FROM medicines WHERE stock=0").c;
    const expiringSoon = one<{ c: number }>("SELECT COUNT(*) c FROM medicines WHERE expiry <= date('now','+60 day')").c;
    const stockValue = one<{ v: number }>("SELECT COALESCE(SUM(cost*stock),0) v FROM medicines").v;
    const todayRevenue = one<{ v: number }>("SELECT COALESCE(SUM(total),0) v FROM sales WHERE date(created_at)=date('2026-06-25')").v;
    const monthRevenue = one<{ v: number }>("SELECT COALESCE(SUM(total),0) v FROM sales").v;
    const salesCount = one<{ c: number }>("SELECT COUNT(*) c FROM sales").c;
    const revenueTrend = db
      .prepare(
        `SELECT date(created_at) d, ROUND(SUM(total),2) total FROM sales
         GROUP BY date(created_at) ORDER BY d DESC LIMIT 14`,
      )
      .all()
      .reverse();
    const topSellers = db
      .prepare(`SELECT name, SUM(qty) qty, ROUND(SUM(line_total),2) revenue FROM sale_items GROUP BY name ORDER BY qty DESC LIMIT 6`)
      .all();
    const categoryBreakdown = db
      .prepare(`SELECT c.name, c.icon, COUNT(m.id) count FROM categories c LEFT JOIN medicines m ON m.category_id=c.id GROUP BY c.id ORDER BY count DESC`)
      .all();
    const lowStockList = db
      .prepare(`SELECT id,name,stock,reorder_level FROM medicines WHERE stock<=reorder_level ORDER BY stock ASC LIMIT 8`)
      .all();
    res.json({
      totalMedicines, lowStock, outOfStock, expiringSoon, stockValue,
      todayRevenue, monthRevenue, salesCount, revenueTrend, topSellers, categoryBreakdown, lowStockList,
    });
  });

  // --- admin: inventory CRUD --------------------------------------------
  app.get("/api/admin/medicines", requireAuth, (req, res) => {
    const q = String(req.query.search ?? "").trim();
    const args: unknown[] = [];
    let where = "";
    if (q) {
      where = "WHERE m.name LIKE ? OR m.sku LIKE ? OR m.generic_name LIKE ?";
      args.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    res.json(
      db
        .prepare(
          `SELECT m.id,m.sku,m.name,m.strength,m.form,m.price,m.cost,m.stock,m.reorder_level,m.expiry,
                  m.prescription_required,m.manufacturer,c.name AS category
           FROM medicines m JOIN categories c ON m.category_id=c.id ${where} ORDER BY m.name LIMIT 600`,
        )
        .all(...args),
    );
  });

  app.put("/api/admin/medicines/:id", requireAuth, (req: AuthedRequest, res) => {
    const { price, stock, reorder_level, expiry } = req.body ?? {};
    db.prepare("UPDATE medicines SET price=?,stock=?,reorder_level=?,expiry=? WHERE id=?").run(
      Number(price), Number(stock), Number(reorder_level), String(expiry ?? ""), Number(req.params.id),
    );
    audit(req.user?.username ?? "", "update_medicine", req.params.id);
    res.json({ ok: true });
  });

  // --- admin: prescriptions ---------------------------------------------
  app.get("/api/admin/prescriptions", requireAuth, (_req, res) => {
    const list = db.prepare("SELECT * FROM prescriptions ORDER BY id DESC").all() as Array<{ id: number }>;
    for (const p of list) {
      (p as Record<string, unknown>).items = db.prepare("SELECT medicine_name,qty,dosage FROM prescription_items WHERE prescription_id=?").all(p.id);
    }
    res.json(list);
  });

  app.get("/api/admin/prescriptions/code/:code", requireAuth, (req, res) => {
    const p = db.prepare("SELECT * FROM prescriptions WHERE code=?").get(String(req.params.code)) as { id: number } | undefined;
    if (!p) {
      res.status(404).json({ error: "prescription not found" });
      return;
    }
    (p as Record<string, unknown>).items = db.prepare("SELECT medicine_name,qty,dosage FROM prescription_items WHERE prescription_id=?").all(p.id);
    res.json(p);
  });

  app.post("/api/admin/prescriptions/:id/dispense", requireAuth, (req: AuthedRequest, res) => {
    db.prepare("UPDATE prescriptions SET status='dispensed' WHERE id=?").run(Number(req.params.id));
    audit(req.user?.username ?? "", "dispense_prescription", req.params.id);
    res.json({ ok: true });
  });

  // --- admin: POS checkout ----------------------------------------------
  app.post("/api/admin/sales", requireAuth, (req: AuthedRequest, res) => {
    const body = req.body ?? {};
    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) {
      res.status(400).json({ error: "empty cart" });
      return;
    }
    let subtotal = 0;
    const lines: Array<{ id: number; name: string; qty: number; price: number; line: number }> = [];
    for (const it of items) {
      const m = db.prepare("SELECT id,name,price,stock FROM medicines WHERE id=?").get(Number(it.id)) as
        | { id: number; name: string; price: number; stock: number }
        | undefined;
      if (!m) continue;
      const qty = Math.max(1, Number(it.qty) || 1);
      if (m.stock < qty) {
        res.status(400).json({ error: `Insufficient stock for ${m.name}` });
        return;
      }
      const line = +(m.price * qty).toFixed(2);
      subtotal += line;
      lines.push({ id: m.id, name: m.name, qty, price: m.price, line });
    }
    const discount = +(Number(body.discount) || 0).toFixed(2);
    const total = +(subtotal - discount).toFixed(2);
    const ref = "S-" + Date.now().toString(36).toUpperCase();
    const r = db
      .prepare("INSERT INTO sales(ref,cashier,subtotal,discount,tax,total,paid,method,prescription_code) VALUES(?,?,?,?,?,?,?,?,?)")
      .run(ref, req.user?.username ?? "", subtotal, discount, 0, total, total, String(body.method ?? "cash"), String(body.prescription_code ?? ""));
    const sid = Number(r.lastInsertRowid);
    const insItem = db.prepare("INSERT INTO sale_items(sale_id,medicine_id,name,qty,price,line_total) VALUES(?,?,?,?,?,?)");
    const dec = db.prepare("UPDATE medicines SET stock=stock-? WHERE id=?");
    for (const l of lines) {
      insItem.run(sid, l.id, l.name, l.qty, l.price, l.line);
      dec.run(l.qty, l.id);
    }
    audit(req.user?.username ?? "", "sale", ref);
    res.json({ ref, subtotal, discount, total, method: body.method ?? "cash", items: lines, at: new Date().toISOString() });
  });

  app.get("/api/admin/sales", requireAuth, (_req, res) => {
    res.json(db.prepare("SELECT id,ref,cashier,total,method,created_at FROM sales ORDER BY id DESC LIMIT 50").all());
  });

  app.get("/api/admin/logs", requireAuth, (_req, res) => {
    res.json(db.prepare("SELECT actor,action,detail,at FROM audit_log ORDER BY id DESC LIMIT 200").all());
  });
}
