<?php
/* ============================================================
   SIPELOK — konfigurasi database & kunci API
   Sesuaikan empat nilai di bawah dengan XAMPP Anda.
   Nilai bawaan sudah cocok untuk XAMPP standar.
   ============================================================ */

const DB_HOST = '127.0.0.1';
const DB_NAME = 'sipelok';
const DB_USER = 'root';
const DB_PASS = '';

/* Kunci rahasia untuk permintaan ubah-data (save/delete/clear).
   Samakan dengan nilai API_KEY di js/util.js bila Anda mengubahnya. */
const API_KEY = 'sipelok-konawe-2024';
