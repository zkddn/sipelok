import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  DEFAULT_PASSWORD,
  DEFAULT_USERNAME,
  HARI_KERJA,
  HARI_LABEL,
  addAccount,
  addPetugas,
  changePassword,
  clearAllData,
  durasiMenit,
  exportCsv,
  fmtDateLong,
  fmtDateShort,
  fmtDurasi,
  fmtHM,
  generateJadwal,
  getAccounts,
  getAuth,
  getJadwal,
  getPetugas,
  getRecords,
  jadwalUntuk,
  login,
  logout,
  menitTerlambat,
  onSync,
  removeAccount,
  removePetugas,
  saveJadwal,
  seedDemo,
  setSlotJadwal,
  shiftDef,
  storageSizeKB,
  todayStr,
  type Account,
  type PresensiRecord,
  type Role,
  type ShiftId,
} from "../lib/store";
import { useNow } from "../lib/hooks";
import {
  IconAlert,
  IconCalendar,
  IconCheck,
  IconClock,
  IconDownload,
  IconEye,
  IconLogout,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconShield,
  IconSun,
  IconSunset,
  IconTrash,
  IconUsers,
  LogoMark,
} from "../components/icons";
import { Badge, EmptyState, Modal, PhotoTile, RecordStatus, SectionLabel } from "../components/ui";

type Tab = "rekap" | "jadwal" | "petugas" | "pengaturan";

/* =============================================================
   Gerbang masuk (akun)
   ============================================================= */

function LoginScreen({ onSuccess }: { onSuccess: (a: Account) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [shakeKey, setShakeKey] = useState(0);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const acc = login(username, password);
    if (!acc) {
      setError("Nama pengguna atau kata sandi salah.");
      setShakeKey((k) => k + 1);
      return;
    }
    onSuccess(acc);
  };

  return (
    <div className="min-h-screen bg-board flex items-center justify-center p-4">
      <div className="w-full max-w-3xl grid md:grid-cols-[1.05fr_1fr] rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40 rise">
        {/* panel identitas */}
        <div className="bg-ink-900 text-mist-50 p-8 relative overflow-hidden">
          <span className="absolute -right-10 -top-10 w-44 h-44 rounded-full border-[14px] border-brand-500/15" />
          <span className="absolute -right-2 top-24 w-16 h-16 rounded-full border-8 border-lagoon-600/20" />
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-brand-500 text-ink-950 flex items-center justify-center">
              <LogoMark size={26} />
            </span>
            <div>
              <p className="font-display font-extrabold text-xl leading-none">SIPELOK</p>
              <p className="text-[0.62rem] font-bold tracking-[0.16em] uppercase text-mist-300 mt-1">BPS Kab. Konawe</p>
            </div>
          </div>
          <h1 className="font-display font-extrabold text-3xl leading-tight mt-8">
            Konsol Admin
            <br />
            <span className="text-brand-400">Rekap Piket Loket</span>
          </h1>
          <ul className="mt-6 space-y-3 text-sm text-mist-200">
            {[
              ["Rekap presensi, jam bertugas & foto atribut", <IconClock key="a" size={16} />],
              ["Atur jadwal piket mingguan dua shift", <IconCalendar key="b" size={16} />],
              ["Kelola petugas piket dan akun akses", <IconUsers key="c" size={16} />],
            ].map(([txt, icon], i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-brand-400 shrink-0">
                  {icon}
                </span>
                {txt as ReactNode}
              </li>
            ))}
          </ul>
          <p className="absolute bottom-5 left-8 text-[0.65rem] text-mist-400 tracking-wide">
            Sistem Presensi Piket Loket Pelayanan · v1.2
          </p>
        </div>

        {/* formulir */}
        <div className="bg-mist-50 p-8 flex flex-col justify-center">
          <h2 className="font-display font-extrabold text-2xl text-ink-900 flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-lg bg-ink-900 text-brand-400 flex items-center justify-center">
              <IconShield size={19} />
            </span>
            Masuk
          </h2>
          <p className="text-sm text-ink-500 mt-2">Gunakan akun yang diberikan pengelola layanan untuk membuka rekap dan pengaturan.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div key={shakeKey} className={error ? "shake" : ""}>
              <label className="block text-[0.7rem] font-extrabold tracking-[0.12em] uppercase text-ink-500 mb-1.5">Nama Pengguna</label>
              <input
                className="input"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                placeholder="cth: admin"
                autoFocus
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-[0.7rem] font-extrabold tracking-[0.12em] uppercase text-ink-500 mb-1.5">Kata Sandi</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-ruby-100 text-ruby-700 text-[0.8rem] font-semibold rounded-lg px-3.5 py-2.5">
                <IconAlert size={16} className="shrink-0 mt-0.5" /> {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg w-full">Masuk ke Konsol</button>
          </form>

          <div className="mt-6 rounded-xl border border-dashed border-mist-300 bg-white px-4 py-3">
            <p className="text-[0.68rem] font-bold uppercase tracking-wider text-ink-500">Akun demo bawaan</p>
            <p className="text-sm text-ink-700 font-semibold tnum mt-1">
              {DEFAULT_USERNAME} <span className="text-mist-400">/</span> {DEFAULT_PASSWORD}
            </p>
            <button
              onClick={() => { setUsername(DEFAULT_USERNAME); setPassword(DEFAULT_PASSWORD); setError(""); }}
              className="btn btn-light btn-xs mt-2"
            >
              <IconRefresh size={13} /> Isi otomatis
            </button>
          </div>

          <a href="#/" className="text-center text-[0.72rem] font-semibold text-ink-500 hover:text-brand-600 mt-5 transition-colors">
            ← Kembali ke beranda SIPELOK
          </a>
        </div>
      </div>
    </div>
  );
}

/* =============================================================
   Dialog konfirmasi
   ============================================================= */

function Confirm({
  open,
  title,
  desc,
  confirmLabel,
  danger = false,
  onOk,
  onClose,
}: {
  open: boolean;
  title: string;
  desc: string;
  confirmLabel: string;
  danger?: boolean;
  onOk: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="pr-8">
        <span className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${danger ? "bg-ruby-100 text-ruby-700" : "bg-amberx-100 text-amberx-700"}`}>
          <IconAlert size={26} />
        </span>
        <h3 className="font-display font-extrabold text-xl text-ink-900">{title}</h3>
        <p className="text-sm text-ink-500 mt-2 leading-relaxed">{desc}</p>
        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="btn btn-light flex-1">Batal</button>
          <button
            onClick={() => { onOk(); onClose(); }}
            className={`btn flex-1 ${danger ? "btn-danger" : "btn-primary"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* =============================================================
   Panel: Piket Hari Ini
   ============================================================= */

function statusPiket(petugasId: string, todayRecs: PresensiRecord[]) {
  const recs = todayRecs.filter((r) => r.petugasId === petugasId);
  const done = recs.find((r) => r.keluar);
  const open = recs.find((r) => !r.keluar);
  if (done) return { tone: "ink" as const, label: "Selesai", sub: `masuk ${fmtHM(done.masuk)} · pulang ${fmtHM(done.keluar)}` };
  if (open) return { tone: "lagoon" as const, label: "Sedang bertugas", sub: `masuk ${fmtHM(open.masuk)}` };
  return { tone: "ruby" as const, label: "Belum presensi", sub: "" };
}

function PiketHariIni({ tick, onAturJadwal }: { tick: number; onAturJadwal: () => void }) {
  const now = useNow();
  const today = todayStr(now);
  const hariIni = useMemo(() => jadwalUntuk(now), [today, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const todayRecs = useMemo(() => getRecords().filter((r) => r.date === today), [today, tick]);

  return (
    <section className="card p-5 rise">
      <div className="flex items-center gap-3 flex-wrap">
        <SectionLabel>Piket Hari Ini</SectionLabel>
        <span className="text-sm text-ink-500 font-semibold capitalize">{fmtDateLong(today)}</span>
        {hariIni.length === 0 && (
          <button onClick={onAturJadwal} className="ml-auto btn btn-light btn-sm">
            <IconCalendar size={14} /> Atur jadwal piket
          </button>
        )}
      </div>

      {hariIni.length === 0 ? (
        <p className="text-sm text-ink-500 mt-3">
          Tidak ada jadwal piket untuk hari ini. Buka tab <strong className="text-ink-800">Jadwal Piket</strong> untuk menyusun giliran petugas.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          {([1, 2] as ShiftId[]).map((s) => {
            const def = shiftDef(s);
            const entries = hariIni.filter((j) => j.shift === s);
            return (
              <div key={s} className="rounded-xl border border-mist-200 bg-mist-50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${s === 1 ? "bg-brand-100 text-brand-600" : "bg-lagoon-100 text-lagoon-700"}`}>
                    {s === 1 ? <IconSun size={15} /> : <IconSunset size={15} />}
                  </span>
                  <p className="font-display font-bold text-ink-900">{def.label} · {def.nama}</p>
                  <span className="text-[0.7rem] text-ink-500 font-semibold tnum ml-auto">{def.waktu}</span>
                </div>

                {entries.length === 0 ? (
                  <p className="text-sm text-ink-400 py-2">Belum ada petugas dijadwalkan.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {entries.map((j) => {
                      const st = statusPiket(j.petugasId, todayRecs);
                      const foto = todayRecs.find((r) => r.petugasId === j.petugasId)?.fotoMasuk ?? null;
                      return (
                        <li key={j.id} className="flex items-center gap-3">
                          <PhotoTile src={foto} nama={j.petugas?.nama ?? "?"} className="w-10 h-10" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-ink-900 truncate">{j.petugas?.nama ?? "(petugas dihapus)"}</p>
                            {st.sub && <p className="text-[0.68rem] text-ink-500 tnum">{st.sub}</p>}
                          </div>
                          <Badge tone={st.tone}>{st.label}</Badge>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* =============================================================
   Tab: Rekap presensi
   ============================================================= */

function StatCard({ label, value, sub, icon, delay }: { label: string; value: number; sub: string; icon: ReactNode; delay: string }) {
  return (
    <div className="card p-4 rise" style={{ animationDelay: delay }}>
      <div className="flex items-center justify-between">
        <p className="text-[0.68rem] font-extrabold tracking-[0.12em] uppercase text-ink-500">{label}</p>
        <span className="w-8 h-8 rounded-lg bg-ink-900 text-brand-400 flex items-center justify-center">{icon}</span>
      </div>
      <p className="font-display font-extrabold text-4xl tnum text-ink-900 mt-1">{value}</p>
      <p className="text-[0.7rem] text-ink-500 font-semibold mt-0.5">{sub}</p>
    </div>
  );
}

function Lightbox({ r, onClose }: { r: PresensiRecord | null; onClose: () => void }) {
  return (
    <Modal open={!!r} onClose={onClose} wide>
      {r && (
        <div className="pr-8">
          <SectionLabel>Foto Atribut</SectionLabel>
          <h3 className="font-display font-extrabold text-2xl text-ink-900 mt-1">{r.nama}</h3>
          <p className="text-sm text-ink-500 capitalize">
            {fmtDateLong(r.date)} · Shift {r.shift} ({shiftDef(r.shift).nama}) · Masuk {fmtHM(r.masuk)}
            {r.keluar && <> · Pulang {fmtHM(r.keluar)}</>}
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mt-5">
            {[
              ["Saat Masuk", r.fotoMasuk],
              ["Saat Pulang", r.fotoKeluar],
            ].map(([label, src]) => (
              <figure key={label as string}>
                <figcaption className="text-[0.7rem] font-extrabold uppercase tracking-wider text-ink-500 mb-2">{label as string}</figcaption>
                {src ? (
                  <img src={src as string} alt={`${label} ${r.nama}`} className="rounded-xl border border-mist-200 w-full object-cover max-h-80 bg-mist-100" />
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-mist-300 h-56 flex flex-col items-center justify-center text-ink-400 gap-2">
                    <IconEye size={26} />
                    <span className="text-xs font-semibold">Tidak ada foto</span>
                  </div>
                )}
              </figure>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

function RekapTab({ tick, onAturJadwal }: { tick: number; onAturJadwal: () => void }) {
  const now = useNow();
  const today = todayStr(now);
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [quick, setQuick] = useState<"today" | "7d" | "month" | "all">("today");
  const [shift, setShift] = useState(0);
  const [lightbox, setLightbox] = useState<PresensiRecord | null>(null);

  const all = useMemo(() => [...getRecords()].sort((a, b) => b.masuk.localeCompare(a.masuk)), [tick]);

  const rows = useMemo(() => {
    let list = all;
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter((r) => r.nama.toLowerCase().includes(s));
    }
    if (shift) list = list.filter((r) => r.shift === shift);
    const d7 = new Date();
    d7.setDate(d7.getDate() - 6);
    if (quick === "today") list = list.filter((r) => r.date === today);
    else if (quick === "7d") list = list.filter((r) => r.date >= todayStr(d7));
    else if (quick === "month") list = list.filter((r) => r.date.slice(0, 7) === today.slice(0, 7));
    else {
      if (from) list = list.filter((r) => r.date >= from);
      if (to) list = list.filter((r) => r.date <= to);
    }
    return list;
  }, [all, q, shift, quick, from, to, today]);

  const stat = useMemo(
    () => ({
      total: rows.length,
      selesai: rows.filter((r) => r.keluar).length,
      bertugas: rows.filter((r) => !r.keluar).length,
      telat: rows.filter((r) => menitTerlambat(r) > 0).length,
    }),
    [rows]
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Presensi" value={stat.total} sub="pada rentang terpilih" icon={<IconClock size={16} />} delay="0s" />
        <StatCard label="Selesai" value={stat.selesai} sub="masuk & pulang tercatat" icon={<IconCheck size={16} />} delay="0.05s" />
        <StatCard label="Sedang Bertugas" value={stat.bertugas} sub="belum presensi pulang" icon={<IconUsers size={16} />} delay="0.1s" />
        <StatCard label="Terlambat" value={stat.telat} sub="> 10 mnt dari jadwal" icon={<IconAlert size={16} />} delay="0.15s" />
      </div>

      <PiketHariIni tick={tick} onAturJadwal={onAturJadwal} />

      {/* filter */}
      <div className="card p-4 rise" style={{ animationDelay: "0.1s" }}>
        <div className="flex flex-wrap gap-2 items-center">
          {([
            ["today", "Hari Ini"],
            ["7d", "7 Hari"],
            ["month", "Bulan Ini"],
            ["all", "Semua"],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setQuick(k)}
              className={`px-3.5 py-2 rounded-full text-[0.78rem] font-bold transition-all ${
                quick === k ? "bg-ink-900 text-mist-50 shadow" : "bg-mist-100 text-ink-600 hover:bg-mist-200"
              }`}
            >
              {label}
            </button>
          ))}
          <div className="relative flex-1 min-w-44">
            <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama petugas…" className="input input-search" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center mt-3">
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setQuick("all"); }} className="input input-inline" aria-label="Dari tanggal" />
          <span className="text-ink-400 text-sm font-bold">–</span>
          <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setQuick("all"); }} className="input input-inline" aria-label="Sampai tanggal" />
          <select value={shift} onChange={(e) => setShift(Number(e.target.value))} className="input input-inline font-semibold" aria-label="Filter shift">
            <option value={0}>Semua shift</option>
            <option value={1}>Shift 1 · Pagi</option>
            <option value={2}>Shift 2 · Siang</option>
          </select>
          <button onClick={() => exportCsv(rows)} className="btn btn-primary btn-sm ml-auto" disabled={rows.length === 0}>
            <IconDownload size={15} /> Ekspor CSV
          </button>
        </div>
      </div>

      {/* tabel */}
      <div className="card overflow-hidden rise" style={{ animationDelay: "0.15s" }}>
        {rows.length === 0 ? (
          <EmptyState title="Tidak ada data pada rentang ini" desc="Ubah filter, atau tunggu petugas melakukan presensi melalui QR di layar loket." />
        ) : (
          <div className="overflow-x-auto slim-scroll">
            <table className="w-full text-sm min-w-[820px]">
              <thead>
                <tr className="bg-ink-900 text-mist-50 text-left text-[0.68rem] uppercase tracking-wider">
                  <th className="px-4 py-3 font-extrabold">Petugas</th>
                  <th className="px-4 py-3 font-extrabold">Tanggal</th>
                  <th className="px-4 py-3 font-extrabold">Shift</th>
                  <th className="px-4 py-3 font-extrabold">Masuk</th>
                  <th className="px-4 py-3 font-extrabold">Pulang</th>
                  <th className="px-4 py-3 font-extrabold">Durasi</th>
                  <th className="px-4 py-3 font-extrabold">Foto</th>
                  <th className="px-4 py-3 font-extrabold">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} className={`border-b border-mist-100 last:border-0 hover:bg-brand-50/60 transition-colors ${r.date === today ? "bg-lagoon-100/30" : i % 2 ? "bg-mist-50/60" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <PhotoTile src={r.fotoMasuk} nama={r.nama} />
                        <div className="min-w-0">
                          <p className="font-bold text-ink-900 truncate max-w-52">{r.nama}</p>
                          <p className="text-[0.68rem] text-ink-500 tnum">{getPetugas().find((p) => p.id === r.petugasId)?.nip ?? "NIP —"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-700 font-semibold whitespace-nowrap capitalize">{fmtDateShort(r.date)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={r.shift === 1 ? "brand" : "lagoon"}>Shift {r.shift} · {shiftDef(r.shift).nama}</Badge>
                    </td>
                    <td className="px-4 py-3 tnum font-bold text-lagoon-700 whitespace-nowrap">{fmtHM(r.masuk)}</td>
                    <td className="px-4 py-3 tnum font-bold text-ink-700 whitespace-nowrap">{r.keluar ? fmtHM(r.keluar) : "—"}</td>
                    <td className="px-4 py-3 tnum text-ink-600 font-semibold whitespace-nowrap">{fmtDurasi(durasiMenit(r))}</td>
                    <td className="px-4 py-3">
                      {(r.fotoMasuk || r.fotoKeluar) ? (
                        <button
                          onClick={() => setLightbox(r)}
                          className="inline-flex items-center gap-1.5 text-[0.72rem] font-bold text-brand-600 hover:text-brand-700 bg-brand-100 hover:bg-brand-200 transition-colors rounded-lg px-2.5 py-1.5"
                        >
                          <IconEye size={14} /> Lihat
                        </button>
                      ) : (
                        <span className="text-[0.72rem] text-ink-400 font-semibold">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><RecordStatus r={r} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 py-2.5 bg-mist-100 border-t border-mist-200 text-[0.72rem] font-semibold text-ink-500 tnum">
          Menampilkan {rows.length} dari {all.length} catatan presensi
        </div>
      </div>

      <Lightbox r={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}

/* =============================================================
   Tab: Jadwal piket
   ============================================================= */

function JadwalTab({ tick, canEdit }: { tick: number; canEdit: boolean }) {
  const [confirmGen, setConfirmGen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [pesan, setPesan] = useState("");

  const petugasList = useMemo(() => getPetugas(), [tick]);
  const jadwal = useMemo(() => getJadwal(), [tick]);
  const todayHari = new Date().getDay();

  const slot = (hari: number, s: ShiftId) => jadwal.find((j) => j.hari === hari && j.shift === s);

  const beban = useMemo(() => {
    const map = new Map<string, number>();
    jadwal.forEach((j) => map.set(j.petugasId, (map.get(j.petugasId) ?? 0) + 1));
    return [...map.entries()]
      .map(([id, n]) => ({ nama: petugasList.find((p) => p.id === id)?.nama ?? "(petugas dihapus)", n }))
      .sort((a, b) => b.n - a.n || a.nama.localeCompare(b.nama));
  }, [jadwal, petugasList]);

  const buatOtomatis = () => {
    if (petugasList.length === 0) {
      setPesan("Tambahkan petugas terlebih dahulu di tab Petugas.");
      return;
    }
    saveJadwal(generateJadwal());
    setPesan(`Rotasi otomatis tersusun untuk ${petugasList.length} petugas.`);
  };

  return (
    <div className="space-y-5">
      <div className="card p-5 rise">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <SectionLabel>Jadwal Piket Mingguan</SectionLabel>
            <p className="text-sm text-ink-500 mt-2 max-w-xl leading-relaxed">
              Pola ini berulang setiap minggu dan menjadi dasar panel <strong className="text-ink-800">Piket Hari Ini</strong> serta layar loket.
              Hari <strong className="text-ink-800">Minggu</strong> tidak ada layanan loket.
            </p>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <button onClick={() => setConfirmGen(true)} className="btn btn-primary btn-sm">
                <IconRefresh size={14} /> Buat Rotasi Otomatis
              </button>
              <button onClick={() => setConfirmClear(true)} className="btn btn-light btn-sm">
                <IconTrash size={14} /> Kosongkan
              </button>
            </div>
          )}
        </div>

        {pesan && (
          <p className="mt-3 inline-flex items-center gap-2 bg-lagoon-100 text-lagoon-700 text-[0.8rem] font-semibold rounded-lg px-3.5 py-2">
            <IconCheck size={15} /> {pesan}
          </p>
        )}
        {!canEdit && (
          <p className="mt-3 inline-flex items-center gap-2 bg-mist-100 text-ink-500 text-[0.8rem] font-semibold rounded-lg px-3.5 py-2">
            <IconShield size={15} /> Mode lihat saja — akun Anda tidak dapat mengubah jadwal.
          </p>
        )}

        {/* kisi mingguan */}
        <div className="mt-5 overflow-x-auto slim-scroll">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[110px_1fr_1fr] gap-2 px-3 pb-2 text-[0.68rem] font-extrabold uppercase tracking-wider text-ink-500">
              <span>Hari</span>
              <span className="flex items-center gap-1.5"><IconSun size={13} className="text-brand-600" /> Shift 1 · Pagi (08.00–12.00)</span>
              <span className="flex items-center gap-1.5"><IconSunset size={13} className="text-lagoon-700" /> Shift 2 · Siang (12.00–16.00)</span>
            </div>

            {HARI_KERJA.map((hari) => {
              const isToday = hari === todayHari;
              return (
                <div
                  key={hari}
                  className={`grid grid-cols-[110px_1fr_1fr] gap-2 px-3 py-2.5 rounded-xl mb-1.5 transition-colors ${
                    isToday ? "bg-brand-100/70 border border-brand-200" : "hover:bg-mist-100/70"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <p className={`font-display font-bold ${isToday ? "text-brand-700" : "text-ink-800"}`}>{HARI_LABEL[hari]}</p>
                    {isToday && <Badge tone="brand">Hari ini</Badge>}
                  </div>
                  {([1, 2] as ShiftId[]).map((s) => {
                    const e = slot(hari, s);
                    return (
                      <select
                        key={s}
                        value={e?.petugasId ?? ""}
                        disabled={!canEdit}
                        onChange={(ev) => setSlotJadwal(hari, s, ev.target.value)}
                        className={`input ${!canEdit ? "opacity-70" : ""} ${e ? "font-bold text-ink-900" : "text-ink-400"}`}
                      >
                        <option value="">— kosong —</option>
                        {petugasList.map((p) => (
                          <option key={p.id} value={p.id}>{p.nama}</option>
                        ))}
                      </select>
                    );
                  })}
                </div>
              );
            })}

            <div className="grid grid-cols-[110px_1fr] gap-2 px-3 py-2.5 text-ink-400">
              <p className="font-display font-bold">Minggu</p>
              <p className="text-sm font-semibold flex items-center">Libur — tidak ada layanan loket</p>
            </div>
          </div>
        </div>
      </div>

      {/* distribusi beban */}
      <div className="card p-5 rise" style={{ animationDelay: "0.1s" }}>
        <SectionLabel>Distribusi Giliran per Minggu</SectionLabel>
        {beban.length === 0 ? (
          <p className="text-sm text-ink-500 mt-3">Belum ada jadwal tersusun.</p>
        ) : (
          <div className="flex flex-wrap gap-2 mt-4">
            {beban.map((b) => (
              <span key={b.nama} className="inline-flex items-center gap-2 bg-mist-100 border border-mist-200 rounded-full pl-2 pr-3 py-1.5 text-sm font-semibold text-ink-700">
                <span className="w-5 h-5 rounded-full bg-ink-900 text-brand-400 text-[0.62rem] font-extrabold flex items-center justify-center tnum">{b.n}</span>
                {b.nama} <span className="text-ink-400 text-xs">× /minggu</span>
              </span>
            ))}
          </div>
        )}
        <p className="text-[0.72rem] text-ink-500 mt-3">
          Angka menunjukkan berapa slot shift yang diemban setiap petugas dalam satu minggu (maks. 12 slot).
        </p>
      </div>

      <Confirm
        open={confirmGen}
        onClose={() => setConfirmGen(false)}
        title="Buat rotasi otomatis?"
        desc={`Jadwal saat ini akan DIGANTI dengan rotasi merata untuk ${petugasList.length} petugas (Senin–Sabtu, 2 shift). Anda tetap bisa mengubah tiap slot setelahnya.`}
        confirmLabel="Ya, susun otomatis"
        onOk={buatOtomatis}
      />
      <Confirm
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Kosongkan seluruh jadwal?"
        desc="Semua slot piket mingguan akan dihapus. Riwayat presensi tetap tersimpan."
        confirmLabel="Kosongkan jadwal"
        danger
        onOk={() => { saveJadwal([]); setPesan("Jadwal dikosongkan."); }}
      />
    </div>
  );
}

/* =============================================================
   Tab: Petugas piket
   ============================================================= */

function PetugasTab({ tick, canEdit }: { tick: number; canEdit: boolean }) {
  const [nama, setNama] = useState("");
  const [nip, setNip] = useState("");
  const [confirmDel, setConfirmDel] = useState<{ id: string; nama: string } | null>(null);

  const petugasList = useMemo(() => getPetugas(), [tick]);
  const jadwal = useMemo(() => getJadwal(), [tick]);
  const records = useMemo(() => getRecords(), [tick]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;
    addPetugas(nama, nip);
    setNama("");
    setNip("");
  };

  const hapus = (id: string) => {
    saveJadwal(getJadwal().filter((j) => j.petugasId !== id));
    removePetugas(id);
  };

  return (
    <div className="space-y-5">
      {canEdit && (
        <form onSubmit={submit} className="card p-5 rise">
          <SectionLabel>Tambah Petugas Piket</SectionLabel>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama lengkap & gelar" className="input flex-1" />
            <input value={nip} onChange={(e) => setNip(e.target.value)} placeholder="NIP (opsional)" className="input sm:w-56" />
            <button type="submit" className="btn btn-primary" disabled={!nama.trim()}>
              <IconPlus size={16} /> Tambah
            </button>
          </div>
        </form>
      )}

      <div className="card overflow-hidden rise" style={{ animationDelay: "0.08s" }}>
        <div className="px-5 py-4 bg-ink-900 text-mist-50 flex items-center gap-2.5">
          <IconUsers size={18} className="text-brand-400" />
          <h3 className="font-display font-bold text-lg">Daftar Petugas</h3>
          <span className="ml-auto text-[0.7rem] font-bold uppercase tracking-wider text-mist-300 tnum">{petugasList.length} orang</span>
        </div>

        {petugasList.length === 0 ? (
          <EmptyState title="Belum ada petugas" desc="Tambahkan pegawai yang mendapat giliran piket loket." />
        ) : (
          <ul>
            {petugasList.map((p, i) => {
              const nJadwal = jadwal.filter((j) => j.petugasId === p.id).length;
              const nPres = records.filter((r) => r.petugasId === p.id).length;
              return (
                <li key={p.id} className={`flex items-center gap-3 px-5 py-3.5 border-b border-mist-100 last:border-0 hover:bg-mist-50 transition-colors ${i % 2 ? "bg-mist-50/50" : ""}`}>
                  <PhotoTile src={null} nama={p.nama} className="w-11 h-11" rounded="rounded-xl" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-ink-900 truncate">{p.nama}</p>
                    <p className="text-[0.7rem] text-ink-500 tnum">{p.nip || "NIP tidak dicatat"}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    <Badge tone={nJadwal ? "brand" : "mist"}>{nJadwal} slot jadwal</Badge>
                    <Badge tone="lagoon">{nPres} presensi</Badge>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => setConfirmDel({ id: p.id, nama: p.nama })}
                      className="w-9 h-9 rounded-lg text-ruby-600 hover:bg-ruby-100 flex items-center justify-center transition-colors shrink-0"
                      aria-label={`Hapus ${p.nama}`}
                    >
                      <IconTrash size={17} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Confirm
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        title={`Hapus ${confirmDel?.nama}?`}
        desc="Petugas dihapus dari daftar dan seluruh slot jadwalnya. Riwayat presensi yang sudah tercatat tetap tersimpan."
        confirmLabel="Hapus petugas"
        danger
        onOk={() => confirmDel && hapus(confirmDel.id)}
      />
    </div>
  );
}

/* =============================================================
   Tab: Pengaturan (akun & data)
   ============================================================= */

function PengaturanTab({ account, tick }: { account: Account; tick: number }) {
  const accounts = useMemo(() => getAccounts(), [tick]);

  // tambah akun
  const [nu, setNu] = useState("");
  const [nn, setNn] = useState("");
  const [np, setNp] = useState("");
  const [nr, setNr] = useState<Role>("viewer");
  const [accMsg, setAccMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // ganti sandi
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [conf, setConf] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmSeed, setConfirmSeed] = useState(false);

  const submitAcc = (e: FormEvent) => {
    e.preventDefault();
    const res = addAccount(nu, nn, np, nr);
    if (!res.ok) { setAccMsg({ ok: false, text: res.error ?? "Gagal menambah akun." }); return; }
    setAccMsg({ ok: true, text: `Akun "${nu.trim()}" berhasil dibuat.` });
    setNu(""); setNn(""); setNp(""); setNr("viewer");
  };

  const submitPw = (e: FormEvent) => {
    e.preventDefault();
    if (next !== conf) { setPwMsg({ ok: false, text: "Konfirmasi kata sandi tidak sama." }); return; }
    const res = changePassword(account.username, cur, next);
    if (!res.ok) { setPwMsg({ ok: false, text: res.error ?? "Gagal mengganti sandi." }); return; }
    setPwMsg({ ok: true, text: "Kata sandi berhasil diganti." });
    setCur(""); setNext(""); setConf("");
  };

  const Msg = ({ m }: { m: { ok: boolean; text: string } }) => (
    <p className={`flex items-start gap-2 text-[0.8rem] font-semibold rounded-lg px-3.5 py-2.5 ${m.ok ? "bg-lagoon-100 text-lagoon-700" : "bg-ruby-100 text-ruby-700"}`}>
      {m.ok ? <IconCheck size={15} className="shrink-0 mt-0.5" /> : <IconAlert size={15} className="shrink-0 mt-0.5" />} {m.text}
    </p>
  );

  return (
    <div className="grid lg:grid-cols-2 gap-5 items-start">
      {/* akun akses */}
      <div className="card p-5 rise">
        <SectionLabel>Akun Akses Konsol</SectionLabel>
        <ul className="mt-4 space-y-2">
          {accounts.map((a) => (
            <li key={a.username} className="flex items-center gap-3 bg-mist-50 border border-mist-200 rounded-xl px-3.5 py-3">
              <span className="w-9 h-9 rounded-lg bg-ink-900 text-brand-400 flex items-center justify-center font-display font-bold text-sm">
                {a.nama.slice(0, 1).toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-ink-900 text-sm truncate">
                  {a.nama}
                  {a.username === account.username && <span className="text-[0.65rem] text-brand-600 font-extrabold ml-1.5">(Anda)</span>}
                </p>
                <p className="text-[0.68rem] text-ink-500 tnum">@{a.username}</p>
              </div>
              <Badge tone={a.role === "admin" ? "ink" : "lagoon"}>{a.role === "admin" ? "Admin penuh" : "Lihat saja"}</Badge>
              <button
                onClick={() => removeAccount(a.username)}
                disabled={a.username === account.username || (a.role === "admin" && accounts.filter((x) => x.role === "admin").length <= 1)}
                className="w-8 h-8 rounded-lg text-ruby-600 hover:bg-ruby-100 disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center transition-colors shrink-0"
                aria-label={`Hapus akun ${a.username}`}
                title={a.username === account.username ? "Tidak dapat menghapus akun sendiri" : undefined}
              >
                <IconTrash size={15} />
              </button>
            </li>
          ))}
        </ul>
        <p className="text-[0.7rem] text-ink-500 mt-2.5">
          Admin dapat mengubah jadwal & petugas; akun "Lihat saja" hanya membuka rekap.
        </p>

        <form onSubmit={submitAcc} className="mt-5 border-t border-mist-200 pt-4">
          <p className="text-[0.7rem] font-extrabold tracking-[0.12em] uppercase text-ink-500 mb-3">Buat akun baru</p>
          <div className="grid sm:grid-cols-2 gap-2">
            <input value={nu} onChange={(e) => setNu(e.target.value)} placeholder="Nama pengguna" className="input" autoComplete="off" />
            <input value={nn} onChange={(e) => setNn(e.target.value)} placeholder="Nama tampilan" className="input" />
            <input value={np} onChange={(e) => setNp(e.target.value)} type="password" placeholder="Kata sandi (min. 6)" className="input" autoComplete="new-password" />
            <select value={nr} onChange={(e) => setNr(e.target.value as Role)} className="input font-semibold">
              <option value="viewer">Peran: Lihat saja</option>
              <option value="admin">Peran: Admin penuh</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-sm mt-3">
            <IconPlus size={14} /> Tambah Akun
          </button>
          {accMsg && <div className="mt-3"><Msg m={accMsg} /></div>}
        </form>
      </div>

      <div className="space-y-5">
        {/* ganti sandi */}
        <form onSubmit={submitPw} className="card p-5 rise" style={{ animationDelay: "0.08s" }}>
          <SectionLabel>Ganti Kata Sandi Saya</SectionLabel>
          <div className="space-y-2 mt-4">
            <input value={cur} onChange={(e) => setCur(e.target.value)} type="password" placeholder="Kata sandi lama" className="input" autoComplete="current-password" />
            <input value={next} onChange={(e) => setNext(e.target.value)} type="password" placeholder="Kata sandi baru (min. 6)" className="input" autoComplete="new-password" />
            <input value={conf} onChange={(e) => setConf(e.target.value)} type="password" placeholder="Ulangi kata sandi baru" className="input" autoComplete="new-password" />
          </div>
          <button type="submit" className="btn btn-primary btn-sm mt-3" disabled={!cur || !next || !conf}>
            <IconShield size={14} /> Simpan Sandi Baru
          </button>
          {pwMsg && <div className="mt-3"><Msg m={pwMsg} /></div>}
        </form>

        {/* data */}
        <div className="card p-5 rise" style={{ animationDelay: "0.14s" }}>
          <SectionLabel>Data & Penyimpanan</SectionLabel>
          <p className="text-sm text-ink-500 mt-3 tnum">
            Seluruh data tersimpan lokal di perangkat ini (± <strong className="text-ink-800">{storageSizeKB()} KB</strong>).
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <button onClick={() => setConfirmSeed(true)} className="btn btn-light btn-sm">
              <IconRefresh size={14} /> Muat Ulang Data Contoh
            </button>
            <button onClick={() => setConfirmClear(true)} className="btn btn-danger btn-sm">
              <IconTrash size={14} /> Hapus Semua Data
            </button>
          </div>
          <p className="text-[0.7rem] text-ink-500 mt-3">
            Menghapus data tidak menghapus akun — Anda tetap bisa masuk setelahnya.
          </p>
        </div>
      </div>

      <Confirm
        open={confirmSeed}
        onClose={() => setConfirmSeed(false)}
        title="Muat ulang data contoh?"
        desc="Data petugas, presensi, dan jadwal saat ini akan DIGANTI dengan data contoh baru."
        confirmLabel="Muat ulang"
        onOk={() => seedDemo(true)}
      />
      <Confirm
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Hapus semua data?"
        desc="Seluruh petugas, jadwal piket, sesi QR, dan catatan presensi akan dihapus permanen dari perangkat ini. Akun login tetap ada."
        confirmLabel="Hapus semua"
        danger
        onOk={() => clearAllData()}
      />
    </div>
  );
}

/* =============================================================
   Halaman Admin
   ============================================================= */

export default function Admin() {
  const [account, setAccount] = useState<Account | null>(() => getAuth());
  const [tab, setTab] = useState<Tab>("rekap");
  const [tick, setTick] = useState(0);
  useEffect(() => onSync(() => setTick((x) => x + 1)), []);

  if (!account) return <LoginScreen onSuccess={setAccount} />;

  const canEdit = account.role === "admin";

  const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: "rekap", label: "Rekap Presensi", icon: <IconClock size={16} /> },
    { id: "jadwal", label: "Jadwal Piket", icon: <IconCalendar size={16} /> },
    { id: "petugas", label: "Petugas", icon: <IconUsers size={16} /> },
    ...(canEdit ? [{ id: "pengaturan" as Tab, label: "Pengaturan", icon: <IconShield size={16} /> }] : []),
  ];

  return (
    <div className="min-h-screen bg-papergrid">
      {/* header */}
      <header className="bg-ink-900 text-mist-50 sticky top-0 z-40 shadow-lg shadow-ink-950/20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 py-3.5">
            <a href="#/" className="flex items-center gap-2.5 group">
              <span className="w-9 h-9 rounded-lg bg-brand-500 text-ink-950 flex items-center justify-center group-hover:rotate-[-6deg] transition-transform">
                <LogoMark size={22} />
              </span>
              <span className="font-display font-bold leading-tight hidden xs:block sm:block">
                SIPELOK
                <span className="block text-[0.62rem] font-body font-semibold tracking-[0.14em] uppercase text-mist-300">Konsol Admin</span>
              </span>
            </a>

            <div className="ml-auto flex items-center gap-2.5">
              {!canEdit && <Badge tone="amber">Mode lihat saja</Badge>}
              <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 rounded-full pl-1.5 pr-3 py-1">
                <span className="w-6 h-6 rounded-full bg-brand-500 text-ink-950 text-[0.65rem] font-extrabold flex items-center justify-center">
                  {account.nama.slice(0, 1).toUpperCase()}
                </span>
                <span className="text-sm font-bold">{account.nama}</span>
                <span className="text-[0.62rem] font-bold uppercase tracking-wider text-mist-300">{account.role}</span>
              </div>
              <button
                onClick={() => { logout(); setAccount(null); }}
                className="btn btn-light btn-sm"
                title="Keluar dari konsol"
              >
                <IconLogout size={15} /> <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          </div>

          {/* tab bar */}
          <nav className="flex gap-1 -mb-px overflow-x-auto slim-scroll">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-bold whitespace-nowrap transition-all ${
                  tab === t.id
                    ? "bg-mist-50 text-ink-900 shadow-inner"
                    : "text-mist-300 hover:text-mist-50 hover:bg-white/5"
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {tab === "rekap" && <RekapTab tick={tick} onAturJadwal={() => setTab("jadwal")} />}
        {tab === "jadwal" && <JadwalTab tick={tick} canEdit={canEdit} />}
        {tab === "petugas" && <PetugasTab tick={tick} canEdit={canEdit} />}
        {tab === "pengaturan" && canEdit && <PengaturanTab account={account} tick={tick} />}
      </main>

      <footer className="max-w-6xl mx-auto px-4 pb-8 text-[0.7rem] text-ink-500 font-semibold">
        SIPELOK · Badan Pusat Statistik Kabupaten Konawe — presensi piket loket pelayanan, terpisah dari presensi kepegawaian.
      </footer>
    </div>
  );
}
