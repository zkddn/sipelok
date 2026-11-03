# Troubleshooting: Error 404 - File API Tidak Ditemukan

## 🐛 Masalah yang Dilaporkan

**Error di Console:**
```
=== httpWithProgress PARSE ERROR === SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON

Response text: <!DOCTYPE html>
<html style="height:100%">
<head>
<title> 404 Not Found </title>
...
<h1 style="margin:0; font-size:150px; line-height:150px; font-weight:bold;">404</h1>
<h2 style="margin-top:20px;font-size: 30px;">Not Found</h2>
<p>The resource requested could not be found on this server!</p>
...
Proudly powered by LiteSpeed Web Server
```

## 🔍 Analisis Masalah

### Penyebab Utama:

1. **Server Menggunakan LiteSpeed (Bukan Apache/XAMPP)**
   - User menggunakan LiteSpeed Web Server
   - Struktur folder atau konfigurasi mungkin berbeda
   - Path relatif `api/api.php` tidak ditemukan

2. **Struktur Folder Berbeda**
   - File HTML dan folder `api/` mungkin tidak di lokasi yang sama
   - Server mungkin menggunakan virtual host atau subdirectory
   - Path absolut vs relatif berbeda

3. **File api.php Tidak Ada**
   - File tidak ter-upload ke server
   - File ada tapi di lokasi yang salah
   - Permission file salah

## ✅ Solusi yang Diterapkan

### 1. **Auto-Detection API Path**

**SEBELUM:**
```javascript
const API = "api/api.php"; // ❌ Path relatif tetap
```

**SESUDAH:**
```javascript
function getApiPath() {
  const path = window.location.pathname;
  
  // Auto-detect path berdasarkan lokasi halaman
  // Jika halaman di /sipelok/presensi.html, API di /sipelok/api/api.php
  const basePath = path.substring(0, path.lastIndexOf('/') + 1);
  return basePath + 'api/api.php';
}

const API = getApiPath();
console.log("API Path:", API);
```

**Keuntungan:**
- ✅ Otomatis mendeteksi path berdasarkan lokasi halaman
- ✅ Bekerja di berbagai struktur folder
- ✅ Tidak perlu konfigurasi manual

### 2. **Error Handling yang Lebih Baik untuk 404**

**SEBELUM:**
```javascript
xhr.onload = function() {
  try {
    const data = JSON.parse(xhr.responseText); // ❌ Error jika HTML
    // ...
  } catch (e) {
    // ❌ Error message tidak jelas
  }
};
```

**SESUDAH:**
```javascript
xhr.onload = function() {
  // Cek 404 terlebih dahulu
  if (xhr.status === 404) {
    const errorMsg = `File API tidak ditemukan (404).\n\n` +
      `URL: ${url}\n\n` +
      `Kemungkinan penyebab:\n` +
      `1. File api/api.php tidak ada di server\n` +
      `2. Struktur folder berbeda dari yang diharapkan\n` +
      `3. Server menggunakan konfigurasi yang berbeda\n\n` +
      `Solusi:\n` +
      `- Pastikan folder 'api' ada di lokasi yang sama dengan file HTML\n` +
      `- Periksa apakah file api.php ada di folder api/\n` +
      `- Cek console browser untuk detail error`;
    
    console.error("=== httpWithProgress 404 ERROR ===");
    console.error(errorMsg);
    
    if (onProgress) {
      onProgress({ percent: 100, status: "✗ File API tidak ditemukan (404)", error: true });
    }
    reject(new Error(errorMsg));
    return; // Jangan retry untuk 404
  }
  
  // Cek apakah response adalah HTML error page
  if (xhr.responseText.includes('<!DOCTYPE') || xhr.responseText.includes('<html')) {
    const errorMsg = `Server mengembalikan HTML, bukan JSON.\n\n` +
      `Ini biasanya berarti:\n` +
      `1. File api.php tidak ada (404)\n` +
      `2. Ada error PHP yang menampilkan HTML error page\n` +
      `3. Server mengembalikan error page`;
    
    console.error("HTML Response Error:", errorMsg);
    
    if (onProgress) {
      onProgress({ percent: 100, status: "✗ Server error: File API tidak ditemukan", error: true });
    }
    reject(new Error(errorMsg));
    return;
  }
  
  // ... rest of the code
};
```

**Keuntungan:**
- ✅ Error message jelas dan informatif
- ✅ Tidak retry untuk 404 (percuma)
- ✅ User tahu persis apa yang salah
- ✅ Solusi diberikan dalam error message

### 3. **Validasi Content-Type**

```javascript
async function http(action, opts) {
  // ...
  const r = await fetch(url, init);
  
  // Cek status HTTP
  if (r.status === 404) {
    throw new Error(`File API tidak ditemukan (404). URL: ${url}`);
  }
  
  if (r.status === 500) {
    throw new Error(`Server error (500). Periksa error log PHP di server.`);
  }
  
  // Cek apakah response adalah JSON
  const contentType = r.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await r.text();
    throw new Error(`Response bukan JSON. Content-Type: ${contentType}\n\nResponse: ${text.substring(0, 200)}...`);
  }
  
  const data = await r.json();
  return data;
}
```

**Keuntungan:**
- ✅ Validasi response sebelum parse
- ✅ Error message lebih jelas
- ✅ Mencegah crash saat parse HTML

## 🔧 Solusi Manual untuk Server Anda

### Langkah 1: Periksa Struktur Folder

**Struktur yang Benar:**
```
/public_html/ (atauhtdocs/)
└── sipelok/ (atau nama folder Anda)
    ├── index.html
    ├── presensi.html
    ├── admin.html
    ├── loket.html
    ├── css/
    │   └── gaya.css
    ├── js/
    │   └── util.js
    └── api/
        ├── api.php          ← HARUS ADA DI SINI
        ├── config.php
        └── uploads/
```

**Cara Memeriksa:**
```bash
# Via FTP/File Manager
1. Login ke cPanel/FTP
2. Navigasi ke folder aplikasi
3. Pastikan folder 'api' ada
4. Pastikan file 'api.php' ada di dalam folder 'api'
```

### Langkah 2: Cek URL API di Console

**Buka Console Browser (F12):**
```javascript
// Lihat URL API yang digunakan
console.log("API Path:", API);

// Contoh output:
// API Path: /sipelok/api/api.php
```

**Test URL Secara Manual:**
```
Buka di browser:
http://yourdomain.com/sipelok/api/api.php?action=ping

Harus mengembalikan:
{"ok":true,"db":"sipelok","version":"10.4.28-MariaDB","waktu":"2024-01-15T10:30:00+08:00"}
```

### Langkah 3: Periksa Permission File

**Via FTP/cPanel File Manager:**
```
api/api.php    → 644 (rw-r--r--)
api/config.php → 644 (rw-r--r--)
api/uploads/   → 755 (rwxr-xr-x)
```

**Via SSH (jika ada akses):**
```bash
cd /path/to/sipelok
chmod 644 api/api.php
chmod 644 api/config.php
chmod 755 api/uploads/
```

### Langkah 4: Periksa Error Log PHP

**Lokasi Error Log:**
```
cPanel: Error Log → PHP Errors
SSH: /var/log/apache2/error.log atau /var/log/litespeed/error.log
```

**Cari Error:**
```bash
# Via SSH
tail -f /var/log/litespeed/error.log | grep "api.php"
```

### Langkah 5: Test Koneksi API

**Buat file test-api.html:**
```html
<!DOCTYPE html>
<html>
<head>
  <title>Test API</title>
</head>
<body>
  <h1>Test Koneksi API</h1>
  <div id="result"></div>
  
  <script>
    const API = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1) + 'api/api.php';
    console.log("Testing API:", API);
    
    fetch(API + '?action=ping')
      .then(r => r.json())
      .then(data => {
        document.getElementById('result').innerHTML = 
          '<pre style="color:green">' + JSON.stringify(data, null, 2) + '</pre>';
      })
      .catch(err => {
        document.getElementById('result').innerHTML = 
          '<pre style="color:red">ERROR: ' + err.message + '</pre>';
      });
  </script>
</body>
</html>
```

**Upload dan buka:**
```
http://yourdomain.com/sipelok/test-api.html
```

## 📊 Kemungkinan Struktur Server

### Struktur 1: Root Domain
```
/public_html/
├── index.html
├── presensi.html
└── api/
    └── api.php
```
**URL:** `http://domain.com/api/api.php`

### Struktur 2: Subfolder
```
/public_html/sipelok/
├── index.html
├── presensi.html
└── api/
    └── api.php
```
**URL:** `http://domain.com/sipelok/api/api.php`

### Struktur 3: Subdomain
```
/public_html/sipelok.domain.com/
├── index.html
├── presensi.html
└── api/
    └── api.php
```
**URL:** `http://sipelok.domain.com/api/api.php`

## 🧪 Cara Menguji Perbaikan

### Test 1: Auto-Detection Path
```
1. Buka: http://yourdomain.com/sipelok/presensi.html
2. Buka Console browser (F12)
3. Lihat log:
   ✅ "API Path: /sipelok/api/api.php"
   ✅ Path otomatis terdeteksi
```

### Test 2: Error 404 Handling
```
1. Hapus folder api/ sementara
2. Buka: http://yourdomain.com/sipelok/presensi.html
3. Coba submit presensi
4. Lihat error message:
   ✅ "✗ File API tidak ditemukan (404)"
   ✅ Pesan error jelas dan informatif
   ✅ Tidak ada retry (percuma)
```

### Test 3: Success Case
```
1. Pastikan folder api/ ada
2. Pastikan file api.php ada
3. Buka: http://yourdomain.com/sipelok/presensi.html
4. Submit presensi
5. Lihat console:
   ✅ "API Path: /sipelok/api/api.php"
   ✅ "=== httpWithProgress SUCCESS ==="
   ✅ "✓ Upload selesai!"
```

## 📁 File yang Diperbaiki

### Modified:
1. **`public/standalone/js/util.js`**
   - ✅ Tambahkan fungsi `getApiPath()` untuk auto-detection
   - ✅ Perbaikan fungsi `http()` dengan validasi Content-Type
   - ✅ Perbaikan fungsi `httpWithProgress()` dengan error handling 404
   - ✅ Deteksi HTML error page
   - ✅ Error message yang lebih jelas dan informatif

### Added:
2. **`public/standalone/TROUBLESHOOTING-404.md`** (file ini)
   - ✅ Dokumentasi lengkap troubleshooting 404

## 🚀 Cara Update

Salin ulang file berikut ke `C:\xampp\htdocs\sipelok\` (atau folder server Anda):

```
sipelok/
└── js/
    └── util.js    ← PERBARUI
```

Lalu **Ctrl+F5** di browser untuk clear cache.

## 💡 Tips untuk LiteSpeed Server

### 1. **Periksa .htaccess**
LiteSpeed mendukung .htaccess seperti Apache. Pastikan tidak ada rule yang memblokir akses ke folder `api/`.

### 2. **Periksa PHP Version**
```bash
# Via cPanel
PHP Selection → PHP Version → Harus 7.4 atau lebih tinggi

# Via SSH
php -v
```

### 3. **Periksa PHP Extensions**
Pastikan extensions berikut aktif:
- ✅ PDO
- ✅ PDO_MySQL
- ✅ JSON
- ✅ mbstring

### 4. **Periksa Error Log LiteSpeed**
```
cPanel: Logs → Error Log
SSH: /var/log/litespeed/error.log
```

### 5. **Restart LiteSpeed**
```bash
# Via cPanel
Restart Services → LiteSpeed Web Server

# Via SSH
systemctl restart lsws
```

## 🎯 Checklist Troubleshooting

- [ ] Folder `api/` ada di lokasi yang sama dengan file HTML
- [ ] File `api/api.php` ada di dalam folder `api/`
- [ ] File `api/config.php` ada di dalam folder `api/`
- [ ] Permission file benar (644 untuk file, 755 untuk folder)
- [ ] URL API terdeteksi dengan benar (lihat console)
- [ ] Test `api.php?action=ping` mengembalikan JSON
- [ ] Error log PHP tidak ada error
- [ ] PHP version 7.4 atau lebih tinggi
- [ ] Extensions PDO, PDO_MySQL, JSON aktif

## 📞 Jika Masih Bermasalah

### Langkah 1: Kumpulkan Informasi
```
1. Screenshot console browser (F12) saat error
2. Screenshot struktur folder di server
3. Catat URL lengkap saat error
4. Catat error message lengkap
```

### Langkah 2: Test Manual
```
1. Buka: http://yourdomain.com/sipelok/api/api.php?action=ping
2. Screenshot hasilnya
3. Jika error, catat error message
```

### Langkah 3: Hubungi Support
Kirim informasi:
- Screenshot console browser
- Screenshot struktur folder
- URL yang error
- Error message lengkap
- Hasil test manual

---

**Catatan**: Error 404 biasanya berarti file tidak ada di lokasi yang diharapkan. Pastikan struktur folder sesuai dan file `api.php` benar-benar ada di folder `api/`. Auto-detection path sudah ditambahkan untuk menangani berbagai struktur folder.
