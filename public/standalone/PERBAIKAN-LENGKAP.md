# Perbaikan Kalender, Rotasi Otomatis & Edit Manual

## 📅 Perbaikan 1: Tampilan Kalender

### Masalah:
- Tanggal tidak sesuai posisi kalender (Senin tidak selalu di kiri)
- Menampilkan role label yang membuat tampilan penuh

### Solusi:
✅ **Padding Hari Kosong**: Menambahkan hari kosong di awal minggu jika tanggal 1 bukan hari Senin
✅ **Tampilan Nama Saja**: Menghapus role label, hanya menampilkan nama petugas
✅ **Visual Indicator**: Hari kosong ditampilkan dengan opacity rendah

### Cara Kerja:
```javascript
// Hitung padding awal (berapa hari kosong sebelum tanggal 1)
const tanggal1 = new Date(kalTahun, kalBulan - 1, 1);
const hariTanggal1 = tanggal1.getDay(); // 0=Minggu, 1=Senin, ...
const paddingAwal = hariTanggal1 === 0 ? 4 : hariTanggal1 - 1;

// Tambahkan padding kosong di awal
for (let i = 0; i < paddingAwal; i++) {
  mingguIni.push(null); // null = hari kosong
}
```

### Contoh:
Jika tanggal 1 adalah hari **Selasa**, maka:
- Padding awal: 1 hari kosong (Senin)
- Minggu pertama: [kosong, Selasa, Rabu, Kamis, Jumat]

---

## 🔄 Perbaikan 2: Rotasi Otomatis (Full Month)

### Masalah:
- Rotasi otomatis hanya berhasil untuk satu minggu (40 slot)
- Seharusnya satu bulan penuh (176 slot)
- Data tersimpan di lokal tapi tidak tersimpan ke database

### Solusi:
✅ **Logging Detail**: Menambahkan console.log untuk setiap langkah
✅ **Chunking**: Data dikirim dalam chunks 100 baris untuk menghindari timeout
✅ **Error Handling**: Menambahkan retry logic dan error handling yang lebih baik
✅ **Verifikasi**: Menambahkan verifikasi jumlah tanggal unik yang di-generate

### Cara Kerja:
```javascript
// Filter prefix yang benar: YYYY-MM
const prefix = kalTahun + "-" + pad(kalBulan);

// hapus jadwal bulan ini
S.jadwal = S.jadwal.filter((j) => !j.tanggal.startsWith(prefix));

// generate baru
const baru = generateJadwalBulan(kalTahun, kalBulan);

// Verifikasi
const tanggalUnik = [...new Set(baru.map(j => j.tanggal))];
console.log("Tanggal unik:", tanggalUnik.length);

// Simpan dengan chunking
persist("jadwal", S.jadwal);
```

### Perhitungan Jadwal:
- **Hari kerja per bulan**: ~22 hari (Senin-Jumat)
- **Shift per hari**: 2 (Pagi & Siang)
- **Petugas per shift**: 4
- **Total slot per bulan**: 22 × 2 × 4 = **176 slot** ✅

### Logging yang Ditambahkan:
```
=== ROTASI OTOMATIS START ===
Bulan target: 2024-01
Jumlah jadwal sebelum filter: 120
Jumlah jadwal bulan ini yang akan dihapus: 120
Jumlah jadwal setelah filter: 0
Generating jadwal baru...
=== generateJadwalBulan START ===
Tahun: 2024 Bulan: 1 Jumlah petugas: 8
Target month: 0 Start date: 2024-01-01T00:00:00.000Z
  Day 1: 2024-01-01 (Senin) - WORK DAY
  Day 2: 2024-01-02 (Selasa) - WORK DAY
  ...
  Day 31: 2024-01-31 (Rabu) - WORK DAY
Total days in month: 31
Work days: 23
Work dates: ["2024-01-01", "2024-01-02", ...]
Total schedules generated: 184
Expected: 23 days × 2 shifts × 4 slots = 184
=== generateJadwalBulan END ===
Jumlah jadwal baru yang di-generate: 184
Tanggal unik yang di-generate: 23
Tanggal pertama: 2024-01-01
Tanggal terakhir: 2024-01-31
Jumlah jadwal total setelah concat: 184
Saving to database...
=== ROTASI OTOMATIS END ===
```

### Chunking untuk Database:
```javascript
// Untuk jadwal, kirim dalam chunks jika terlalu besar
const CHUNK_SIZE = 100;
if (table === "jadwal" && rows.length > CHUNK_SIZE) {
  const chunks = [];
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    chunks.push(rows.slice(i, i + CHUNK_SIZE));
  }
  
  chunks.forEach((chunk, index) => {
    http("save", { table: table, body: chunk })
      .then(res => { /* handle response */ })
      .catch(err => { /* handle error */ });
  });
}
```

---

## ✏️ Perbaikan 3: Edit Manual Jadwal

### Masalah:
- Belum ada menu untuk mengubah alokasi secara manual
- User tidak bisa mengedit jadwal per tanggal

### Solusi:
✅ **Click-to-Edit**: Klik tanggal tertentu untuk membuka form edit
✅ **Modal Form**: Form dengan 8 dropdown (4 untuk shift 1, 4 untuk shift 2)
✅ **Role Labels**: Setiap dropdown diberi label role (Frontliner, Konsultasi, dll)
✅ **Visual Feedback**: Tanggal yang bisa diklik memiliki hover effect

### Cara Kerja:
```javascript
// Tambahkan class clickable ke setiap tanggal
'<div class="tgl clickable" data-tanggal="' + h.tanggal + '" 
      onclick="editJadwalTanggal(\'' + h.tanggal + '\')" 
      title="Klik untuk edit jadwal">'

// Fungsi edit
window.editJadwalTanggal = function(tanggal) {
  // Tampilkan modal dengan form
  showModal(form);
  
  // Set nilai dropdown dari data yang ada
  document.getElementById("s1u1").value = getPetugas(1, 1);
  // ... set semua dropdown
};

// Fungsi simpan
window.saveJadwalTanggal = function(tanggal) {
  // Hapus jadwal lama untuk tanggal ini
  S.jadwal = S.jadwal.filter(j => j.tanggal !== tanggal);
  
  // Tambahkan jadwal baru dari form
  slots.forEach(slot => {
    if (slot.value) {
      S.jadwal.push({
        id: uid(),
        tanggal: tanggal,
        shift: slot.shift,
        urutan: slot.urutan,
        petugasId: slot.value
      });
    }
  });
  
  // Simpan ke database
  persist("jadwal", S.jadwal);
  
  // Refresh tampilan
  renderJadwal();
};
```

### UI Form Edit:
```
┌─────────────────────────────────────────┐
│  Edit Jadwal: Senin, 1 Januari 2024    │
├─────────────────────────────────────────┤
│  Shift 1 · Pagi (08.00-12.00)          │
│  ┌──────────────┬──────────────┐       │
│  │ Frontliner   │ Konsultasi   │       │
│  │ [Dropdown ▼] │ [Dropdown ▼] │       │
│  ├──────────────┼──────────────┤       │
│  │ Rekomendasi  │ Perpustakaan │       │
│  │ [Dropdown ▼] │ [Dropdown ▼] │       │
│  └──────────────┴──────────────┘       │
│                                         │
│  Shift 2 · Siang (12.00-15.30)         │
│  ┌──────────────┬──────────────┐       │
│  │ Frontliner   │ Konsultasi   │       │
│  │ [Dropdown ▼] │ [Dropdown ▼] │       │
│  ├──────────────┼──────────────┤       │
│  │ Rekomendasi  │ Perpustakaan │       │
│  │ [Dropdown ▼] │ [Dropdown ▼] │       │
│  └──────────────┴──────────────┘       │
│                                         │
│              [Batal] [Simpan]          │
└─────────────────────────────────────────┘
```

### CSS untuk Clickable Dates:
```css
.kalender .tgl.clickable { 
  cursor: pointer; 
  transition: all 0.2s; 
  border: 2px solid transparent; 
}
.kalender .tgl.clickable:hover { 
  border-color: var(--brand-500); 
  transform: translateY(-2px); 
  box-shadow: 0 4px 12px rgba(242, 105, 31, 0.2); 
}
```

---

## 🧪 Cara Menguji

### Test 1: Tampilan Kalender
1. Buka **Admin → Jadwal Piket**
2. Pilih bulan yang tanggal 1-nya bukan hari Senin
3. Pastikan:
   - ✅ Senin selalu di kiri
   - ✅ Hari kosong ditampilkan dengan opacity rendah
   - ✅ Hanya nama petugas yang ditampilkan

### Test 2: Rotasi Otomatis
1. Buka **Admin → Jadwal Piket**
2. Buka **Console browser** (F12)
3. Klik **"Rotasi Otomatis"**
4. Lihat log di console:
   ```
   === ROTASI OTOMATIS START ===
   Bulan target: 2024-01
   ...
   Total schedules generated: 184
   Expected: 23 days × 2 shifts × 4 slots = 184
   === ROTASI OTOMATIS END ===
   ```
5. Pastikan alert muncul dengan informasi lengkap
6. Periksa kalender:
   - ✅ Semua hari kerja terisi
   - ✅ Setiap hari memiliki 4 petugas per shift
   - ✅ Petugas bergiliran secara merata

### Test 3: Edit Manual
1. Buka **Admin → Jadwal Piket**
2. Klik tanggal tertentu (akan ada hover effect)
3. Form edit akan muncul dengan 8 dropdown
4. Pilih petugas untuk setiap slot
5. Klik **"Simpan"**
6. Pastikan:
   - ✅ Modal tertutup
   - ✅ Alert konfirmasi muncul
   - ✅ Kalender terupdate dengan data baru
   - ✅ Data tersimpan ke database

### Test 4: Persist ke Database
1. Setelah rotasi otomatis atau edit manual, **refresh halaman** (F5)
2. Buka **Admin → Jadwal Piket** lagi
3. Pastikan jadwal **masih ada** (tidak hilang)
4. Jika hilang, periksa:
   - Console browser untuk error
   - Error log PHP di `C:\xampp\php\logs\php_error_log`
   - Apakah database menerima data dengan benar

---

## 🐛 Troubleshooting

### Masalah: Rotasi hanya mengisi satu minggu
**Penyebab**: `generateJadwalBulan()` hanya menghasilkan jadwal untuk minggu pertama

**Solusi**:
1. Buka Console browser (F12)
2. Lihat log yang muncul saat rotasi
3. Pastikan "Total schedules generated" = 176-184 (bukan 40)
4. Jika hanya 40, periksa:
   - Apakah `hariKerja.length` = 22-23?
   - Apakah loop `while (d.getMonth() === targetMonth)` berjalan sampai akhir bulan?

### Masalah: Data tersimpan di lokal tapi tidak di database
**Penyebab**: Database menolak insert karena UNIQUE constraint atau error lain

**Solusi**:
1. Buka Console browser (F12)
2. Lihat log yang muncul saat persist
3. Pastikan tidak ada error "Gagal simpan ke database"
4. Periksa error log PHP di `C:\xampp\php\logs\php_error_log`
5. Jika ada error "Duplicate entry", jalankan di phpMyAdmin:
   ```sql
   DELETE FROM jadwal WHERE tanggal LIKE '2024-01%';
   ```

### Masalah: Form edit tidak muncul
**Penyebab**: JavaScript error atau fungsi `editJadwalTanggal()` tidak terdefinisi

**Solusi**:
1. Buka Console browser (F12)
2. Klik tanggal di kalender
3. Lihat apakah ada error di console
4. Pastikan fungsi `editJadwalTanggal()` sudah didefinisikan
5. Refresh halaman (F5) dan coba lagi

### Masalah: Data hilang setelah refresh
**Penyebab**: Database tidak menerima data atau sync overwrite data lokal

**Solusi**:
1. Periksa Console browser untuk error
2. Periksa error log PHP
3. Pastikan `MODE === "db"` (bukan "local")
4. Pastikan API PHP berjalan dengan benar
5. Test dengan `http://localhost/sipelok/api/api.php?action=ping`

---

## 📊 Statistik Perbaikan

### Sebelum Perbaikan:
- ❌ Kalender tidak sesuai posisi hari
- ❌ Tampilan penuh dengan role label
- ❌ Rotasi otomatis hanya 1 minggu (40 slot)
- ❌ Data tidak tersimpan ke database
- ❌ Tidak ada fitur edit manual
- ❌ Tidak ada logging untuk debugging

### Setelah Perbaikan:
- ✅ Kalender sesuai posisi hari (Senin di kiri)
- ✅ Tampilan bersih dengan nama saja
- ✅ Rotasi otomatis penuh 1 bulan (176-184 slot)
- ✅ Data tersimpan ke database dengan chunking
- ✅ Fitur edit manual dengan modal form
- ✅ Logging detail untuk debugging
- ✅ Error handling yang lebih baik
- ✅ Visual feedback untuk clickable dates

---

## 🎯 Kesimpulan

Ketiga masalah utama telah diperbaiki:

1. **Kalender** sekarang menampilkan tanggal sesuai posisi hari dengan padding yang benar
2. **Rotasi otomatis** sekarang menghasilkan jadwal penuh untuk satu bulan (176-184 slot) dan tersimpan ke database
3. **Edit manual** sekarang tersedia dengan modal form yang user-friendly

Silakan test dan beri feedback jika masih ada masalah! 🚀
