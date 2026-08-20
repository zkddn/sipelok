-- ============================================================
--  SIPELOK — Presensi Piket Loket Pelayanan BPS Kab. Konawe
--  Skema MySQL (impor lewat phpMyAdmin: menu Import)
--  Tanpa npm. Cukup PHP + MySQL (XAMPP).
-- ============================================================
CREATE DATABASE IF NOT EXISTS sipelok
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sipelok;

CREATE TABLE IF NOT EXISTS petugas (
  id       VARCHAR(40)  PRIMARY KEY,
  nama     VARCHAR(120) NOT NULL,
  nip      VARCHAR(40)  NULL,
  updated  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS presensi (
  id          VARCHAR(40)  PRIMARY KEY,
  tanggal     DATE         NOT NULL,
  shift       TINYINT      NOT NULL,
  petugas_id  VARCHAR(40)  NOT NULL,
  nama        VARCHAR(120) NOT NULL,
  masuk       DATETIME     NULL,
  keluar      DATETIME     NULL,
  foto_masuk  VARCHAR(255) NULL,
  foto_keluar VARCHAR(255) NULL,
  updated     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tanggal (tanggal),
  INDEX idx_petugas (petugas_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS jadwal (
  id          VARCHAR(40) PRIMARY KEY,
  hari        TINYINT     NOT NULL,  -- 1=Senin .. 6=Sabtu
  shift       TINYINT     NOT NULL,  -- 1=Pagi 2=Siang
  petugas_id  VARCHAR(40) NOT NULL,
  updated     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_hari (hari)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS akun (
  username VARCHAR(60)  PRIMARY KEY,
  nama     VARCHAR(120) NOT NULL,
  peran    VARCHAR(20)  NOT NULL DEFAULT 'viewer',  -- admin | viewer
  hash     VARCHAR(100) NOT NULL,
  salt     VARCHAR(40)  NULL,
  dibuat   DATETIME     NULL,
  updated  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sesi (
  token   VARCHAR(40) PRIMARY KEY,
  tanggal DATE        NOT NULL,
  shift   TINYINT     NOT NULL,
  dibuat  DATETIME    NULL,
  updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Catatan: akun admin bawaan (admin / bpskonawe) dibuat otomatis oleh
-- api.php saat pertama kali diakses. Tidak perlu INSERT manual.
