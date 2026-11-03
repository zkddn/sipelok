# 🚨 Solusi Error 404 - File API Tidak Ditemukan

## Masalah yang Anda Alami

```
Error: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
Response: 404 Not Found - LiteSpeed Web Server
```

**Artinya:** Server mengembalikan halaman HTML 404, bukan JSON dari API.

## 🔍 Penyebab Utama

1. **Browser menggunakan cache lama** - File `util.js` yang baru belum di-load
2. **File `api/api.php` tidak ada** di lokasi yang diharapkan
3. **Struktur folder berbeda** dari yang diharapkan aplikasi
4. **Server LiteSpeed** mengembalikan HTML 404 dengan status 200

## ✅ Solusi Lengkap

### Langkah 1: Clear Browser Cache (WAJIB!)

**Chrome/Edge:**
```
Ctrl + Shift + Delete
→ Pilih "Cached images and files"
→ Time range: "All time"
→ Clear data
```

**Atau Hard Refresh:**
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

**Firefox:**
```
Ctrl + F5
```

**Mobile Browser:**
- Buka Settings → Privacy → Clear browsing data
- Atau buka Incognito/Private mode untuk test

### Langkah 2: Gunakan Halaman Diagnostik

Saya sudah membuat halaman diagnostik khusus untuk Anda:

```
https://sipelok.bpskabkonawe.com/standalone/diagnostic.html
```

**Halaman ini akan:**
- ✅ Menampilkan path API yang terdeteksi
- ✅ Test akses langsung ke API
- ✅ Test GET request (ping)
- ✅ Test POST request (save)
- ✅ Cek berbagai kemungkinan lokasi file
- ✅ Memberikan solusi otomatis

### Langkah 3: Periksa Struktur Folder

**Struktur yang Benar:**
```
/standalone/
├── index.html
├── presensi.html
├── admin.html
├── loket.html
├── diagnostic.html          ← BARU
├── css/
│   └── gaya.css
├── js/
│   └── util.js              ← HARUS UPDATED
└── api/
    ├── api.php              ← HARUS ADA
    ├── config.php           ← HARUS ADA
    └── uploads/             ← HARUS ADA
```

**Cara Memeriksa:**
1. Login ke cPanel/File Manager
2. Navigasi ke folder aplikasi
3. Pastikan struktur folder seperti di atas
4. Pastikan file `api/api.php` ada

### Langkah 4: Test Manual

Buka URL ini langsung di browser:
```
https://sipelok.bpskabkonawe.com/standalone/api/api.php?action=ping
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

**Jika Muncul HTML 404:**
- File `api.php` tidak ada di lokasi tersebut
- Lanjut ke Langkah 5

### Langkah 5: Edit util.js Manual (Jika Auto-Detect Gagal)

Jika auto-detection tidak bekerja, edit file `js/util.js`:

**Cari baris ini (sekitar baris 7-20):**
```javascript
function getApiPath() {
  const path = window.location.pathname;
  const basePath = path.substring(0, path.lastIndexOf('/') + 1);
  return basePath + 'api/api.php';
}
```

**Ganti dengan salah satu opsi:**

**Opsi 1: Absolute path dari root**
```javascript
function getApiPath() {
  return '/standalone/api/api.php';
}
```

**Opsi 2: Full URL**
```javascript
function getApiPath() {
  return 'https://sipelok.bpskabkonawe.com/standalone/api/api.php';
}
```

**Opsi 3: Relative path**
```javascript
function getApiPath() {
  return 'api/api.php';
}
```

### Langkah 6: Periksa Permission File

**Via cPanel File Manager:**
1. Right-click file `api/api.php`
2. Pilih "Change Permissions"
3. Set ke **644** (rw-r--r--)
4. Repeat untuk `api/config.php`
5. Untuk folder `api/uploads/`, set ke **755**

**Via SSH:**
```bash
cd /path/to/standalone
chmod 644 api/api.php
chmod 644 api/config.php
chmod 755 api/uploads/
```

### Langkah 7: Periksa Error Log PHP

**Via cPanel:**
1. Buka cPanel
2. Cari "Error Log" atau "Metrics" → "Errors"
3. Lihat error terbaru

**Via SSH:**
```bash
tail -f /var/log/litespeed/error.log | grep "api.php"
# atau
tail -f /usr/local/apache/logs/error_log | grep "api.php"
```

**Error yang Umum:**
```
[error] PHP Fatal error: Uncaught PDOException: SQLSTATE[HY000] [1045] Access denied
→ Solusi: Periksa kredensial database di api/config.php

[error] PHP Fatal error: Uncaught Error: Call to undefined function json_encode()
→ Solusi: Install/enable PHP JSON extension

[error] PHP Warning: file_put_contents(): Permission denied
→ Solusi: chmod 755 api/uploads/
```

## 🧪 Checklist Troubleshooting

Gunakan checklist ini:

- [ ] **Browser cache sudah di-clear** (Ctrl+Shift+Delete)
- [ ] **File `util.js` sudah diupdate** (cek tanggal modifikasi)
- [ ] **Halaman `diagnostic.html` sudah diupload**
- [ ] **Test di `diagnostic.html` sudah dijalankan**
- [ ] **Folder `api/` ada** di lokasi yang sama dengan file HTML
- [ ] **File `api/api.php` ada** di dalam folder `api/`
- [ ] **File `api/config.php` ada** di dalam folder `api/`
- [ ] **Permission file benar** (644 untuk file, 755 untuk folder)
- [ ] **Test manual** `api.php?action=ping` mengembalikan JSON
- [ ] **Database MySQL berjalan**
- [ ] **Database `sipelok` sudah dibuat**
- [ ] **Tabel sudah diimpor** dari `database/sipelok.sql`

## 📊 Kemungkinan Struktur Server

### Struktur 1: Subfolder /standalone/
```
/public_html/
└── standalone/
    ├── index.html
    ├── presensi.html
    └── api/
        └── api.php
```
**URL:** `https://domain.com/standalone/api/api.php`

### Struktur 2: Root Domain
```
/public_html/
├── index.html
├── presensi.html
└── api/
    └── api.php
```
**URL:** `https://domain.com/api/api.php`

### Struktur 3: Subdomain
```
/public_html/sipelok/
├── index.html
├── presensi.html
└── api/
    └── api.php
```
**URL:** `https://sipelok.domain.com/api/api.php`

## 💡 Solusi Cepat

Jika Anda ingin solusi cepat, coba ini:

### 1. Upload Ulang Semua File
```bash
# Upload semua file dari folder standalone/ ke server
# Pastikan struktur folder sama persis
```

### 2. Clear Cache Browser
```
Ctrl + Shift + Delete
atau
Ctrl + F5 (hard refresh)
```

### 3. Test dengan diagnostic.html
```
1. Upload diagnostic.html
2. Buka: https://sipelok.bpskabkonawe.com/standalone/diagnostic.html
3. Klik "Jalankan Semua Test"
4. Lihat hasilnya
```

### 4. Lihat Console Browser
```
1. Buka presensi.html
2. Tekan F12
3. Pilih tab Console
4. Lihat error message
5. Screenshot dan kirim untuk troubleshooting
```

## 🎯 Expected Behavior

### Saat API Berfungsi:
```
Console Browser:
✅ "API Path: /standalone/api/api.php"
✅ "=== httpWithProgress SUCCESS ==="
✅ "✓ Upload selesai!"

Progress Bar:
████████████████████ 100%
✓ Presensi berhasil disimpan!
```

### Saat API Tidak Ditemukan:
```
Console Browser:
❌ "=== httpWithProgress HTML RESPONSE ERROR ==="
❌ "Server mengembalikan HTML, bukan JSON"
❌ "File API tidak ditemukan"

Progress Bar:
████████████████████ 100%
✗ File API tidak ditemukan
```

## 📞 Jika Masih Bermasalah

Kumpulkan informasi berikut:

1. **Screenshot Console Browser (F12)**
   - Tab Console saat error
   - Tab Network saat error

2. **Screenshot diagnostic.html**
   - Hasil semua test

3. **Informasi Server**
   - URL lengkap aplikasi
   - Struktur folder (screenshot File Manager)
   - Error log PHP

4. **Test Manual**
   - Buka `https://sipelok.bpskabkonawe.com/standalone/api/api.php?action=ping`
   - Screenshot hasilnya

Kirim informasi di atas untuk troubleshooting lebih lanjut.

---

**Catatan Penting:** 
- Error 404 berarti file `api.php` tidak ditemukan di lokasi yang diharapkan
- Browser cache sering menjadi penyebab utama masalah
- Gunakan `diagnostic.html` untuk mendiagnosis masalah secara visual
- Auto-detection path sudah ditambahkan untuk menangani berbagai struktur folder
