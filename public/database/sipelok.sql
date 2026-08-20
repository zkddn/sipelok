-- =====================================================================
--  SIPELOK — Skema Database MySQL (Presensi Piket Loket, BPS Kab. Konawe)
--  Cara pakai: buka phpMyAdmin → tab "Import" → pilih berkas ini → Go.
--  (atau: mysql -u root -p < sipelok.sql)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS sipelok
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sipelok;

-- Daftar pegawai yang mendapat giliran piket
CREATE TABLE IF NOT EXISTS petugas (
  id      VARCHAR(16)  NOT NULL PRIMARY KEY,
  nama    VARCHAR(160) NOT NULL,
  nip     VARCHAR(40)  NULL,
  updated TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Catatan presensi piket (foto disimpan sebagai berkas di api/uploads/)
CREATE TABLE IF NOT EXISTS presensi (
  id          VARCHAR(16)  NOT NULL PRIMARY KEY,
  tanggal     DATE         NOT NULL,
  shift       TINYINT      NOT NULL,
  petugas_id  VARCHAR(16)  NOT NULL,
  nama        VARCHAR(160) NOT NULL,
  masuk       DATETIME     NOT NULL,
  keluar      DATETIME     NULL,
  foto_masuk  VARCHAR(255) NULL,
  foto_keluar VARCHAR(255) NULL,
  updated     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tanggal (tanggal),
  INDEX idx_petugas (petugas_id)
) ENGINE=InnoDB;

-- Jadwal piket mingguan: hari 1=Senin … 6=Sabtu, shift 1=Pagi 2=Siang
CREATE TABLE IF NOT EXISTS jadwal (
  id         VARCHAR(16) NOT NULL PRIMARY KEY,
  hari       TINYINT     NOT NULL,
  shift      TINYINT     NOT NULL,
  petugas_id VARCHAR(16) NOT NULL,
  updated    TIMESTAMP   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_slot (hari, shift)
) ENGINE=InnoDB;

-- Akun konsol admin (hash dibuat aplikasi; admin bawaan dibuat otomatis
-- oleh api.php saat pertama kali diakses: admin / bpskonawe)
CREATE TABLE IF NOT EXISTS akun (
  username VARCHAR(64)  NOT NULL PRIMARY KEY,
  nama     VARCHAR(160) NOT NULL,
  peran    ENUM('admin','viewer') NOT NULL DEFAULT 'viewer',
  hash     VARCHAR(128) NOT NULL,
  salt     VARCHAR(32)  NULL,
  dibuat   DATETIME     NULL,
  updated  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Sesi token QR (dibuat layar loket; kedaluwarsa otomatis 3 hari)
CREATE TABLE IF NOT EXISTS sesi (
  token   VARCHAR(16) NOT NULL PRIMARY KEY,
  tanggal DATE        NOT NULL,
  shift   TINYINT     NOT NULL,
  dibuat  DATETIME    NOT NULL,
  updated TIMESTAMP   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
