# 💊 Vitalis Pharmacy

**A motion-animated pharmacy platform** — a public storefront, a staff admin
console, and a point-of-sale terminal over a **520-medicine database**, with
**QR scanning** (medicines + e-prescriptions) and **prescription OCR**. Built
on React + Framer Motion with an Express API backed by Node's built-in SQLite.

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 18">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Framer%20Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white" alt="Framer Motion">
  <img src="https://img.shields.io/badge/SQLite-node%3Asqlite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="node:sqlite">
  <img src="https://img.shields.io/badge/License-Apache%202.0-D22128?style=for-the-badge&logo=apache&logoColor=white" alt="License Apache 2.0">
</p>

---

## Features

| Surface | What it does |
|---------|--------------|
| **Storefront** | Motion-animated hero, shop-by-category, searchable catalogue of 520 medicines, medicine detail pages with a QR label |
| **POS terminal** | Live medicine search, **QR scan** (camera + manual), cart with quantities/discount, prescription attach, checkout that decrements stock and prints a QR receipt |
| **Prescriptions** | **Scan an e-prescription QR** to load it; **OCR a photo** of a paper prescription (Tesseract.js) and auto-detect medicines; dispense workflow |
| **Inventory** | Searchable table with **resizeable columns**, low-stock & expiry highlighting, inline edit of price/stock/reorder/expiry |
| **Dashboard** | KPIs, 14-day revenue chart (Chart.js, hover tooltips), best sellers, category breakdown, low-stock alerts |
| **Activity log** | Live audit monitor (login, sales, dispense, edits), auto-refreshing |
| **Throughout** | Light/dark theme, collapsible sidebar, Framer Motion page/element transitions, logout confirm modal, HMAC-cookie auth |

---

## 🛠 Tech Stack

![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%2B%20TS-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Motion](https://img.shields.io/badge/Motion-Framer%20Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)
![Styling](https://img.shields.io/badge/Styling-Tailwind%20v4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Backend](https://img.shields.io/badge/Backend-Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Database](https://img.shields.io/badge/Database-node%3Asqlite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript, Vite, React Router |
| **Motion** | Framer Motion (hero, page transitions, staggered reveals, animated charts) |
| **Styling** | Tailwind CSS v4 — "Apothecary Fresh" theme with auto light/dark |
| **Backend** | Express (single process; serves the SPA via Vite middleware in dev) |
| **Database** | `node:sqlite` (Node's built-in SQLite — no native build) |
| **QR & OCR** | `qrcode` (generate), `jsqr` (camera scan), `tesseract.js` (prescription OCR) |
| **Charts / Auth** | Chart.js, bcryptjs + HMAC-signed cookie sessions |

---

## Quickstart

Requires Node.js 22.6+ (uses `node:sqlite` and runs `.ts` server files directly).

```bash
git clone https://github.com/vugarfamiloglu/vitalis-pharmacy
cd vitalis-pharmacy
npm install

npm run seed     # build the database: 520 medicines, categories, prescriptions, sample sales
npm run dev      # http://localhost:5300
```

- **Storefront:** http://localhost:5300
- **Staff console:** http://localhost:5300/admin — `admin / Vitalis2026!`

```bash
npm run build && npm start   # production build + serve dist/
```

### Try it

- Search the catalogue, open a medicine, scan its QR label.
- In **POS**, search or scan a medicine (`VP-00001`-style SKU) into the cart and check out → QR receipt.
- In **Prescriptions**, scan a prescription QR (`RX-2026001`) or upload a photo to OCR.

---

## Project layout

```
server/
  db.ts        node:sqlite schema + helpers
  seed.ts      520-medicine generator + sample data
  api.ts       REST API (catalog, auth, POS, prescriptions, stats, QR)
  index.ts     Express + Vite middleware
src/
  site/        public storefront (layout, home, catalog, detail)
  admin/       console (login, shell, dashboard, inventory, POS, prescriptions, logs, QR scanner)
  components/  toast, confirm modal, theme toggle
  context/     theme + auth providers
  lib/         api client, motion variants, formatting
```

---

## Notes

- Prices are shown in AZN (₼). The 520 medicines are generated from ~120 real
  generic drugs across 15 categories, expanded by strength and branded variants.
- QR camera scanning needs a browser with `getUserMedia`; a manual code entry
  fallback is always available. OCR loads Tesseract.js on demand.
- Secrets (`data/`, the session key) are git-ignored; run `npm run seed` to
  create the database locally.

---

## License

Apache License 2.0 — see [LICENSE](LICENSE).
