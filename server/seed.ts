// Seeds the database: categories, 500+ medicines (real generics expanded by
// strength + branded variants), users, prescriptions and sample sales.

import bcrypt from "bcryptjs";

import { getDb } from "./db.ts";

// Deterministic PRNG so reseeds produce stable data.
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260625);
const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)] as T;
const between = (lo: number, hi: number): number => lo + rng() * (hi - lo);
const intBetween = (lo: number, hi: number): number => Math.floor(between(lo, hi + 1));

const CATEGORIES: Array<{ name: string; slug: string; icon: string }> = [
  { name: "Pain Relief", slug: "pain-relief", icon: "💊" },
  { name: "Antibiotics", slug: "antibiotics", icon: "🦠" },
  { name: "Cardiovascular", slug: "cardiovascular", icon: "❤️" },
  { name: "Gastrointestinal", slug: "gastrointestinal", icon: "🩺" },
  { name: "Respiratory", slug: "respiratory", icon: "🫁" },
  { name: "Allergy", slug: "allergy", icon: "🤧" },
  { name: "Diabetes", slug: "diabetes", icon: "🩸" },
  { name: "Vitamins & Supplements", slug: "vitamins", icon: "🍊" },
  { name: "Dermatology", slug: "dermatology", icon: "🧴" },
  { name: "Eye & Ear", slug: "eye-ear", icon: "👁️" },
  { name: "Mental Health", slug: "mental-health", icon: "🧠" },
  { name: "Hormones", slug: "hormones", icon: "⚗️" },
  { name: "Antifungal", slug: "antifungal", icon: "🍄" },
  { name: "Antiviral", slug: "antiviral", icon: "🛡️" },
  { name: "First Aid", slug: "first-aid", icon: "🩹" },
];

interface Drug {
  generic: string;
  cat: string;
  form: string;
  strengths: string[];
  rx: boolean;
  base: number;
}

const DRUGS: Drug[] = [
  // Pain Relief
  { generic: "Paracetamol", cat: "Pain Relief", form: "tablet", strengths: ["500 mg", "650 mg", "1 g"], rx: false, base: 2.2 },
  { generic: "Ibuprofen", cat: "Pain Relief", form: "tablet", strengths: ["200 mg", "400 mg", "600 mg"], rx: false, base: 3.1 },
  { generic: "Aspirin", cat: "Pain Relief", form: "tablet", strengths: ["75 mg", "100 mg", "300 mg"], rx: false, base: 2.0 },
  { generic: "Diclofenac", cat: "Pain Relief", form: "tablet", strengths: ["25 mg", "50 mg", "75 mg"], rx: false, base: 3.8 },
  { generic: "Naproxen", cat: "Pain Relief", form: "tablet", strengths: ["250 mg", "500 mg"], rx: false, base: 4.0 },
  { generic: "Ketoprofen", cat: "Pain Relief", form: "gel", strengths: ["2.5%", "5%"], rx: false, base: 5.5 },
  { generic: "Meloxicam", cat: "Pain Relief", form: "tablet", strengths: ["7.5 mg", "15 mg"], rx: true, base: 4.6 },
  { generic: "Tramadol", cat: "Pain Relief", form: "capsule", strengths: ["50 mg", "100 mg"], rx: true, base: 6.2 },
  { generic: "Indomethacin", cat: "Pain Relief", form: "capsule", strengths: ["25 mg", "50 mg"], rx: true, base: 4.4 },
  // Antibiotics
  { generic: "Amoxicillin", cat: "Antibiotics", form: "capsule", strengths: ["250 mg", "500 mg", "875 mg"], rx: true, base: 5.5 },
  { generic: "Amoxicillin-Clavulanate", cat: "Antibiotics", form: "tablet", strengths: ["500/125 mg", "875/125 mg"], rx: true, base: 8.4 },
  { generic: "Azithromycin", cat: "Antibiotics", form: "tablet", strengths: ["250 mg", "500 mg"], rx: true, base: 9.0 },
  { generic: "Ciprofloxacin", cat: "Antibiotics", form: "tablet", strengths: ["250 mg", "500 mg", "750 mg"], rx: true, base: 6.8 },
  { generic: "Doxycycline", cat: "Antibiotics", form: "capsule", strengths: ["50 mg", "100 mg"], rx: true, base: 5.2 },
  { generic: "Cephalexin", cat: "Antibiotics", form: "capsule", strengths: ["250 mg", "500 mg"], rx: true, base: 6.0 },
  { generic: "Clarithromycin", cat: "Antibiotics", form: "tablet", strengths: ["250 mg", "500 mg"], rx: true, base: 8.8 },
  { generic: "Metronidazole", cat: "Antibiotics", form: "tablet", strengths: ["250 mg", "500 mg"], rx: true, base: 4.2 },
  { generic: "Levofloxacin", cat: "Antibiotics", form: "tablet", strengths: ["250 mg", "500 mg"], rx: true, base: 9.6 },
  { generic: "Cefuroxime", cat: "Antibiotics", form: "tablet", strengths: ["250 mg", "500 mg"], rx: true, base: 10.2 },
  { generic: "Erythromycin", cat: "Antibiotics", form: "tablet", strengths: ["250 mg", "500 mg"], rx: true, base: 5.4 },
  // Cardiovascular
  { generic: "Atorvastatin", cat: "Cardiovascular", form: "tablet", strengths: ["10 mg", "20 mg", "40 mg", "80 mg"], rx: true, base: 6.5 },
  { generic: "Simvastatin", cat: "Cardiovascular", form: "tablet", strengths: ["10 mg", "20 mg", "40 mg"], rx: true, base: 5.0 },
  { generic: "Rosuvastatin", cat: "Cardiovascular", form: "tablet", strengths: ["5 mg", "10 mg", "20 mg"], rx: true, base: 7.8 },
  { generic: "Amlodipine", cat: "Cardiovascular", form: "tablet", strengths: ["5 mg", "10 mg"], rx: true, base: 4.2 },
  { generic: "Lisinopril", cat: "Cardiovascular", form: "tablet", strengths: ["5 mg", "10 mg", "20 mg"], rx: true, base: 4.6 },
  { generic: "Losartan", cat: "Cardiovascular", form: "tablet", strengths: ["25 mg", "50 mg", "100 mg"], rx: true, base: 5.2 },
  { generic: "Bisoprolol", cat: "Cardiovascular", form: "tablet", strengths: ["2.5 mg", "5 mg", "10 mg"], rx: true, base: 4.8 },
  { generic: "Metoprolol", cat: "Cardiovascular", form: "tablet", strengths: ["25 mg", "50 mg", "100 mg"], rx: true, base: 4.4 },
  { generic: "Ramipril", cat: "Cardiovascular", form: "capsule", strengths: ["2.5 mg", "5 mg", "10 mg"], rx: true, base: 5.0 },
  { generic: "Valsartan", cat: "Cardiovascular", form: "tablet", strengths: ["80 mg", "160 mg"], rx: true, base: 6.4 },
  { generic: "Furosemide", cat: "Cardiovascular", form: "tablet", strengths: ["20 mg", "40 mg"], rx: true, base: 3.2 },
  { generic: "Clopidogrel", cat: "Cardiovascular", form: "tablet", strengths: ["75 mg"], rx: true, base: 7.0 },
  { generic: "Hydrochlorothiazide", cat: "Cardiovascular", form: "tablet", strengths: ["12.5 mg", "25 mg"], rx: true, base: 3.0 },
  { generic: "Nebivolol", cat: "Cardiovascular", form: "tablet", strengths: ["5 mg"], rx: true, base: 6.6 },
  // Gastrointestinal
  { generic: "Omeprazole", cat: "Gastrointestinal", form: "capsule", strengths: ["10 mg", "20 mg", "40 mg"], rx: false, base: 4.0 },
  { generic: "Pantoprazole", cat: "Gastrointestinal", form: "tablet", strengths: ["20 mg", "40 mg"], rx: false, base: 4.8 },
  { generic: "Esomeprazole", cat: "Gastrointestinal", form: "capsule", strengths: ["20 mg", "40 mg"], rx: true, base: 6.2 },
  { generic: "Lansoprazole", cat: "Gastrointestinal", form: "capsule", strengths: ["15 mg", "30 mg"], rx: false, base: 4.6 },
  { generic: "Famotidine", cat: "Gastrointestinal", form: "tablet", strengths: ["20 mg", "40 mg"], rx: false, base: 3.4 },
  { generic: "Domperidone", cat: "Gastrointestinal", form: "tablet", strengths: ["10 mg"], rx: false, base: 3.6 },
  { generic: "Loperamide", cat: "Gastrointestinal", form: "capsule", strengths: ["2 mg"], rx: false, base: 2.8 },
  { generic: "Mebeverine", cat: "Gastrointestinal", form: "tablet", strengths: ["135 mg", "200 mg"], rx: false, base: 4.2 },
  { generic: "Ondansetron", cat: "Gastrointestinal", form: "tablet", strengths: ["4 mg", "8 mg"], rx: true, base: 7.2 },
  { generic: "Bisacodyl", cat: "Gastrointestinal", form: "tablet", strengths: ["5 mg"], rx: false, base: 2.4 },
  // Respiratory
  { generic: "Salbutamol", cat: "Respiratory", form: "inhaler", strengths: ["100 mcg"], rx: true, base: 7.5 },
  { generic: "Budesonide", cat: "Respiratory", form: "inhaler", strengths: ["200 mcg"], rx: true, base: 11.0 },
  { generic: "Montelukast", cat: "Respiratory", form: "tablet", strengths: ["4 mg", "5 mg", "10 mg"], rx: true, base: 6.0 },
  { generic: "Fluticasone", cat: "Respiratory", form: "spray", strengths: ["50 mcg"], rx: false, base: 8.4 },
  { generic: "Ambroxol", cat: "Respiratory", form: "syrup", strengths: ["15 mg/5ml", "30 mg/5ml"], rx: false, base: 3.8 },
  { generic: "Acetylcysteine", cat: "Respiratory", form: "sachet", strengths: ["200 mg", "600 mg"], rx: false, base: 4.6 },
  { generic: "Dextromethorphan", cat: "Respiratory", form: "syrup", strengths: ["15 mg/5ml"], rx: false, base: 3.4 },
  { generic: "Guaifenesin", cat: "Respiratory", form: "syrup", strengths: ["100 mg/5ml"], rx: false, base: 3.2 },
  // Allergy
  { generic: "Cetirizine", cat: "Allergy", form: "tablet", strengths: ["5 mg", "10 mg"], rx: false, base: 2.8 },
  { generic: "Loratadine", cat: "Allergy", form: "tablet", strengths: ["10 mg"], rx: false, base: 2.6 },
  { generic: "Fexofenadine", cat: "Allergy", form: "tablet", strengths: ["120 mg", "180 mg"], rx: false, base: 4.4 },
  { generic: "Desloratadine", cat: "Allergy", form: "tablet", strengths: ["5 mg"], rx: false, base: 3.8 },
  { generic: "Levocetirizine", cat: "Allergy", form: "tablet", strengths: ["5 mg"], rx: false, base: 3.4 },
  { generic: "Chlorphenamine", cat: "Allergy", form: "tablet", strengths: ["4 mg"], rx: false, base: 2.2 },
  { generic: "Ebastine", cat: "Allergy", form: "tablet", strengths: ["10 mg", "20 mg"], rx: false, base: 4.0 },
  // Diabetes
  { generic: "Metformin", cat: "Diabetes", form: "tablet", strengths: ["500 mg", "850 mg", "1000 mg"], rx: true, base: 3.6 },
  { generic: "Gliclazide", cat: "Diabetes", form: "tablet", strengths: ["30 mg", "60 mg", "80 mg"], rx: true, base: 4.8 },
  { generic: "Glimepiride", cat: "Diabetes", form: "tablet", strengths: ["1 mg", "2 mg", "4 mg"], rx: true, base: 4.2 },
  { generic: "Sitagliptin", cat: "Diabetes", form: "tablet", strengths: ["50 mg", "100 mg"], rx: true, base: 12.0 },
  { generic: "Empagliflozin", cat: "Diabetes", form: "tablet", strengths: ["10 mg", "25 mg"], rx: true, base: 14.5 },
  { generic: "Dapagliflozin", cat: "Diabetes", form: "tablet", strengths: ["5 mg", "10 mg"], rx: true, base: 13.8 },
  { generic: "Insulin Glargine", cat: "Diabetes", form: "pen", strengths: ["100 IU/ml"], rx: true, base: 22.0 },
  // Vitamins & Supplements
  { generic: "Vitamin C", cat: "Vitamins & Supplements", form: "tablet", strengths: ["500 mg", "1000 mg"], rx: false, base: 3.0 },
  { generic: "Vitamin D3", cat: "Vitamins & Supplements", form: "capsule", strengths: ["1000 IU", "2000 IU", "5000 IU"], rx: false, base: 4.0 },
  { generic: "Vitamin B Complex", cat: "Vitamins & Supplements", form: "tablet", strengths: ["—"], rx: false, base: 3.6 },
  { generic: "Folic Acid", cat: "Vitamins & Supplements", form: "tablet", strengths: ["400 mcg", "5 mg"], rx: false, base: 2.4 },
  { generic: "Ferrous Sulfate", cat: "Vitamins & Supplements", form: "tablet", strengths: ["200 mg", "325 mg"], rx: false, base: 2.8 },
  { generic: "Calcium + D3", cat: "Vitamins & Supplements", form: "tablet", strengths: ["600 mg/400 IU"], rx: false, base: 4.2 },
  { generic: "Magnesium", cat: "Vitamins & Supplements", form: "tablet", strengths: ["250 mg", "400 mg"], rx: false, base: 3.8 },
  { generic: "Zinc", cat: "Vitamins & Supplements", form: "tablet", strengths: ["15 mg", "25 mg"], rx: false, base: 3.2 },
  { generic: "Omega-3", cat: "Vitamins & Supplements", form: "capsule", strengths: ["1000 mg"], rx: false, base: 5.6 },
  { generic: "Multivitamin", cat: "Vitamins & Supplements", form: "tablet", strengths: ["—"], rx: false, base: 4.8 },
  { generic: "Vitamin B12", cat: "Vitamins & Supplements", form: "tablet", strengths: ["500 mcg", "1000 mcg"], rx: false, base: 3.4 },
  // Dermatology
  { generic: "Hydrocortisone", cat: "Dermatology", form: "cream", strengths: ["0.5%", "1%"], rx: false, base: 3.6 },
  { generic: "Clotrimazole", cat: "Dermatology", form: "cream", strengths: ["1%"], rx: false, base: 3.2 },
  { generic: "Betamethasone", cat: "Dermatology", form: "cream", strengths: ["0.05%", "0.1%"], rx: true, base: 4.8 },
  { generic: "Mupirocin", cat: "Dermatology", form: "ointment", strengths: ["2%"], rx: true, base: 6.0 },
  { generic: "Benzoyl Peroxide", cat: "Dermatology", form: "gel", strengths: ["2.5%", "5%"], rx: false, base: 5.2 },
  { generic: "Terbinafine", cat: "Dermatology", form: "cream", strengths: ["1%"], rx: false, base: 5.6 },
  { generic: "Adapalene", cat: "Dermatology", form: "gel", strengths: ["0.1%"], rx: true, base: 7.4 },
  { generic: "Ketoconazole", cat: "Dermatology", form: "shampoo", strengths: ["2%"], rx: false, base: 6.2 },
  // Eye & Ear
  { generic: "Chloramphenicol", cat: "Eye & Ear", form: "eye drops", strengths: ["0.5%"], rx: true, base: 4.4 },
  { generic: "Tobramycin", cat: "Eye & Ear", form: "eye drops", strengths: ["0.3%"], rx: true, base: 6.0 },
  { generic: "Olopatadine", cat: "Eye & Ear", form: "eye drops", strengths: ["0.1%"], rx: true, base: 7.2 },
  { generic: "Hypromellose", cat: "Eye & Ear", form: "eye drops", strengths: ["0.3%"], rx: false, base: 3.8 },
  { generic: "Ofloxacin", cat: "Eye & Ear", form: "ear drops", strengths: ["0.3%"], rx: true, base: 5.4 },
  // Mental Health
  { generic: "Sertraline", cat: "Mental Health", form: "tablet", strengths: ["50 mg", "100 mg"], rx: true, base: 5.8 },
  { generic: "Fluoxetine", cat: "Mental Health", form: "capsule", strengths: ["20 mg"], rx: true, base: 5.0 },
  { generic: "Escitalopram", cat: "Mental Health", form: "tablet", strengths: ["5 mg", "10 mg", "20 mg"], rx: true, base: 6.4 },
  { generic: "Amitriptyline", cat: "Mental Health", form: "tablet", strengths: ["10 mg", "25 mg"], rx: true, base: 4.2 },
  { generic: "Mirtazapine", cat: "Mental Health", form: "tablet", strengths: ["15 mg", "30 mg"], rx: true, base: 5.6 },
  { generic: "Diazepam", cat: "Mental Health", form: "tablet", strengths: ["2 mg", "5 mg"], rx: true, base: 4.0 },
  { generic: "Quetiapine", cat: "Mental Health", form: "tablet", strengths: ["25 mg", "100 mg", "200 mg"], rx: true, base: 8.0 },
  // Hormones
  { generic: "Levothyroxine", cat: "Hormones", form: "tablet", strengths: ["25 mcg", "50 mcg", "100 mcg"], rx: true, base: 3.8 },
  { generic: "Prednisolone", cat: "Hormones", form: "tablet", strengths: ["5 mg", "25 mg"], rx: true, base: 3.6 },
  { generic: "Dexamethasone", cat: "Hormones", form: "tablet", strengths: ["0.5 mg", "4 mg"], rx: true, base: 4.0 },
  { generic: "Methylprednisolone", cat: "Hormones", form: "tablet", strengths: ["4 mg", "16 mg"], rx: true, base: 6.2 },
  { generic: "Estradiol", cat: "Hormones", form: "patch", strengths: ["25 mcg", "50 mcg"], rx: true, base: 9.0 },
  // Antifungal
  { generic: "Fluconazole", cat: "Antifungal", form: "capsule", strengths: ["50 mg", "150 mg", "200 mg"], rx: false, base: 5.4 },
  { generic: "Itraconazole", cat: "Antifungal", form: "capsule", strengths: ["100 mg"], rx: true, base: 8.6 },
  { generic: "Nystatin", cat: "Antifungal", form: "suspension", strengths: ["100000 IU/ml"], rx: true, base: 5.0 },
  { generic: "Griseofulvin", cat: "Antifungal", form: "tablet", strengths: ["125 mg", "500 mg"], rx: true, base: 6.4 },
  // Antiviral
  { generic: "Aciclovir", cat: "Antiviral", form: "tablet", strengths: ["200 mg", "400 mg", "800 mg"], rx: true, base: 6.0 },
  { generic: "Valaciclovir", cat: "Antiviral", form: "tablet", strengths: ["500 mg"], rx: true, base: 9.2 },
  { generic: "Oseltamivir", cat: "Antiviral", form: "capsule", strengths: ["30 mg", "75 mg"], rx: true, base: 13.0 },
  // First Aid
  { generic: "Povidone-Iodine", cat: "First Aid", form: "solution", strengths: ["10%"], rx: false, base: 3.0 },
  { generic: "Hydrogen Peroxide", cat: "First Aid", form: "solution", strengths: ["3%"], rx: false, base: 2.2 },
  { generic: "Saline Solution", cat: "First Aid", form: "solution", strengths: ["0.9%"], rx: false, base: 2.0 },
  { generic: "Antiseptic Cream", cat: "First Aid", form: "cream", strengths: ["—"], rx: false, base: 3.4 },
  { generic: "Rehydration Salts", cat: "First Aid", form: "sachet", strengths: ["—"], rx: false, base: 1.8 },
];

const MANUFACTURERS = [
  "Bayer", "Pfizer", "GSK", "Novartis", "Sanofi", "Teva", "Sandoz", "Abbott",
  "Roche", "Cipla", "Sun Pharma", "Hikma", "Gedeon Richter", "Krka", "Berlin-Chemie",
];
const BRANDS = ["Vitalis", "Medex", "Curex", "HealthAid", "BioGen", "Remedy", "Apex", "NovaCare", "PrimeMed"];

function expiryDate(monthsAhead: number): string {
  const base = new Date(2026, 5, 25); // fixed reference for reproducibility
  const d = new Date(base.getFullYear(), base.getMonth() + monthsAhead, base.getDate());
  return d.toISOString().slice(0, 10);
}

function main(): void {
  const db = getDb();
  for (const t of ["sale_items", "sales", "prescription_items", "prescriptions", "medicines", "categories", "users", "audit_log"]) {
    db.exec(`DELETE FROM ${t}`);
  }

  const catId = new Map<string, number>();
  const insCat = db.prepare("INSERT INTO categories(name,slug,icon) VALUES(?,?,?)");
  for (const c of CATEGORIES) {
    const r = insCat.run(c.name, c.slug, c.icon);
    catId.set(c.name, Number(r.lastInsertRowid));
  }

  const insMed = db.prepare(`INSERT INTO medicines
    (sku,name,generic_name,category_id,manufacturer,form,strength,price,cost,stock,reorder_level,expiry,prescription_required,description)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);

  let n = 0;
  const addMed = (name: string, d: Drug, strength: string, branded: boolean): void => {
    n++;
    const sku = "VP-" + String(n).padStart(5, "0");
    const factor = 1 + (strength.match(/\d+/) ? Math.min(2, parseFloat(strength) / 200) : 0);
    const price = +(d.base * factor * between(1, 1.5) * (branded ? 1.25 : 1)).toFixed(2);
    const cost = +(price * between(0.55, 0.7)).toFixed(2);
    // ~8% low stock, ~3% out, ~89% healthy
    const roll = rng();
    const stock = roll < 0.03 ? 0 : roll < 0.11 ? intBetween(1, 18) : intBetween(25, 320);
    const reorder = 20;
    const months = rng() < 0.05 ? intBetween(1, 2) : intBetween(6, 30); // ~5% near expiry
    const desc = `${d.generic} ${strength !== "—" ? strength : ""} ${d.form} — ${d.cat.toLowerCase()}.`.replace(/\s+/g, " ").trim();
    insMed.run(sku, name, d.generic, catId.get(d.cat) ?? null, pick(MANUFACTURERS), d.form, strength,
      price, cost, stock, reorder, expiryDate(months), d.rx ? 1 : 0, desc);
  };

  for (const d of DRUGS) {
    for (const s of d.strengths) {
      const label = s === "—" ? d.generic : `${d.generic} ${s}`;
      addMed(label, d, s, false);
    }
    // one branded variant per drug to enrich the catalog
    const brand = pick(BRANDS);
    const s = pick(d.strengths);
    addMed(`${brand} ${d.generic}`, d, s, true);
  }
  // Top up to comfortably exceed 500 with extra branded variants.
  while (n < 520) {
    const d = pick(DRUGS);
    const brand = pick(BRANDS);
    addMed(`${brand} ${d.generic} ${pick(d.strengths)}`, d, pick(d.strengths), true);
  }

  // Users
  const insUser = db.prepare("INSERT INTO users(username,password_hash,full_name,role) VALUES(?,?,?,?)");
  insUser.run("admin", bcrypt.hashSync("Vitalis2026!", 10), "Pharmacy Admin", "admin");
  insUser.run("cashier", bcrypt.hashSync("Vitalis2026!", 10), "Front Counter", "cashier");

  // Prescriptions
  const insRx = db.prepare("INSERT INTO prescriptions(code,patient_name,doctor,status,notes) VALUES(?,?,?,?,?)");
  const insRxItem = db.prepare("INSERT INTO prescription_items(prescription_id,medicine_name,qty,dosage) VALUES(?,?,?,?)");
  const patients = ["Aysel Mammadova", "Rashad Aliyev", "Leyla Huseynova", "Tural Guliyev", "Nigar Ismayilova", "Emin Karimov", "Sevda Rahimova", "Orxan Najafov"];
  const doctors = ["Dr. Bayramov", "Dr. Quliyeva", "Dr. Hasanov", "Dr. Aliyeva"];
  const rxMeds = ["Amoxicillin 500 mg", "Atorvastatin 20 mg", "Metformin 850 mg", "Omeprazole 20 mg", "Salbutamol 100 mcg", "Cetirizine 10 mg", "Losartan 50 mg", "Sertraline 50 mg"];
  for (let i = 0; i < 8; i++) {
    const code = "RX-" + String(2026000 + i + 1);
    const status = i < 5 ? "pending" : "dispensed";
    const r = insRx.run(code, pick(patients), pick(doctors), status, "");
    const id = Number(r.lastInsertRowid);
    const count = intBetween(1, 3);
    for (let j = 0; j < count; j++) {
      insRxItem.run(id, pick(rxMeds), intBetween(1, 2), pick(["1x daily", "2x daily", "3x daily after meals", "as needed"]));
    }
  }

  // Sample sales over the last 30 days for dashboard charts
  const meds = db.prepare("SELECT id,name,price FROM medicines ORDER BY RANDOM() LIMIT 60").all() as Array<{ id: number; name: string; price: number }>;
  const insSale = db.prepare("INSERT INTO sales(ref,cashier,subtotal,discount,tax,total,paid,method,prescription_code,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)");
  const insSaleItem = db.prepare("INSERT INTO sale_items(sale_id,medicine_id,name,qty,price,line_total) VALUES(?,?,?,?,?,?)");
  for (let i = 0; i < 140; i++) {
    const daysAgo = intBetween(0, 29);
    const when = new Date(2026, 5, 25 - daysAgo, intBetween(9, 20), intBetween(0, 59)).toISOString().slice(0, 19).replace("T", " ");
    const lineCount = intBetween(1, 5);
    let subtotal = 0;
    const items: Array<{ id: number; name: string; qty: number; price: number; line: number }> = [];
    for (let j = 0; j < lineCount; j++) {
      const m = pick(meds);
      const qty = intBetween(1, 3);
      const line = +(m.price * qty).toFixed(2);
      subtotal += line;
      items.push({ id: m.id, name: m.name, qty, price: m.price, line });
    }
    const discount = rng() < 0.25 ? +(subtotal * 0.05).toFixed(2) : 0;
    const tax = +((subtotal - discount) * 0.0).toFixed(2);
    const total = +(subtotal - discount + tax).toFixed(2);
    const ref = "S-" + String(100000 + i);
    const r = insSale.run(ref, pick(["admin", "cashier"]), subtotal, discount, tax, total, total, pick(["cash", "card", "card", "cash"]), "", when);
    const sid = Number(r.lastInsertRowid);
    for (const it of items) insSaleItem.run(sid, it.id, it.name, it.qty, it.price, it.line);
  }

  const count = (db.prepare("SELECT COUNT(*) c FROM medicines").get() as { c: number }).c;
  console.log(`seeded: ${count} medicines, ${CATEGORIES.length} categories, 2 users, 8 prescriptions, 140 sales`);
  console.log("admin login: admin / Vitalis2026!  (cashier / Vitalis2026!)");
}

main();
