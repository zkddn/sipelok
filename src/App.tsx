import { useEffect, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

const LINKS = [
  {
    href: "standalone/index.html",
    judul: "Beranda / Hub",
    desc: "Papan utama: jam hidup, petugas piket hari ini, dan pilihan peran.",
    warna: "bg-brand-500 text-ink-950",
    ikon: "M3 4h18v12H3zM9 21h6M12 17v4",
  },
  {
    href: "standalone/loket.html",
    judul: "Layar Loket (PC)",
    desc: "QR besar untuk discan petugas + feed presensi langsung.",
    warna: "bg-lagoon-600 text-mist-50",
    ikon: "M3 4.5h18v12.5H3zM9 21h6M12 17v4M7 13.5v-3M10.5 13.5V8M14 13.5v-4",
  },
  {
    href: "standalone/admin.html",
    judul: "Admin & Rekap",
    desc: "Rekap presensi, jadwal piket, kelola petugas & akun. admin / bpskonawe",
    warna: "bg-ink-700 text-mist-50",
    ikon: "M12 3 5 5.8v5.4c0 4.5 3 7.8 7 9.3 4-1.5 7-4.8 7-9.3V5.8L12 3Zm-3 8.5 2.2 2.2 4.3-4.7",
  },
  {
    href: "standalone/panduan.html",
    judul: "Panduan Instalasi",
    desc: "Pasang di XAMPP ±10 menit, tanpa npm / Node.js, plus uji koneksi.",
    warna: "bg-amberx-500 text-ink-950",
    ikon: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Zm4 2h7M8 11h7",
  },
];

const FITUR = [
  ["Dua shift per hari", "Pagi 08–12 & Siang 12–16, terdeteksi otomatis dari jam."],
  ["Scan QR dari HP", "Petugas scan QR di layar loket, tidak perlu mengetik alamat."],
  ["Foto atribut", "Bukti kelengkapan rompi & name tag saat presensi masuk."],
  ["Jadwal piket mingguan", "Atur Senin–Sabtu per shift, rotasi otomatis, lihat yang piket hari ini."],
  ["Rekap & ekspor", "Filter tanggal/shift, statistik, ekspor CSV, cetak resmi."],
  ["Akun & peran", "Admin penuh atau lihat-saja, sandi ter-hash."],
];

const LANGKAH = [
  ["Pasang XAMPP", "Jalankan Apache + MySQL."],
  ["Salin folder", "Taruh folder sipelok ke C:\\xampp\\htdocs\\"],
  ["Impor database", "phpMyAdmin → Import → database/sipelok.sql"],
  ["Buka aplikasi", "http://localhost/sipelok/ → badge “MySQL Aktif”"],
];

export default function App() {
  const now = useClock();

  return (
    <div className="min-h-screen bg-board text-mist-50">
      <div className="max-w-6xl mx-auto px-5 py-10">
        {/* header */}
        <header className="flex items-center gap-3 rise">
          <span className="w-11 h-11 rounded-xl bg-brand-500 text-ink-950 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="16" rx="3.5" /><path d="M3 9.5h18M7 16.5v-3M11 16.5v-5M15 16.5v-2" />
            </svg>
          </span>
          <div>
            <p className="font-display font-bold text-lg leading-tight">SIPELOK</p>
            <p className="text-[0.7rem] tracking-[0.18em] uppercase text-mist-300">BPS Kabupaten Konawe</p>
          </div>
          <span className="ml-auto badge-row hidden sm:flex items-center gap-2 text-[0.7rem] font-bold text-mist-300">
            <span className="w-2 h-2 rounded-full bg-brand-500 live-dot" /> VERSI TANPA-NPM
          </span>
        </header>

        {/* intro + jam */}
        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-10 mt-12 items-start">
          <section className="rise">
            <span className="eyebrow inline-flex items-center gap-2 text-[0.66rem] font-extrabold tracking-[0.16em] uppercase text-brand-400">
              <span className="w-2 h-2 rounded-full bg-brand-400 live-dot" /> Sekarang murni HTML + PHP + MySQL
            </span>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl leading-[1.04] mt-4">
              Presensi Piket Loket,<br />
              <span className="text-brand-400">tanpa npm sama sekali.</span>
            </h1>
            <p className="text-mist-300 max-w-xl mt-5 leading-relaxed">
              Seluruh aplikasi kini berupa <strong className="text-mist-50">file statis + satu berkas PHP + MySQL</strong>.
              Tidak perlu Node.js, tidak perlu build, tidak perlu install paket — cukup <strong className="text-mist-50">XAMPP</strong>,
              salin folder, impor SQL, selesai. Yang Anda lihat di pratinjau ini adalah pintu masuknya.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mt-8">
              {LINKS.map((l, i) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="card group bg-white/5 border border-white/12 rounded-2xl p-5 flex gap-4 items-start transition-all hover:border-brand-500 hover:-translate-y-1 rise"
                  style={{ animationDelay: `${0.08 + i * 0.06}s` }}
                >
                  <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${l.warna}`}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d={l.ikon} />
                    </svg>
                  </span>
                  <span>
                    <span className="font-display font-bold text-mist-50 flex items-center gap-1.5">
                      {l.judul}
                      <span className="text-brand-400 transition-transform group-hover:translate-x-1">→</span>
                    </span>
                    <span className="block text-[0.8rem] text-mist-300 mt-1 leading-snug">{l.desc}</span>
                  </span>
                </a>
              ))}
            </div>
          </section>

          {/* jam & status */}
          <aside className="rise" style={{ animationDelay: "0.15s" }}>
            <div className="card bg-white/5 border border-white/12 rounded-2xl p-7 text-center">
              <p className="text-[0.68rem] font-extrabold tracking-[0.16em] uppercase text-mist-300">Waktu setempat</p>
              <p className="font-display font-extrabold text-6xl tnum mt-2 leading-none">
                {pad(now.getHours())}.{pad(now.getMinutes())}
                <span className="text-2xl text-brand-400 align-top">:{pad(now.getSeconds())}</span>
              </p>
              <p className="text-sm text-mist-300 capitalize mt-2">
                {now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
              <div className="mt-5 rounded-xl bg-amberx-500/15 border border-amberx-500/30 px-4 py-3 text-[0.78rem] text-amberx-100 leading-snug">
                Pratinjau ini statis — database MySQL aktif setelah folder disalin ke XAMPP.
              </div>
            </div>

            <div className="card bg-white/5 border border-white/12 rounded-2xl p-6 mt-5">
              <p className="text-[0.68rem] font-extrabold tracking-[0.16em] uppercase text-mist-300">Instalasi cepat</p>
              <ol className="mt-3 space-y-3">
                {LANGKAH.map(([j, d], i) => (
                  <li key={j} className="flex gap-3">
                    <span className="w-7 h-7 rounded-lg bg-brand-500 text-ink-950 font-display font-extrabold text-sm flex items-center justify-center shrink-0">{i + 1}</span>
                    <span>
                      <span className="font-bold text-mist-50 text-sm">{j}</span>
                      <span className="block text-[0.75rem] text-mist-300">{d}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>

        {/* fitur */}
        <section className="mt-16 rise" style={{ animationDelay: "0.1s" }}>
          <span className="text-[0.66rem] font-extrabold tracking-[0.16em] uppercase text-brand-400">Fitur</span>
          <h2 className="font-display font-extrabold text-2xl mt-2">Semua yang dibutuhkan loket</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {FITUR.map(([j, d], i) => (
              <div key={j} className="card bg-white/5 border border-white/12 rounded-xl p-5 hover:border-lagoon-500/60 transition-colors rise" style={{ animationDelay: `${i * 0.05}s` }}>
                <p className="font-bold text-mist-50 flex items-center gap-2">
                  <span className="w-1.5 h-5 rounded-full bg-brand-500" /> {j}
                </p>
                <p className="text-[0.8rem] text-mist-300 mt-1.5 leading-snug">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-16 pt-6 border-t border-white/10 text-[0.72rem] text-mist-400 flex flex-wrap gap-2 items-center">
          <span>SIPELOK · Badan Pusat Statistik Kabupaten Konawe</span>
          <span className="ml-auto">Murni HTML + CSS + JS + PHP + MySQL — tanpa npm.</span>
        </footer>
      </div>
    </div>
  );
}
