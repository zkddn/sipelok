/* ============================================================
   SIPELOK — util.js  (dipakai semua halaman, tanpa npm)
   Dua mode:  db  -> PHP+MySQL   |   local -> localStorage (demo)
   ============================================================ */
"use strict";

// Auto-detect API path berdasarkan lokasi halaman
function getApiPath() {
  const path = window.location.pathname;
  
  // Coba berbagai kemungkinan path
  const possiblePaths = [
    'api/api.php',           // Struktur standar
    '../api/api.php',        // Jika di subfolder
    '/api/api.php',          // Absolute path dari root
    '/sipelok/api/api.php',  // Jika di subfolder sipelok
  ];
  
  // Gunakan path relatif dari lokasi saat ini
  // Jika halaman di /sipelok/presensi.html, API di /sipelok/api/api.php
  const basePath = path.substring(0, path.lastIndexOf('/') + 1);
  return basePath + 'api/api.php';
}

const API = getApiPath();
const API_KEY = "sipelok-konawe-2024";
const ADMIN_SALT = "sipelokadmin";

console.log("API Path:", API);

const LS = {
  petugas: "sipelok.petugas", records: "sipelok.records", jadwal: "sipelok.jadwal",
  accounts: "sipelok.accounts", seeded: "sipelok.seeded",
};
const AUTH_KEY = "sipelok.auth";

const S = { petugas: [], records: [], jadwal: [], accounts: [] };
let MODE = "local";
let lastSig = "";
const listeners = [];

/* ---------------- dasar ---------------- */
let uidCounter = 0;
function uid() { 
  // Gunakan crypto.randomUUID() jika tersedia (paling unik)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '');
  }
  // Fallback: timestamp + counter + random untuk memastikan unik
  uidCounter++;
  const timestamp = Date.now().toString(36);
  const counter = uidCounter.toString(36);
  const random = Math.random().toString(36).slice(2, 11);
  const uniqueId = `${timestamp}-${counter}-${random}`;
  console.log("Generated UID:", uniqueId);
  return uniqueId;
}
function onChange(fn) { listeners.push(fn); }
function emit() { listeners.forEach((f) => { try { f(); } catch (e) { console.error(e); } }); }

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
  
  // Selalu kirim API key untuk semua request (GET dan POST)
  init.headers["X-Sipelok-Key"] = API_KEY;
  
  if (opts.body) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(opts.body);
    console.log("HTTP POST:", action, "Table:", opts.table, "Records:", opts.body.length);
  } else {
    console.log("HTTP GET:", action);
  }
  
  console.log("Request URL:", url);
  
  try {
    const r = await fetch(url, init);
    
    // Cek status HTTP
    if (r.status === 404) {
      const errorMsg = `File API tidak ditemukan (404). URL: ${url}\n\n` +
        `Kemungkinan penyebab:\n` +
        `1. File api/api.php tidak ada di server\n` +
        `2. Struktur folder berbeda dari yang diharapkan\n` +
        `3. Server menggunakan konfigurasi yang berbeda\n\n` +
        `Solusi:\n` +
        `- Pastikan folder 'api' ada di lokasi yang sama dengan file HTML\n` +
        `- Periksa apakah file api.php ada di folder api/\n` +
        `- Cek console browser untuk detail error`;
      console.error("HTTP 404 Error:", errorMsg);
      throw new Error(errorMsg);
    }
    
    if (r.status === 500) {
      const errorMsg = `Server error (500). Periksa error log PHP di server.`;
      console.error("HTTP 500 Error:", errorMsg);
      throw new Error(errorMsg);
    }
    
    // Cek apakah response adalah JSON
    const contentType = r.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await r.text();
      const errorMsg = `Response bukan JSON. Content-Type: ${contentType}\n\n` +
        `Response: ${text.substring(0, 200)}...\n\n` +
        `Kemungkinan penyebab:\n` +
        `1. File api.php mengembalikan HTML error page\n` +
        `2. Ada error PHP yang tidak tertangkap\n` +
        `3. File api.php tidak ada (404)`;
      console.error("Non-JSON Response:", errorMsg);
      throw new Error(errorMsg);
    }
    
    const data = await r.json();
    if (!data.ok) {
      console.error("HTTP Error:", action, data);
    }
    return data;
  } catch (e) {
    console.error("HTTP Fetch Error:", action, e);
    throw e;
  }
}

/* HTTP dengan progress tracking menggunakan XMLHttpRequest + retry mechanism */
function httpWithProgress(action, opts, onProgress) {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 detik
  
  function attempt(retryCount) {
    return new Promise((resolve, reject) => {
      opts = opts || {};
      
      // Pastikan URL lengkap dengan origin
      let url = API;
      if (!url.startsWith('http')) {
        url = location.origin + '/' + url;
      }
      url += "?action=" + encodeURIComponent(action);
      if (opts.table) url += "&table=" + encodeURIComponent(opts.table);
      
      console.log("=== httpWithProgress ATTEMPT", retryCount + 1, "/", MAX_RETRIES, "===");
      console.log("URL:", url);
      console.log("Action:", action);
      console.log("Table:", opts.table);
      console.log("Body size:", opts.body ? JSON.stringify(opts.body).length : 0, "bytes");
      
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader("X-Sipelok-Key", API_KEY);
      
      // Track upload progress
      xhr.upload.onprogress = function(e) {
        if (e.lengthComputable && onProgress) {
          const percent = Math.round((e.loaded / e.total) * 100);
          console.log("Upload progress:", percent + "%", e.loaded + "/" + e.total);
          onProgress({
            percent: percent,
            loaded: e.loaded,
            total: e.total,
            status: "Mengupload data... (" + percent + "%)"
          });
        }
      };
      
      xhr.onload = function() {
        console.log("=== httpWithProgress RESPONSE ===");
        console.log("Status:", xhr.status);
        console.log("Response:", xhr.responseText);
        
        // Cek 404 terlebih dahulu
        if (xhr.status === 404) {
          const errorMsg = `File API tidak ditemukan (404).\n\n` +
            `URL: ${url}\n\n` +
            `Kemungkinan penyebab:\n` +
            `1. File api/api.php tidak ada di server\n` +
            `2. Struktur folder berbeda dari yang diharapkan\n` +
            `3. Server menggunakan konfigurasi yang berbeda\n\n` +
            `Solusi:\n` +
            `- Pastikan folder 'api' ada di lokasi yang sama dengan file HTML\n` +
            `- Periksa apakah file api.php ada di folder api/\n` +
            `- Cek console browser untuk detail error`;
          
          console.error("=== httpWithProgress 404 ERROR ===");
          console.error(errorMsg);
          
          if (onProgress) {
            onProgress({ percent: 100, status: "✗ File API tidak ditemukan (404)", error: true });
          }
          reject(new Error(errorMsg));
          return; // Jangan retry untuk 404
        }
        
        // Cek 500 error
        if (xhr.status === 500) {
          const errorMsg = `Server error (500). Periksa error log PHP di server.`;
          console.error("=== httpWithProgress 500 ERROR ===");
          console.error(errorMsg);
          
          if (onProgress) {
            onProgress({ percent: 100, status: "✗ Server error (500)", error: true });
          }
          reject(new Error(errorMsg));
          return; // Jangan retry untuk 500
        }
        
        try {
          const data = JSON.parse(xhr.responseText);
          console.log("Parsed data:", data);
          
          if (xhr.status === 200 && data.ok) {
            if (onProgress) {
              onProgress({ percent: 100, status: "✓ Upload selesai!", success: true });
            }
            console.log("=== httpWithProgress SUCCESS ===");
            resolve(data);
          } else {
            const errorMsg = data.error || "HTTP " + xhr.status + ": " + xhr.statusText;
            console.error("=== httpWithProgress ERROR ===", errorMsg);
            
            // Retry jika ada error dan masih ada percobaan
            if (retryCount < MAX_RETRIES - 1) {
              console.log("Retrying in", RETRY_DELAY / 1000, "seconds...");
              if (onProgress) {
                onProgress({ 
                  percent: 0, 
                  status: "Gagal, mencoba ulang... (" + (retryCount + 1) + "/" + MAX_RETRIES + ")",
                  retry: true
                });
              }
              setTimeout(() => {
                attempt(retryCount + 1).then(resolve).catch(reject);
              }, RETRY_DELAY);
            } else {
              if (onProgress) {
                onProgress({ percent: 100, status: "✗ " + errorMsg, error: true });
              }
              reject(new Error(errorMsg));
            }
          }
        } catch (e) {
          console.error("=== httpWithProgress PARSE ERROR ===", e);
          console.error("Response text:", xhr.responseText);
          
          // Cek apakah response adalah HTML error page
          if (xhr.responseText.includes('<!DOCTYPE') || xhr.responseText.includes('<html')) {
            const errorMsg = `Server mengembalikan HTML, bukan JSON.\n\n` +
              `Ini biasanya berarti:\n` +
              `1. File api.php tidak ada (404)\n` +
              `2. Ada error PHP yang menampilkan HTML error page\n` +
              `3. Server mengembalikan error page\n\n` +
              `Response: ${xhr.responseText.substring(0, 200)}...`;
            
            console.error("HTML Response Error:", errorMsg);
            
            if (onProgress) {
              onProgress({ percent: 100, status: "✗ Server error: File API tidak ditemukan", error: true });
            }
            reject(new Error(errorMsg));
            return; // Jangan retry untuk HTML error
          }
          
          // Retry jika parse error dan masih ada percobaan
          if (retryCount < MAX_RETRIES - 1) {
            console.log("Retrying in", RETRY_DELAY / 1000, "seconds...");
            if (onProgress) {
              onProgress({ 
                percent: 0, 
                status: "Parse error, mencoba ulang... (" + (retryCount + 1) + "/" + MAX_RETRIES + ")",
                retry: true
              });
            }
            setTimeout(() => {
              attempt(retryCount + 1).then(resolve).catch(reject);
            }, RETRY_DELAY);
          } else {
            if (onProgress) {
              onProgress({ percent: 100, status: "✗ Parse error: " + e.message, error: true });
            }
            reject(e);
          }
        }
      };
      
      xhr.onerror = function() {
        console.error("=== httpWithProgress NETWORK ERROR ===");
        console.error("URL:", url);
        console.error("ReadyState:", xhr.readyState);
        console.error("Status:", xhr.status);
        
        // Retry jika network error dan masih ada percobaan
        if (retryCount < MAX_RETRIES - 1) {
          console.log("Retrying in", RETRY_DELAY / 1000, "seconds...");
          if (onProgress) {
            onProgress({ 
              percent: 0, 
              status: "Network error, mencoba ulang... (" + (retryCount + 1) + "/" + MAX_RETRIES + ")",
              retry: true
            });
          }
          setTimeout(() => {
            attempt(retryCount + 1).then(resolve).catch(reject);
          }, RETRY_DELAY);
        } else {
          if (onProgress) {
            onProgress({ percent: 100, status: "✗ Network error - tidak dapat terhubung ke server", error: true });
          }
          reject(new Error("Network error - tidak dapat terhubung ke server"));
        }
      };
      
      xhr.ontimeout = function() {
        console.error("=== httpWithProgress TIMEOUT ===");
        
        // Retry jika timeout dan masih ada percobaan
        if (retryCount < MAX_RETRIES - 1) {
          console.log("Retrying in", RETRY_DELAY / 1000, "seconds...");
          if (onProgress) {
            onProgress({ 
              percent: 0, 
              status: "Timeout, mencoba ulang... (" + (retryCount + 1) + "/" + MAX_RETRIES + ")",
              retry: true
            });
          }
          setTimeout(() => {
            attempt(retryCount + 1).then(resolve).catch(reject);
          }, RETRY_DELAY);
        } else {
          if (onProgress) {
            onProgress({ percent: 100, status: "✗ Timeout - server tidak merespons", error: true });
          }
          reject(new Error("Request timeout"));
        }
      };
      
      if (opts.body) {
        console.log("Sending data...");
        xhr.timeout = 15000; // Kurangi timeout dari 30 detik ke 15 detik
        xhr.send(JSON.stringify(opts.body));
      } else {
        reject(new Error("No body to send"));
      }
    });
  }
  
  return attempt(0);
}

/* ---------------- deteksi mode & bootstrap ---------------- */
async function detectMode() {
  try {
    console.log("Mendeteksi mode penyimpanan...");
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000); // Timeout 5 detik
    const r = await fetch(API + "?action=ping", { signal: ctrl.signal });
    clearTimeout(t);
    const j = await r.json();
    if (j && j.ok) {
      console.log("✓ Server PHP terdeteksi. Mode: MySQL");
      MODE = "db";
      return true;
    } else {
      console.log("✗ Server PHP tidak merespons dengan benar. Mode: LocalStorage");
    }
  } catch (e) {
    console.log("✗ Tidak dapat terhubung ke server PHP. Mode: LocalStorage");
    console.log("Error:", e.message);
  }
  MODE = "local";
  return false;
}
function getMode() { return MODE; }

async function init() {
  try {
    const isDb = await detectMode();
    console.log("Mode penyimpanan:", MODE === "db" ? "MySQL (database)" : "LocalStorage (demo)");
    
    if (isDb) {
      console.log("Mengambil data dari database...");
      const j = await http("bootstrap");
      if (j && j.ok) {
        S.petugas = j.petugas || []; S.records = j.records || [];
        S.jadwal = j.jadwal || []; S.accounts = j.accounts || [];
        console.log("Data berhasil dimuat:", S.records.length, "records");
        lsWrite(LS.petugas, S.petugas); lsWrite(LS.records, S.records);
        lsWrite(LS.jadwal, S.jadwal); lsWrite(LS.accounts, S.accounts);
        try { const s = await http("sig"); lastSig = (s && s.sig) || ""; } catch (e) { /* abaikan */ }
      } else {
        console.error("Gagal mengambil data dari database:", j);
      }
    } else {
      console.log("Mengambil data dari localStorage...");
      S.petugas = lsRead(LS.petugas, []); S.records = lsRead(LS.records, []);
      S.jadwal = lsRead(LS.jadwal, []); S.accounts = lsRead(LS.accounts, []);
      console.log("Data dimuat dari localStorage:", S.records.length, "records");
      if (!localStorage.getItem(LS.seeded)) seedDemo();
    }
  } catch (e) {
    console.error("init error:", e);
    S.petugas = lsRead(LS.petugas, []); S.records = lsRead(LS.records, []);
    S.jadwal = lsRead(LS.jadwal, []); S.accounts = lsRead(LS.accounts, []);
  }
  ensureAdmin();
  emit();
  return MODE;
}

function startSync(intervalMs) {
  if (MODE !== "db") return;
  let syncing = false;
  setInterval(async () => {
    if (syncing) return; // Jangan sync jika sedang sync
    try {
      syncing = true;
      const s = await http("sig");
      if (s && s.sig && s.sig !== lastSig) {
        lastSig = s.sig;
        // Hanya reload data, jangan overwrite jika ada perubahan lokal
        const j = await http("bootstrap");
        if (j && j.ok) {
          // Merge: hanya update jika record dari server lebih baru
          const localIds = new Set(S.records.map(r => r.id));
          const serverRecords = j.records || [];
          
          // Tambahkan record baru dari server yang belum ada di lokal
          serverRecords.forEach(sr => {
            if (!localIds.has(sr.id)) {
              S.records.push(sr);
            }
          });
          
          // Update record yang sudah ada jika versi server lebih baru
          S.records = S.records.map(lr => {
            const sr = serverRecords.find(s => s.id === lr.id);
            if (sr) {
              // Gunakan yang lebih baru berdasarkan timestamp
              const localTime = new Date(lr.masuk || lr.keluar || 0).getTime();
              const serverTime = new Date(sr.masuk || sr.keluar || 0).getTime();
              return serverTime > localTime ? sr : lr;
            }
            return lr;
          });
          
          lsWrite(LS.records, S.records);
          emit();
        }
      }
    } catch (e) {
      console.error("Sync error:", e);
    } finally {
      syncing = false;
    }
  }, intervalMs || 3500);
}

/* ---------------- simpan (dua mode) ---------------- */
function persist(table, rows) {
  console.log("=== persist START ===");
  console.log("Table:", table, "Rows:", rows.length, "Mode:", MODE);
  
  lsWrite(LS[table], rows);
  console.log("Data saved to localStorage");
  
  if (MODE === "db") {
    console.log("Sending to database...");
    
    // Untuk jadwal, kirim dalam chunks jika terlalu besar
    const CHUNK_SIZE = 100;
    if (table === "jadwal" && rows.length > CHUNK_SIZE) {
      console.log("Splitting into chunks of", CHUNK_SIZE);
      const chunks = [];
      for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        chunks.push(rows.slice(i, i + CHUNK_SIZE));
      }
      console.log("Total chunks:", chunks.length);
      
      let completed = 0;
      let failed = 0;
      
      chunks.forEach((chunk, index) => {
        console.log("Sending chunk", index + 1, "/", chunks.length, "(", chunk.length, "rows)");
        http("save", { table: table, body: chunk })
          .then(res => {
            if (!res || !res.ok) {
              console.error("Chunk", index + 1, "failed:", res);
              failed++;
            } else {
              console.log("Chunk", index + 1, "success");
            }
            completed++;
            if (completed === chunks.length) {
              if (failed > 0) {
                alert("Peringatan: " + failed + " dari " + chunks.length + " chunk gagal disimpan ke database. Data tersimpan lokal.");
              } else {
                console.log("All chunks saved successfully");
              }
            }
          })
          .catch(err => {
            console.error("Chunk", index + 1, "error:", err);
            failed++;
            completed++;
            if (completed === chunks.length) {
              alert("Error koneksi ke server. " + failed + " chunk gagal. Data tersimpan lokal saja.");
            }
          });
      });
    } else {
      // Kirim semua sekaligus
      http("save", { table: table, body: rows })
        .then(res => {
          if (!res || !res.ok) {
            console.error("Gagal simpan ke database:", res);
            alert("Peringatan: Data tersimpan lokal tapi gagal ke server. Error: " + (res?.error || "Unknown"));
          } else {
            console.log("✓ Data berhasil disimpan ke database. Rows:", res.rows);
          }
        })
        .catch(err => {
          console.error("Error simpan ke database:", err);
          alert("Error koneksi ke server: " + err.message + ". Data tersimpan lokal saja.");
        });
    }
  } else {
    console.log("Mode is local, skipping database save");
  }
  
  console.log("=== persist END ===");
}
function persistDelete(table, id, rows) {
  lsWrite(LS[table], rows);
  if (MODE === "db") {
    http("delete", { table: table, id: id })
      .then(res => {
        if (!res || !res.ok) console.error("Gagal hapus dari database:", res);
      })
      .catch(err => console.error("Error hapus dari database:", err));
  }
}

/* ---------------- shift & waktu ---------------- */
const SHIFT = {
  1: { nama: "Pagi", waktu: "08.00–12.00", label: "Shift 1", mulai: 8 * 60, selesai: 12 * 60 },
  2: { nama: "Siang", waktu: "12.00–15.30", label: "Shift 2", mulai: 12 * 60, selesai: 15 * 60 + 30 },
};
const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const HARI_KERJA = [1, 2, 3, 4, 5]; // Senin–Jumat

/* ---------------- role petugas per shift ---------------- */
const ROLE_MAP = {
  1: "Frontliner",
  2: "Konsultasi",
  3: "Rekomendasi",
  4: "Perpustakaan"
};

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
/* waktu selesai shift 2 berbeda di hari Jumat */
function waktuShift(tanggalStr, shift) {
  if (shift === 1) return SHIFT[1].waktu;
  const d = new Date(tanggalStr + "T12:00:00");
  return d.getDay() === 5 ? "12.00–16.00" : SHIFT[2].waktu;
}

/* ---------------- jadwal per bulan ---------------- */
function jadwalUntukTanggal(tanggalStr) {
  return S.jadwal.filter((j) => j.tanggal === tanggalStr);
}
function jadwalUntukSekarang() {
  return jadwalUntukTanggal(todayStr());
}
function generateJadwalBulan(tahun, bulan) {
  const p = S.petugas, n = p.length, out = [];
  if (n === 0) {
    console.warn("generateJadwalBulan: Tidak ada petugas");
    return out;
  }
  
  console.log("=== generateJadwalBulan START ===");
  console.log("Tahun:", tahun, "Bulan:", bulan, "Jumlah petugas:", n);
  
  // semua hari kerja di bulan tsb
  const hariKerja = [];
  const d = new Date(tahun, bulan - 1, 1);
  const targetMonth = bulan - 1;
  
  console.log("Target month:", targetMonth, "Start date:", d.toISOString());
  
  let dayCount = 0;
  while (d.getMonth() === targetMonth) {
    dayCount++;
    if (HARI_KERJA.indexOf(d.getDay()) >= 0) {
      const tgl = todayStr(d);
      hariKerja.push(tgl);
      console.log("  Day", dayCount, ":", d.toISOString().split('T')[0], "(", HARI[d.getDay()], ") - WORK DAY");
    } else {
      console.log("  Day", dayCount, ":", d.toISOString().split('T')[0], "(", HARI[d.getDay()], ") - WEEKEND");
    }
    d.setDate(d.getDate() + 1);
  }
  
  console.log("Total days in month:", dayCount);
  console.log("Work days:", hariKerja.length);
  console.log("Work dates:", hariKerja);
  
  // Validasi: pastikan tidak ada duplikat (tanggal, shift, urutan)
  const existingKeys = new Set();
  S.jadwal.forEach(j => {
    if (j.tanggal.startsWith(tahun + "-" + String(bulan).padStart(2, "0"))) {
      existingKeys.add(`${j.tanggal}-${j.shift}-${j.urutan}`);
    }
  });
  console.log("Existing jadwal keys for this month:", existingKeys.size);
  
  // isi 4 slot per shift per hari, bergiliran
  let idx = 0;
  const generatedIds = new Set(); // Track ID yang sudah di-generate
  
  hariKerja.forEach((tgl) => {
    [1, 2].forEach((sh) => {
      for (let ur = 1; ur <= 4; ur++) {
        const key = `${tgl}-${sh}-${ur}`;
        
        // Skip jika sudah ada di database (untuk update manual)
        if (existingKeys.has(key)) {
          console.log("  Skipping existing:", key);
          idx++;
          continue;
        }
        
        // Generate ID yang pasti unik
        let newId;
        let attempts = 0;
        do {
          newId = uid();
          attempts++;
          if (attempts > 10) {
            console.error("Failed to generate unique ID after 10 attempts!");
            break;
          }
        } while (generatedIds.has(newId));
        
        generatedIds.add(newId);
        
        out.push({ 
          id: newId, 
          tanggal: tgl, 
          shift: sh, 
          urutan: ur, 
          petugasId: p[idx % n].id 
        });
        idx++;
      }
    });
  });
  
  console.log("Total schedules generated:", out.length);
  console.log("Expected:", hariKerja.length, "days × 2 shifts × 4 slots =", hariKerja.length * 2 * 4);
  console.log("Unique IDs generated:", generatedIds.size);
  
  // Validasi akhir: pastikan tidak ada ID duplikat
  const idArray = Array.from(generatedIds);
  const uniqueIds = new Set(idArray);
  if (idArray.length !== uniqueIds.size) {
    console.error("DUPLICATE IDS DETECTED!", idArray.length - uniqueIds.size, "duplicates");
  } else {
    console.log("✓ All IDs are unique");
  }
  
  console.log("=== generateJadwalBulan END ===");
  
  return out;
}

/* ---------------- presensi ---------------- */
function findOpenRecord(date, shift, petugasId) {
  return S.records.find((r) => r.date === date && r.shift === shift && r.petugasId === petugasId && !r.keluar);
}
function findRecord(date, shift, petugasId) {
  return S.records.find((r) => r.date === date && r.shift === shift && r.petugasId === petugasId);
}
function checkIn(petugas, shift, fotoMasuk, onProgress) {
  const r = { id: uid(), date: todayStr(), shift: shift, petugasId: petugas.id, nama: petugas.nama, masuk: new Date().toISOString(), keluar: null, fotoMasuk: fotoMasuk || null, fotoKeluar: null };
  S.records.unshift(r);
  
  // Simpan ke localStorage dulu
  lsWrite(LS.records, S.records);
  
  console.log("=== checkIn START ===");
  console.log("Record ID:", r.id);
  console.log("Total records in S.records:", S.records.length);
  console.log("Mode:", MODE);
  
  // Simpan ke database jika mode db
  if (MODE === "db") {
    if (onProgress) {
      onProgress({ percent: 10, status: "Menyimpan ke database..." });
    }
    
    // Kirim hanya record baru (bukan semua records) untuk menghemat bandwidth
    console.log("Sending only new record to server...");
    
    httpWithProgress("save", { table: "records", body: [r] }, onProgress)
      .then(res => {
        console.log("=== checkIn RESPONSE ===");
        console.log("Response:", res);
        
        if (!res || !res.ok) {
          console.error("Gagal simpan presensi ke database:", res);
          if (onProgress) {
            onProgress({ percent: 100, status: "✗ Gagal: " + (res?.error || "Unknown error"), error: true });
          }
          alert("Peringatan: Presensi tersimpan lokal tapi gagal ke server.\n\nError: " + (res?.error || "Unknown") + "\n\nPeriksa console browser (F12) untuk detail.");
        } else {
          console.log("✓ Presensi berhasil disimpan ke database. ID:", r.id);
          if (onProgress) {
            onProgress({ percent: 100, status: "✓ Presensi berhasil disimpan!", success: true });
          }
        }
      })
      .catch(err => {
        console.error("=== checkIn ERROR ===");
        console.error("Error:", err);
        console.error("Error message:", err.message);
        console.error("Error stack:", err.stack);
        
        if (onProgress) {
          onProgress({ percent: 100, status: "✗ Error: " + err.message, error: true });
        }
        alert("Error koneksi ke server.\n\nError: " + err.message + "\n\nPresensi tersimpan lokal saja.\nPeriksa console browser (F12) untuk detail.");
      });
  } else {
    console.log("Mode lokal, tidak mengirim ke server");
    // Mode lokal, langsung selesai
    if (onProgress) {
      onProgress({ percent: 100, status: "✓ Presensi tersimpan (mode lokal)", success: true });
    }
  }
  
  console.log("=== checkIn END ===");
  
  emit();
  return r;
}
function checkOut(rec, fotoKeluar, onProgress) {
  rec.keluar = new Date().toISOString();
  if (fotoKeluar) rec.fotoKeluar = fotoKeluar;
  
  // Simpan ke localStorage dulu
  lsWrite(LS.records, S.records);
  
  console.log("=== checkOut START ===");
  console.log("Record ID:", rec.id);
  console.log("Mode:", MODE);
  
  // Simpan ke database jika mode db
  if (MODE === "db") {
    if (onProgress) {
      onProgress({ percent: 10, status: "Menyimpan ke database..." });
    }
    
    // Kirim hanya record yang diupdate (bukan semua records)
    console.log("Sending only updated record to server...");
    
    httpWithProgress("save", { table: "records", body: [rec] }, onProgress)
      .then(res => {
        console.log("=== checkOut RESPONSE ===");
        console.log("Response:", res);
        
        if (!res || !res.ok) {
          console.error("Gagal simpan presensi pulang ke database:", res);
          if (onProgress) {
            onProgress({ percent: 100, status: "✗ Gagal: " + (res?.error || "Unknown error"), error: true });
          }
          alert("Peringatan: Presensi pulang tersimpan lokal tapi gagal ke server.\n\nError: " + (res?.error || "Unknown") + "\n\nPeriksa console browser (F12) untuk detail.");
        } else {
          console.log("✓ Presensi pulang berhasil disimpan. ID:", rec.id);
          if (onProgress) {
            onProgress({ percent: 100, status: "✓ Presensi pulang berhasil disimpan!", success: true });
          }
        }
      })
      .catch(err => {
        console.error("=== checkOut ERROR ===");
        console.error("Error:", err);
        console.error("Error message:", err.message);
        console.error("Error stack:", err.stack);
        
        if (onProgress) {
          onProgress({ percent: 100, status: "✗ Error: " + err.message, error: true });
        }
        alert("Error koneksi ke server.\n\nError: " + err.message + "\n\nPresensi pulang tersimpan lokal saja.\nPeriksa console browser (F12) untuk detail.");
      });
  } else {
    console.log("Mode lokal, tidak mengirim ke server");
    // Mode lokal, langsung selesai
    if (onProgress) {
      onProgress({ percent: 100, status: "✓ Presensi tersimpan (mode lokal)", success: true });
    }
  }
  
  console.log("=== checkOut END ===");
  
  emit();
  return rec;
}
function deleteRecords(ids) {
  const set = new Set(ids);
  S.records = S.records.filter((r) => !set.has(r.id));
  lsWrite(LS.records, S.records);
  if (MODE === "db") http("delete", { table: "records", id: ids.join(",") }).catch(() => {});
  emit();
}

/* ---------------- akun / auth ---------------- */
function verifyPw(acc, pw) {
  if (acc.salt && acc.hash === hashPw(pw, acc.salt)) return true;
  if (!acc.salt && acc.hash === djb2("sipelok:" + pw + ":konawe")) return true;
  return false;
}
function ensureAdmin() {
  if (!S.accounts.some((a) => a.role === "admin")) {
    S.accounts.push({ username: "admin", nama: "Administrator", role: "admin", salt: ADMIN_SALT, hash: hashPw("bpskonawe", ADMIN_SALT), dibuat: new Date().toISOString() });
    persist("accounts", S.accounts);
  }
}
function login(username, password) {
  ensureAdmin();
  const acc = S.accounts.find((a) => a.username.toLowerCase() === username.trim().toLowerCase());
  if (!acc) return null;
  if (acc.username === "admin" && !verifyPw(acc, password) && password === "bpskonawe") {
    acc.salt = ADMIN_SALT; acc.hash = hashPw(password, ADMIN_SALT);
    persist("accounts", S.accounts);
  }
  if (!verifyPw(acc, password)) return null;
  try { sessionStorage.setItem(AUTH_KEY, acc.username); } catch (e) { /* abaikan */ }
  return acc;
}
function getAuth() {
  try { const u = sessionStorage.getItem(AUTH_KEY); return u ? (S.accounts.find((a) => a.username === u) || null) : null; } catch (e) { return null; }
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
  ["Budi Santoso, S.Stat", "19850618 200801 1 008"], ["Dewi Lestari, S.E.", "19920925 201603 2 006"],
];
function seedDemo(force) {
  if (MODE === "db" && !force) return;
  if (!force && localStorage.getItem(LS.seeded)) return;
  S.petugas = DEMO.map((d) => ({ id: uid(), nama: d[0], nip: d[1] }));
  const now = new Date();
  S.jadwal = generateJadwalBulan(now.getFullYear(), now.getMonth() + 1);
  S.accounts = [];
  S.accounts.push({ username: "admin", nama: "Administrator", role: "admin", salt: ADMIN_SALT, hash: hashPw("bpskonawe", ADMIN_SALT), dibuat: new Date().toISOString() });
  S.records = [];
  // contoh presensi hari ini
  const hour = now.getHours();
  const jd = jadwalUntukSekarang();
  const rec = (shift, urutanIdx, telat, keluar) => {
    const j = jd.find((x) => x.shift === shift && x.urutan === urutanIdx + 1);
    if (!j) return;
    const p = S.petugas.find((x) => x.id === j.petugasId);
    if (!p) return;
    const d = new Date(); d.setHours(shift === 1 ? 8 : 12, telat, 0, 0);
    const masuk = d.toISOString(); let out = null;
    if (keluar != null) { const e = new Date(d); e.setMinutes(e.getMinutes() + 230 + keluar); out = e.toISOString(); }
    S.records.push({ id: uid(), date: todayStr(), shift: shift, petugasId: p.id, nama: p.nama, masuk: masuk, keluar: out, fotoMasuk: null, fotoKeluar: null });
  };
  if (hour >= 8) { rec(1, 0, -7, hour >= 12 ? 8 : null); rec(1, 1, 6, hour >= 12 ? -4 : null); }
  if (hour >= 12) { rec(2, 0, -4, null); rec(2, 1, 5, null); }
  lsWrite(LS.petugas, S.petugas); lsWrite(LS.records, S.records); lsWrite(LS.jadwal, S.jadwal);
  lsWrite(LS.accounts, S.accounts);
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

/* ---------------- salin & foto ---------------- */
async function copyText(t) { try { await navigator.clipboard.writeText(t); return true; } catch (e) { return false; } }
function kecilkanFoto(file, done) {
  const img = new Image();
  const url = URL.createObjectURL(file);
  
  // Timeout untuk mencegah stuck
  const timeout = setTimeout(() => {
    console.error("kecilkanFoto timeout");
    URL.revokeObjectURL(url);
    done(null);
  }, 10000); // 10 detik timeout
  
  img.onload = () => {
    clearTimeout(timeout);
    try {
      // Kurangi ukuran lebih agresif untuk HP dengan koneksi lambat
      const max = 480; // dari 720 ke 480
      const sc = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.width * sc));
      c.height = Math.max(1, Math.round(img.height * sc));
      
      const ctx = c.getContext("2d");
      if (!ctx) {
        console.error("Canvas context not available");
        URL.revokeObjectURL(url);
        done(null);
        return;
      }
      
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      
      // Kurangi kualitas untuk mengurangi ukuran file
      const dataUrl = c.toDataURL("image/jpeg", 0.6); // dari 0.72 ke 0.6
      console.log("Foto dikompresi:", (file.size / 1024).toFixed(1), "KB →", (dataUrl.length * 0.75 / 1024).toFixed(1), "KB");
      done(dataUrl);
    } catch (e) { 
      console.error("kecilkanFoto error:", e);
      URL.revokeObjectURL(url); 
      done(null); 
    }
  };
  
  img.onerror = (e) => { 
    clearTimeout(timeout);
    console.error("kecilkanFoto img.onerror:", e);
    URL.revokeObjectURL(url); 
    done(null); 
  };
  
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
