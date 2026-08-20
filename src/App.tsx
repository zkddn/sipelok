import { useEffect, useRef, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

/* muncul saat digulir ke tampilan */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
      { threshold: 0.12 }
    );
    el.querySelectorAll(".reveal").forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);
  return ref;
}

const LOKET = [
  {
    kelas: "a",
    plat: "A",
    href: "standalone/index.html",
    judul: "Beranda & Hub",
    desc: "Papan utama: jam hidup, petugas piket hari ini, pilihan peran, status koneksi MySQL.",
    tag: null as string | null,
  },
  {
    kelas: "b",
    plat: "B",
    href: "standalone/loket.html",
    judul: "Layar Loket · PC Front Office",
    desc: "QR besar untuk discan petugas + feed presensi yang muncul seketika.",
    tag: null as string | null,
  },
  {
    kelas: "c",
    plat: "C",
    href: "standalone/admin.html",
    judul: "Admin & Rekap",
    desc: "Rekap presensi, jadwal piket mingguan, kelola petugas & akun. Masuk: admin / bpskonawe",
    tag: "admin / bpskonawe",
  },
];

const FITUR = [
  ["Dua shift otomatis", "Pagi 08.00–12.00 dan Siang 12.00–16.00, terdeteksi dari jam — tanpa pilih manual."],
  ["Scan QR dari HP petugas", "QR di layar loket memuat alamat presensi; token bisa diperbarui kapan saja."],
  ["Foto kelengkapan atribut", "Bukti rompi & name tag diambil dengan kamera HP saat presensi masuk."],
  ["Jadwal piket mingguan", "Atur Senin–Sabtu per shift, rotasi otomatis, dan lihat siapa yang piket hari ini."],
  ["Rekap, ekspor & cetak", "Filter tanggal/shift, statistik kehadiran, ekspor CSV, dan cetak rekap resmi."],
  ["Akun & peran", "Admin penuh atau lihat-saja; kata sandi tersimpan sebagai hash, bukan teks."],
];

const LANGKAH = [
  ["Pasang XAMPP", "Jalankan modul Apache dan MySQL."],
  ["Salin folder sipelok", "Taruh di C:\\xampp\\htdocs\\sipelok"],
  ["Impor database", "phpMyAdmin → Import → database/sipelok.sql"],
  ["Buka aplikasi", "http://localhost/sipelok/ — badge berubah “MySQL Aktif”"],
];

const TICKER = [
  "Selamat datang di Layanan Terpadu BPS Kabupaten Konawe",
  "Pojok Statistik buka setiap hari kerja",
  "Petugas piket wajib melengkapi atribut: rompi & name tag",
  "Satu hari dua shift — Pagi 08.00–12.00 · Siang 12.00–16.00",
  "Scan QR di layar loket untuk presensi bertugas",
  "Aplikasi ini murni HTML + PHP + MySQL, tanpa npm",
];

const IkonPanah = () => (
  <svg className="panah" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 12h15M13.5 6l6 6-6 6" />
  </svg>
);

export default function App() {
  const now = useClock();
  const rootRef = useReveal();

  return (
    <div ref={rootRef}>
      {/* pita informasi */}
      <div className="tickerbar" aria-hidden="true">
        <div className="ticker">
          {[0, 1].map((g) => (
            <span key={g}>
              {TICKER.map((t) => (
                <span key={t}>
                  <i>◆</i> {t}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <div className="wrap">
        {/* header */}
        <header className="top">
          <span className="mark">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="16" rx="3.5" />
              <path d="M3 9.5h18M7 16.5v-3M11 16.5v-5M15 16.5v-2" />
            </svg>
          </span>
          <span className="word">
            <b>SIPELOK</b>
            <small>BPS Kabupaten Konawe</small>
          </span>
          <span className="mode">
            <span className="dot" />
            <span className="teks">Versi tanpa-npm · siap salin</span>
          </span>
        </header>

        {/* papan loket */}
        <section className="hero">
          <div className="hero-kiri">
            <span className="eyebrow">
              <span className="dot" /> Murni HTML + CSS + JS + PHP + MySQL
            </span>
            <h1>
              Presensi piket loket,
              <br />
              <em>tanpa npm sama sekali.</em>
            </h1>
            <p className="lead">
              Seluruh aplikasi berupa <strong>berkas statis + satu berkas PHP + MySQL</strong>. Tidak perlu Node.js,
              tidak perlu build, tidak perlu memasang paket — cukup <strong>XAMPP</strong>, salin folder{" "}
              <strong>standalone/</strong>, impor SQL, selesai. Pratinjau ini adalah pintu masuknya.
            </p>

            <nav className="lokets" aria-label="Pilihan peran">
              {LOKET.map((l) => (
                <a key={l.plat} className={`loket ${l.kelas}`} href={l.href}>
                  {l.tag && <span className="tag">{l.tag}</span>}
                  <span className="plat">{l.plat}</span>
                  <span className="txt">
                    <b>{l.judul}</b>
                    <small>{l.desc}</small>
                  </span>
                  <IkonPanah />
                </a>
              ))}
            </nav>
          </div>

          <div className="hero-kanan">
            <div className="jamcard">
              <p className="lbl">Waktu setempat</p>
              <p className="jam">
                {pad(now.getHours())}:{pad(now.getMinutes())}
                <span className="detik">:{pad(now.getSeconds())}</span>
              </p>
              <p className="tgl">
                {now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>

            <div className="struk">
              <h3>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 4v10M8 10.5l4 4 4-4M4.5 16.5v2A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5v-2" />
                </svg>
                Instalasi cepat · ±10 menit
              </h3>
              <ol>
                {LANGKAH.map(([j, d]) => (
                  <li key={j}>
                    <div>
                      <b>{j}</b>
                      <span>{d}</span>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="barcode" aria-hidden="true">
                {[3, 1, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 2, 3, 1].map((w, i) => (
                  <i key={i} style={{ width: w * 2 }} />
                ))}
              </div>
              <p className="kode">SIPELOK·KONAWE·2026</p>
            </div>
          </div>
        </section>

        {/* fitur & panduan */}
        <section className="bawah">
          <div className="buku reveal">
            <span className="eyebrow">Fitur</span>
            <h2>Semua yang dibutuhkan loket</h2>
            {FITUR.map(([j, d], i) => (
              <div className="baris" key={j}>
                <span className="nomor">{pad(i + 1)}</span>
                <div>
                  <b>{j}</b>
                  <p>{d}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="alur reveal">
            <h2>Cara pasangnya</h2>
            <div className="kartu">
              {LANGKAH.map(([j, d], i) => (
                <div className="langkah" key={j}>
                  <span className="n">{i + 1}</span>
                  <div>
                    <b>{j}</b>
                    <span>{d}</span>
                  </div>
                </div>
              ))}
              <a className="cta" href="standalone/panduan.html">
                Baca panduan lengkap
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4.5 12h15M13.5 6l6 6-6 6" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        <footer className="foot">
          <span>
            <b>SIPELOK</b> · Badan Pusat Statistik Kabupaten Konawe
          </span>
          <span className="kanan">Murni HTML + CSS + JS + PHP + MySQL — tanpa npm, tanpa build.</span>
        </footer>
      </div>
    </div>
  );
}
