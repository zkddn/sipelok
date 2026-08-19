/* =========================================================
   SIPELOK — lapisan data (localStorage, tanpa backend)
   ========================================================= */

export type ShiftId = 1 | 2;

export interface Petugas {
  id: string;
  nama: string;
  nip?: string;
}

export interface Session {
  token: string;
  date: string; // YYYY-MM-DD
  shift: ShiftId;
  createdAt: string;
}

export interface PresensiRecord {
  id: string;
  date: string;
  shift: ShiftId;
  petugasId: string;
  nama: string;
  masuk: string; // ISO
  keluar: string | null; // ISO
  fotoMasuk: string | null; // dataURL
  fotoKeluar: string | null;
}

export interface ShiftDef {
  id: ShiftId;
  label: string;
  nama: string;
  waktu: string;
  mulai: string; // HH:MM
  selesai: string;
}

export const SHIFTS: ShiftDef[] = [
  { id: 1, label: "Shift 1", nama: "Pagi", waktu: "08.00 – 12.00", mulai: "08:00", selesai: "12:00" },
  { id: 2, label: "Shift 2", nama: "Siang", waktu: "12.00 – 16.00", mulai: "12:00", selesai: "16:00" },
];

export const TOLERANSI_MENIT = 10;
export const ADMIN_PIN = "1234";

const K = {
  petugas: "sipelok.petugas",
  sessions: "sipelok.sessions",
  records: "sipelok.records",
  seeded: "sipelok.seeded.v1",
};

/* ---------------- util waktu ---------------- */

const pad = (n: number) => String(n).padStart(2, "0");

export function todayStr(d = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function dateFrom(dateStr: string, hm: string): Date {
  return new Date(`${dateStr}T${hm}:00`);
}

export function fmtHM(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fmtDateLong(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function fmtDateShort(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });
}

export function shiftForTime(d = new Date()): ShiftId {
  return d.getHours() < 12 ? 1 : 2;
}

export function shiftDef(id: ShiftId): ShiftDef {
  return SHIFTS.find((s) => s.id === id)!;
}

export function menitTerlambat(record: PresensiRecord): number {
  const batas = dateFrom(record.date, shiftDef(record.shift).mulai).getTime() + TOLERANSI_MENIT * 60000;
  const diff = Math.round((new Date(record.masuk).getTime() - batas) / 60000);
  return diff > 0 ? diff : 0;
}

export function durasiMenit(record: PresensiRecord): number | null {
  if (!record.keluar) return null;
  return Math.max(0, Math.round((new Date(record.keluar).getTime() - new Date(record.masuk).getTime()) / 60000));
}

export function fmtDurasi(menit: number | null): string {
  if (menit === null) return "—";
  const j = Math.floor(menit / 60);
  const m = menit % 60;
  if (j === 0) return `${m} mnt`;
  return `${j} jam ${pad(m)} mnt`;
}

export function uid(): string {
  try {
    return crypto.randomUUID().slice(0, 8);
  } catch {
    return Math.random().toString(36).slice(2, 10);
  }
}

export function scanUrlFor(token: string): string {
  return `${location.origin}${location.pathname}#/scan/${token}`;
}

/* ---------------- storage dasar ---------------- */

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* kuota penuh — biarkan */
  }
}

/* ---------------- petugas ---------------- */

export function getPetugas(): Petugas[] {
  return read<Petugas[]>(K.petugas, []);
}

export function addPetugas(nama: string, nip?: string): Petugas {
  const list = getPetugas();
  const p: Petugas = { id: uid(), nama: nama.trim(), nip: nip?.trim() || undefined };
  list.push(p);
  write(K.petugas, list);
  notify();
  return p;
}

export function removePetugas(id: string) {
  write(
    K.petugas,
    getPetugas().filter((p) => p.id !== id)
  );
  notify();
}

/* ---------------- sesi & token QR ---------------- */

export function getSessions(): Session[] {
  return read<Session[]>(K.sessions, []);
}

function newToken(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

export function getOrCreateSession(date: string, shift: ShiftId): Session {
  const sessions = getSessions();
  let s = sessions.find((x) => x.date === date && x.shift === shift);
  if (!s) {
    s = { token: newToken(), date, shift, createdAt: new Date().toISOString() };
    sessions.push(s);
    // bersihkan sesi lama (>3 hari) agar tidak menumpuk
    const cut = new Date().getTime() - 3 * 86400000;
    const kept = sessions.filter((x) => new Date(x.createdAt).getTime() > cut || x === s);
    write(K.sessions, kept);
    notify();
  }
  return s;
}

export function rotateToken(date: string, shift: ShiftId): Session {
  const sessions = getSessions().map((s) =>
    s.date === date && s.shift === shift ? { ...s, token: newToken(), createdAt: new Date().toISOString() } : s
  );
  write(K.sessions, sessions);
  notify();
  return getOrCreateSession(date, shift);
}

export function findSessionByToken(token: string): Session | null {
  return getSessions().find((s) => s.token.toUpperCase() === (token || "").toUpperCase()) ?? null;
}

/* ---------------- record presensi ---------------- */

export function getRecords(): PresensiRecord[] {
  return read<PresensiRecord[]>(K.records, []);
}

export function saveRecords(list: PresensiRecord[]) {
  write(K.records, list);
  notify();
}

export function findOpenRecord(date: string, shift: ShiftId, petugasId: string): PresensiRecord | null {
  return (
    getRecords().find((r) => r.date === date && r.shift === shift && r.petugasId === petugasId && !r.keluar) ?? null
  );
}

export function hasCheckedIn(date: string, shift: ShiftId, petugasId: string): boolean {
  return getRecords().some((r) => r.date === date && r.shift === shift && r.petugasId === petugasId);
}

export type ActionResult =
  | { ok: true; record: PresensiRecord }
  | { ok: false; error: string; code: "NO_SESSION" | "ALREADY_IN" | "NOT_IN_YET" | "DONE" };

export function checkIn(token: string, petugasId: string, foto: string | null): ActionResult {
  const session = findSessionByToken(token);
  if (!session) return { ok: false, code: "NO_SESSION", error: "Sesi QR tidak ditemukan. Mintalah QR terbaru di layar loket." };
  const petugas = getPetugas().find((p) => p.id === petugasId);
  if (!petugas) return { ok: false, code: "NO_SESSION", error: "Petugas tidak dikenal." };
  if (hasCheckedIn(session.date, session.shift, petugasId))
    return { ok: false, code: "ALREADY_IN", error: "Kamu sudah presensi masuk di shift ini. Gunakan mode Presensi Pulang." };

  const record: PresensiRecord = {
    id: uid(),
    date: session.date,
    shift: session.shift,
    petugasId,
    nama: petugas.nama,
    masuk: new Date().toISOString(),
    keluar: null,
    fotoMasuk: foto,
    fotoKeluar: null,
  };
  saveRecords([...getRecords(), record]);
  return { ok: true, record };
}

export function checkOut(token: string, petugasId: string, foto: string | null): ActionResult {
  const session = findSessionByToken(token);
  if (!session) return { ok: false, code: "NO_SESSION", error: "Sesi QR tidak ditemukan. Mintalah QR terbaru di layar loket." };
  const open = findOpenRecord(session.date, session.shift, petugasId);
  if (!open) {
    if (hasCheckedIn(session.date, session.shift, petugasId))
      return { ok: false, code: "DONE", error: "Presensi shift ini sudah lengkap (masuk & pulang tercatat)." };
    return { ok: false, code: "NOT_IN_YET", error: "Kamu belum presensi masuk di shift ini. Lakukan Presensi Masuk lebih dulu." };
  }
  const list = getRecords().map((r) =>
    r.id === open.id ? { ...r, keluar: new Date().toISOString(), fotoKeluar: foto ?? r.fotoKeluar } : r
  );
  saveRecords(list);
  return { ok: true, record: list.find((r) => r.id === open.id)! };
}

export function clearAllData() {
  localStorage.removeItem(K.petugas);
  localStorage.removeItem(K.sessions);
  localStorage.removeItem(K.records);
  localStorage.removeItem(K.seeded);
  notify();
}

export function storageSizeKB(): number {
  let total = 0;
  for (const key of Object.values(K)) total += (localStorage.getItem(key) ?? "").length;
  return Math.round((total * 2) / 1024); // UTF-16 ~ 2 byte/char
}

/* ---------------- foto ---------------- */

export function fileToDataUrl(file: File, max = 640, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d")!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gagal membaca foto"));
    };
    img.src = url;
  });
}

/* ---------------- sinkronisasi antar-tab ---------------- */

let bc: BroadcastChannel | null = null;
try {
  bc = new BroadcastChannel("sipelok-sync");
} catch {
  bc = null;
}

export function notify() {
  try {
    bc?.postMessage("sync");
  } catch {
    /* abaikan */
  }
}

export function onSync(cb: () => void): () => void {
  const onStorage = () => cb();
  const onMsg = () => cb();
  window.addEventListener("storage", onStorage);
  bc?.addEventListener("message", onMsg);
  const t = setInterval(cb, 2500); // jaring pengaman
  return () => {
    window.removeEventListener("storage", onStorage);
    bc?.removeEventListener("message", onMsg);
    clearInterval(t);
  };
}

/* ---------------- ekspor CSV ---------------- */

export function exportCsv(rows: PresensiRecord[]) {
  const head = ["Tanggal", "Shift", "Nama Petugas", "NIP", "Jam Masuk", "Jam Keluar", "Durasi (menit)", "Status"];
  const nipOf = (id: string) => getPetugas().find((p) => p.id === id)?.nip ?? "-";
  const lines = rows.map((r) => {
    const telat = menitTerlambat(r);
    const status = r.keluar ? (telat ? `Selesai (terlambat ${telat} mnt)` : "Selesai") : telat ? "Berjalan (terlambat)" : "Sedang bertugas";
    return [r.date, `Shift ${r.shift}`, r.nama, nipOf(r.petugasId), fmtHM(r.masuk), r.keluar ? fmtHM(r.keluar) : "-", durasiMenit(r) ?? "-", status]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(";");
  });
  const csv = "\uFEFF" + [head.join(";"), ...lines].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `rekap-presensi-loket-${todayStr()}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ---------------- data contoh ---------------- */

const DEMO_NAMES: Array<[string, string]> = [
  ["Andi Nurhaliza, S.Stat", "19900412 201402 2 003"],
  ["Muhammad Fajar Ramadhan", "19960823 202012 1 011"],
  ["Siti Rahmawati, S.ST", "19930517 201703 2 008"],
  ["La Ode Alif Pratama", "19980209 202201 1 005"],
  ["Wa Ode Nurul Hidayah, S.E.", "19911130 201903 2 002"],
  ["Rizky Adityawan, S.Kom", "19940701 201802 1 006"],
  ["Hasnawati, S.Si", "19921225 201504 2 001"],
  ["Yusran Maulana", "19950514 202012 1 009"],
];

const randInt = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));

export function seedDemo(force = false) {
  if (!force && localStorage.getItem(K.seeded)) return;

  const petugas: Petugas[] = DEMO_NAMES.map(([nama, nip]) => ({ id: uid(), nama, nip }));
  write(K.petugas, petugas);

  const records: PresensiRecord[] = [];
  const addRec = (date: string, shift: ShiftId, p: Petugas, masukMin: number, keluarMin: number | null) => {
    const def = shiftDef(shift);
    const baseIn = dateFrom(date, def.mulai).getTime();
    const baseOut = dateFrom(date, def.selesai).getTime();
    records.push({
      id: uid(),
      date,
      shift,
      petugasId: p.id,
      nama: p.nama,
      masuk: new Date(baseIn + masukMin * 60000).toISOString(),
      keluar: keluarMin === null ? null : new Date(baseOut + keluarMin * 60000).toISOString(),
      fotoMasuk: null,
      fotoKeluar: null,
    });
  };

  // 6 hari kerja ke belakang
  const workdays: string[] = [];
  const d = new Date();
  d.setDate(d.getDate() - 1);
  while (workdays.length < 6) {
    if (d.getDay() !== 0 && d.getDay() !== 6) workdays.push(todayStr(d));
    d.setDate(d.getDate() - 1);
  }
  workdays.forEach((day, i) => {
    const a = petugas[i % petugas.length];
    const b = petugas[(i + 1) % petugas.length];
    const c = petugas[(i + 2) % petugas.length];
    const e = petugas[(i + 3) % petugas.length];
    addRec(day, 1, a, randInt(-9, 8), randInt(-6, 18));
    addRec(day, 1, b, randInt(-6, 24), randInt(-10, 22));
    addRec(day, 2, c, randInt(-8, 9), randInt(-8, 20));
    addRec(day, 2, e, randInt(-5, 26), randInt(-12, 15));
  });

  // hari ini — isi sesuai jam sekarang agar layar loket langsung "hidup"
  const today = todayStr();
  const hour = new Date().getHours();
  if (hour >= 8) {
    addRec(today, 1, petugas[0], -7, hour >= 12 ? randInt(2, 14) : null);
    addRec(today, 1, petugas[1], randInt(4, 18), hour >= 12 ? randInt(-8, 8) : null);
  }
  if (hour >= 12) {
    addRec(today, 2, petugas[2], -4, null);
    addRec(today, 2, petugas[3], randInt(2, 12), null);
  }
  write(K.records, records);

  // sesi QR hari ini untuk kedua shift
  getOrCreateSession(today, 1);
  getOrCreateSession(today, 2);

  localStorage.setItem(K.seeded, "1");
  notify();
}
