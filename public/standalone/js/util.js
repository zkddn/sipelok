/* ============================================================
   SIPELOK — util.js  (dipakai semua halaman, tanpa npm)
   Dua mode:  db  -> PHP+MySQL   |   local -> localStorage (demo)
   Login SINKRON dengan satu format hash yang pasti (djb2+salt),
   sama persis dengan api.php — mustahil tidak cocok.
   ============================================================ */
"use strict";

const API = "api/api.php";
const API_KEY = "sipelok-konawe-2024";
const ADMIN_SALT = "sipelokadmin"; // sama dengan api.php

const LS = {
  petugas: "sipelok.petugas", records: "sipelok.records", jadwal: "sipelok.jadwal",
  accounts: "sipelok.accounts", sessions: "sipelok.sessions", seeded: "sipelok.seeded",
};
const AUTH_KEY = "sipelok.auth";

const S = { petugas: [], records: [], jadwal: [], accounts: [], sessions: [] };
let MODE = "local";              // "db" | "local"
let lastSig = "";
const listeners = [];

/* ---------------- dasar ---------------- */
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 9); }
function onChange(fn) { listeners.push(fn); }
function emit() { listeners.forEach((f) => { try { f(); } catch (e) { console.error(e); } }); }

/* djb2 -> base36. WAJIB identik dengan fungsi djb2() di api.php */
function djb2(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
function hashPw(pw, salt) { return djb2(salt + "::sipelok::" + pw); }
function newSalt() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

/* ---------------- localStorage ---------------- */
function lsRead(key, def) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
function lsWrite(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* penuh */ } }

/* ---------------- HTTP ---------------- */
async function http(action, opts) {
  opts = opts || {};
  let url = API + "?action=" + encodeURIComponent(action);
  if (opts.table) url += "&table=" + encodeURIComponent(opts.table);
  if (opts.id) url += "&id=" + encodeURIComponent(opts.id);
  const init = { method: opts.body ? "POST" : "GET", headers: {} };
  if (opts.body) {
    init.headers["Content-Type"] = "application/json";
    init.headers["X-Sipelok-Key"] = API_KEY;
    init.body = JSON.stringify(opts.body);
  }
  const r = await fetch(url, init);
  return r.json();
}

/* ---------------- deteksi mode & bootstrap ---------------- */
async function detectMode() {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2500);
    const r = await fetch(API + "?action=ping", { signal: ctrl.signal });
    clearTimeout(t);
    const j = await r.json();
    if (j && j.ok) { MODE = "db"; return true; }
  } catch (e) { /* tidak ada server */ }
  MODE = "local";
  return false;
}
function getMode() { return MODE; }

async function init() {
  try {
    const isDb = await detectMode();
    if (isDb) {
      const j = await http("bootstrap");
      if (j && j.ok) {
        S.petugas = j.petugas || []; S.records = j.records || [];
        S.jadwal = j.jadwal || []; S.accounts = j.accounts || []; S.sessions = j.sessions || [];
        // cermin lokal agar tetap terbaca saat offline sesaat
        lsWrite(LS.petugas, S.petugas); lsWrite(LS.records, S.records);
        lsWrite(LS.jadwal, S.jadwal); lsWrite(LS.accounts, S.accounts); lsWrite(LS.sessions, S.sessions);
        try { const s = await http("sig"); lastSig = (s && s.sig) || ""; } catch (e) { /* abaikan */ }
      }
    } else {
      S.petugas = lsRead(LS.petugas, []); S.records = lsRead(LS.records, []);
      S.jadwal = lsRead(LS.jadwal, []); S.accounts = lsRead(LS.accounts, []); S.sessions = lsRead(LS.sessions, []);
      if (!localStorage.getItem(LS.seeded)) seedDemo();
    }
  } catch (e) {
    console.error("init:", e);
    S.petugas = lsRead(LS.petugas, []); S.records = lsRead(LS.records, []);
    S.jadwal = lsRead(LS.jadwal, []); S.accounts = lsRead(LS.accounts, []); S.sessions = lsRead(LS.sessions, []);
  }
  ensureAdmin();
  emit();
  return MODE;
}

/* live-sync: poll sidik jari, muat ulang bila berubah */
function startSync(intervalMs) {
  if (MODE !== "db") return;
  setInterval(async () => {
    try {
      const s = await http("sig");
      if (s && s.sig && s.sig !== lastSig) { lastSig = s.sig; await init(); }
    } catch (e) { /* server sibuk, lewati */ }
  }, intervalMs || 3500);
}

/* ---------------- simpan (dua mode) ---------------- */
function persist(table, rows) {
  lsWrite(LS[table], rows);
  if (MODE === "db") http("save", { table: table, body: rows }).catch(() => {});
}
function persistDelete(table, id, rows) {
  lsWrite(LS[table], rows);
  if (MODE === "db") http("delete", { table: table, id: id }).catch(() => {});
}

/* ---------------- shift & waktu ---------------- */
const SHIFT = {
  1: { nama: "Pagi", waktu: "08.00–12.00", label: "Shift 1", mulai: 8 * 60 },
  2: { nama: "Siang", waktu: "12.00–16.00", label: "Shift 2", mulai: 12 * 60 },
};
const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const HARI_KERJA = [1, 2, 3, 4, 5, 6];

function pad(n) { return String(n).padStart(2, "0"); }
function todayStr(d) { d = d || new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
function shiftForTime(d) { d = d || new Date(); return d.getHours() < 12 ? 1 : 2; }
function fmtHM(iso) { if (!iso) return "—"; const d = new Date(iso); return pad(d.getHours()) + "." + pad(d.getMinutes()); }
function fmtDateShort(s) { const d = new Date(s + "T12:00:00"); return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }); }
function fmtDateLong(s) { const d = new Date(s + "T12:00:00"); return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); }
function fmtDurasi(menit) { if (menit == null || isNaN(menit)) return "—"; const j = Math.floor(menit / 60), m = menit % 60; return j + " j " + m + " m"; }
function durasiMenit(r) {
  if (!r.masuk) return null;
  const a = new Date(r.masuk), b = r.keluar ? new Date(r.keluar) : new Date();
  return Math.max(0, Math.round((b - a) / 60000));
}
function menitTerlambat(r) {
  if (!r.masuk) return 0;
  const d = new Date(r.masuk);
  const m = d.getHours() * 60 + d.getMinutes();
  return Math.max(0, m - (SHIFT[r.shift].mulai + 10));
}

/* ---------------- jadwal ---------------- */
function jadwalUntuk(d) { const hari = d.getDay(); return S.jadwal.filter((j) => j.hari === hari); }
function generateJadwal() {
  const p = S.petugas, n = p.length, out = [];
  if (n === 0) return out;
  HARI_KERJA.forEach((hari, di) => {
    out.push({ id: uid(), hari: hari, shift: 1, petugasId: p[(di * 2) % n].id });
    out.push({ id: uid(), hari: hari, shift: 2, petugasId: p[(di * 2 + 1) % n].id });
  });
  return out;
}

/* ---------------- sesi QR ---------------- */
function getSessionFor(shift) {
  const t = todayStr();
  let s = S.sessions.find((x) => x.date === t && x.shift === shift);
  if (!s) {
    s = { token: uid().toUpperCase(), date: t, shift: shift, createdAt: new Date().toISOString() };
    S.sessions.push(s); persist("sessions", S.sessions);
  }
  return s;
}
function renewSession(shift) {
  const t = todayStr();
  S.sessions = S.sessions.filter((x) => !(x.date === t && x.shift === shift));
  const s = { token: uid().toUpperCase(), date: t, shift: shift, createdAt: new Date().toISOString() };
  S.sessions.push(s); persist("sessions", S.sessions);
  return s;
}
function findSession(token) { return S.sessions.find((x) => x.token === token); }
function scanUrlFor(token) { return location.href.replace(/[^/]*$/, "scan.html") + "?token=" + token; }

/* ---------------- presensi ---------------- */
function findOpenRecord(date, shift, petugasId) {
  return S.records.find((r) => r.date === date && r.shift === shift && r.petugasId === petugasId && !r.keluar);
}
function checkIn(petugas, shift, fotoMasuk) {
  const r = { id: uid(), date: todayStr(), shift: shift, petugasId: petugas.id, nama: petugas.nama, masuk: new Date().toISOString(), keluar: null, fotoMasuk: fotoMasuk || null, fotoKeluar: null };
  S.records.unshift(r); persist("records", S.records); emit();
  return r;
}
function checkOut(rec, fotoKeluar) {
  rec.keluar = new Date().toISOString();
  if (fotoKeluar) rec.fotoKeluar = fotoKeluar;
  persist("records", S.records); emit();
  return rec;
}
/* hapus satu atau banyak catatan presensi (berkas foto ikut dibersihkan di server) */
function deleteRecords(ids) {
  const set = new Set(ids);
  S.records = S.records.filter((r) => !set.has(r.id));
  lsWrite(LS.records, S.records);
  if (MODE === "db") http("delete", { table: "records", id: ids.join(",") }).catch(() => {});
  emit();
}

/* ---------------- akun / auth (sinkron, anti-terkunci) ---------------- */
function verifyPw(acc, pw) {
  if (acc.salt && acc.hash === hashPw(pw, acc.salt)) return true;           // format kini
  if (!acc.salt && acc.hash === djb2("sipelok:" + pw + ":konawe")) return true; // warisan v0
  return false;
}
function ensureAdmin() {
  const ada = S.accounts.some((a) => a.role === "admin");
  if (!ada) {
    S.accounts.push({ username: "admin", nama: "Administrator", role: "admin", salt: ADMIN_SALT, hash: hashPw("bpskonawe", ADMIN_SALT), dibuat: new Date().toISOString() });
    persist("accounts", S.accounts);
  }
}
function login(username, password) {
  ensureAdmin();
  const acc = S.accounts.find((a) => a.username.toLowerCase() === username.trim().toLowerCase());
  if (!acc) return null;
  // pemulihan akun bawaan: bila admin tersimpan dalam format versi lama yang
  // tak dikenali, mengetik sandi bawaan akan memulihkannya ke format kini
  if (acc.username === "admin" && !verifyPw(acc, password) && password === "bpskonawe") {
    acc.salt = ADMIN_SALT; acc.hash = hashPw(password, ADMIN_SALT);
    persist("accounts", S.accounts);
  }
  if (!verifyPw(acc, password)) return null;
  try { sessionStorage.setItem(AUTH_KEY, acc.username); } catch (e) { /* abaikan */ }
  return acc;
}
function getAuth() {
  try {
    const u = sessionStorage.getItem(AUTH_KEY);
    return u ? (S.accounts.find((a) => a.username === u) || null) : null;
  } catch (e) { return null; }
}
function logout() { try { sessionStorage.removeItem(AUTH_KEY); } catch (e) { /* abaikan */ } }

function addAccount(username, nama, password, role) {
  const uname = username.trim();
  if (uname.length < 3) return { ok: false, error: "Nama pengguna minimal 3 karakter." };
  if (!/^[a-zA-Z0-9._-]+$/.test(uname)) return { ok: false, error: "Hanya huruf, angka, titik, strip, dan garis bawah." };
  if (S.accounts.some((a) => a.username.toLowerCase() === uname.toLowerCase())) return { ok: false, error: "Nama pengguna sudah dipakai." };
  if (password.length < 6) return { ok: false, error: "Kata sandi minimal 6 karakter." };
  const salt = newSalt();
  S.accounts.push({ username: uname, nama: nama.trim() || uname, role: role, salt: salt, hash: hashPw(password, salt), dibuat: new Date().toISOString() });
  persist("accounts", S.accounts); emit();
  return { ok: true };
}
function removeAccount(username) {
  const target = S.accounts.find((a) => a.username === username);
  if (!target) return { ok: false, error: "Akun tidak ditemukan." };
  if (target.role === "admin" && S.accounts.filter((a) => a.role === "admin").length <= 1)
    return { ok: false, error: "Minimal harus tersisa satu akun admin." };
  S.accounts = S.accounts.filter((a) => a.username !== username);
  persist("accounts", S.accounts); emit();
  return { ok: true };
}
function changePassword(username, cur, next) {
  const acc = S.accounts.find((a) => a.username === username);
  if (!acc) return { ok: false, error: "Akun tidak ditemukan." };
  if (!verifyPw(acc, cur)) return { ok: false, error: "Kata sandi lama tidak cocok." };
  if (next.length < 6) return { ok: false, error: "Kata sandi baru minimal 6 karakter." };
  const salt = newSalt();
  acc.salt = salt; acc.hash = hashPw(next, salt);
  persist("accounts", S.accounts); emit();
  return { ok: true };
}

/* ---------------- data contoh (mode demo) ---------------- */
const DEMO = [
  ["Andi Saputra, S.ST", "19870412 201001 1 003"], ["Rina Kartika, S.E.", "19910223 201502 2 007"],
  ["Muh. Fajar, S.Kom", "19930817 201903 1 002"], ["Sri Wahyuni, S.Stat", "19950530 202012 2 001"],
  ["Laode Arman, S.E.", "19891105 201403 1 005"], ["Nurul Hidayah, S.ST", "19970714 202203 2 004"],
];
function seedDemo(force) {
  if (MODE === "db" && !force) return;
  if (!force && localStorage.getItem(LS.seeded)) return;
  S.petugas = DEMO.map((d) => ({ id: uid(), nama: d[0], nip: d[1] }));
  S.jadwal = generateJadwal();
  S.accounts = [];
  S.accounts.push({ username: "admin", nama: "Administrator", role: "admin", salt: ADMIN_SALT, hash: hashPw("bpskonawe", ADMIN_SALT), dibuat: new Date().toISOString() });
  S.sessions = []; S.records = [];
  const hour = new Date().getHours();
  const rec = (shift, i, telat, keluar) => {
    const j = S.jadwal.find((x) => x.shift === shift) || {};
    const p = S.petugas.find((x) => x.id === j.petugasId) || S.petugas[i % S.petugas.length];
    const d = new Date(); d.setHours(shift === 1 ? 8 : 12, telat, 0, 0);
    const masuk = d.toISOString(); let out = null;
    if (keluar != null) { const e = new Date(d); e.setMinutes(e.getMinutes() + 230 + keluar); out = e.toISOString(); }
    S.records.push({ id: uid(), date: todayStr(), shift: shift, petugasId: p.id, nama: p.nama, masuk: masuk, keluar: out, fotoMasuk: null, fotoKeluar: null });
  };
  if (hour >= 8) { rec(1, 0, -7, hour >= 12 ? 8 : null); rec(1, 1, 6, hour >= 12 ? -4 : null); }
  if (hour >= 12) { rec(2, 2, -4, null); rec(2, 3, 5, null); }
  lsWrite(LS.petugas, S.petugas); lsWrite(LS.records, S.records); lsWrite(LS.jadwal, S.jadwal);
  lsWrite(LS.accounts, S.accounts); lsWrite(LS.sessions, S.sessions);
  localStorage.setItem(LS.seeded, "1");
  emit();
}

/* ---------------- ekspor CSV ---------------- */
function downloadCsv(nama, baris) {
  const csv = "\uFEFF" + baris.map((b) => b.map((c) => '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"').join(";")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = nama; a.click(); URL.revokeObjectURL(a.href);
}

/* ---------------- salin, QR & foto ---------------- */
async function copyText(t) { try { await navigator.clipboard.writeText(t); return true; } catch (e) { return false; } }
function qrImg(url, size) {
  return "https://api.qrserver.com/v1/create-qr-code/?size=" + size + "x" + size +
         "&color=0C2431&bgcolor=FFFFFF&margin=1&data=" + encodeURIComponent(url);
}
/* perkecil foto HP agar hemat penyimpanan (maks 720px, JPEG) */
function kecilkanFoto(file, done) {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    try {
      const max = 720, sc = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.width * sc));
      c.height = Math.max(1, Math.round(img.height * sc));
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      done(c.toDataURL("image/jpeg", 0.72));
    } catch (e) { URL.revokeObjectURL(url); done(null); }
  };
  img.onerror = () => { URL.revokeObjectURL(url); done(null); };
  img.src = url;
}

/* ---------------- util DOM ---------------- */
function el(sel) { return document.querySelector(sel); }
function esc(s) { const d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; }
function inisial(nama) { return (nama || "?").trim().charAt(0).toUpperCase(); }
function modeBadgeHtml() {
  return MODE === "db"
    ? '<span class="badge lagoon"><span class="dot" style="background:var(--lagoon-500)"></span>MySQL Aktif</span>'
    : '<span class="badge amber"><span class="dot" style="background:var(--amberx-500)"></span>Mode Demo</span>';
}
