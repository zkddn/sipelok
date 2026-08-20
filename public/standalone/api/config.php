<?php
/* ============================================================
   SIPELOK — Konfigurasi (sesuaikan dengan server Anda)
   Nilai di bawah adalah default XAMPP; biasanya TIDAK perlu diubah.
   ============================================================ */
define('DB_HOST', 'localhost');
define('DB_NAME', 'sipelok');
define('DB_USER', 'root');
define('DB_PASS', '');

/* Kunci rahasia untuk mutasi data (ubah saat deploy agar aman).
   Frontend mengirimnya otomatis lewat header X-Sipelok-Key. */
define('API_KEY', 'sipelok-konawe-2024');

/* Zona waktu kantor: WITA (Konawe). Sesuaikan bila perlu. */
date_default_timezone_set('Asia/Makassar');
