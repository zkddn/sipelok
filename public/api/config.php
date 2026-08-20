<?php
/* =====================================================================
   SIPELOK — Konfigurasi Database & API
   ---------------------------------------------------------------------
   Sesuaikan nilai di bawah dengan server Anda (XAMPP = nilai bawaan).
   File ini ikut tersalin ke folder dist/api saat `npm run build`.
   ===================================================================== */

/* --- Koneksi MySQL --- */
define('DB_HOST', 'localhost');   // host database
define('DB_USER', 'root');        // pengguna MySQL (XAMPP default: root)
define('DB_PASS', '');            // kata sandi MySQL (XAMPP default: kosong)
define('DB_NAME', 'sipelok');     // nama database (buat lewat sipelok.sql)

/* --- Keamanan ---
   Kunci ini harus SAMA dengan konstanta API_KEY di src/lib/backend.ts.
   Ganti dengan nilai acak Anda sendiri sebelum produksi. */
define('API_KEY', 'sipelok-2026');

/* --- Zona waktu server (Kab. Konawe = WITA) --- */
date_default_timezone_set('Asia/Makassar');
