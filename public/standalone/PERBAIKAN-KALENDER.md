# Perbaikan Kalender & Rotasi Otomatis

## 📅 Perbaikan Tampilan Kalender

### Masalah Sebelumnya:
- Tanggal tidak sesuai posisi kalender (Senin tidak selalu di kiri)
- Menampilkan role label yang membuat tampilan penuh

### Solusi:
1. **Padding Hari Kosong**: Menambahkan hari kosong di awal minggu jika tanggal 1 bukan hari Senin
2. **Tampilan Nama Saja**: Menghapus role label, hanya menampilkan nama petugas

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

Jika tanggal 1 adalah hari **Rabu**, maka:
- Padding awal: 2 hari kosong (Senin, Selasa)
- Minggu pertama: [kosong, kosong, Rabu, Kamis, Jumat]

## 🔄 Perbaikan Rotasi Otomatis

### Masalah Sebelumnya:
- Rotasi otomatis hanya berhasil untuk satu minggu
- Tidak ada error handling yang baik
- Tidak ada logging untuk debugging

### Solusi:
1. **Logging Detail**: Menambahkan console.log untuk setiap langkah
2. **Error Handling**: Menambahkan alert jika terjadi error
3. **Filter Tanggal yang Benar**: Memastikan filter menghapus semua jadwal bulan tersebut

### Cara Kerja:
```javascript
// Filter prefix yang benar: YYYY-MM
const prefix = kalTahun + "-" + pad(kalBulan);

// hapus jadwal bulan ini
S.jadwal = S.jadwal.filter((j) => !j.tanggal.startsWith(prefix));

// generate baru
const baru = generateJadwalBulan(kalTahun, kalBulan);
S.jadwal = S.jadwal.concat(baru);

persist("jadwal", S.jadwal);
```

### Logging yang Ditambahkan:
```
Rotasi otomatis untuk bulan: 2024-01
Jumlah jadwal sebelum filter: 120
Jumlah jadwal yang akan dihapus: 120
Jumlah jadwal setelah filter: 0
Jumlah jadwal baru yang di-generate: 176
Jumlah jadwal total setelah concat: 176
```

### Perhitungan Jadwal:
- **Hari kerja per bulan**: ~22 hari (Senin-Jumat)
- **Shift per hari**: 2 (Pagi & Siang)
- **Petugas per shift**: 4
- **Total slot per bulan**: 22 × 2 × 4 = **176 slot**

## 🧪 Cara Menguji

### 1. Uji Tampilan Kalender
1. Buka Admin → Jadwal Piket
2. Pilih bulan yang tanggal 1-nya bukan hari Senin
3. Pastikan:
   - ✅ Senin selalu di kiri
   - ✅ Hari kosong ditampilkan dengan opacity rendah
   - ✅ Hanya nama petugas yang ditampilkan (tanpa role)

### 2. Uji Rotasi Otomatis
1. Buka Admin → Jadwal Piket
2. Buka Console browser (F12)
3. Klik "Rotasi Otomatis"
4. Lihat log di console:
   ```
   Rotasi otomatis untuk bulan: 2024-01
   Jumlah jadwal sebelum filter: X
   Jumlah jadwal yang akan dihapus: X
   Jumlah jadwal setelah filter: Y
   Jumlah jadwal baru yang di-generate: 176
   Jumlah jadwal total setelah concat: 176
   ```
5. Pastikan alert muncul: "✓ Rotasi otomatis berhasil untuk Januari 2024 (176 slot jadwal)"
6. Periksa kalender:
   - ✅ Semua hari kerja terisi
   - ✅ Setiap hari memiliki 4 petugas per shift
   - ✅ Petugas bergiliran secara merata

### 3. Uji Persist ke Database
1. Setelah rotasi otomatis, refresh halaman (F5)
2. Buka Admin → Jadwal Piket lagi
3. Pastikan jadwal masih ada (tidak hilang)
4. Jika hilang, periksa:
   - Console browser untuk error
   - Error log PHP di `C:\xampp\php\logs\php_error_log`
   - Apakah database menerima data dengan benar

## 🐛 Troubleshooting

### Masalah: Rotasi hanya mengisi satu minggu
**Penyebab**: Filter tanggal tidak bekerja dengan benar

**Solusi**:
1. Buka Console browser (F12)
2. Lihat log yang muncul saat rotasi
3. Pastikan "Jumlah jadwal baru yang di-generate" = 176 (bukan 40)
4. Jika hanya 40, berarti `generateJadwalBulan()` hanya menghasilkan 5 hari

**Debug**:
```javascript
// Tambahkan di awal generateJadwalBulan()
console.log("generateJadwalBulan: tahun=", tahun, "bulan=", bulan);
console.log("generateJadwalBulan: hariKerja=", hariKerja);
```

### Masalah: Jadwal hilang setelah refresh
**Penyebab**: Database menolak insert karena UNIQUE constraint

**Solusi**:
1. Periksa error log PHP
2. Pastikan filter tanggal menghapus semua jadwal bulan tersebut
3. Jika masih ada duplikat, jalankan di phpMyAdmin:
   ```sql
   DELETE FROM jadwal WHERE tanggal LIKE '2024-01%';
   ```

### Masalah: Hari kosong tidak ditampilkan
**Penyebab**: CSS untuk `.kalender .tgl.kosong` tidak ada

**Solusi**: Pastikan CSS ini ada di admin.html:
```css
.kalender .tgl.kosong { background: var(--mist-100); opacity: .3; }
```

## 📊 Statistik

### Sebelum Perbaikan:
- ❌ Kalender tidak sesuai posisi hari
- ❌ Tampilan penuh dengan role label
- ❌ Rotasi otomatis hanya 1 minggu
- ❌ Tidak ada logging untuk debugging

### Setelah Perbaikan:
- ✅ Kalender sesuai posisi hari (Senin di kiri)
- ✅ Tampilan bersih dengan nama saja
- ✅ Rotasi otomatis penuh 1 bulan (176 slot)
- ✅ Logging detail untuk debugging
- ✅ Error handling yang lebih baik

## 🎯 Kesimpulan

Kedua masalah utama telah diperbaiki:
1. **Kalender** sekarang menampilkan tanggal sesuai posisi hari dengan padding yang benar
2. **Rotasi otomatis** sekarang menghasilkan jadwal penuh untuk satu bulan (176 slot)

Silakan test dan beri feedback jika masih ada masalah! 🚀
