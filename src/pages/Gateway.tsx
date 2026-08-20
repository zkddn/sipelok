import { useEffect, useMemo, useState } from "react";
import {
  fmtDateLong,
  getOrCreateSession,
  getRecords,
  onSync,
  scanUrlFor,
  shiftDef,
  shiftForTime,
  todayStr,
} from "../lib/store";
import { copyText, navigate, useNow } from "../lib/hooks";
import { IconArrowRight, IconBook, IconCopy, IconMonitor, IconPhoneScan, IconShield, LogoMark, IconSun, IconSunset } from "../components/icons";
import { Badge, ModeBadge } from "../components/ui";

const pad = (n: number) => String(n).padStart(2, "0");

function ShiftTimeline({ now }: { now: Date }) {
  // garis 08:00 -> 16:00
  const start = new Date(now);
  start.setHours(8, 0, 0, 0);
  const end = new Date(now);
  end.setHours(16, 0, 0, 0);
  const pct = Math.min(100, Math.max(0, ((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100));
  const active = shiftForTime(now);
  return (
    <div>
      <div className="relative h-2.5 rounded-full bg-white/10 overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1/2 border-r border-ink-900/60" style={{ background: active === 1 ? "rgba(242,101,34,.55)" : "rgba(255,255,255,.07)" }} />
        <div className="absolute inset-y-0 left-1/2 w-1/2" style={{ background: active === 2 ? "rgba(242,101,34,.55)" : "rgba(255,255,255,.07)" }} />
        <div className="absolute inset-y-0 left-0 rounded-full bg-brand-500 transition-all duration-700" style={{ width: `${pct}%`, boxShadow: "0 0 12px rgba(242,101,34,.8)" }} />
      </div>
      <div className="flex justify-between mt-2 text-[0.7rem] font-bold text-mist-300 tnum">
        <span>08:00</span>
        <span className={active === 1 ? "text-brand-400" : ""}>Shift 1 · Pagi</span>
        <span>12:00</span>
        <span className={active === 2 ? "text-brand-400" : ""}>Shift 2 · Siang</span>
        <span>16:00</span>
      </div>
    </div>
  );
}

export default function Gateway() {
  const now = useNow();
  const [tick, setTick] = useState(0);
  useEffect(() => onSync(() => setTick((x) => x + 1)), []);

  const today = todayStr(now);
  const activeShift = shiftForTime(now);
  const def = shiftDef(activeShift);
  const session = useMemo(() => getOrCreateSession(today, activeShift), [today, activeShift, tick]);

  const todayRecords = useMemo(() => getRecords().filter((r) => r.date === today), [today, tick]);
  const sedangBertugas = todayRecords.filter((r) => !r.keluar).length;

  const [copied, setCopied] = useState(false);
  const url = scanUrlFor(session.token);
  const doCopy = async () => {
    if (await copyText(url)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  const clock = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.15fr_1fr]">
      {/* ===== Papan loket (kiri) ===== */}
      <section className="bg-board text-mist-50 relative overflow-hidden flex flex-col justify-between p-7 sm:p-10 min-h-[52vh]">
        <div className="absolute -right-20 -top-24 w-[26rem] h-[26rem] rounded-full border-[26px] border-white/[0.04] pointer-events-none" />
        <p className="absolute right-8 bottom-24 font-display font-extrabold text-[9rem] leading-none text-white/[0.04] select-none hidden xl:block">
          BPS
        </p>

        <div className="rise">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-brand-500 text-ink-950 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <LogoMark size={26} />
            </span>
            <div>
              <p className="font-display font-bold text-lg leading-tight">SIPELOK</p>
              <p className="text-[0.7rem] tracking-[0.18em] uppercase text-mist-300">BPS Kabupaten Konawe</p>
            </div>
            <span className="ml-auto flex items-center gap-3">
              <a
                href="#/panduan"
                className="hidden md:inline-flex items-center gap-1.5 text-[0.7rem] font-extrabold text-brand-400 hover:text-brand-300 border border-brand-500/30 hover:border-brand-500/60 bg-brand-500/5 rounded-full px-3 py-1.5 transition-all"
              >
                <IconBook size={13} /> Panduan Implementasi
              </a>
              <span className="hidden lg:inline-flex"><ModeBadge dark /></span>
              <span className="hidden sm:flex items-center gap-2 text-[0.7rem] font-bold text-mist-300">
                <span className="w-2 h-2 rounded-full bg-brand-500 live-dot" /> LOKET PELAYANAN TERPADU
              </span>
            </span>
          </div>

          <h1 className="font-display font-extrabold text-4xl sm:text-5xl xl:text-6xl leading-[1.02] mt-8 max-w-xl">
            Presensi Piket
            <span className="block text-brand-400">Loket Pelayanan</span>
          </h1>
          <p className="text-mist-300 max-w-md mt-4 text-[0.95rem] leading-relaxed">
            Setiap petugas piket memindai QR di layar loket untuk mencatat <strong className="text-mist-50">jam mulai</strong> dan{" "}
            <strong className="text-mist-50">jam selesai</strong> bertugas, lengkap dengan{" "}
            <strong className="text-mist-50">foto atribut</strong> sebagai bukti kelengkapan.
          </p>
        </div>

        <div className="rise" style={{ animationDelay: "0.12s" }}>
          <div className="flex flex-wrap items-end gap-x-8 gap-y-4 mb-6">
            <div>
              <p className="text-[0.7rem] font-extrabold tracking-[0.16em] uppercase text-mist-300 mb-1">Waktu setempat</p>
              <p className="font-display font-extrabold text-6xl sm:text-7xl tnum leading-none">
                {clock}
                <span className="text-2xl text-brand-400 align-top">:{pad(now.getSeconds())}</span>
              </p>
            </div>
            <div className="pb-1.5">
              <Badge tone="brand" className="mb-2">
                {activeShift === 1 ? <IconSun size={13} /> : <IconSunset size={13} />} {def.label} · {def.nama} — {def.waktu}
              </Badge>
              <p className="text-sm text-mist-300 capitalize">{fmtDateLong(today)}</p>
            </div>
            <div className="pb-1.5 ml-auto flex gap-6">
              <div>
                <p className="font-display font-extrabold text-3xl tnum text-mist-50">{todayRecords.length}</p>
                <p className="text-[0.68rem] font-bold uppercase tracking-wider text-mist-300">Presensi hari ini</p>
              </div>
              <div>
                <p className="font-display font-extrabold text-3xl tnum text-lagoon-100">{sedangBertugas}</p>
                <p className="text-[0.68rem] font-bold uppercase tracking-wider text-mist-300">Sedang bertugas</p>
              </div>
            </div>
          </div>
          <ShiftTimeline now={now} />
        </div>
      </section>

      {/* ===== Panel akses (kanan) ===== */}
      <section className="bg-papergrid p-6 sm:p-10 flex flex-col gap-4">
        <p className="text-[0.7rem] font-extrabold tracking-[0.16em] uppercase text-ink-500 rise">Pilih jalur akses</p>

        <button
          onClick={() => navigate("/loket")}
          className="card card-hover text-left p-6 flex items-center gap-5 group rise"
          style={{ animationDelay: "0.06s" }}
        >
          <span className="w-14 h-14 rounded-2xl bg-ink-900 text-brand-400 flex items-center justify-center shrink-0 group-hover:rotate-[-4deg] transition-transform">
            <IconMonitor size={30} />
          </span>
          <span className="flex-1">
            <span className="flex items-center gap-2">
              <span className="font-display font-bold text-xl text-ink-900">Layar Loket</span>
              <Badge tone="mist">PC Front Office</Badge>
            </span>
            <span className="block text-sm text-ink-500 mt-0.5">
              Tampilkan QR giliran piket di monitor pelayanan — petugas memindainya dari HP masing-masing.
            </span>
          </span>
          <IconArrowRight size={22} className="text-mist-400 group-hover:text-brand-500 group-hover:translate-x-1 transition-all shrink-0" />
        </button>

        <div className="card card-hover p-6 rise" style={{ animationDelay: "0.14s" }}>
          <div className="flex items-center gap-5">
            <span className="w-14 h-14 rounded-2xl bg-brand-500 text-white flex items-center justify-center shrink-0">
              <IconPhoneScan size={30} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="flex items-center gap-2 flex-wrap">
                <span className="font-display font-bold text-xl text-ink-900">Petugas Piket</span>
                <Badge tone="brand">HP · Scan QR</Badge>
              </p>
              <p className="text-sm text-ink-500 mt-0.5">
                Tautan presensi <strong>{def.label} ({def.nama})</strong> hari ini — biasanya dibuka lewat kamera HP.
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <code className="flex-1 truncate text-[0.78rem] bg-mist-100 border border-mist-200 rounded-lg px-3 py-2.5 text-ink-700 tnum">
              {url.replace(/^https?:\/\//, "")}
            </code>
            <button onClick={doCopy} className="btn btn-ghost btn-sm" aria-label="Salin tautan">
              <IconCopy size={16} /> {copied ? "Tersalin!" : "Salin"}
            </button>
            <button onClick={() => navigate(`/scan/${session.token}`)} className="btn btn-primary btn-sm">
              Buka
            </button>
          </div>
        </div>

        <button
          onClick={() => navigate("/admin")}
          className="card card-hover text-left px-6 py-4 flex items-center gap-4 group rise"
          style={{ animationDelay: "0.22s" }}
        >
          <span className="w-10 h-10 rounded-xl bg-lagoon-600 text-white flex items-center justify-center shrink-0">
            <IconShield size={20} />
          </span>
          <span className="flex-1">
            <span className="font-display font-bold text-ink-900">Admin & Rekap</span>
            <span className="block text-xs text-ink-500">Rekapitulasi presensi, foto atribut, kelola petugas, ekspor CSV.</span>
          </span>
          <IconArrowRight size={18} className="text-mist-400 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
        </button>

        <div className="mt-auto pt-4 rise" style={{ animationDelay: "0.3s" }}>
          <div className="border-t border-mist-200 pt-3 overflow-hidden">
            <div className="marquee-track text-[0.72rem] font-semibold text-ink-500">
              {Array(2)
                .fill(
                  "Selamat datang di Layanan Terpadu BPS Kab. Konawe · Pojok Statistik buka setiap hari kerja · Lengkapi atribut: rompi, name tag, dan tanda pengenal · Konsultasi data? Temui petugas loket · "
                )
                .join("")}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
