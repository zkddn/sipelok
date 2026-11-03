# Penambahan QR Code di Halaman Loket

## 📱 Fitur Baru: QR Code untuk Akses Cepat Presensi

QR code telah ditambahkan di halaman **Layar Loket** (`loket.html`) untuk memudahkan petugas mengakses halaman presensi hanya dengan scan QR menggunakan HP.

## 🎯 Tujuan

Memudahkan petugas piket untuk:
- Akses halaman presensi dengan cepat tanpa perlu mengetik URL
- Scan QR langsung dari layar loket menggunakan HP
- Mengurangi kesalahan pengetikan URL

## 📍 Lokasi QR Code

QR code ditampilkan di halaman **Layar Loket** (`loket.html`), tepat di bawah header dan sebelum daftar petugas piket per shift.

### Posisi di Halaman:
```
┌─────────────────────────────────────┐
│  Header: SIPELOK - Layar Loket     │
├─────────────────────────────────────┤
│  Jam Besar & Shift Aktif           │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │  QR CODE (250x250px)        │   │  ← BARU!
│  │  [QR Image]                 │   │
│  │  URL: .../presensi.html     │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│  Shift 1 (Pagi)  │  Shift 2 (Siang)│
│  - Daftar petugas│  - Daftar petugas│
└─────────────────────────────────────┘
```

## 🔧 Cara Kerja

### 1. Generate URL Presensi
```javascript
const presensiUrl = location.origin + location.pathname.replace('loket.html', 'presensi.html');
```

**Contoh:**
- Jika loket.html diakses via: `http://192.168.1.10/sipelok/loket.html`
- Maka presensiUrl: `http://192.168.1.10/sipelok/presensi.html`

### 2. Generate QR Code
```javascript
const qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=' + encodeURIComponent(presensiUrl);
```

**Penjelasan:**
- Menggunakan API gratis dari `qrserver.com`
- Ukuran QR: 250x250 pixel (optimal untuk scan)
- Data yang di-encode: URL presensi.html

### 3. Tampilkan QR Code
```html
<div class="card dark pad mt-3" style="text-align:center">
  <span class="eyebrow on-dark">Akses Cepat Presensi</span>
  <p class="small mt-1">Scan QR code di bawah dengan HP untuk membuka halaman presensi</p>
  <div style="margin:20px auto;display:inline-block;background:white;padding:20px;border-radius:16px">
    <img src="[QR_CODE_URL]" alt="QR Code Presensi" style="width:250px;height:250px" />
  </div>
  <p class="small">[PRESENSI_URL]</p>
</div>
```

## 🎨 Tampilan QR Code

### Desain:
- **Background**: Putih (untuk kontras optimal)
- **Ukuran**: 250x250 pixel
- **Padding**: 20px di sekeliling QR
- **Border Radius**: 16px (rounded corners)
- **Shadow**: Sesuai dengan tema dark mode

### Informasi yang Ditampilkan:
1. **Judul**: "Akses Cepat Presensi"
2. **Instruksi**: "Scan QR code di bawah dengan HP untuk membuka halaman presensi"
3. **QR Code**: Gambar QR 250x250px
4. **URL**: Teks URL presensi.html (untuk fallback jika QR tidak bisa di-scan)

## 📱 Cara Menggunakan

### Untuk Petugas:
1. Buka kamera HP atau aplikasi QR scanner
2. Arahkan kamera ke QR code di layar loket
3. Tap notifikasi/link yang muncul
4. Halaman presensi.html akan terbuka otomatis
5. Pilih nama, shift, dan ambil foto atribut
6. Simpan presensi

### Untuk Admin:
- QR code akan otomatis ter-generate setiap kali halaman loket dimuat
- URL akan menyesuaikan dengan domain/IP yang digunakan
- Tidak perlu konfigurasi tambahan

## 🌐 URL yang Di-generate

### Contoh URL:

**Localhost (Development):**
```
http://localhost/sipelok/presensi.html
```

**IP Address (LAN):**
```
http://192.168.1.10/sipelok/presensi.html
```

**Domain (Production):**
```
https://sipelok.bps-konawe.go.id/presensi.html
```

### Catatan Penting:
- URL akan otomatis menyesuaikan dengan `location.origin`
- Jika diakses via IP, QR akan mengarah ke IP tersebut
- Jika diakses via domain, QR akan mengarah ke domain tersebut
- Pastikan HP petugas terhubung ke jaringan yang sama dengan server

## 🔍 Testing QR Code

### Test 1: Scan QR dari HP
1. Buka `http://[SERVER_IP]/sipelok/loket.html` di PC loket
2. Lihat QR code yang tampil
3. Scan QR dengan HP petugas
4. Pastikan halaman presensi.html terbuka
5. Pastikan URL di browser HP sama dengan yang ditampilkan di bawah QR

### Test 2: Verifikasi URL
1. Lihat URL yang ditampilkan di bawah QR code
2. Bandingkan dengan URL yang terbuka di HP setelah scan
3. Pastikan keduanya sama persis

### Test 3: Test di Berbagai Network
- Test di localhost (development)
- Test di LAN (IP address)
- Test di production (domain)

## ⚙️ Konfigurasi

### Tidak Perlu Konfigurasi Tambahan!

QR code akan otomatis:
- ✅ Menggunakan URL yang sesuai dengan domain/IP server
- ✅ Generate ulang setiap kali halaman dimuat
- ✅ Menyesuaikan dengan lokasi instalasi

### Jika Ingin Mengubah Ukuran QR:
Edit file `loket.html` baris 32:
```javascript
const qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(presensiUrl);
```
(Ubah `250x250` menjadi ukuran yang diinginkan)

### Jika Ingin Mengubah Posisi QR:
Edit file `loket.html` baris 97-104:
- Pindahkan blok QR code ke posisi yang diinginkan
- Bisa dipindah ke atas, bawah, atau samping

## 🐛 Troubleshooting

### Masalah: QR Code Tidak Muncul

**Penyebab:**
- Koneksi internet tidak ada (API qrserver.com butuh internet)
- API qrserver.com down

**Solusi:**
1. Pastikan server memiliki koneksi internet
2. Cek apakah API qrserver.com bisa diakses:
   ```
   https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=test
   ```
3. Jika API down, tunggu beberapa saat atau gunakan alternatif

### Masalah: QR Code Tidak Bisa Di-Scan

**Penyebab:**
- QR terlalu kecil
- Kontras kurang
- Layar terlalu terang/gelap

**Solusi:**
1. Perbesar ukuran QR (ubah `size=250x250` menjadi `size=300x300`)
2. Pastikan background putih dan QR hitam
3. Atur brightness layar loket

### Masalah: URL Salah Setelah Scan

**Penyebab:**
- `location.origin` tidak terdeteksi dengan benar
- Path tidak sesuai

**Solusi:**
1. Cek URL yang ditampilkan di bawah QR code
2. Pastikan URL tersebut benar
3. Jika salah, perbaiki logika `location.pathname.replace()`

## 🔒 Keamanan

### Apakah QR Code Aman?

**Ya, QR code aman karena:**
- ✅ Hanya mengarah ke halaman presensi.html (halaman publik)
- ✅ Tidak mengandung data sensitif
- ✅ Tidak ada token atau password
- ✅ Petugas tetap harus login untuk akses admin
- ✅ Presensi tetap butuh foto atribut

### Apakah Bisa Di-Abuse?

**Tidak, karena:**
- QR hanya membuka halaman presensi
- Petugas tetap harus memilih nama mereka sendiri
- Petugas tetap harus mengambil foto atribut
- Semua presensi tercatat dengan timestamp
- Admin bisa melihat semua presensi di rekap

## 📊 Statistik Penggunaan

### Keuntungan QR Code:

**Sebelum (Tanpa QR):**
- ❌ Petugas harus ketik URL manual
- ❌ Rawan salah ketik
- ❌ Butuh waktu lebih lama
- ❌ Perlu tahu URL server

**Sesudah (Dengan QR):**
- ✅ Scan QR = langsung terbuka
- ✅ Tidak mungkin salah
- ✅ Cepat (1-2 detik)
- ✅ Tidak perlu hafal URL

### Estimasi Waktu:
- **Tanpa QR**: 30-60 detik (ketik URL + navigasi)
- **Dengan QR**: 3-5 detik (scan + tap)
- **Penghematan**: ~90% waktu

## 📝 File yang Diubah

### Modified:
1. **`public/standalone/loket.html`**
   - Tambah variabel `presensiUrl` (baris 31)
   - Tambah variabel `qrCodeUrl` (baris 32)
   - Tambah section QR code (baris 97-104)

### Added:
2. **`public/standalone/PENAMBAHAN-QR-CODE.md`** (file ini)
   - Dokumentasi lengkap fitur QR code

## 🚀 Cara Update

Salin ulang file berikut ke `C:\xampp\htdocs\sipelok\`:

```
sipelok/
└── loket.html    ← PERBARUI
```

Lalu **Ctrl+F5** di browser untuk clear cache.

## 🎯 Hasil Akhir

✅ QR code tampil di halaman loket  
✅ QR mengarah ke presensi.html  
✅ URL otomatis menyesuaikan domain/IP  
✅ Petugas bisa scan QR dengan HP  
✅ Akses presensi lebih cepat dan mudah  
✅ Tidak perlu konfigurasi tambahan  

## 💡 Tips

### Untuk Petugas:
- Gunakan kamera HP bawaan (tidak perlu aplikasi QR scanner)
- Pastikan HP terhubung ke WiFi yang sama dengan server
- Jika QR tidak bisa di-scan, ketik URL manual dari yang ditampilkan

### Untuk Admin:
- Letakkan layar loket di tempat yang mudah di-scan
- Pastikan layar tidak terlalu terang/gelap
- Bersihkan layar secara berkala agar QR tetap jelas

### Untuk IT:
- QR code menggunakan API gratis dari qrserver.com
- Jika API down, petugas masih bisa ketik URL manual
- Pertimbangkan untuk self-host QR generator jika diperlukan

## 📞 Support

Jika ada masalah dengan QR code:
1. Cek koneksi internet server
2. Cek apakah API qrserver.com bisa diakses
3. Cek console browser untuk error
4. Lihat troubleshooting di atas

---

**Catatan**: QR code ini bersifat opsional. Petugas tetap bisa akses presensi.html dengan cara manual (ketik URL atau bookmark).
