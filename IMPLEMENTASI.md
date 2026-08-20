# SIPELOK — Implementasi PHP + MySQL

Presensi piket loket pelayanan untuk BPS Kab. Konawe. Arsitektur sengaja dibuat
sederhana: **aplikasi web statis + SATU berkas PHP (`api.php`) + MySQL**, agar
mudah dipasang di kantor tanpa Node.js atau layanan cloud.

> Panduan lengkap & interaktif (dengan uji koneksi langsung) tersedia di dalam
> aplikasi: buka **`#/panduan`**.

## Prasyarat

- **XAMPP** (sudah berisi Apache + PHP + MySQL) — satu-satunya yang perlu diinstal.

## Langkah Ringkas

1. **Pasang XAMPP**, lalu `Start` modul **Apache** dan **MySQL**.
2. **Salin seluruh isi folder `dist/`** ke `C:\xampp\htdocs\sipelok`.
3. **Buat database**: buka `http://localhost/phpmyadmin` → tab **Import** →
   pilih `dist/database/sipelok.sql` → **Go**.
4. **Sesuaikan `dist/api/config.php`** (kredensial MySQL & `API_KEY`).
5. **Tes API**: buka `http://localhost/sipelok/api/api.php?action=ping`
   → harus muncul `{"ok":true,...}`.
6. **Masuk admin**: `http://localhost/sipelok/#/admin` dengan `admin / bpskonawe`
   (segera ganti sandi).

## Agar HP Petugas Bisa Mengakses

Sambungkan PC server & HP ke Wi-Fi/jaringan yang sama, lalu buka aplikasi lewat
**IP PC server**, mis. `http://192.168.1.10/sipelok`. QR di layar loket otomatis
memakai alamat tersebut, jadi petugas tinggal memindai.

## Struktur `dist/`

```
sipelok/
├── index.html            ← aplikasi (React statis)
├── api/
│   ├── api.php           ← satu-satunya berkas PHP
│   ├── config.php        ← kredensial MySQL & API_KEY
│   └── uploads/          ← foto atribut (harus dapat ditulis)
└── database/
    └── sipelok.sql       ← skema (5 tabel)
```

## Mode Kerja

- **MySQL Aktif** — `api.php` terdeteksi: semua perangkat melihat data yang sama
  (sinkron otomatis ±3,5 detik), foto disimpan sebagai berkas.
- **Mode Demo** — tanpa server: data tersimpan di localStorage peramban, tetap
  berfungsi penuh untuk mencoba aplikasi.

## Pengembangan (opsional)

- Frontend: `npm install && npm run dev`, build dengan `npm run build`.
- Kunci API harus sama di `src/lib/backend.ts` (konstanta `API_KEY`) dan
  `public/api/config.php` — build ulang setelah mengubahnya.
