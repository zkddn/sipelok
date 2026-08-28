<?php
/* =====================================================================
   SIPELOK — API PHP + MySQL (SATU berkas, tanpa framework, tanpa npm)
   ---------------------------------------------------------------------
   Aksi (?action=...):
     ping      cek hidup API + database
     sig       sidik jari perubahan (dipoll frontend utk sinkronisasi)
     bootstrap seluruh data (petugas, presensi, jadwal, akun, sesi)
     save      simpan baris (?table=...) — UPSERT
     delete    hapus baris (?table=...&id=...) — id presensi boleh banyak (koma)
     clear     kosongkan tabel (?table=...)
   Permintaan ubah-data wajib menyertakan header X-Sipelok-Key = API_KEY.
   ===================================================================== */
require __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, X-Sipelok-Key');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }

function out(array $d, int $code = 200): void {
  http_response_code($code);
  echo json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}
function fail(string $m, int $code = 400): void { out(['ok' => false, 'error' => $m], $code); }

/* djb2 -> base36. WAJIB identik dengan fungsi djb2() di js/util.js */
function djb2(string $s): string {
  $h = 5381;
  for ($i = 0, $n = strlen($s); $i < $n; $i++) {
    $h = ($h * 33 + ord($s[$i])) & 0xFFFFFFFF;
  }
  return base_convert((string) $h, 10, 36);
}
const ADMIN_SALT = 'sipelokadmin'; // sama dengan js/util.js

$action = trim((string) ($_GET['action'] ?? ''));
if (in_array($action, ['save', 'delete', 'clear'], true)
    && (string) ($_SERVER['HTTP_X_SIPELOK_KEY'] ?? '') !== API_KEY) {
  fail('Kunci API tidak valid (X-Sipelok-Key)', 403);
}

try {
  $db = new PDO(
    'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
    DB_USER, DB_PASS,
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
  );
} catch (Throwable $e) {
  out(['ok' => false, 'error' => 'Koneksi MySQL gagal. Pastikan MySQL menyala dan database "sipelok" sudah diimpor (database/sipelok.sql).']);
}

/* Pastikan selalu ada akun admin bawaan: admin / bpskonawe.
   Hash dihitung dengan cara yang sama persis seperti frontend,
   sehingga mustahil tidak cocok. */
function seed_defaults(PDO $db): void {
  $ada = $db->query("SELECT COUNT(*) FROM akun WHERE peran = 'admin'")->fetchColumn();
  if ((int) $ada === 0) {
    $hash = djb2(ADMIN_SALT . '::sipelok::bpskonawe');
    $db->prepare('INSERT INTO akun (username, nama, peran, hash, salt, dibuat) VALUES (?,?,?,?,?,NOW())
                  ON DUPLICATE KEY UPDATE peran="admin", hash=VALUES(hash), salt=VALUES(salt)')
       ->execute(['admin', 'Administrator', 'admin', $hash, ADMIN_SALT]);
  }
}

function to_iso(?string $v): ?string { if (!$v) return null; $t = strtotime($v); return $t === false ? null : date('c', $t); }
function to_dt(?string $v): ?string  { if (!$v) return null; $t = strtotime($v); return $t === false ? null : date('Y-m-d H:i:s', $t); }

/* foto: simpan dataURL menjadi berkas di uploads/ agar database tetap ringan */
function simpan_foto(?string $v, string $id, string $suf): ?string {
  if (!$v) return null;
  if (strpos($v, 'image') === 0) {
    $pos = strpos($v, ',');
    $bin = base64_decode($pos === false ? '' : substr($v, $pos + 1), true);
    if ($bin === false) return null;
    $dir = __DIR__ . '/uploads';
    if (!is_dir($dir)) @mkdir($dir, 0777, true);
    $nama = preg_replace('/[^A-Za-z0-9_-]/', '', $id) . '_' . $suf . '.jpg';
    if (@file_put_contents($dir . '/' . $nama, $bin) === false) return null;
    return 'api/uploads/' . $nama;
  }
  return $v; // sudah berupa path
}

try {
  seed_defaults($db);

  switch ($action) {

    case 'ping':
      out(['ok' => true, 'db' => DB_NAME, 'version' => (string) $db->query('SELECT VERSION()')->fetchColumn(), 'waktu' => date('c')]);
      break;

    case 'sig': {
      $p = [];
      foreach (['petugas', 'presensi', 'jadwal', 'akun', 'sesi'] as $t) {
        $r = $db->query("SELECT COUNT(*) c, COALESCE(MAX(updated),'') m FROM $t")->fetch();
        $p[] = $t . ':' . $r['c'] . ':' . $r['m'];
      }
      out(['ok' => true, 'sig' => md5(implode('|', $p))]);
      break;
    }

    case 'bootstrap': {
      $petugas = $db->query('SELECT id, nama, nip FROM petugas')->fetchAll();
      $jadwal  = $db->query('SELECT id, hari, shift, petugas_id FROM jadwal')->fetchAll();
      $akun    = $db->query('SELECT username, nama, peran, hash, salt, dibuat FROM akun')->fetchAll();
      $sesi    = $db->query('SELECT token, tanggal, shift, dibuat FROM sesi')->fetchAll();
      $rec     = $db->query('SELECT id, tanggal, shift, petugas_id, nama, masuk, keluar, foto_masuk, foto_keluar
                             FROM presensi ORDER BY tanggal DESC, masuk DESC')->fetchAll();
      out([
        'ok' => true,
        'petugas'  => array_map(fn($r) => ['id' => $r['id'], 'nama' => $r['nama'], 'nip' => $r['nip']], $petugas),
        'jadwal'   => array_map(fn($r) => ['id' => $r['id'], 'hari' => (int) $r['hari'], 'shift' => (int) $r['shift'], 'petugasId' => $r['petugas_id']], $jadwal),
        'accounts' => array_map(fn($r) => ['username' => $r['username'], 'nama' => $r['nama'], 'role' => $r['peran'], 'hash' => $r['hash'], 'salt' => $r['salt'], 'dibuat' => to_iso($r['dibuat'])], $akun),
        'sessions' => array_map(fn($r) => ['token' => $r['token'], 'date' => $r['tanggal'], 'shift' => (int) $r['shift'], 'createdAt' => to_iso($r['dibuat'])], $sesi),
        'records'  => array_map(fn($r) => ['id' => $r['id'], 'date' => $r['tanggal'], 'shift' => (int) $r['shift'], 'petugasId' => $r['petugas_id'], 'nama' => $r['nama'], 'masuk' => to_iso($r['masuk']), 'keluar' => to_iso($r['keluar']), 'fotoMasuk' => $r['foto_masuk'], 'fotoKeluar' => $r['foto_keluar']], $rec),
      ]);
      break;
    }

    case 'save': {
      $table = (string) ($_GET['table'] ?? '');
      $rows  = json_decode(file_get_contents('php://input') ?: '[]', true);
      if (!is_array($rows)) fail('Isi permintaan tidak valid');
      if (count($rows) > 6000) fail('Terlalu banyak baris');
      $db->beginTransaction();

      if ($table === 'petugas') {
        $up = $db->prepare('UPDATE petugas SET nama=?, nip=? WHERE id=?');
        $in = $db->prepare('INSERT INTO petugas (id, nama, nip) VALUES (?,?,?)');
        foreach ($rows as $r) {
          $up->execute([$r['nama'] ?? '', $r['nip'] ?? null, $r['id'] ?? '']);
          if ($up->rowCount() === 0) $in->execute([$r['id'] ?? '', $r['nama'] ?? '', $r['nip'] ?? null]);
        }
      } elseif ($table === 'records') {
        $up = $db->prepare('UPDATE presensi SET tanggal=?, shift=?, petugas_id=?, nama=?, masuk=?, keluar=?, foto_masuk=?, foto_keluar=? WHERE id=?');
        $in = $db->prepare('INSERT INTO presensi (id, tanggal, shift, petugas_id, nama, masuk, keluar, foto_masuk, foto_keluar) VALUES (?,?,?,?,?,?,?,?,?)');
        foreach ($rows as $r) {
          $id = (string) ($r['id'] ?? '');
          if ($id === '') continue;
          $v = [
            $r['date'] ?? null, (int) ($r['shift'] ?? 1), $r['petugasId'] ?? '', $r['nama'] ?? '',
            to_dt($r['masuk'] ?? null), to_dt($r['keluar'] ?? null),
            simpan_foto($r['fotoMasuk'] ?? null, $id, 'masuk'),
            simpan_foto($r['fotoKeluar'] ?? null, $id, 'keluar'),
          ];
          $up->execute(array_merge($v, [$id]));
          if ($up->rowCount() === 0) $in->execute(array_merge([$id], $v));
        }
      } elseif ($table === 'jadwal') {
        $db->exec('DELETE FROM jadwal');
        $in = $db->prepare('INSERT INTO jadwal (id, hari, shift, petugas_id) VALUES (?,?,?,?)');
        foreach ($rows as $r) $in->execute([$r['id'] ?? '', (int) ($r['hari'] ?? 1), (int) ($r['shift'] ?? 1), $r['petugasId'] ?? '']);
      } elseif ($table === 'accounts') {
        $db->exec('DELETE FROM akun');
        $in = $db->prepare('INSERT INTO akun (username, nama, peran, hash, salt, dibuat) VALUES (?,?,?,?,?,?)');
        foreach ($rows as $r) $in->execute([$r['username'] ?? '', $r['nama'] ?? '', $r['role'] ?? 'viewer', $r['hash'] ?? '', $r['salt'] ?? null, to_dt($r['dibuat'] ?? null)]);
      } elseif ($table === 'sessions') {
        $up = $db->prepare('UPDATE sesi SET tanggal=?, shift=?, dibuat=? WHERE token=?');
        $in = $db->prepare('INSERT INTO sesi (token, tanggal, shift, dibuat) VALUES (?,?,?,?)');
        foreach ($rows as $r) {
          $v = [$r['date'] ?? null, (int) ($r['shift'] ?? 1), to_dt($r['createdAt'] ?? null)];
          $up->execute(array_merge($v, [$r['token'] ?? '']));
          if ($up->rowCount() === 0) $in->execute(array_merge([$r['token'] ?? ''], $v));
        }
        $db->exec('DELETE FROM sesi WHERE dibuat < (NOW() - INTERVAL 3 DAY)');
      } else {
        $db->rollBack();
        fail('Tabel tidak dikenal: ' . $table);
      }

      $db->commit();
      out(['ok' => true, 'rows' => count($rows)]);
      break;
    }

    case 'delete': {
      $table = (string) ($_GET['table'] ?? '');
      $id    = (string) ($_GET['id'] ?? '');
      if ($table === 'petugas') {
        $db->prepare('DELETE FROM petugas WHERE id = ?')->execute([$id]);
      } elseif ($table === 'sessions') {
        $db->prepare('DELETE FROM sesi WHERE token = ?')->execute([$id]);
      } elseif ($table === 'records') {
        $ids = array_values(array_filter(array_map('trim', explode(',', $id)), 'strlen'));
        if (!$ids) fail('Tidak ada id presensi yang dikirim');
        // bersihkan berkas foto atribut di disk agar penyimpanan tidak penuh
        $pf = $db->prepare('SELECT foto_masuk, foto_keluar FROM presensi WHERE id = ?');
        foreach ($ids as $rid) {
          $pf->execute([$rid]);
          $f = $pf->fetch();
          if ($f) foreach ([$f['foto_masuk'], $f['foto_keluar']] as $fp) {
            if ($fp && strpos($fp, 'api/uploads/') === 0) @unlink(dirname(__DIR__) . '/' . $fp);
          }
        }
        $st = $db->prepare('DELETE FROM presensi WHERE id = ?');
        foreach ($ids as $rid) $st->execute([$rid]);
      } else {
        fail('Tabel tidak dikenal: ' . $table);
      }
      out(['ok' => true]);
      break;
    }

    case 'clear': {
      $table = (string) ($_GET['table'] ?? '');
      $map = ['petugas' => 'petugas', 'records' => 'presensi', 'jadwal' => 'jadwal', 'sessions' => 'sesi'];
      if (!isset($map[$table])) fail('Tabel tidak dikenal: ' . $table);
      $db->exec('DELETE FROM ' . $map[$table]);
      out(['ok' => true]);
      break;
    }

    default:
      fail('Aksi tidak dikenal: ' . $action, 404);
  }
} catch (Throwable $e) {
  if ($db->inTransaction()) $db->rollBack();
  fail('Galat server: ' . $e->getMessage(), 500);
}
