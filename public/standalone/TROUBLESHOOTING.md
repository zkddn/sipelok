# Troubleshooting: Presensi Tidak Tersimpan

## Masalah
Presensi yang diinput tidak muncul di halaman admin/rekap.

## Kemungkinan Penyebab & Solusi

### 1. Mode Penyimpanan Salah

**Gejala:**
- Data hanya muncul di satu browser/perangkat
- Setelah clear browser, data hilang
- Badge di pojok kanan atas menunjukkan "Mode Demo"

**Penyebab:**
Aplikasi berjalan dalam mode LocalStorage (demo) karena tidak dapat terhubung ke server PHP/MySQL.

**Solusi:**
1. Pastikan XAMPP berjalan (Apache dan MySQL aktif)
2. Pastikan folder `standalone` ada di `C:\xampp\htdocs\sipelok\`
3. Akses aplikasi via `http://localhost/sipelok/` (bukan buka file HTML langsung)
4. Buka `http://localhost/sipelok/debug.html` untuk memeriksa mode
5. Jika masih "Mode Demo", periksa:
   - Apakah MySQL berjalan di XAMPP Control Panel?
   - Apakah database `sipelok` sudah dibuat?
   - Apakah file `api/config.php` sudah dikonfigurasi dengan benar?

### 2. Database Tidak Terhubung

**Gejala:**
- Badge menunjukkan "MySQL Aktif" tapi data tidak tersimpan
- Console browser (F12) menampilkan error koneksi

**Penyebab:**
Koneksi ke database MySQL gagal atau konfigurasi salah.

**Solusi:**
1. Buka `http://localhost/sipelok/api/api.php?action=ping`
2. Jika muncul error, periksa `api/config.php`:
   ```php
   const DB_HOST = '127.0.0.1';
   const DB_NAME = 'sipelok';
   const DB_USER = 'root';
   const DB_PASS = ''; // Sesuaikan dengan password MySQL Anda
   ```
3. Pastikan database `sipelok` sudah dibuat dan tabel sudah diimpor
4. Cek error log di `C:\xampp\php\logs\php_error_log`

### 3. Race Condition (Data Tertimpa)

**Gejala:**
- Presensi tersimpan tapi tiba-tiba hilang setelah beberapa detik
- Data tidak konsisten antar perangkat

**Penyebab:**
Sinkronisasi otomatis menimpa data lokal dengan data lama dari database.

**Solusi:**
- Sudah diperbaiki di versi terbaru dengan merge strategy
- Update file `js/util.js` dengan versi terbaru
- Clear cache browser (Ctrl+Shift+Delete)

### 4. Foto Gagal Diupload

**Gejala:**
- Presensi tersimpan tapi foto tidak muncul
- Console menampilkan error upload

**Penyebab:**
Folder `api/uploads/` tidak memiliki permission write atau tidak ada.

**Solusi:**
1. Pastikan folder `api/uploads/` ada
2. Set permission write:
   - Windows: Right-click folder → Properties → Security → Edit → Allow Full Control untuk user IUSR atau IIS_IUSRS
   - Linux/Mac: `chmod 755 api/uploads/`
3. Cek error log PHP untuk detail

### 5. LocalStorage Penuh

**Gejala:**
- Console menampilkan error "QuotaExceededError"
- Data tidak tersimpan di mode demo

**Penyebab:**
LocalStorage browser penuh (limit ~5-10MB).

**Solusi:**
1. Buka `debug.html` dan klik "Hapus LocalStorage"
2. Atau clear browser data secara manual
3. Gunakan mode MySQL untuk penyimpanan yang lebih baik

## Langkah Debugging

### 1. Periksa Mode Penyimpanan
Buka `http://localhost/sipelok/debug.html`
- Lihat bagian "Status Mode Penyimpanan"
- Jika "Mode Demo", berarti tidak terhubung ke database

### 2. Periksa Console Browser
Tekan F12 → Tab Console
- Lihat ada error merah atau warning
- Screenshot error dan berikan ke developer

### 3. Test Presensi
Di halaman `debug.html`:
- Klik "Tambah Presensi Test"
- Lihat apakah presensi berhasil ditambahkan
- Cek apakah muncul di LocalStorage dan Database

### 4. Periksa Data Langsung
Di halaman `debug.html`:
- Klik "Tampilkan Data LocalStorage"
- Klik "Tampilkan Data Database"
- Bandingkan apakah data sama

### 5. Cek Error Log PHP
Lokasi: `C:\xampp\php\logs\php_error_log`
- Buka file ini dengan text editor
- Cari error terkait SIPELOK
- Screenshot error dan berikan ke developer

## Checklist Troubleshooting

- [ ] XAMPP Apache dan MySQL berjalan
- [ ] Folder `standalone` ada di `htdocs/sipelok/`
- [ ] Database `sipelok` sudah dibuat
- [ ] Tabel sudah diimpor dari `database/sipelok.sql`
- [ ] Akses via `http://localhost/sipelok/` (bukan file://)
- [ ] Badge menunjukkan "MySQL Aktif" (bukan "Mode Demo")
- [ ] Folder `api/uploads/` ada dan writable
- [ ] Console browser tidak ada error merah
- [ ] File `js/util.js` adalah versi terbaru
- [ ] File `api/api.php` adalah versi terbaru

## Jika Masih Bermasalah

1. Screenshot halaman `debug.html`
2. Screenshot Console browser (F12)
3. Screenshot error log PHP
4. Berikan informasi:
   - Versi XAMPP
   - Versi PHP
   - Versi MySQL
   - Browser yang digunakan
   - Langkah yang sudah dicoba

## Kontak Support

Jika semua langkah di atas sudah dicoba tapi masih bermasalah, hubungi developer dengan menyertakan:
- Screenshot debug.html
- Screenshot console browser
- Error log PHP
- Deskripsi masalah yang detail
