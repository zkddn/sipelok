/* =========================================================
   SIPELOK — klien API PHP/MySQL (mode database)
   ---------------------------------------------------------
   Aplikasi berjalan dalam dua mode:
   • "db"    : api.php terdeteksi → semua data disinkronkan ke
               MySQL. PC loket dan HP petugas melihat data yang
               sama (polling tanda perubahan tiap ~3,5 detik).
   • "local" : api.php tidak ada (mis. pratinjau statis) →
               data tersimpan di localStorage peramban ini.

   File PHP berada di folder `api/` hasil build (public/api).
   ========================================================= */

export type BackendMode = "db" | "local";

/** Nama tabel logis frontend → dipakai sebagai parameter `table` di api.php */
export type TableId = "petugas" | "records" | "jadwal" | "accounts" | "sessions";

export interface BootstrapPayload {
  petugas: unknown[];
  records: unknown[];
  jadwal: unknown[];
  accounts: unknown[];
  sessions: unknown[];
}

/* Kunci API — SAMAKAN dengan define('API_KEY', ...) di api/config.php */
const API_KEY = "sipelok-2026";
const API_URL = "api.php";

let mode: BackendMode = "local";
let lastSig = "";
let pollTimer: number | null = null;
let booted = false;

const modeListeners = new Set<(m: BackendMode) => void>();
let payloadHandler: ((p: BootstrapPayload) => void) | null = null;
let changeHandler: (() => void) | null = null;

/* ---------- registrasi dari store.ts (menghindari impor sirkular) ---------- */

export function onRemotePayload(cb: (p: BootstrapPayload) => void) {
  payloadHandler = cb;
}

export function onRemoteChange(cb: () => void) {
  changeHandler = cb;
}

export function getBackendMode(): BackendMode {
  return mode;
}

export function isBackendBooted(): boolean {
  return booted;
}

export function onBackendMode(cb: (m: BackendMode) => void): () => void {
  modeListeners.add(cb);
  cb(mode);
  return () => modeListeners.delete(cb);
}

function setMode(m: BackendMode) {
  if (mode === m) return;
  mode = m;
  modeListeners.forEach((cb) => cb(m));
}

/* ---------- util fetch dengan batas waktu ---------- */

async function jfetch<T>(url: string, init?: RequestInit, timeoutMs = 3000): Promise<T> {
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    return JSON.parse(text) as T;
  } finally {
    window.clearTimeout(t);
  }
}

const headers = (): Record<string, string> => ({
  "Content-Type": "application/json",
  "X-Sipelok-Key": API_KEY,
});

/* ---------- inisialisasi saat aplikasi dimuat ---------- */

type ApiOk = { ok: boolean; error?: string };

export async function initBackend(): Promise<BackendMode> {
  try {
    const ping = await jfetch<ApiOk>(`${API_URL}?action=ping`);
    if (!ping || ping.ok !== true) throw new Error("ping gagal");
    const data = await jfetch<BootstrapPayload & ApiOk>(`${API_URL}?action=bootstrap`, undefined, 6000);
    if (!data || data.ok !== true) throw new Error("bootstrap gagal");
    applyPayload(data);
    setMode("db");
    changeHandler?.();
    startPolling();
  } catch {
    setMode("local");
  } finally {
    booted = true;
    modeListeners.forEach((cb) => cb(mode));
  }
  return mode;
}

function applyPayload(p: BootstrapPayload) {
  payloadHandler?.(p);
}

/** Tes koneksi singkat (dipakai halaman Panduan). */
export async function pingBackend(): Promise<{ ok: boolean; detail: string }> {
  try {
    const r = await jfetch<ApiOk & { db?: string; version?: string }>(`${API_URL}?action=ping`);
    if (r?.ok === true) return { ok: true, detail: `Terhubung · database "${r.db ?? "sipelok"}" · ${r.version ?? "MySQL"}` };
    return { ok: false, detail: r?.error ?? "api.php menjawab tetapi database gagal dihubungi." };
  } catch {
    return { ok: false, detail: "api.php tidak ditemukan (mode statis). Salin folder api/ ke server PHP." };
  }
}

/* ---------- penulisan data (antre + debounce per tabel) ---------- */

const pending = new Map<TableId, unknown[]>();
const timers = new Map<TableId, number>();

export function backendSave(table: TableId, rows: unknown[]) {
  if (mode !== "db") return;
  pending.set(table, rows);
  if (timers.has(table)) return;
  const t = window.setTimeout(() => flushTable(table), 350);
  timers.set(table, t);
}

async function flushTable(table: TableId) {
  timers.delete(table);
  const rows = pending.get(table);
  if (!rows) return;
  pending.delete(table);
  try {
    await jfetch<ApiOk>(`${API_URL}?action=save&table=${table}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(rows),
    });
  } catch {
    /* server mungkin restart — data aman di cache lokal, coba lagi pada perubahan berikutnya */
  }
}

export async function backendDeleteRow(table: TableId, id: string) {
  if (mode !== "db") return;
  try {
    await jfetch<ApiOk>(`${API_URL}?action=delete&table=${table}&id=${encodeURIComponent(id)}`, {
      method: "POST",
      headers: headers(),
    });
  } catch {
    /* abaikan */
  }
}

export async function backendClear(table: TableId) {
  if (mode !== "db") return;
  try {
    await jfetch<ApiOk>(`${API_URL}?action=clear&table=${table}`, { method: "POST", headers: headers() });
  } catch {
    /* abaikan */
  }
}

/* ---------- polling perubahan (sinkronisasi antar perangkat) ---------- */

function startPolling() {
  if (pollTimer !== null) return;
  pollTimer = window.setInterval(async () => {
    if (document.hidden) return;
    try {
      const r = await jfetch<{ ok: boolean; sig?: string }>(`${API_URL}?action=sig`, undefined, 2500);
      if (!r?.ok || !r.sig) return;
      if (lastSig && r.sig !== lastSig) {
        const data = await jfetch<BootstrapPayload & ApiOk>(`${API_URL}?action=bootstrap`, undefined, 6000);
        if (data?.ok === true) {
          applyPayload(data);
          changeHandler?.();
        }
      }
      lastSig = r.sig;
    } catch {
      /* jaringan berkedip — lewati siklus ini */
    }
  }, 3500);
}
