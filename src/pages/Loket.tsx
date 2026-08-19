import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  fmtDateLong,
  fmtHM,
  getOrCreateSession,
  getRecords,
  onSync,
  rotateToken,
  scanUrlFor,
  shiftDef,
  shiftForTime,
  todayStr,
  type PresensiRecord,
  type ShiftId,
} from "../lib/store";
import { navigate, useNow } from "../lib/hooks";
import { IconArrowRight, IconQr, IconRefresh, LogoMark } from "../components/icons";
import { Badge, EmptyState, PhotoTile, RecordStatus } from "../components/ui";

const pad = (n: number) => String(n).padStart(2, "0");

function lastEvent(r: PresensiRecord): string {
  return r.keluar ?? r.masuk;
}

function FeedRow({ r, index }: { r: PresensiRecord; index: number }) {
  return (
    <li className="slide-row flex items-center gap-3 px-4 py-3 border-b border-mist-100 last:border-0 hover:bg-mist-50 transition-colors" style={{ animationDelay: `${index * 0.05}s` }}>
      <PhotoTile src={r.fotoMasuk} nama={r.nama} />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-ink-900 truncate">{r.nama}</p>
        <p className="text-[0.72rem] text-ink-500 tnum">
          <span className="text-lagoon-700 font-semibold">Masuk {fmtHM(r.masuk)}</span>
          {r.keluar && <span className="text-ink-600 font-semibold"> · Keluar {fmtHM(r.keluar)}</span>}
          <span className="text-mist-400"> · Shift {r.shift}</span>
        </p>
      </div>
      <RecordStatus r={r} />
    </li>
  );
}

export default function Loket() {
  const now = useNow();
  const [override, setOverride] = useState<ShiftId | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => onSync(() => setTick((x) => x + 1)), []);

  const today = todayStr(now);
  const autoShift = shiftForTime(now);
  const shift: ShiftId = override ?? autoShift;
  const def = shiftDef(shift);
  const session = useMemo(() => getOrCreateSession(today, shift), [today, shift, tick]);
  const url = scanUrlFor(session.token);

  const todayRecords = useMemo(
    () => getRecords().filter((r) => r.date === today).sort((a, b) => lastEvent(b).localeCompare(lastEvent(a))),
    [today, tick]
  );
  const masukCount = todayRecords.length;
  const aktifCount = todayRecords.filter((r) => !r.keluar).length;

  return (
    <div className="min-h-screen bg-board text-mist-50 flex flex-col">
      {/* bar atas */}
      <header className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
        <button onClick={() => navigate("/")} className="flex items-center gap-2.5 group" aria-label="Kembali ke beranda">
          <span className="w-9 h-9 rounded-lg bg-brand-500 text-ink-950 flex items-center justify-center group-hover:rotate-[-6deg] transition-transform">
            <LogoMark size={22} />
          </span>
          <span className="font-display font-bold">SIPELOK <span className="text-mist-300 font-body font-semibold text-xs block -mt-0.5">BPS Kab. Konawe</span></span>
        </button>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden md:inline text-[0.7rem] font-bold uppercase tracking-wider text-mist-300 mr-1">Shift ditampilkan</span>
          {([1, 2] as ShiftId[]).map((s) => (
            <button
              key={s}
              onClick={() => setOverride(s === autoShift ? null : s)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                shift === s ? "bg-brand-500 text-ink-950 shadow-lg shadow-brand-500/30" : "bg-white/5 text-mist-300 hover:bg-white/10 border border-white/10"
              }`}
            >
              Shift {s} · {shiftDef(s).nama}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 grid lg:grid-cols-[1.2fr_1fr] gap-6 p-6 max-w-7xl w-full mx-auto">
        {/* ===== Kolom QR ===== */}
        <section className="flex flex-col gap-5">
          <div className="flex items-end justify-between rise">
            <div>
              <p className="text-[0.7rem] font-extrabold tracking-[0.16em] uppercase text-mist-300 capitalize">{fmtDateLong(today)}</p>
              <p className="font-display font-extrabold text-6xl xl:text-7xl tnum leading-none mt-1">
                {pad(now.getHours())}:{pad(now.getMinutes())}
                <span className="text-xl text-brand-400 align-top">:{pad(now.getSeconds())}</span>
              </p>
            </div>
            <div className="text-right">
              <Badge tone="brand">{def.label} · {def.nama}</Badge>
              <p className="text-mist-300 text-sm tnum mt-1.5 font-semibold">{def.waktu} WITA</p>
              {override && override !== autoShift && (
                <p className="text-[0.68rem] text-amberx-100 mt-1 font-bold">Mode manual — mengikuti jam: Shift {autoShift}</p>
              )}
            </div>
          </div>

          <div className="bg-qrhalo rounded-3xl border border-white/10 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-7 rise" style={{ animationDelay: "0.1s" }}>
            <div className="relative shrink-0">
              {/* sudut pemindai */}
              <span className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-brand-500 rounded-tl-xl" />
              <span className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-brand-500 rounded-tr-xl" />
              <span className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-brand-500 rounded-bl-xl" />
              <span className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-brand-500 rounded-br-xl" />
              <div className="relative bg-[#fdfefd] rounded-2xl p-5 overflow-hidden">
                <QRCodeSVG value={url} size={252} level="M" fgColor="#0c2431" bgColor="#fdfefd" />
                <span className="scanbeam" />
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left min-w-0">
              <p className="flex items-center justify-center sm:justify-start gap-2 text-brand-400 font-extrabold text-sm tracking-wide">
                <IconQr size={18} /> SCAN UNTUK PRESENSI PIKET
              </p>
              <h2 className="font-display font-extrabold text-3xl leading-tight mt-2">
                Arahkan kamera HP
                <br />ke kode di samping
              </h2>
              <p className="text-mist-300 text-sm mt-2 leading-relaxed">
                Tautan ini khusus <strong className="text-mist-50">{def.label} ({def.nama})</strong> hari ini. Setelah memindai, pilih nama,
                ambil foto atribut, dan simpan presensi.
              </p>
              <code className="block mt-4 text-[0.72rem] tnum bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-mist-300 truncate">
                {url}
              </code>
              <button
                onClick={() => rotateToken(today, shift)}
                className="btn btn-light btn-sm mt-4"
                title="Buat QR baru — QR lama langsung tidak berlaku"
              >
                <IconRefresh size={16} /> Perbarui QR (token: {session.token})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 rise" style={{ animationDelay: "0.18s" }}>
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <p className="font-display font-extrabold text-3xl tnum">{masukCount}</p>
              <p className="text-[0.68rem] font-bold uppercase tracking-wider text-mist-300">Presensi tercatat</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <p className="font-display font-extrabold text-3xl tnum text-lagoon-100">{aktifCount}</p>
              <p className="text-[0.68rem] font-bold uppercase tracking-wider text-mist-300">Sedang di loket</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <p className="font-display font-extrabold text-3xl tnum text-brand-400">2</p>
              <p className="text-[0.68rem] font-bold uppercase tracking-wider text-mist-300">Shift per hari</p>
            </div>
          </div>
        </section>

        {/* ===== Umpan langsung ===== */}
        <section className="bg-mist-50 text-ink-900 rounded-3xl border border-white/10 overflow-hidden flex flex-col rise" style={{ animationDelay: "0.14s" }}>
          <div className="flex items-center gap-2.5 px-5 py-4 bg-ink-800 text-mist-50">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500 live-dot" />
            <h3 className="font-display font-bold text-lg">Presensi Hari Ini</h3>
            <span className="ml-auto text-[0.7rem] font-bold uppercase tracking-wider text-mist-300 tnum">
              diperbarui {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
            </span>
          </div>

          {todayRecords.length === 0 ? (
            <EmptyState title="Belum ada presensi" desc="Hasil pindaian petugas akan muncul di sini secara langsung." />
          ) : (
            <ul className="flex-1 overflow-y-auto slim-scroll max-h-[52vh] lg:max-h-none">
              {todayRecords.map((r, i) => (
                <FeedRow key={r.id} r={r} index={i} />
              ))}
            </ul>
          )}

          <div className="px-5 py-3 bg-mist-100 border-t border-mist-200 flex items-center justify-between text-[0.75rem] font-semibold text-ink-500">
            <span>Loket Pelayanan Terpadu · SIPELOK</span>
            <button onClick={() => navigate("/admin")} className="inline-flex items-center gap-1 hover:text-brand-600 transition-colors">
              Buka rekap admin <IconArrowRight size={13} />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
