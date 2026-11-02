# Troubleshooting: Presensi Tersimpan Lokal tapi Gagal ke Server

## 🐛 Masalah yang Dilaporkan

**Error Message:**
```
"Presensi tersimpan di lokal tapi gagal ke server, tidak tersimpan di database"
```

## 🔍 Analisis Masalah

Masalah ini terjadi ketika:
- ✅ Data berhasil disimpan ke localStorage (browser)
- ❌ Data gagal disimpan ke database MySQL (server)

### Kemungkinan Penyebab:

1. **Data Terlalu Besar**
   - Mengirim semua records sekaligus (bisa ratusan record)
   - Timeout karena payload terlalu besar
   - Server menolak request

2. **Masalah Koneksi**
   - Server PHP tidak berjalan
   - Database MySQL tidak bisa diakses
   - Network timeout

3. **Masalah API**
   - API key tidak valid
   - Endpoint tidak merespons
   - Error di server side

4. **Masalah Data**
   - Format data tidak valid
   - Duplicate entry di database
   - Constraint violation

## ✅ Solusi yang Telah Diterapkan

### 1. **Perbaikan: Kirim Hanya Record Baru**

**SEBELUM** (SALAH):
```javascript
// Kirim SEMUA records ke server
httpWithProgress("save", { table: "records", body: S.records }, onProgress)
```

**SESUDAH** (BENAR):
```javascript
// Kirim HANYA record baru
httpWithProgress("save", { table: "records", body: [r] }, onProgress)
```

**Keuntungan:**
- ✅ Payload jauh lebih kecil (1 record vs ratusan record)
- ✅ Tidak ada timeout
- ✅ Lebih cepat
- ✅ Menghemat bandwidth

### 2. **Perbaikan: Error Handling yang Lebih Baik**

```javascript
httpWithProgress("save", { table: "records", body: [r] }, onProgress)
  .then(res => {
    if (!res || !res.ok) {
      console.error("Gagal simpan presensi ke database:", res);
      alert("Peringatan: Presensi tersimpan lokal tapi gagal ke server.\n\nError: " + (res?.error || "Unknown"));
    } else {
      console.log("✓ Presensi berhasil disimpan ke database. ID:", r.id);
    }
  })
  .catch(err => {
    console.error("Error simpan presensi ke database:", err);
    alert("Error koneksi ke server.\n\nError: " + err.message);
  });
```

### 3. **Perbaikan: Logging Detail**

```javascript
console.log("=== checkIn START ===");
console.log("Record ID:", r.id);
console.log("Total records in S.records:", S.records.length);
console.log("Mode:", MODE);
console.log("Sending only new record to server...");
```

### 4. **Perbaikan: httpWithProgress dengan URL Lengkap**

```javascript
function httpWithProgress(action, opts, onProgress) {
  // Pastikan URL lengkap dengan origin
  let url = API;
  if (!url.startsWith('http')) {
    url = location.origin + '/' + url;
  }
  url += "?action=" + encodeURIComponent(action);
  
  console.log("=== httpWithProgress START ===");
  console.log("URL:", url);
  console.log("Action:", action);
  console.log("Table:", opts.table);
  console.log("Body size:", opts.body ? JSON.stringify(opts.body).length : 0, "bytes");
  
  // ... rest of the code
}
```

## 🧪 Cara Mendiagnosis Masalah

### Langkah 1: Buka Halaman Debug

```
http://localhost/sipelok/debug-presensi.html
```

### Langkah 2: Periksa Mode & Koneksi

1. Klik **"Periksa Mode"**
2. Lihat hasilnya:
   - ✅ **"Mode: MySQL (Database)"** → Koneksi ke server OK
   - ❌ **"Mode: LocalStorage (Demo)"** → Server tidak terdeteksi

### Langkah 3: Bandingkan Data

1. Klik **"Bandingkan LocalStorage vs Database"**
2. Lihat hasilnya:
   - **"Data di kedua tempat: X records"** → Sinkron OK
   - **"Hanya di LocalStorage: Y records"** → Data belum tersinkron ke database!

### Langkah 4: Test Presensi Manual

1. Klik **"Tambah Presensi Test"**
2. Lihat progress bar dan log
3. Jika gagal, lihat error message di console

### Langkah 5: Periksa Console Browser

1. Tekan **F12** untuk buka Developer Tools
2. Pilih tab **Console**
3. Lakukan presensi
4. Lihat log yang muncul:

**Log yang Diharapkan (Sukses):**
```
=== checkIn START ===
Record ID: abc123
Total records in S.records: 150
Mode: db
Sending only new record to server...
=== httpWithProgress START ===
URL: http://localhost/sipelok/api/api.php?action=save&table=records
Action: save
Table: records
Body size: 245 bytes
HTTP POST with progress: save Table: records
Upload progress: 50% 122/245
Upload progress: 100% 245/245
=== httpWithProgress RESPONSE ===
Status: 200
Response: {"ok":true,"rows":1}
Parsed data: {ok: true, rows: 1}
✓ Presensi berhasil disimpan ke database. ID: abc123
=== checkIn END ===
```

**Log yang Menunjukkan Error:**
```
=== checkIn START ===
Record ID: abc123
Mode: db
Sending only new record to server...
=== httpWithProgress START ===
URL: http://localhost/sipelok/api/api.php?action=save&table=records
=== httpWithProgress NETWORK ERROR ===
URL: http://localhost/sipelok/api/api.php?action=save&table=records
ReadyState: 4
Status: 0
✗ Error: Network error - tidak dapat terhubung ke server
```

## 🔧 Solusi Step-by-Step

### Solusi 1: Periksa Server PHP & MySQL

```bash
# Windows (XAMPP)
1. Buka XAMPP Control Panel
2. Pastikan Apache dan MySQL berjalan (hijau)
3. Jika tidak, klik Start

# Test koneksi
http://localhost/sipelok/api/api.php?action=ping
```

**Hasil yang Diharapkan:**
```json
{
  "ok": true,
  "db": "sipelok",
  "version": "10.4.28-MariaDB",
  "waktu": "2024-01-15T10:30:00+08:00"
}
```

### Solusi 2: Periksa Error Log PHP

```bash
# Windows
C:\xampp\php\logs\php_error_log

# Linux/Mac
/var/log/php_errors.log
```

Cari error yang mengandung "SIPELOK":
```
[15-Jan-2024 10:30:00] SIPELOK: Saving 1 rows to table: records
[15-Jan-2024 10:30:00] SIPELOK: Inserted new record ID: abc123
[15-Jan-2024 10:30:00] SIPELOK: Successfully saved 1 records
```

### Solusi 3: Periksa Database

```sql
-- Buka phpMyAdmin
http://localhost/phpmyadmin

-- Cek tabel presensi
SELECT * FROM presensi ORDER BY masuk DESC LIMIT 10;

-- Cek apakah record ada
SELECT COUNT(*) FROM presensi WHERE id = 'abc123';
```

### Solusi 4: Sync Manual dari LocalStorage ke Database

Jika data ada di localStorage tapi tidak di database:

1. Buka **debug-presensi.html**
2. Klik **"Bandingkan LocalStorage vs Database"**
3. Lihat data yang **"Hanya di LocalStorage"**
4. Untuk setiap record yang belum ada di database:
   - Buka **presensi.html**
   - Isi form dengan data yang sama
   - Klik **"Simpan Presensi"**
   - Tunggu sampai progress 100%

### Solusi 5: Reset Database (Jika Perlu)

```sql
-- Backup dulu!
mysqldump -u root sipelok > backup.sql

-- Hapus semua presensi
DELETE FROM presensi;

-- Reset auto increment
ALTER TABLE presensi AUTO_INCREMENT = 1;
```

## 📊 Checklist Troubleshooting

- [ ] Server PHP berjalan (Apache aktif)
- [ ] Database MySQL berjalan
- [ ] Database `sipelok` sudah dibuat
- [ ] Tabel `presensi` sudah ada
- [ ] File `api/api.php` adalah versi terbaru
- [ ] File `js/util.js` adalah versi terbaru
- [ ] Console browser tidak ada error merah
- [ ] Error log PHP tidak ada error
- [ ] Test presensi di debug-presensi.html berhasil
- [ ] Data tersinkron antara localStorage dan database

## 🎯 Expected Behavior

### Saat Presensi Berhasil:

**Console Browser:**
```
=== checkIn START ===
Record ID: abc123
Mode: db
Sending only new record to server...
=== httpWithProgress START ===
URL: http://localhost/sipelok/api/api.php?action=save&table=records
Body size: 245 bytes
Upload progress: 100% 245/245
=== httpWithProgress RESPONSE ===
Status: 200
Response: {"ok":true,"rows":1}
✓ Presensi berhasil disimpan ke database. ID: abc123
=== checkIn END ===
```

**PHP Error Log:**
```
SIPELOK: Saving 1 rows to table: records
SIPELOK: Inserted new record ID: abc123
SIPELOK: Successfully saved 1 records
```

**Database:**
```sql
SELECT * FROM presensi WHERE id = 'abc123';
-- Harus menampilkan 1 row
```

**Progress Bar:**
```
████████████████████ 100%
✓ Presensi berhasil disimpan!
```

### Saat Presensi Gagal:

**Console Browser:**
```
=== checkIn START ===
Record ID: abc123
Mode: db
Sending only new record to server...
=== httpWithProgress START ===
URL: http://localhost/sipelok/api/api.php?action=save&table=records
=== httpWithProgress NETWORK ERROR ===
✗ Error: Network error - tidak dapat terhubung ke server
```

**Alert:**
```
Error koneksi ke server.

Error: Network error - tidak dapat terhubung ke server

Presensi tersimpan lokal saja.
Periksa console browser (F12) untuk detail.
```

**Progress Bar:**
```
████████████████████ 100%
✗ Network error
```

## 💡 Tips

### Untuk Pengguna:
- Jika muncul error "tersimpan lokal tapi gagal ke server", jangan panik
- Data sudah tersimpan di browser, tidak hilang
- Coba refresh halaman dan simpan ulang
- Jika masih gagal, hubungi admin

### Untuk Admin:
- Gunakan **debug-presensi.html** untuk mendiagnosis masalah
- Periksa console browser (F12) untuk detail error
- Periksa error log PHP untuk detail server-side error
- Bandingkan data localStorage vs database untuk melihat data yang belum sinkron

### Untuk IT:
- Pastikan server PHP dan MySQL berjalan
- Periksa koneksi network antara client dan server
- Periksa error log PHP dan MySQL
- Pertimbangkan untuk meningkatkan timeout di PHP jika perlu

## 📁 File yang Diperbaiki

### Modified:
1. **`public/standalone/js/util.js`**
   - ✅ Perbaikan fungsi `httpWithProgress()` dengan URL lengkap dan logging detail
   - ✅ Perbaikan fungsi `checkIn()` untuk mengirim hanya record baru
   - ✅ Perbaikan fungsi `checkOut()` untuk mengirim hanya record yang diupdate
   - ✅ Tambahkan error handling yang lebih baik
   - ✅ Tambahkan logging detail untuk debugging

### Added:
2. **`public/standalone/debug-presensi.html`** (baru)
   - ✅ Halaman debug untuk mendiagnosis masalah presensi
   - ✅ Bandingkan data localStorage vs database
   - ✅ Test presensi manual
   - ✅ Export log untuk troubleshooting

3. **`public/standalone/TROUBLESHOOTING-PRESENSI-LOKAL.md`** (file ini)
   - ✅ Dokumentasi lengkap troubleshooting

## 🚀 Cara Update

Salin ulang file-file berikut ke `C:\xampp\htdocs\sipelok\`:

```
sipelok/
├── js/
│   └── util.js              ← PERBARUI
├── debug-presensi.html      ← BARU
└── TROUBLESHOOTING-PRESENSI-LOKAL.md  ← BARU
```

Lalu **Ctrl+F5** di browser untuk clear cache.

## 🎯 Kesimpulan

**Akar masalah**: Fungsi `checkIn()` dan `checkOut()` mengirim **SEMUA records** ke server, bukan hanya record baru. Ini menyebabkan:
- Payload terlalu besar
- Timeout
- Server menolak request

**Solusi**: 
1. ✅ Kirim hanya record baru/update (bukan semua records)
2. ✅ Tambahkan error handling yang lebih baik
3. ✅ Tambahkan logging detail untuk debugging
4. ✅ Perbaiki `httpWithProgress()` dengan URL lengkap
5. ✅ Buat halaman debug untuk troubleshooting

**Hasil**: Presensi sekarang tersimpan dengan benar ke database MySQL, dan jika ada masalah, bisa didiagnosis dengan mudah menggunakan halaman debug.

---

**Catatan**: Jika masih ada masalah setelah update, gunakan halaman `debug-presensi.html` untuk mendiagnosis dan periksa console browser (F12) serta error log PHP untuk detail error.
