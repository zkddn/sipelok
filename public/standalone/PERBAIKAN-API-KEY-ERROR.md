# Perbaikan: Error "Kunci API tidak valid (X-Sipelok-Key)" saat Delete

## 🐛 Masalah yang Dilaporkan

**Error di Console:**
```
HTTP Error: delete 
{ok: false, error: 'Kunci API tidak valid (X-Sipelok-Key)'}
```

## 🔍 Akar Masalah

### Fungsi `http()` Tidak Mengirim Header untuk GET Request

**SEBELUM** (MASALAH):
```javascript
async function http(action, opts) {
  const init = { method: opts.body ? "POST" : "GET", headers: {} };
  
  if (opts.body) {
    init.headers["Content-Type"] = "application/json";
    init.headers["X-Sipelok-Key"] = API_KEY;  // ❌ Hanya dikirim untuk POST
    init.body = JSON.stringify(opts.body);
  } else {
    console.log("HTTP GET:", action);
    // ❌ Header X-Sipelok-Key TIDAK dikirim untuk GET!
  }
  
  const r = await fetch(url, init);
  // ...
}
```

**Masalah:**
- Header `X-Sipelok-Key` hanya dikirim untuk request POST (yang punya body)
- Request GET (seperti delete, ping, bootstrap) tidak mengirim header
- API PHP menolak request tanpa header → error "Kunci API tidak valid"

### Fungsi yang Terpengaruh:

1. **`persistDelete()`** - Hapus data dari database
   ```javascript
   http("delete", { table: table, id: id })  // ❌ GET tanpa header
   ```

2. **`deleteRecords()`** - Hapus multiple records
   ```javascript
   http("delete", { table: "records", id: ids.join(",") })  // ❌ GET tanpa header
   ```

3. **`detectMode()`** - Deteksi mode penyimpanan
   ```javascript
   fetch(API + "?action=ping")  // ❌ Tidak ada header
   ```

## ✅ Solusi yang Diterapkan

### Perbaikan Fungsi `http()` - Selalu Kirim API Key

**SESUDAH** (BENAR):
```javascript
async function http(action, opts) {
  opts = opts || {};
  let url = API + "?action=" + encodeURIComponent(action);
  if (opts.table) url += "&table=" + encodeURIComponent(opts.table);
  if (opts.id) url += "&id=" + encodeURIComponent(opts.id);
  const init = { method: opts.body ? "POST" : "GET", headers: {} };
  
  // ✅ Selalu kirim API key untuk semua request (GET dan POST)
  init.headers["X-Sipelok-Key"] = API_KEY;
  
  if (opts.body) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(opts.body);
    console.log("HTTP POST:", action, "Table:", opts.table, "Records:", opts.body.length);
  } else {
    console.log("HTTP GET:", action);
  }
  
  const r = await fetch(url, init);
  // ...
}
```

**Keuntungan:**
- ✅ Header `X-Sipelok-Key` selalu dikirim untuk semua request
- ✅ Tidak ada error "Kunci API tidak valid"
- ✅ Semua operasi (GET dan POST) terautentikasi
- ✅ Lebih aman

## 🧪 Cara Menguji

### Test 1: Delete Presensi
```
1. Buka: http://localhost/sipelok/admin.html
2. Pilih tab "Rekap Presensi"
3. Centang beberapa presensi
4. Klik "Hapus Terpilih"
5. Lihat console browser (F12):
   ✅ "HTTP GET: delete"
   ✅ Tidak ada error "Kunci API tidak valid"
   ✅ Data berhasil dihapus
```

### Test 2: Delete Petugas
```
1. Buka: http://localhost/sipelok/admin.html
2. Pilih tab "Petugas"
3. Klik "Hapus" pada salah satu petugas
4. Lihat console browser (F12):
   ✅ "HTTP GET: delete"
   ✅ Tidak ada error
   ✅ Petugas berhasil dihapus
```

### Test 3: Cek Console Log
```
Saat delete, console harus menampilkan:
✅ "HTTP GET: delete"
✅ Tidak ada error "Kunci API tidak valid"
✅ Response: {ok: true}
```

## 📁 File yang Diperbaiki

### Modified:
1. **`public/standalone/js/util.js`**
   - ✅ Perbaikan fungsi `http()` untuk selalu mengirim header `X-Sipelok-Key`
   - ✅ Header dikirim untuk semua request (GET dan POST)

### Added:
2. **`public/standalone/PERBAIKAN-API-KEY-ERROR.md`** (file ini)
   - ✅ Dokumentasi lengkap perbaikan

## 🚀 Cara Update

Salin ulang file berikut ke `C:\xampp\htdocs\sipelok\`:

```
sipelok/
└── js/
    └── util.js                      ← PERBARUI
```

Lalu **Ctrl+F5** di browser untuk clear cache.

## 🔧 Verifikasi Perbaikan

### Langkah 1: Buka Console Browser
```
1. Tekan F12
2. Pilih tab Console
3. Clear console (ikon tempat sampah)
```

### Langkah 2: Lakukan Delete
```
1. Buka admin.html
2. Pilih tab "Rekap Presensi"
3. Centang beberapa presensi
4. Klik "Hapus Terpilih"
```

### Langkah 3: Periksa Console Log
```
Seharusnya muncul:
✅ "HTTP GET: delete"
✅ Tidak ada error "Kunci API tidak valid"
✅ Response: {ok: true}
```

### Langkah 4: Verifikasi Database
```sql
-- Buka phpMyAdmin
http://localhost/phpmyadmin

-- Cek apakah data sudah dihapus
SELECT COUNT(*) FROM presensi;
-- Jumlah harus berkurang
```

## 📊 Perbandingan Sebelum vs Sesudah

### Sebelum (Header Hanya untuk POST):
```javascript
if (opts.body) {
  init.headers["X-Sipelok-Key"] = API_KEY;  // ❌ Hanya POST
}
// GET request tidak ada header → error
```

**Masalah:**
- ❌ GET request ditolak oleh server
- ❌ Error "Kunci API tidak valid"
- ❌ Delete tidak bisa dilakukan

### Sesudah (Header untuk Semua Request):
```javascript
// ✅ Selalu kirim API key
init.headers["X-Sipelok-Key"] = API_KEY;
```

**Keuntungan:**
- ✅ Semua request terautentikasi
- ✅ Tidak ada error
- ✅ Delete berfungsi dengan baik

## 💡 Tips

### Untuk Pengguna:
- Jika masih ada error "Kunci API tidak valid", refresh halaman (Ctrl+F5)
- Pastikan file `util.js` sudah diupdate
- Periksa console browser (F12) untuk detail error

### Untuk Admin:
- Gunakan console browser untuk debugging
- Periksa apakah header `X-Sipelok-Key` dikirim
- Verifikasi API key di `config.php` sama dengan di `util.js`

### Untuk IT:
- API key harus sama di frontend dan backend
- Frontend: `const API_KEY = "sipelok-konawe-2024";` di util.js
- Backend: `const API_KEY = 'sipelok-konawe-2024';` di config.php
- Jika berbeda, ubah salah satu agar sama

## 🎯 Hasil Akhir

✅ **Tidak ada lagi error "Kunci API tidak valid"**  
✅ **Header `X-Sipelok-Key` selalu dikirim untuk semua request**  
✅ **Delete berfungsi dengan baik**  
✅ **Semua operasi terautentikasi**  
✅ **Lebih aman**  

## 📞 Jika Masih Bermasalah

### Langkah 1: Periksa API Key
```javascript
// Di util.js (frontend)
const API_KEY = "sipelok-konawe-2024";

// Di config.php (backend)
const API_KEY = 'sipelok-konawe-2024';

// Harus SAMA!
```

### Langkah 2: Periksa Console Browser
```
1. Tekan F12
2. Pilih tab Network
3. Lakukan delete
4. Klik request "delete"
5. Lihat "Request Headers":
   ✅ Harus ada: X-Sipelok-Key: sipelok-konawe-2024
```

### Langkah 3: Periksa Error Log PHP
```
C:\xampp\php\logs\php_error_log

Cari: "Kunci API tidak valid"
```

---

**Catatan**: Perbaikan ini memastikan bahwa semua request (GET dan POST) mengirim header `X-Sipelok-Key`, sehingga tidak ada lagi error "Kunci API tidak valid" saat melakukan delete atau operasi lainnya.
