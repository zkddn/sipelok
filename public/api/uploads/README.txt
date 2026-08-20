SIPELOK — folder foto atribut petugas.

api.php menyimpan foto presensi di folder ini dengan nama:
  {id-presensi}_masuk.jpg   dan   {id-presensi}_keluar.jpg

Pastikan folder ini DAPAT DITULISI oleh Apache/PHP:
  - Linux  : chmod -R 775 api/uploads && chown -R www-data api/uploads
  - XAMPP  : biasanya sudah dapat ditulis secara otomatis.

Foto lama aman dihapus kapan saja; rekap tetap menampilkan data jam.
