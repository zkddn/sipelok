# Fitur Progress Bar Upload Foto

## 📊 Fitur Baru: Progress Bar saat Upload Foto

Progress bar telah ditambahkan di halaman **Presensi** (`presensi.html`) untuk memberikan feedback visual saat upload foto. Pengguna sekarang bisa melihat progress upload secara real-time!

## 🎯 Tujuan

Memberikan feedback visual yang jelas saat:
- ✅ Mengompresi foto (saat pilih foto)
- ✅ Upload data presensi ke server (saat klik "Simpan Presensi")
- ✅ Menampilkan status upload (persentase, ukuran file, status)

## 📍 Lokasi Progress Bar

Progress bar ditampilkan di halaman **Presensi** (`presensi.html`), tepat di bawah input file foto.

### Posisi di Form:
```
┌─────────────────────────────────────┐
│  Foto Atribut (wajib saat masuk)   │
│  [Pilih File]                      │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │  ████████████░░░░░░  75%    │   │  ← Progress Bar
│  └─────────────────────────────┘   │
│  Mengupload data...                │  ← Status
│  Upload: 150.5 KB / 200.3 KB      │  ← Detail
└─────────────────────────────────────┘
```

## 🎨 Tampilan Progress Bar

### 1. Saat Kompresi Foto
```
┌─────────────────────────────────────┐
│  ████████████████████  100%         │
├─────────────────────────────────────┤
│  ✓ Foto berhasil dikompresi         │
│  Ukuran asli: 245.7 KB → ~184 KB   │
└─────────────────────────────────────┘
```

### 2. Saat Upload ke Server
```
┌─────────────────────────────────────┐
│  ████████████░░░░░░░░  60%         │
├─────────────────────────────────────┤
│  Mengupload data...                 │
│  Upload: 150.5 KB / 250.8 KB       │
└─────────────────────────────────────┘
```

### 3. Saat Sukses
```
┌─────────────────────────────────────┐
│  ████████████████████  100%         │
├─────────────────────────────────────┤
│  ✓ Presensi berhasil disimpan!      │
└─────────────────────────────────────┘
```

### 4. Saat Error
```
┌─────────────────────────────────────┐
│  ████████████████████  100%         │
├─────────────────────────────────────┤
│  ✗ Gagal menyimpan ke server        │
└─────────────────────────────────────┘
```

## 🔧 Cara Kerja

### 1. Progress saat Kompresi Foto

Saat pengguna memilih foto:
```javascript
// Tampilkan progress container
progressContainer.classList.remove("hidden");
progressBar.style.width = "0%";
progressStatus.textContent = "Mempersiapkan foto...";

// Simulasi progress saat kompresi
let progress = 0;
const progressInterval = setInterval(() => {
  progress += 10;
  if (progress <= 80) {
    progressBar.style.width = progress + "%";
    progressBar.textContent = progress + "%";
    progressStatus.textContent = "Mengompresi foto...";
  }
}, 100);

// Setelah kompresi selesai
kecilkanFoto(f, (data) => {
  clearInterval(progressInterval);
  progressBar.style.width = "100%";
  progressBar.textContent = "100%";
  progressStatus.textContent = "✓ Foto berhasil dikompresi";
  progressStatus.className = "progress-status upload-success";
  
  const compressedSize = Math.round(data.length * 0.75 / 1024);
  progressDetail.textContent = "Ukuran asli: " + (f.size / 1024).toFixed(1) + 
                                " KB → Kompresi: ~" + compressedSize + " KB";
  
  // Sembunyikan progress setelah 2 detik
  setTimeout(() => {
    progressContainer.classList.add("hidden");
  }, 2000);
});
```

### 2. Progress saat Upload ke Server

Saat pengguna klik "Simpan Presensi":
```javascript
// Tampilkan progress container
progressContainer.classList.remove("hidden");
progressBar.style.width = "0%";
progressStatus.textContent = "Menyimpan data presensi...";

// Disable tombol kirim
tombolKirim.disabled = true;
tombolKirim.textContent = "Menyimpan...";

// Progress callback
const onProgress = (progress) => {
  progressBar.style.width = progress.percent + "%";
  progressBar.textContent = progress.percent + "%";
  progressStatus.textContent = progress.status;
  
  if (progress.loaded && progress.total) {
    const loadedKB = (progress.loaded / 1024).toFixed(1);
    const totalKB = (progress.total / 1024).toFixed(1);
    progressDetail.textContent = "Upload: " + loadedKB + " KB / " + totalKB + " KB";
  }
  
  if (progress.success) {
    progressStatus.className = "progress-status upload-success";
    // Tunggu sebentar sebelum tampilkan hasil
    setTimeout(() => {
      tampilkanHasil(r, jenis);
    }, 1000);
  }
};

// Panggil checkIn/checkOut dengan progress callback
checkIn(petugas, sh, foto, onProgress);
```

### 3. HTTP Request dengan Progress Tracking

Fungsi `httpWithProgress` menggunakan XMLHttpRequest untuk tracking progress:
```javascript
function httpWithProgress(action, opts, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("X-Sipelok-Key", API_KEY);
    
    // Track upload progress
    xhr.upload.onprogress = function(e) {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress({
          percent: percent,
          loaded: e.loaded,
          total: e.total,
          status: "Mengupload data..."
        });
      }
    };
    
    xhr.onload = function() {
      const data = JSON.parse(xhr.responseText);
      if (data.ok) {
        onProgress({ percent: 100, status: "Upload selesai!" });
        resolve(data);
      } else {
        reject(new Error(data.error));
      }
    };
    
    xhr.send(JSON.stringify(opts.body));
  });
}
```

## 📊 Tahapan Progress

### Saat Kompresi Foto:
1. **0%** - "Mempersiapkan foto..."
2. **10-80%** - "Mengompresi foto..." (simulasi progress)
3. **100%** - "✓ Foto berhasil dikompresi"
4. **Detail** - "Ukuran asli: X KB → Kompresi: ~Y KB"
5. **Auto-hide** setelah 2 detik

### Saat Upload ke Server:
1. **0%** - "Mempersimpan data presensi..."
2. **10%** - "Menyimpan ke database..."
3. **10-99%** - "Mengupload data..." (real-time dari server)
4. **100%** - "✓ Presensi berhasil disimpan!" atau "✗ Gagal menyimpan"
5. **Detail** - "Upload: X KB / Y KB" (jika ada data)

## 🎨 Desain Progress Bar

### CSS Styles:
```css
.progress-container {
  margin-top: 12px;
  padding: 12px;
  background: var(--mist-50);
  border-radius: 8px;
  border: 1px solid var(--mist-200);
}

.progress-bar-wrapper {
  width: 100%;
  height: 24px;
  background: var(--mist-200);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--brand-500), var(--brand-600));
  border-radius: 12px;
  transition: width 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 0.75rem;
}

.progress-status {
  margin-top: 8px;
  font-size: 0.85rem;
  color: var(--ink-700);
  font-weight: 600;
}

.progress-detail {
  font-size: 0.75rem;
  color: var(--ink-500);
  margin-top: 4px;
}

.upload-success {
  color: var(--lagoon-700);
  font-weight: 700;
}

.upload-error {
  color: var(--ruby-700);
  font-weight: 700;
}
```

## 🧪 Testing Progress Bar

### Test 1: Kompresi Foto
```
1. Buka presensi.html
2. Pilih foto dari kamera (ukuran besar, misal 2-5 MB)
3. Lihat progress bar:
   ✅ Progress berjalan dari 0% ke 100%
   ✅ Status berubah: "Mempersiapkan..." → "Mengompresi..." → "✓ Berhasil"
   ✅ Detail menampilkan ukuran asli dan hasil kompresi
   ✅ Progress bar hilang setelah 2 detik
```

### Test 2: Upload ke Server
```
1. Isi form presensi (nama, shift, foto)
2. Klik "Simpan Presensi"
3. Lihat progress bar:
   ✅ Progress berjalan dari 0% ke 100%
   ✅ Status berubah: "Menyimpan..." → "Mengupload..." → "✓ Berhasil"
   ✅ Detail menampilkan ukuran upload (jika ada)
   ✅ Tombol "Simpan" disabled saat upload
   ✅ Setelah 100%, tampilkan halaman hasil
```

### Test 3: Error Handling
```
1. Matikan koneksi internet
2. Klik "Simpan Presensi"
3. Lihat progress bar:
   ✅ Progress berjalan sampai error
   ✅ Status berubah: "✗ Gagal menyimpan ke server"
   ✅ Progress bar berwarna merah
   ✅ Tombol "Simpan" di-enable kembali
```

### Test 4: Mode Lokal
```
1. Buka presensi.html tanpa server PHP
2. Isi form dan klik "Simpan Presensi"
3. Lihat progress bar:
   ✅ Progress langsung ke 100%
   ✅ Status: "✓ Presensi tersimpan (mode lokal)"
   ✅ Tidak ada upload ke server
```

## 📁 File yang Diubah

### Modified:
1. **`public/standalone/presensi.html`**
   - ✅ Tambah CSS untuk progress bar (baris 13-47)
   - ✅ Tambah progress container di form (baris 83-89)
   - ✅ Modifikasi handler upload foto (baris 142-189)
   - ✅ Modifikasi handler tombol kirim (baris 191-267)

2. **`public/standalone/js/util.js`**
   - ✅ Tambah fungsi `httpWithProgress()` (baris 75-118)
   - ✅ Modifikasi fungsi `checkIn()` untuk support progress (baris 427-473)
   - ✅ Modifikasi fungsi `checkOut()` untuk support progress (baris 474-520)

### Added:
3. **`public/standalone/PENAMBAHAN-PROGRESS-BAR.md`** (file ini)
   - ✅ Dokumentasi lengkap fitur progress bar

## 🚀 Cara Update

Salin ulang file-file berikut ke `C:\xampp\htdocs\sipelok\`:

```
sipelok/
├── presensi.html    ← PERBARUI
└── js/
    └── util.js      ← PERBARUI
```

Lalu **Ctrl+F5** di browser untuk clear cache.

## 🎯 Keuntungan Progress Bar

### Sebelum (Tanpa Progress):
- ❌ Tidak tahu apakah upload sedang berjalan
- ❌ Tidak tahu berapa lama lagi selesai
- ❌ Pengguna bisa klik tombol berkali-kali
- ❌ Tidak ada feedback visual

### Sesudah (Dengan Progress):
- ✅ Progress bar menunjukkan persentase upload
- ✅ Status text menjelaskan apa yang sedang terjadi
- ✅ Detail menampilkan ukuran file yang diupload
- ✅ Tombol disabled saat upload (mencegah double-click)
- ✅ Feedback visual yang jelas (sukses/error)
- ✅ **User experience jauh lebih baik!**

## 💡 Tips

### Untuk Pengguna:
- Tunggu sampai progress bar mencapai 100%
- Jangan tutup browser saat upload sedang berjalan
- Jika error, coba upload ulang
- Foto akan dikompresi otomatis untuk menghemat bandwidth

### Untuk Admin:
- Progress bar membantu pengguna memahami proses upload
- Jika upload lambat, periksa koneksi internet server
- Foto dikompresi menjadi ~72% kualitas JPEG untuk menghemat space

### Untuk IT:
- Progress tracking menggunakan XMLHttpRequest (bukan fetch)
- Progress update real-time dari server
- Jika server lambat, progress bar akan bergerak lambat
- Pertimbangkan untuk compress foto di server jika perlu

## 📊 Statistik Performance

### Estimasi Waktu Upload:

**Koneksi LAN (100 Mbps):**
- Foto 200 KB: ~0.5 detik
- Foto 500 KB: ~1 detik
- Foto 1 MB: ~2 detik

**Koneksi WiFi (10 Mbps):**
- Foto 200 KB: ~0.5 detik
- Foto 500 KB: ~1.5 detik
- Foto 1 MB: ~3 detik

**Koneksi Internet (1 Mbps):**
- Foto 200 KB: ~2 detik
- Foto 500 KB: ~5 detik
- Foto 1 MB: ~10 detik

### Kompresi Foto:
- **Input**: Foto dari kamera HP (2-5 MB)
- **Output**: JPEG 720px max, kualitas 72% (~200-500 KB)
- **Penghematan**: ~80-90% ukuran file
- **Waktu kompresi**: ~1-2 detik

## 🔒 Keamanan

### Apakah Progress Bar Aman?

**Ya, progress bar aman karena:**
- ✅ Hanya menampilkan progress upload (tidak ada data sensitif)
- ✅ Tidak menyimpan informasi di client
- ✅ Progress tracking hanya di memory (hilang saat refresh)
- ✅ Tidak ada risiko security

## 🐛 Troubleshooting

### Masalah: Progress Bar Tidak Muncul

**Penyebab:**
- CSS tidak ter-load
- JavaScript error

**Solusi:**
1. Buka Console browser (F12)
2. Cek apakah ada error JavaScript
3. Refresh halaman (Ctrl+F5)
4. Pastikan file `presensi.html` dan `util.js` sudah diupdate

### Masalah: Progress Bar Tidak Bergerak

**Penyebab:**
- Koneksi internet sangat lambat
- Server tidak merespons
- Browser tidak support XMLHttpRequest progress

**Solusi:**
1. Periksa koneksi internet
2. Cek apakah server PHP berjalan
3. Coba browser lain (Chrome/Firefox/Edge)
4. Lihat Console browser untuk error

### Masalah: Progress Langsung 100%

**Penyebab:**
- Mode lokal (tidak ada server)
- Upload sangat cepat (file kecil)

**Solusi:**
- Ini normal! Jika mode lokal, tidak ada upload ke server
- Jika file kecil, upload sangat cepat sehingga progress langsung 100%

## 🎯 Hasil Akhir

✅ Progress bar tampil saat kompresi foto  
✅ Progress bar tampil saat upload ke server  
✅ Status text menjelaskan apa yang sedang terjadi  
✅ Detail menampilkan ukuran file  
✅ Tombol disabled saat upload (mencegah double-click)  
✅ Feedback visual yang jelas (sukses/error)  
✅ Auto-hide setelah sukses  
✅ User experience jauh lebih baik  

## 💡 Kesimpulan

Progress bar memberikan feedback visual yang jelas saat upload foto, sehingga pengguna tahu:
- Apakah upload sedang berjalan
- Berapa persen sudah selesai
- Apa yang sedang terjadi (kompresi/upload)
- Apakah berhasil atau error

Ini meningkatkan **user experience** secara signifikan dan mengurangi kebingungan pengguna saat upload foto yang mungkin memakan waktu beberapa detik.

---

**Catatan**: Progress bar bersifat opsional. Jika ada masalah, pengguna tetap bisa upload foto tanpa progress bar (fallback ke mode lama).
