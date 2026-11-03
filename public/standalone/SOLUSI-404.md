# Solusi Error 404 - File API Tidak Ditemukan

## 🚨 Masalah yang Anda Alami

```
Error: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
Response: 404 Not Found - LiteSpeed Web Server
```

**Artinya:** Server tidak menemukan file `api/api.php` di lokasi yang diharapkan.

## 🔍 Penyebab Masalah

Anda menggunakan **LiteSpeed Web Server** (bukan Apache/XAMPP), yang mungkin memiliki:
- Struktur folder berbeda
- Konfigurasi path berbeda
- Permission yang berbeda

## ✅ Solusi yang Sudah Diterapkan

### 1. **Auto-Detection API Path**
Sekarang aplikasi otomatis mendeteksi path API berdasarkan lokasi halaman:

```javascript
function getApiPath() {
  const path = window.location.pathname;
  const basePath = path.substring(0, path.lastIndexOf('/') + 1);
  return basePath + 'api/api.php';
}
```

**Contoh:**
- Jika halaman di: `http://domain.com/sipelok/presensi.html`
- API akan dicari di: `http://domain.com/sipelok/api/api.php`

### 2. **Error Handling yang Lebih Baik**
Sekarang error 404 akan menampilkan pesan yang jelas:

```
✗ File API tidak ditemukan (404)

URL: http://domain.com/sipelok/api/api.php

Kemungkinan penyebab:
1. File api/api.php tidak ada di server
2. Struktur folder berbeda dari yang diharapkan
3. Server menggunakan konfigurasi yang berbeda

Solusi:
- Pastikan folder 'api' ada di lokasi yang sama dengan file HTML
- Periksa apakah file api.php ada di folder api/
- Cek console browser untuk detail error
```

### 3. **Halaman Test API**
File baru `test-api.html` untuk mendiagnosis masalah:

```
http://yourdomain.com/sipelok/test-api.html
```

## 🔧 Langkah-Langkah Perbaikan Manual

### Langkah 1: Periksa Struktur Folder

**Struktur yang Benar:**
```
/public_html/ (atau htdocs/)
└── sipelok/ (atau nama folder Anda)
    ├── index.html
    ├── presensi.html
    ├── admin.html
    ├── loket.html
    ├── test-api.html          ← BARU
    ├── css/
    │   └── gaya.css
    ├── js/
    │   └── util.js            ← UPDATED
    └── api/
        ├── api.php            ← HARUS ADA
        ├── config.php         ← HARUS ADA
        └── uploads/           ← HARUS ADA
```

**Cara Memeriksa via cPanel/File Manager:**
1. Login ke cPanel
2. Buka File Manager
3. Navigasi ke folder aplikasi (misal: `public_html/sipelok/`)
4. Pastikan folder `api/` ada
5. Pastikan file `api.php` ada di dalam folder `api/`

### Langkah 2: Gunakan Halaman Test API

1. Upload file `test-api.html` ke folder aplikasi
2. Buka di browser: `http://yourdomain.com/sipelok/test-api.html`
3. Klik **"Jalankan Diagnostik Lengkap"**
4. Lihat hasilnya:
   - ✅ **Test 1: File Existence Check** → Harus ✓
   - ✅ **Test 2: Ping Test** → Harus ✓
   - ✅ **Test 3: Bootstrap Test** → Harus ✓
   - ✅ **Test 4: API Key Check** → Harus ✓

**Jika Test 1 Gagal (404):**
- File `api.php` tidak ada atau di lokasi yang salah
- Lanjut ke Langkah 3

**Jika Test 1 Sukses tapi Test 2/3 Gagal:**
- Ada error di PHP atau database
- Lanjut ke Langkah 4

### Langkah 3: Perbaiki Lokasi File API

**Opsi A: Pindahkan File API**

Jika folder `api/` tidak ada atau di lokasi yang salah:

1. Via FTP/cPanel File Manager:
   - Upload folder `api/` ke lokasi yang sama dengan file HTML
   - Pastikan struktur: `sipelok/api/api.php`

2. Via SSH (jika ada akses):
   ```bash
   cd /path/to/sipelok
   mkdir -p api
   # Upload file api.php dan config.php ke folder api/
   ```

**Opsi B: Edit util.js Manual**

Jika struktur folder berbeda, edit file `js/util.js`:

```javascript
// Cari baris ini (sekitar baris 7-20):
function getApiPath() {
  const path = window.location.pathname;
  const basePath = path.substring(0, path.lastIndexOf('/') + 1);
  return basePath + 'api/api.php';
}

// Ganti dengan path yang sesuai:
function getApiPath() {
  // Contoh 1: Jika API di root domain
  return '/api/api.php';
  
  // Contoh 2: Jika API di subfolder tertentu
  return '/sipelok/api/api.php';
  
  // Contoh 3: Jika menggunakan absolute URL
  return 'http://yourdomain.com/api/api.php';
}
```

### Langkah 4: Periksa Permission File

**Via cPanel File Manager:**
1. Right-click file `api/api.php`
2. Pilih "Change Permissions"
3. Set ke **644** (rw-r--r--)
4. Repeat untuk `api/config.php`
5. Untuk folder `api/uploads/`, set ke **755** (rwxr-xr-x)

**Via SSH:**
```bash
cd /path/to/sipelok
chmod 644 api/api.php
chmod 644 api/config.php
chmod 755 api/uploads/
```

### Langkah 5: Periksa Error Log PHP

**Via cPanel:**
1. Buka cPanel
2. Cari "Error Log" atau "Logs"
3. Lihat error terbaru

**Via SSH:**
```bash
# Untuk LiteSpeed
tail -f /var/log/litespeed/error.log | grep "api.php"

# Untuk Apache
tail -f /var/log/apache2/error.log | grep "api.php"
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

### Langkah 6: Test Manual via Browser

Buka URL ini langsung di browser:
```
http://yourdomain.com/sipelok/api/api.php?action=ping
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

**Jika Muncul 404:**
- File `api.php` tidak ada di lokasi tersebut
- Kembali ke Langkah 3

**Jika Muncul Error PHP:**
- Ada error di kode PHP
- Lihat error log (Langkah 5)

**Jika Muncul HTML:**
- Server mengembalikan error page
- Periksa error log dan permission

### Langkah 7: Periksa Konfigurasi Database

Edit file `api/config.php`:

```php
<?php
const DB_HOST = 'localhost';      // atau '127.0.0.1'
const DB_NAME = 'sipelok';        // nama database
const DB_USER = 'root';           // username database
const DB_PASS = '';               // password database (kosongkan jika tidak ada)
const API_KEY = 'sipelok-konawe-2024';
```

**Pastikan:**
- ✅ Database `sipelok` sudah dibuat
- ✅ Tabel sudah diimpor dari `database/sipelok.sql`
- ✅ Kredensial database benar

### Langkah 8: Restart Server

**Via cPanel:**
1. Buka cPanel
2. Cari "Restart Services"
3. Restart LiteSpeed/Apache

**Via SSH:**
```bash
# Untuk LiteSpeed
systemctl restart lsws

# Untuk Apache
systemctl restart apache2
# atau
systemctl restart httpd
```

## 📊 Checklist Troubleshooting

Gunakan checklist ini untuk memastikan semua sudah benar:

- [ ] **Struktur Folder**
  - [ ] Folder `api/` ada di lokasi yang sama dengan file HTML
  - [ ] File `api/api.php` ada
  - [ ] File `api/config.php` ada
  - [ ] Folder `api/uploads/` ada

- [ ] **Permission**
  - [ ] `api/api.php` → 644
  - [ ] `api/config.php` → 644
  - [ ] `api/uploads/` → 755

- [ ] **Database**
  - [ ] MySQL/MariaDB berjalan
  - [ ] Database `sipelok` sudah dibuat
  - [ ] Tabel sudah diimpor
  - [ ] Kredensial di `config.php` benar

- [ ] **Server**
  - [ ] LiteSpeed/Apache berjalan
  - [ ] PHP version 7.4+
  - [ ] Extensions: PDO, PDO_MySQL, JSON aktif

- [ ] **Test**
  - [ ] `test-api.html` semua test ✓
  - [ ] URL `api.php?action=ping` mengembalikan JSON
  - [ ] Console browser tidak ada error 404

## 🎯 Solusi Cepat

Jika Anda ingin solusi cepat, coba langkah ini:

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

### 3. Test dengan test-api.html
```
1. Upload test-api.html
2. Buka: http://yourdomain.com/sipelok/test-api.html
3. Klik "Jalankan Diagnostik Lengkap"
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

## 📞 Jika Masih Bermasalah

Kumpulkan informasi berikut:

1. **Screenshot Console Browser (F12)**
   - Tab Console
   - Tab Network (saat error)

2. **Screenshot test-api.html**
   - Hasil diagnostik lengkap

3. **Informasi Server**
   - URL lengkap aplikasi
   - Struktur folder (screenshot File Manager)
   - Error log PHP

4. **Test Manual**
   - Buka `http://yourdomain.com/sipelok/api/api.php?action=ping`
   - Screenshot hasilnya

Kirim informasi di atas untuk troubleshooting lebih lanjut.

## 📁 File yang Diperbaiki

### Updated:
1. **`public/standalone/js/util.js`**
   - ✅ Auto-detection API path
   - ✅ Error handling 404 yang lebih baik
   - ✅ Validasi Content-Type
   - ✅ Error message informatif

### Added:
2. **`public/standalone/test-api.html`** (baru)
   - ✅ Halaman test koneksi API
   - ✅ Diagnostik lengkap
   - ✅ Visual feedback

3. **`public/standalone/SOLUSI-404.md`** (file ini)
   - ✅ Panduan troubleshooting lengkap

4. **`public/standalone/TROUBLESHOOTING-404.md`** (baru)
   - ✅ Dokumentasi teknis

## 🚀 Cara Update

Salin ulang file-file berikut ke server Anda:

```
sipelok/
├── js/
│   └── util.js              ← PERBARUI
├── test-api.html            ← BARU (upload)
├── SOLUSI-404.md            ← BARU (upload)
└── TROUBLESHOOTING-404.md   ← BARU (upload)
```

Lalu:
1. Clear cache browser (Ctrl+F5)
2. Buka `test-api.html` untuk test
3. Jika masih error, ikuti langkah troubleshooting di atas

---

**Catatan Penting:** Error 404 berarti file `api.php` tidak ditemukan di lokasi yang diharapkan. Pastikan struktur folder sesuai dan file `api.php` benar-benar ada di folder `api/`. Gunakan `test-api.html` untuk mendiagnosis masalah secara visual.
