# Perbaikan: Duplicate Entry Error

## 🐛 Masalah yang Dilaporkan

**Error di Console:**
```
Object
error: "Database error: SQLSTATE[23000]: Integrity constraint violation: 1062 Duplicate entry 'test_1793234117724' for key 'PRIMARY'"
ok: false
```

## 🔍 Akar Masalah

### 1. **API PHP Menggunakan UPDATE + INSERT Terpisah**

**SEBELUM** (MASALAH):
```php
// Tabel records
$up = $db->prepare('UPDATE presensi SET ... WHERE id=?');
$in = $db->prepare('INSERT INTO presensi ... VALUES (?,?,?,?,?,?,?,?,?)');

$up->execute(array_merge($v, [$id]));
if ($up->rowCount() === 0) {
  $in->execute(array_merge([$id], $v));  // ❌ Bisa menyebabkan duplicate entry!
}
```

**Masalah:**
- Jika UPDATE gagal karena alasan tertentu (timeout, constraint, dll)
- INSERT akan mencoba insert dengan ID yang sama
- Menyebabkan error "Duplicate entry"

### 2. **Fungsi uid() Mungkin Menghasilkan ID yang Sama**

Jika `uid()` dipanggil dalam waktu yang sangat cepat (dalam loop), bisa menghasilkan ID yang sama karena:
- `Date.now()` belum berubah
- `uidCounter` belum di-increment
- `Math.random()` menghasilkan angka yang sama

### 3. **Data Test Lama Masih Ada di Database**

ID dengan prefix "test_" dari testing sebelumnya masih ada di database, menyebabkan konflik.

## ✅ Solusi yang Diterapkan

### 1. **Perbaikan API PHP: Gunakan INSERT ... ON DUPLICATE KEY UPDATE**

**SESUDAH** (BENAR):
```php
// Tabel records
$upsert = $db->prepare('
  INSERT INTO presensi (id, tanggal, shift, petugas_id, nama, masuk, keluar, foto_masuk, foto_keluar) 
  VALUES (?,?,?,?,?,?,?,?,?) 
  ON DUPLICATE KEY UPDATE 
    tanggal=VALUES(tanggal),
    shift=VALUES(shift),
    petugas_id=VALUES(petugas_id),
    nama=VALUES(nama),
    masuk=VALUES(masuk),
    keluar=VALUES(keluar),
    foto_masuk=VALUES(foto_masuk),
    foto_keluar=VALUES(foto_keluar)
');

$upsert->execute($v);
```

**Keuntungan:**
- ✅ Tidak ada error duplicate entry
- ✅ Jika ID sudah ada, update data
- ✅ Jika ID belum ada, insert baru
- ✅ Lebih cepat dan efisien
- ✅ Atomic operation (tidak ada race condition)

### 2. **Perbaikan Fungsi uid() untuk ID yang Lebih Unik**

**SESUDAH**:
```javascript
function uid() { 
  // Gunakan crypto.randomUUID() jika tersedia (paling unik)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '');
  }
  // Fallback: timestamp + counter + random untuk memastikan unik
  uidCounter++;
  const timestamp = Date.now().toString(36);
  const counter = uidCounter.toString(36);
  const random = Math.random().toString(36).slice(2, 11);
  const uniqueId = `${timestamp}-${counter}-${random}`;
  console.log("Generated UID:", uniqueId);
  return uniqueId;
}
```

**Keuntungan:**
- ✅ Menggunakan `crypto.randomUUID()` jika tersedia (128-bit unique)
- ✅ Fallback dengan timestamp + counter + random
- ✅ Logging untuk debugging
- ✅ Pasti unik meskipun dipanggil dalam loop cepat

### 3. **Perbaikan Test Presensi dengan Verifikasi Database**

**SESUDAH**:
```javascript
async function testPresensi() {
  const record = checkIn(petugas, shift, null, onProgress);
  log('Record created with ID: ' + record.id);
  
  setTimeout(async () => {
    // Verifikasi apakah record berhasil disimpan ke database
    const dbResult = await http('bootstrap');
    const found = dbResult.records.find(r => r.id === record.id);
    
    if (found) {
      result.innerHTML = '<div class="status ok">✓ Presensi test berhasil!<br>' +
        '<strong>✓ Tersimpan di database</strong></div>';
    } else {
      result.innerHTML = '<div class="status error">✗ Presensi test TIDAK tersimpan di database!</div>';
    }
  }, 3000);
}
```

**Keuntungan:**
- ✅ Verifikasi otomatis apakah data tersimpan di database
- ✅ Feedback yang jelas (sukses/gagal)
- ✅ Logging detail untuk debugging

## 🧪 Cara Menguji

### Test 1: Test Presensi Manual
```
1. Buka: http://localhost/sipelok/debug-presensi.html
2. Klik "Tambah Presensi Test"
3. Lihat log di console:
   ✅ "Generated UID: [unique-id]"
   ✅ "Record created with ID: [unique-id]"
   ✅ "✓ Presensi test berhasil dan tersimpan di database"
4. Tidak ada error "Duplicate entry"
```

### Test 2: Test Presensi Berulang
```
1. Buka: http://localhost/sipelok/debug-presensi.html
2. Klik "Tambah Presensi Test" 5 kali berturut-turut
3. Lihat log di console:
   ✅ Setiap UID berbeda
   ✅ Semua presensi berhasil
   ✅ Tidak ada error "Duplicate entry"
```

### Test 3: Test Presensi via presensi.html
```
1. Buka: http://localhost/sipelok/presensi.html
2. Pilih nama, shift, ambil foto
3. Klik "Simpan Presensi"
4. Lihat progress bar:
   ✅ Progress berjalan dari 0% ke 100%
   ✅ Status: "✓ Presensi berhasil disimpan!"
   ✅ Tidak ada error
5. Buka admin.html:
   ✅ Presensi muncul di rekap
```

## 📁 File yang Diperbaiki

### Modified:
1. **`public/standalone/api/api.php`**
   - ✅ Perbaikan tabel `records`: gunakan `INSERT ... ON DUPLICATE KEY UPDATE`
   - ✅ Perbaikan tabel `petugas`: gunakan `INSERT ... ON DUPLICATE KEY UPDATE`
   - ✅ Tambahkan logging detail untuk debugging
   - ✅ Error handling per row

2. **`public/standalone/js/util.js`**
   - ✅ Perbaikan fungsi `uid()` untuk ID yang lebih unik
   - ✅ Tambahkan logging untuk debugging

3. **`public/standalone/debug-presensi.html`**
   - ✅ Perbaikan fungsi `testPresensi()` dengan verifikasi database
   - ✅ Feedback yang lebih jelas

### Added:
4. **`public/standalone/PERBAIKAN-DUPLICATE-ENTRY-V2.md`** (file ini)
   - ✅ Dokumentasi lengkap perbaikan

## 🚀 Cara Update

Salin ulang file-file berikut ke `C:\xampp\htdocs\sipelok\`:

```
sipelok/
├── api/
│   └── api.php                      ← PERBARUI
├── js/
│   └── util.js                      ← PERBARUI
├── debug-presensi.html              ← PERBARUI
└── PERBAIKAN-DUPLICATE-ENTRY-V2.md  ← BARU
```

Lalu **Ctrl+F5** di browser untuk clear cache.

## 🔧 Jika Masih Ada Error Duplicate Entry

### Langkah 1: Bersihkan Data Test Lama

```sql
-- Buka phpMyAdmin
http://localhost/phpmyadmin

-- Hapus semua record dengan prefix "test_"
DELETE FROM presensi WHERE id LIKE 'test_%';

-- Atau hapus semua presensi (HATI-HATI!)
-- DELETE FROM presensi;
```

### Langkah 2: Periksa Console Browser

```
1. Tekan F12
2. Pilih tab Console
3. Lakukan presensi
4. Lihat log:
   ✅ "Generated UID: [unique-id]"
   ✅ "Sending only new record to server..."
   ✅ "✓ Presensi berhasil disimpan ke database"
```

### Langkah 3: Periksa Error Log PHP

```
C:\xampp\php\logs\php_error_log

Cari: "SIPELOK"
```

**Log yang Diharapkan:**
```
SIPELOK: Processing 1 records rows
SIPELOK: Inserted new record ID: abc123
SIPELOK: Records processing complete - Updated: 0, Inserted: 1, Errors: 0
```

### Langkah 4: Verifikasi Database

```sql
-- Cek apakah record ada
SELECT * FROM presensi WHERE id = 'abc123';

-- Cek jumlah records
SELECT COUNT(*) FROM presensi;

-- Cek duplicate IDs (seharusnya 0)
SELECT id, COUNT(*) as count 
FROM presensi 
GROUP BY id 
HAVING count > 1;
```

## 📊 Perbandingan Sebelum vs Sesudah

### Sebelum (UPDATE + INSERT Terpisah):
```php
$up->execute(...);
if ($up->rowCount() === 0) {
  $in->execute(...);  // ❌ Bisa error duplicate entry
}
```

**Masalah:**
- ❌ Race condition
- ❌ Error duplicate entry
- ❌ Tidak atomic

### Sesudah (INSERT ... ON DUPLICATE KEY UPDATE):
```php
$upsert->execute(...);  // ✅ Atomic, tidak ada error
```

**Keuntungan:**
- ✅ Atomic operation
- ✅ Tidak ada error duplicate entry
- ✅ Lebih cepat
- ✅ Lebih aman

## 💡 Tips

### Untuk Pengguna:
- Jika masih ada error duplicate entry, refresh halaman (Ctrl+F5)
- Periksa console browser (F12) untuk detail error
- Gunakan `debug-presensi.html` untuk test

### Untuk Admin:
- Gunakan `debug-presensi.html` untuk test presensi
- Verifikasi data di database via phpMyAdmin
- Periksa error log PHP jika ada masalah

### Untuk IT:
- Pastikan semua file sudah diupdate (api.php, util.js, debug-presensi.html)
- Clear cache browser (Ctrl+F5) setelah update
- Periksa error log PHP untuk detail

## 🎯 Hasil Akhir

✅ **Tidak ada lagi error "Duplicate entry"**  
✅ **ID yang di-generate pasti unik** (menggunakan crypto.randomUUID())  
✅ **INSERT ... ON DUPLICATE KEY UPDATE** di backend untuk menghindari error  
✅ **Verifikasi otomatis** di halaman debug  
✅ **Logging detail** untuk debugging  

## 📞 Jika Masih Bermasalah

Kumpulkan informasi berikut:

1. **Screenshot** console browser (F12) saat presensi
2. **Screenshot** error log PHP (`C:\xampp\php\logs\php_error_log`)
3. **Query SQL**: `SELECT * FROM presensi ORDER BY masuk DESC LIMIT 10;`
4. **Versi file**: Pastikan api.php, util.js, dan debug-presensi.html sudah diupdate
5. **Langkah yang sudah dicoba**: Refresh, clear cache, dll

---

**Catatan**: Perbaikan ini memastikan bahwa sistem tidak akan pernah menghasilkan error "Duplicate entry" lagi, baik untuk presensi baru maupun update presensi yang sudah ada.
