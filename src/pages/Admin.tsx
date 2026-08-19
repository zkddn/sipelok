import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  addPetugas,
  ADMIN_PIN,
  clearAllData,
  durasiMenit,
  exportCsv,
  fmtDateShort,
  fmtDurasi,
  fmtHM,
  getPetugas,
  getRecords,
  menitTerlambat,
  onSync,
  removePetugas,
  seedDemo,
  storageSizeKB,
  todayStr,
  type PresensiRecord,
} from "../lib/store";
import { navigate } from "../lib/hooks";
import {
  IconBadgeId, IconCalendar, IconDownload, IconEye, IconLogout, IconPlus,
  IconSearch, IconShield, IconTrash, IconUsers, LogoMark, IconX, IconRefresh,
} from "../components/icons";
import { Badge, EmptyState, Modal, PhotoTile, RecordStatus } from "../components/ui";

const pad = (n: number) => String(n).padStart(2, "0");
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return todayStr(d);
};

/* ================= PIN GATE ================= */

function PinGate({ onOk }: { onOk: () => void }) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const submit = () => {
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem("sipelok.admin", "1");
      onOk();
    } else {
      setShake(true);
      setPin("");
      setTimeout(() => setShake(false), 450);
    }
  };
  return (
    <div className="min-h-screen bg-board flex items-center justify-center p-6">
      <div className={`card w-full max-w-sm p-7 text-center rise ${shake ? "shake" : ""}`}>
        <span className="w-14 h-14 mx-auto rounded-2xl bg-ink-900 text-brand-400 flex items-center justify-center mb-4">
          <IconShield size={30} />
        </span>
        <h1 className="font-display font-extrabold text-2xl text-ink-900">Area Admin</h1>
        <p className="text-sm text-ink-500 mt-1">Masukkan PIN untuk membuka rekap presensi piket.</p>
        <form
          onSubmit={(e) => { e.preventDefault(); submit(); }}
          className="mt-5 flex gap-2"
        >
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="PIN admin"
            className="input text-center tracking-[0.5em] font-bold"
            aria-label="PIN admin"
          />
          <button type="submit" className="btn btn-primary shrink-0">Buka</button>
        </form>
        {shake && <p className="text-ruby-700 text-xs font-bold mt-2">PIN salah — coba lagi.</p>}
        <p className="text-[0.7rem] text-ink-500 mt-4">
          PIN demo: <code className="bg-mist-100 px-1.5 py-0.5 rounded font-bold text-ink-700">1234</code> · <button className="underline hover:text-brand-600" onClick={() => navigate("/")}>kembali ke beranda</button>
        </p>
      </div>
    </div>
  );
}

/* ================= LIGHTBOX ================= */

function Lightbox({ r, onClose }: { r: PresensiRecord | null; onClose: () => void }) {
  if (!r) return null;
  const telat = menitTerlambat(r);
  return (
    <Modal open onClose={onClose} wide>
      <div className="flex items-center gap-3 mb-4 pr-8">
        <PhotoTile src={r.fotoMasuk} nama={r.nama} className="w-12 h-12" />
        <div>
          <h3 className="font-display font-extrabold text-xl text-ink-900 leading-tight">{r.nama}</h3>
          <p className="text-xs text-ink-500 tnum">{fmtDateShort(r.date)} · Shift {r.shift} · {r.keluar ? `durasi ${fmtDurasi(durasiMenit(r))}` : "masih bertugas"}</p>
        </div>
        <div className="ml-auto"><RecordStatus r={r} /></div>
      </div>
      {telat > 0 && (
        <p className="mb-3 text-xs font-bold text-amberx-700 bg-amberx-100 rounded-lg px-3 py-2">
          Terlambat {telat} menit dari jadwal masuk shift (toleransi 10 menit).
        </p>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        <figure>
          <figcaption className="text-[0.7rem] font-extrabold uppercase tracking-wider text-ink-500 mb-2">
            Foto masuk · {fmtHM(r.masuk)}
          </figcaption>
          {r.fotoMasuk ? (
            <img src={r.fotoMasuk} alt={`Foto masuk ${r.nama}`} className="w-full rounded-xl border border-mist-200 object-cover max-h-80" />
          ) : (
            <div className="h-48 rounded-xl bg-mist-100 border border-dashed border-mist-300 flex items-center justify-center text-ink-500 text-sm font-semibold">
              Belum ada foto (data contoh)
            </div>
          )}
        </figure>
        <figure>
          <figcaption className="text-[0.7rem] font-extrabold uppercase tracking-wider text-ink-500 mb-2">
            Foto pulang · {r.keluar ? fmtHM(r.keluar) : "—"}
          </figcaption>
          {r.fotoKeluar ? (
            <img src={r.fotoKeluar} alt={`Foto pulang ${r.nama}`} className="w-full rounded-xl border border-mist-200 object-cover max-h-80" />
          ) : (
            <div className="h-48 rounded-xl bg-mist-100 border border-dashed border-mist-300 flex items-center justify-center text-ink-500 text-sm font-semibold">
              {r.keluar ? "Tidak mengambil foto pulang" : "Belum presensi pulang"}
            </div>
          )}
        </figure>
      </div>
      <p className="text-[0.7rem] text-ink-500 mt-4">
        Foto digunakan kasubbag umum untuk memverifikasi kelengkapan atribut petugas: rompi layanan, name tag, dan tanda pengenal.
      </p>
    </Modal>
  );
}

/* ================= TAB REKAP ================= */

type Quick = "today" | "7d" | "month" | "all";

function RekapTab() {
  const [q, setQ] = useState("");
  const [from, setFrom] = useState(daysAgo(6));
  const [to, setTo] = useState(todayStr());
  const [shift, setShift] = useState(0);
  const [quick, setQuick] = useState<Quick>("7d");
  const [view, setView] = useState<PresensiRecord | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => onSync(() => setTick((x) => x + 1)), []);

  const all = useMemo(() => getRecords(), [tick]);
  const rows = useMemo(() => {
    return all
      .filter((r) => (from === "" || r.date >= from) && (to === "" || r.date <= to))
      .filter((r) => (shift === 0 ? true : r.shift === shift))
      .filter((r) => r.nama.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => b.date.localeCompare(a.date) || a.shift - b.shift || a.masuk.localeCompare(b.masuk));
  }, [all, from, to, shift, q]);

  const stats = useMemo(() => {
    const selesai = rows.filter((r) => r.keluar).length;
    const aktif = rows.length - selesai;
    const telat = rows.filter((r) => menitTerlambat(r) > 0).length;
    return { total: rows.length, selesai, aktif, telat };
  }, [rows]);

  const applyQuick = (k: Quick) => {
    setQuick(k);
    if (k === "today") { setFrom(todayStr()); setTo(todayStr()); }
    if (k === "7d") { setFrom(daysAgo(6)); setTo(todayStr()); }
    if (k === "month") { setFrom(todayStr().slice(0, 8) + "01"); setTo(todayStr()); }
    if (k === "all") { setFrom(""); setTo(""); }
  };

  return (
    <div className="space-y-4">
      {/* toolbar */}
      <div className="card p-4 flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[180px]">
          <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama petugas…" className="input input-search" />
        </div>
        <label className="flex items-center gap-1.5 text-xs font-bold text-ink-500">
          <IconCalendar size={15} />
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setQuick("all"); }} className="input input-inline" aria-label="Dari tanggal" />
          –
          <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setQuick("all"); }} className="input input-inline" aria-label="Sampai tanggal" />
        </label>
        <select value={shift} onChange={(e) => setShift(Number(e.target.value))} className="input input-inline font-semibold" aria-label="Filter shift">
          <option value={0}>Semua Shift</option>
          <option value={1}>Shift 1 · Pagi</option>
          <option value={2}>Shift 2 · Siang</option>
        </select>
        <button onClick={() => exportCsv(rows)} className="btn btn-primary btn-sm ml-auto" disabled={rows.length === 0}>
          <IconDownload size={16} /> Ekspor CSV ({rows.length})
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {([["today", "Hari Ini"], ["7d", "7 Hari"], ["month", "Bulan Ini"], ["all", "Semua"]] as [Quick, string][]).map(([k, label]) => (
          <button
            key={k}
            onClick={() => applyQuick(k)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              quick === k ? "bg-ink-900 text-mist-50" : "bg-mist-100 text-ink-600 hover:bg-mist-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* strip statistik */}
      <div className="card grid grid-cols-2 md:grid-cols-4 divide-x divide-mist-200 overflow-hidden">
        {[
          { v: stats.total, l: "Total presensi", c: "text-ink-900" },
          { v: stats.selesai, l: "Selesai bertugas", c: "text-ink-700" },
          { v: stats.aktif, l: "Sedang bertugas", c: "text-lagoon-600" },
          { v: stats.telat, l: "Terlambat", c: stats.telat > 0 ? "text-amberx-700" : "text-ink-700" },
        ].map((s, i) => (
          <div key={i} className="px-5 py-4">
            <p className={`font-display font-extrabold text-3xl tnum ${s.c}`}>{s.v}</p>
            <p className="text-[0.68rem] font-bold uppercase tracking-wider text-ink-500 mt-0.5">{s.l}</p>
          </div>
        ))}
      </div>

      {/* tabel */}
      <div className="card overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState title="Tidak ada data pada filter ini" desc="Ubah rentang tanggal atau shift, atau tunggu petugas melakukan presensi dari layar loket." />
        ) : (
          <div className="overflow-x-auto slim-scroll">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="bg-ink-900 text-mist-50 text-[0.7rem] uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-extrabold">Tanggal</th>
                  <th className="text-left px-4 py-3 font-extrabold">Shift</th>
                  <th className="text-left px-4 py-3 font-extrabold">Petugas</th>
                  <th className="text-left px-4 py-3 font-extrabold">Masuk</th>
                  <th className="text-left px-4 py-3 font-extrabold">Keluar</th>
                  <th className="text-left px-4 py-3 font-extrabold">Durasi</th>
                  <th className="text-left px-4 py-3 font-extrabold">Status</th>
                  <th className="text-left px-4 py-3 font-extrabold">Foto</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-mist-100 hover:bg-brand-50/60 transition-colors">
                    <td className="px-4 py-2.5 whitespace-nowrap text-ink-700 font-semibold">{fmtDateShort(r.date)}</td>
                    <td className="px-4 py-2.5"><Badge tone={r.shift === 1 ? "brand" : "mist"}>Shift {r.shift}</Badge></td>
                    <td className="px-4 py-2.5 font-bold text-ink-900">{r.nama}</td>
                    <td className="px-4 py-2.5 tnum font-semibold text-lagoon-700">{fmtHM(r.masuk)}</td>
                    <td className="px-4 py-2.5 tnum font-semibold text-ink-700">{fmtHM(r.keluar)}</td>
                    <td className="px-4 py-2.5 tnum text-ink-600">{fmtDurasi(durasiMenit(r))}</td>
                    <td className="px-4 py-2.5"><RecordStatus r={r} /></td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => setView(r)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-600 hover:text-brand-600 transition-colors"
                        aria-label={`Lihat foto ${r.nama}`}
                      >
                        <PhotoTile src={r.fotoMasuk} nama={r.nama} className="w-8 h-8" rounded="rounded-md" />
                        <IconEye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Lightbox r={view} onClose={() => setView(null)} />
    </div>
  );
}

/* ================= TAB PETUGAS ================= */

function PetugasTab() {
  const [nama, setNama] = useState("");
  const [nip, setNip] = useState("");
  const [tick, setTick] = useState(0);
  useEffect(() => onSync(() => setTick((x) => x + 1)), []);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const list = useMemo(() => getPetugas(), [tick]);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    getRecords().forEach((r) => m.set(r.petugasId, (m.get(r.petugasId) ?? 0) + 1));
    return m;
  }, [tick]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;
    addPetugas(nama, nip);
    setNama("");
    setNip("");
  };

  return (
    <div className="grid lg:grid-cols-[1fr_1.4fr] gap-4 items-start">
      <form onSubmit={submit} className="card p-5">
        <h3 className="font-display font-extrabold text-lg text-ink-900 flex items-center gap-2">
          <IconPlus size={18} className="text-brand-500" /> Tambah Petugas
        </h3>
        <p className="text-xs text-ink-500 mt-1 mb-4">Nama harus sama dengan daftar giliran piket agar mudah dipilih saat scan.</p>
        <label className="block text-[0.7rem] font-extrabold uppercase tracking-wider text-ink-500 mb-1">Nama lengkap & gelar</label>
        <input value={nama} onChange={(e) => setNama(e.target.value)} className="input mb-3" placeholder="cth: Nur Aini, S.Stat" />
        <label className="block text-[0.7rem] font-extrabold uppercase tracking-wider text-ink-500 mb-1">NIP (opsional)</label>
        <input value={nip} onChange={(e) => setNip(e.target.value)} className="input mb-4" placeholder="18 digit NIP" />
        <button type="submit" className="btn btn-primary w-full" disabled={!nama.trim()}>
          <IconPlus size={16} /> Simpan ke Daftar Piket
        </button>
      </form>

      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-mist-200 flex items-center gap-2">
          <IconUsers size={17} className="text-ink-500" />
          <h3 className="font-display font-bold text-ink-900">Daftar Petugas Piket</h3>
          <Badge tone="mist" className="ml-auto">{list.length} orang</Badge>
        </div>
        <ul className="divide-y divide-mist-100 max-h-[52vh] overflow-y-auto slim-scroll">
          {list.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-mist-50 transition-colors">
              <PhotoTile src={null} nama={p.nama} className="w-10 h-10" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-ink-900 truncate">{p.nama}</p>
                <p className="text-[0.72rem] text-ink-500 tnum">{p.nip ?? "NIP tidak dicatat"}</p>
              </div>
              <Badge tone="mist">{counts.get(p.id) ?? 0}× presensi</Badge>
              <button
                onClick={() => setConfirmDel(p.id)}
                className="w-8 h-8 rounded-lg text-ruby-700 hover:bg-ruby-100 flex items-center justify-center transition-colors"
                aria-label={`Hapus ${p.nama}`}
              >
                <IconTrash size={16} />
              </button>
            </li>
          ))}
          {list.length === 0 && <EmptyState title="Belum ada petugas" desc="Tambahkan pegawai yang mendapat giliran piket loket." />}
        </ul>
      </div>

      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)}>
        <h3 className="font-display font-extrabold text-lg text-ink-900 pr-8">Hapus petugas?</h3>
        <p className="text-sm text-ink-500 mt-1.5">
          Nama <strong>{list.find((p) => p.id === confirmDel)?.nama}</strong> akan hilang dari daftar pilihan saat scan.
          Riwayat presensinya tetap tersimpan.
        </p>
        <div className="flex gap-2 mt-5 justify-end">
          <button className="btn btn-ghost" onClick={() => setConfirmDel(null)}>Batal</button>
          <button
            className="btn btn-danger"
            onClick={() => {
              if (confirmDel) removePetugas(confirmDel);
              setConfirmDel(null);
            }}
          >
            <IconTrash size={15} /> Ya, Hapus
          </button>
        </div>
      </Modal>
    </div>
  );
}

/* ================= TAB DATA ================= */

function DataTab() {
  const [tick, setTick] = useState(0);
  useEffect(() => onSync(() => setTick((x) => x + 1)), []);
  const [confirmClear, setConfirmClear] = useState(false);
  const size = useMemo(() => storageSizeKB(), [tick]);

  return (
    <div className="grid md:grid-cols-2 gap-4 items-start">
      <div className="card p-6">
        <h3 className="font-display font-extrabold text-lg text-ink-900 flex items-center gap-2"><IconBadgeId size={19} className="text-brand-500" /> Penyimpanan Lokal</h3>
        <p className="text-sm text-ink-500 mt-2 leading-relaxed">
          Seluruh data presensi (termasuk foto yang sudah dikompres) tersimpan di peramban ini. Untuk produksi, hubungkan
          dengan basis data server BPS.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-mist-50 border border-mist-200 rounded-xl p-4">
            <p className="font-display font-extrabold text-2xl tnum text-ink-900">{size} KB</p>
            <p className="text-[0.68rem] font-bold uppercase tracking-wider text-ink-500">Ukuran terpakai</p>
          </div>
          <div className="bg-mist-50 border border-mist-200 rounded-xl p-4">
            <p className="font-display font-extrabold text-2xl tnum text-ink-900">{getRecords().length}</p>
            <p className="text-[0.68rem] font-bold uppercase tracking-wider text-ink-500">Record presensi</p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-display font-extrabold text-lg text-ink-900 flex items-center gap-2"><IconRefresh size={19} className="text-lagoon-600" /> Alat Demo</h3>
        <div className="mt-4 space-y-3">
          <button
            className="btn btn-ghost w-full"
            onClick={() => { seedDemo(true); setTimeout(() => window.location.reload(), 300); }}
          >
            <IconRefresh size={16} /> Muat ulang data contoh
          </button>
          <button className="btn btn-danger w-full" onClick={() => setConfirmClear(true)}>
            <IconTrash size={16} /> Hapus semua data
          </button>
        </div>
        <p className="text-xs text-ink-500 mt-3">Setelah menghapus data, halaman loket akan membuat QR & sesi baru secara otomatis.</p>
      </div>

      <Modal open={confirmClear} onClose={() => setConfirmClear(false)}>
        <h3 className="font-display font-extrabold text-lg text-ink-900 pr-8">Hapus seluruh data?</h3>
        <p className="text-sm text-ink-500 mt-1.5">Semua record presensi, daftar petugas, dan sesi QR akan dihapus permanen dari peramban ini.</p>
        <div className="flex gap-2 mt-5 justify-end">
          <button className="btn btn-ghost" onClick={() => setConfirmClear(false)}>Batal</button>
          <button className="btn btn-danger" onClick={() => { clearAllData(); setConfirmClear(false); setTimeout(() => window.location.reload(), 300); }}>
            <IconX size={15} /> Hapus Permanen
          </button>
        </div>
      </Modal>
    </div>
  );
}

/* ================= HALAMAN ADMIN ================= */

type Tab = "rekap" | "petugas" | "data";

export default function Admin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("sipelok.admin") === "1");
  const [tab, setTab] = useState<Tab>("rekap");

  useEffect(() => {
    seedDemo();
  }, []);

  if (!authed) return <PinGate onOk={() => setAuthed(true)} />;

  const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: "rekap", label: "Rekap Presensi", icon: <IconCalendar size={16} /> },
    { id: "petugas", label: "Petugas Piket", icon: <IconUsers size={16} /> },
    { id: "data", label: "Data & Demo", icon: <IconBadgeId size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-papergrid">
      <header className="bg-ink-900 text-mist-50">
        <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center gap-3">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5 group" aria-label="Ke beranda">
            <span className="w-9 h-9 rounded-lg bg-brand-500 text-ink-950 flex items-center justify-center group-hover:rotate-[-6deg] transition-transform">
              <LogoMark size={22} />
            </span>
            <span className="font-display font-bold leading-tight">SIPELOK <span className="block text-[0.65rem] font-body font-semibold text-mist-300 -mt-0.5">Admin · BPS Kab. Konawe</span></span>
          </button>
          <nav className="ml-6 hidden sm:flex gap-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[0.8rem] font-bold transition-all ${
                  tab === t.id ? "bg-brand-500 text-ink-950" : "text-mist-300 hover:bg-white/10 hover:text-mist-50"
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </nav>
          <button
            onClick={() => { sessionStorage.removeItem("sipelok.admin"); setAuthed(false); }}
            className="ml-auto btn btn-light btn-sm"
          >
            <IconLogout size={15} /> Kunci
          </button>
        </div>
        <nav className="sm:hidden px-4 pb-3 flex gap-1.5 overflow-x-auto slim-scroll">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[0.78rem] font-bold whitespace-nowrap transition-all ${
                tab === t.id ? "bg-brand-500 text-ink-950" : "text-mist-300 bg-white/5"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-6">
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-[0.7rem] font-extrabold tracking-[0.16em] uppercase text-ink-500">Panel Admin</p>
            <h1 className="font-display font-extrabold text-3xl text-ink-900">
              {tab === "rekap" && "Rekap Presensi Piket Loket"}
              {tab === "petugas" && "Manajemen Petugas Piket"}
              {tab === "data" && "Data & Pengaturan Demo"}
            </h1>
          </div>
        </div>
        <div key={tab} className="fadein">
          {tab === "rekap" && <RekapTab />}
          {tab === "petugas" && <PetugasTab />}
          {tab === "data" && <DataTab />}
        </div>
      </main>

      <footer className="max-w-6xl mx-auto px-5 pb-8 text-[0.7rem] text-ink-500">
        SIPELOK · Sistem Presensi Piket Loket Pelayanan — Badan Pusat Statistik Kabupaten Konawe
      </footer>
    </div>
  );
}
