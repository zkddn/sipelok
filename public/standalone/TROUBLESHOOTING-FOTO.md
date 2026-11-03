# Troubleshooting: Foto Tidak Tersimpan

## 📸 Masalah

Foto atribut tidak tersimpan ke database/folder uploads meskipun sudah menambahkan folder uploads di folder api.

## 🔍 Kemungkinan Penyebab

### 1. **Folder Uploads Tidak Writable**
Folder `api/uploads/` tidak memiliki permission write untuk Apache/PHP.

### 2. **Path Folder Salah**
Folder uploads tidak berada di lokasi yang benar.

### 3. **Data URL Tidak Valid**
Foto dari kamera tidak dalam format data URL yang benar.

### 4. **PHP Error**
Ada error di PHP yang tidak terlihat di frontend.

### 5. **Database Constraint**
Kolom `foto_masuk` atau `foto_keluar` terlalu kecil untuk menyimpan path.

## ✅ Solusi

### Solusi 1: Periksa Permission Folder

#### Windows (XAMPP):
1. Buka File Explorer
2. Navigasi ke `C:\xampp\htdocs\sipelok\api\uploads\`
3. Right-click folder `uploads` → Properties → Security
4. Klik "Edit" → "Add"
5. Tambahkan user: `IUSR` dan `IIS_IUSRS`
6. Berikan permission "Full control"
7. Klik OK

#### Linux/Mac:
```bash
cd /path/to/sipelok/api
chmod -R 755 uploads
chown -R www-data:www-data uploads  # Ubuntu/Debian
# atau
chown -R apache:apache uploads  # CentOS/RHEL
```

### Solusi 2: Verifikasi Lokasi Folder

Pastikan struktur folder seperti ini:
```
sipelok/
├── api/
│   ├── api.php
│   ├── config.php
│   ├── cleanup_jadwal.php
│   └── uploads/          ← Folder ini harus ada
│       ├── (file foto akan disimpan di sini)
│       └── .htaccess     ← Optional: untuk security
```

### Solusi 3: Test Upload dengan Halaman Test

1. Buka browser
2. Akses: `http://localhost/sipelok/test-upload.html`
3. Klik "Choose File" dan ambil foto
4. Klik "Upload Foto Test"
5. Lihat log untuk detail error

**Hasil yang Diharapkan:**
```
[10:30:15] File dipilih: photo.jpg, ukuran: 245.67 KB
[10:30:15] Foto berhasil dibaca, panjang data URL: 327556 karakter
[10:30:16] Mulai upload foto ke server...
[10:30:16] Mengirim data ke API...
[10:30:16] Response status: 200 OK
[10:30:16] Response data: {"ok":true,"rows":1}
[10:30:16] Upload berhasil!
```

### Solusi 4: Periksa PHP Error Log

Buka file error log PHP:
```
C:\xampp\php\logs\php_error_log  (Windows)
/var/log/php_errors.log           (Linux)
```

Cari error yang mengandung "SIPELOK Foto":
```
[15-Jan-2024 10:30:16] SIPELOK Foto: Memproses data URL untuk ID abc123, panjang: 327556
[15-Jan-2024 10:30:16] SIPELOK Foto: Berhasil decode base64, ukuran: 245670 bytes
[15-Jan-2024 10:30:16] SIPELOK Foto: Menyimpan ke: C:\xampp\htdocs\sipelok\api\uploads/abc123_masuk.jpg
[15-Jan-2024 10:30:16] SIPELOK Foto: Berhasil menyimpan file: C:\xampp\htdocs\sipelok\api\uploads/abc123_masuk.jpg (245670 bytes)
```

**Error yang Mungkin Muncul:**

```
SIPELOK Foto: Folder uploads tidak ada, mencoba membuat: C:\xampp\htdocs\sipelok\api\uploads
SIPELOK Foto: GAGAL membuat folder uploads: C:\xampp\htdocs\sipelok\api\uploads
```
→ **Solusi**: Buat folder manual dan set permission

```
SIPELOK Foto: Folder uploads tidak writable: C:\xampp\htdocs\sipelok\api\uploads
```
→ **Solusi**: Set permission folder (lihat Solusi 1)

```
SIPELOK Foto: GAGAL menyimpan file: C:\xampp\htdocs\sipelok\api\uploads/abc123_masuk.jpg
```
→ **Solusi**: Periksa disk space dan permission

### Solusi 5: Periksa Database

Buka phpMyAdmin dan periksa struktur tabel `presensi`:

```sql
DESCRIBE presensi;
```

Pastikan kolom `foto_masuk` dan `foto_keluar` memiliki tipe `VARCHAR(255)` atau lebih besar:

```sql
ALTER TABLE presensi MODIFY foto_masuk VARCHAR(500);
ALTER TABLE presensi MODIFY foto_keluar VARCHAR(500);
```

### Solusi 6: Test Manual dengan cURL

Jika Anda memiliki cURL, test upload manual:

```bash
# Buat file test.json
cat > test.json << EOF
[{
  "id": "test_manual_123",
  "date": "2024-01-15",
  "shift": 1,
  "petugasId": "test_petugas",
  "nama": "Test User",
  "masuk": "2024-01-15T08:00:00.000Z",
  "keluar": null,
  "fotoMasuk": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
  "fotoKeluar": null
}]
EOF

# Upload ke API
curl -X POST "http://localhost/sipelok/api/api.php?action=save&table=records" \
  -H "Content-Type: application/json" \
  -H "X-Sipelok-Key: sipelok-konawe-2024" \
  -d @test.json
```

## 🧪 Checklist Troubleshooting

- [ ] Folder `api/uploads/` ada
- [ ] Folder `api/uploads/` memiliki permission write
- [ ] File `api/api.php` adalah versi terbaru (dengan logging)
- [ ] Database tabel `presensi` memiliki kolom `foto_masuk` dan `foto_keluar`
- [ ] Test upload via `test-upload.html` berhasil
- [ ] PHP error log tidak menunjukkan error "SIPELOK Foto"
- [ ] File foto muncul di folder `api/uploads/`
- [ ] Path foto tersimpan di database (bukan data URL)

## 📊 Debugging Step-by-Step

### Step 1: Test Halaman Test Upload
```
1. Buka: http://localhost/sipelok/test-upload.html
2. Ambil foto
3. Upload
4. Lihat log
```

### Step 2: Periksa PHP Error Log
```
1. Buka: C:\xampp\php\logs\php_error_log
2. Cari: "SIPELOK Foto"
3. Lihat error terakhir
```

### Step 3: Periksa Folder Uploads
```
1. Buka: C:\xampp\htdocs\sipelok\api\uploads\
2. Apakah ada file .jpg?
3. Jika ada, berapa ukurannya?
```

### Step 4: Periksa Database
```sql
-- Cek apakah path foto tersimpan
SELECT id, nama, foto_masuk, foto_keluar 
FROM presensi 
ORDER BY masuk DESC 
LIMIT 10;

-- Jika foto_masuk berisi "data:image/..." berarti upload gagal
-- Jika foto_masuk berisi "api/uploads/xxx.jpg" berarti upload berhasil
```

### Step 5: Test Akses File Foto
```
1. Ambil path dari database, misal: api/uploads/abc123_masuk.jpg
2. Buka di browser: http://localhost/sipelok/api/uploads/abc123_masuk.jpg
3. Apakah foto muncul?
```

## 🔧 Perbaikan Otomatis

Jika semua cara di atas gagal, jalankan script perbaikan:

1. Buka `test-upload.html`
2. Klik "Periksa Folder"
3. Jika folder tidak ada, buat manual
4. Upload foto test
5. Lihat log untuk detail error

## 📞 Jika Masih Bermasalah

Kumpulkan informasi berikut:

1. **Screenshot** halaman `test-upload.html` setelah upload
2. **Screenshot** PHP error log (baris terakhir)
3. **Screenshot** folder `api/uploads/` (isi folder)
4. **Query SQL**: `SELECT id, foto_masuk FROM presensi ORDER BY masuk DESC LIMIT 5;`
5. **Browser Console** (F12 → Console) saat upload

Kirim informasi di atas ke developer untuk analisis lebih lanjut.

## 💡 Tips

### Ukuran Foto
- Foto dari kamera HP biasanya 2-5 MB
- Sistem otomatis mengkompres menjadi ~200-500 KB
- Jika masih terlalu besar, periksa fungsi `kecilkanFoto()` di `util.js`

### Format Foto
- Sistem menerima: JPEG, PNG, WebP
- Disarankan: JPEG (ukuran lebih kecil)
- Format output: JPEG dengan kualitas 72%

### Browser Support
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browser: Full support dengan `capture="user"`

### Performance
- Upload 1 foto: ~1-3 detik
- Upload 10 foto: ~10-30 detik
- Jika lambat, periksa koneksi network dan ukuran foto

---

**Catatan**: Sistem sudah dilengkapi dengan logging detail di `api.php`. Setiap operasi upload foto akan tercatat di PHP error log. Gunakan log ini untuk mendiagnosis masalah.
