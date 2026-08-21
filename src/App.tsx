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

const LOKET = [
  {
    kelas: "a",
    plat: "A",
    href: "standalone/index.html",
    judul: "Beranda & Hub",
    desc: "Papan utama: jam hidup, petugas piket hari ini, dan status koneksi database.",
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
    desc: "Rekap presensi, jadwal piket mingguan, kelola petugas dan akun.",
    tag: "admin / bpskonawe",
  },
];

const TICKER = [
  "Selamat datang di Layanan Terpadu BPS Kabupaten Konawe",
  "Pojok Statistik buka setiap hari kerja",
  "Petugas piket wajib melengkapi atribut: rompi & name tag",
  "Satu hari dua shift — Pagi 08.00–12.00 · Siang 12.00–16.00",
  "Scan QR di layar loket untuk presensi bertugas",
];

const IkonPanah = () => (
  <svg className="panah" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 12h15M13.5 6l6 6-6 6" />
  </svg>
);

export default function App() {
  const now = useClock();

  return (
    <div>
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
          <span className="pill">
            <span className="dot" /> Loket Pelayanan Terpadu
          </span>
        </header>

        {/* papan loket */}
        <section className="hero">
          <div className="hero-kiri">
            <h1 className="rise">
              Presensi piket
              <br />
              <em>loket pelayanan.</em>
            </h1>
            <p className="lead rise" style={{ animationDelay: "0.08s" }}>
              Setiap petugas piket mencatat <strong>jam mulai</strong> dan <strong>jam selesai</strong> bertugas lewat
              scan QR di layar loket, lengkap dengan <strong>foto kelengkapan atribut</strong>.
            </p>

            <p className="subhead rise" style={{ animationDelay: "0.14s" }}>
              Pilih peran Anda
            </p>
            <nav className="lokets" aria-label="Pilihan peran">
              {LOKET.map((l, i) => (
                <a
                  key={l.plat}
                  className={`loket ${l.kelas} rise`}
                  style={{ animationDelay: `${0.2 + i * 0.07}s` }}
                  href={l.href}
                >
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
            <div className="jamcard rise" style={{ animationDelay: "0.15s" }}>
              <p className="lbl">Waktu setempat</p>
              <p className="jam">
                {pad(now.getHours())}:{pad(now.getMinutes())}
                <span className="detik">:{pad(now.getSeconds())}</span>
              </p>
              <p className="tgl">
                {now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
              <div className="shift">
                <span className={now.getHours() >= 8 && now.getHours() < 12 ? "on" : ""}>Shift 1 · Pagi 08–12</span>
                <span className={now.getHours() >= 12 && now.getHours() < 16 ? "on" : ""}>Shift 2 · Siang 12–16</span>
              </div>
            </div>
          </div>
        </section>

        <footer className="foot">
          <b>SIPELOK</b> · Badan Pusat Statistik Kabupaten Konawe
        </footer>
      </div>
    </div>
  );
}
