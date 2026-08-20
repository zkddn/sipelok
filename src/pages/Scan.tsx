import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  checkIn,
  checkOut,
  fileToDataUrl,
  findOpenRecord,
  findSessionByToken,
  fmtDateLong,
  fmtHM,
  getPetugas,
  jadwalUntuk,
  menitTerlambat,
  onSync,
  shiftDef,
  type PresensiRecord,
} from "../lib/store";
import { useNow } from "../lib/hooks";
import { IconAlert, IconBadgeId, IconCalendar, IconCamera, IconCheck, IconChevronDown, IconSun, IconSunset, IconX, LogoMark } from "../components/icons";
import { Badge, PhotoTile } from "../components/ui";

const pad = (n: number) => String(n).padStart(2, "0");

type Mode = "masuk" | "keluar";

export default function Scan({ token }: { token?: string }) {
  const now = useNow();
  const [tick, setTick] = useState(0);
  useEffect(() => onSync(() => setTick((x) => x + 1)), []);

  const session = useMemo(() => findSessionByToken(token ?? ""), [token]);
  const def = session ? shiftDef(session.shift) : null;

  const petugasList = useMemo(() => getPetugas(), [session, tick]);
  const [petugasId, setPetugasId] = useState("");
  const [mode, setMode] = useState<Mode>("masuk");
  const [foto, setFoto] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [fotoBusy, setFotoBusy] = useState(false);
  const [result, setResult] = useState<{ record: PresensiRecord; mode: Mode } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // deteksi status presensi petugas terpilih
  const openRec = session && petugasId ? findOpenRecord(session.date, session.shift, petugasId) : null;
  const namaTerpilih = petugasList.find((p) => p.id === petugasId)?.nama ?? "";

  // cek kesesuaian dengan jadwal piket mingguan
  const jadwalNote = useMemo(() => {
    if (!session || !petugasId) return "";
    const j = jadwalUntuk(new Date(`${session.date}T12:00:00`)).find((x) => x.petugasId === petugasId);
    if (!j) return "";
    const d = shiftDef(j.shift);
    return `Sesuai jadwal piket: ${d.label} · ${d.nama} (${d.waktu} WITA)`;
  }, [session, petugasId, tick]);

  const pilihPetugas = (id: string) => {
    setPetugasId(id);
    setFoto(null);
    setError("");
    setInfo("");
    if (!session || !id) return;
    const open = findOpenRecord(session.date, session.shift, id);
    if (open) {
      setMode("keluar");
      setInfo(`Sudah presensi masuk pukul ${fmtHM(open.masuk)}. Lanjutkan dengan presensi pulang.`);
    } else {
      setMode("masuk");
    }
  };

  const gantiMode = (m: Mode) => {
    setMode(m);
    setError("");
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setFotoBusy(true);
    setError("");
    try {
      const dataUrl = await fileToDataUrl(f);
      setFoto(dataUrl);
    } catch {
      setError("Foto gagal dibaca. Coba ambil ulang.");
    } finally {
      setFotoBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const valid = petugasId !== "" && (mode === "keluar" || foto !== null) && !busy && !fotoBusy;

  const submit = () => {
    if (!valid || !session) return;
    setBusy(true);
    setError("");
    // jeda singkat agar terasa "terkirim"
    setTimeout(() => {
      const res = mode === "masuk" ? checkIn(session.token, petugasId, foto) : checkOut(session.token, petugasId, foto);
      setBusy(false);
      if (!res.ok) {
        setError(res.error);
        if (res.code === "ALREADY_IN") setMode("keluar");
        if (res.code === "NOT_IN_YET") setMode("masuk");
        return;
      }
      setResult({ record: res.record, mode });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 650);
  };

  /* ---------- token tidak valid ---------- */
  if (!session || !def) {
    return (
      <Shell now={now}>
        <div className="card p-6 text-center rise">
          <span className="w-14 h-14 mx-auto rounded-2xl bg-ruby-100 text-ruby-700 flex items-center justify-center mb-4">
            <IconAlert size={30} />
          </span>
          <h2 className="font-display font-extrabold text-xl text-ink-900">QR tidak dikenali</h2>
          <p className="text-sm text-ink-500 mt-2 leading-relaxed">
            Tautan atau token QR ini tidak valid — mungkin sudah diperbarui oleh admin loket. Silakan pindai ulang QR yang
            tampil di layar loket pelayanan.
          </p>
          <a href="#/" className="btn btn-primary mt-5">Kembali ke Beranda</a>
        </div>
      </Shell>
    );
  }

  /* ---------- sukses ---------- */
  if (result) {
    const r = result.record;
    const telat = menitTerlambat(r);
    return (
      <Shell now={now} defLabel={`${def.label} · ${def.nama}`}>
        <div className="card p-6 text-center rise">
          <span className="pop-check w-20 h-20 mx-auto rounded-full bg-lagoon-600 text-white flex items-center justify-center shadow-xl shadow-lagoon-600/30">
            <IconCheck size={44} />
          </span>
          <h2 className="font-display font-extrabold text-2xl text-ink-900 mt-4">
            {result.mode === "masuk" ? "Presensi Masuk Tersimpan" : "Presensi Pulang Tersimpan"}
          </h2>
          <p className="text-sm text-ink-500 mt-1 capitalize">{fmtDateLong(r.date)} · {def.waktu} WITA</p>

          <div className="mt-5 bg-mist-50 border border-mist-200 rounded-xl p-4 text-left flex items-center gap-4">
            <PhotoTile src={result.mode === "masuk" ? r.fotoMasuk : r.fotoKeluar ?? r.fotoMasuk} nama={r.nama} className="w-16 h-16" rounded="rounded-xl" />
            <div>
              <p className="font-display font-bold text-ink-900">{r.nama}</p>
              <p className="text-sm text-ink-500 tnum mt-0.5">
                Masuk <strong className="text-lagoon-700">{fmtHM(r.masuk)}</strong>
                {r.keluar && <> · Keluar <strong className="text-ink-700">{fmtHM(r.keluar)}</strong></>}
              </p>
              {telat > 0 && <Badge tone="amber" className="mt-1.5">Terlambat {telat} menit dari jadwal</Badge>}
            </div>
          </div>

          <p className="text-xs text-ink-500 mt-4 leading-relaxed">
            {r.keluar
              ? "Terima kasih! Giliran piketmu hari ini sudah tercatat lengkap."
              : "Jangan lupa scan lagi QR loket saat selesai bertugas untuk mencatat jam pulang."}
          </p>
          <button
            className="btn btn-primary mt-5 w-full"
            onClick={() => {
              setResult(null);
              setPetugasId("");
              setFoto(null);
              setInfo("");
              setError("");
              setMode("masuk");
            }}
          >
            Presensi Petugas Lain
          </button>
        </div>
      </Shell>
    );
  }

  /* ---------- formulir ---------- */
  return (
    <Shell now={now} defLabel={`${def.label} · ${def.nama}`}>
      <div className="card overflow-hidden rise">
        <div className="bg-ink-900 text-mist-50 px-5 py-4 flex items-center gap-3">
          <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${session.shift === 1 ? "bg-brand-500 text-ink-950" : "bg-lagoon-600 text-white"}`}>
            {session.shift === 1 ? <IconSun size={22} /> : <IconSunset size={22} />}
          </span>
          <div className="flex-1">
            <p className="font-display font-bold leading-tight">Giliran Piket: {def.label} ({def.nama})</p>
            <p className="text-[0.72rem] text-mist-300 tnum">{def.waktu} WITA · Token {session.token}</p>
          </div>
          <span className="font-display font-extrabold text-2xl tnum">{pad(now.getHours())}:{pad(now.getMinutes())}</span>
        </div>

        <div className="p-5 space-y-5">
          {info && (
            <div className="flex items-start gap-2.5 bg-lagoon-100 text-lagoon-700 text-[0.8rem] font-semibold rounded-lg px-3.5 py-3">
              <IconCheck size={17} className="shrink-0 mt-0.5" /> {info}
            </div>
          )}

          {/* nama */}
          <div>
            <label className="flex items-center gap-1.5 text-[0.72rem] font-extrabold tracking-[0.12em] uppercase text-ink-500 mb-1.5">
              <IconBadgeId size={15} /> 1 · Nama Petugas
            </label>
            <div className="relative">
              <select value={petugasId} onChange={(e) => pilihPetugas(e.target.value)} className="input appearance-none pr-10 font-semibold" required>
                <option value="">— Pilih namamu dari daftar piket —</option>
                {petugasList.map((p) => (
                  <option key={p.id} value={p.id}>{p.nama}</option>
                ))}
              </select>
              <IconChevronDown size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 pointer-events-none" />
            </div>
            {jadwalNote && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-[0.72rem] font-bold text-brand-600 bg-brand-100 rounded-lg px-2.5 py-1.5">
                <IconCalendar size={13} /> {jadwalNote}
              </p>
            )}
          </div>

          {/* mode */}
          <div>
            <p className="text-[0.72rem] font-extrabold tracking-[0.12em] uppercase text-ink-500 mb-1.5">2 · Jenis Presensi</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => gantiMode("masuk")}
                className={`rounded-xl border-2 px-3 py-3 text-sm font-bold transition-all ${
                  mode === "masuk" ? "border-lagoon-600 bg-lagoon-100 text-lagoon-700" : "border-mist-200 text-ink-500 hover:border-mist-300"
                }`}
              >
                Masuk Loket
                <span className="block text-[0.68rem] font-semibold opacity-70 mt-0.5">catat jam mulai bertugas</span>
              </button>
              <button
                onClick={() => gantiMode("keluar")}
                className={`rounded-xl border-2 px-3 py-3 text-sm font-bold transition-all ${
                  mode === "keluar" ? "border-brand-500 bg-brand-50 text-brand-600" : "border-mist-200 text-ink-500 hover:border-mist-300"
                }`}
              >
                Pulang / Serah Terima
                <span className="block text-[0.68rem] font-semibold opacity-70 mt-0.5">catat jam selesai bertugas</span>
              </button>
            </div>
          </div>

          {/* foto */}
          <div>
            <p className="text-[0.72rem] font-extrabold tracking-[0.12em] uppercase text-ink-500 mb-1.5">
              3 · Foto Atribut {mode === "masuk" ? "(wajib)" : "(opsional)"}
            </p>
            <input ref={fileRef} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            {!foto ? (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full rounded-xl border-2 border-dashed border-mist-300 hover:border-brand-500 hover:bg-brand-50 transition-all py-7 flex flex-col items-center gap-2 text-ink-500"
              >
                <span className="w-12 h-12 rounded-full bg-ink-900 text-brand-400 flex items-center justify-center">
                  <IconCamera size={24} />
                </span>
                <span className="font-bold text-sm text-ink-800">{fotoBusy ? "Memproses foto…" : "Ambil Foto / Unggah"}</span>
                <span className="text-[0.72rem]">Pastikan rompi & name tag terlihat jelas</span>
              </button>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-mist-200">
                <img src={foto} alt="Foto atribut" className="w-full max-h-72 object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/80 to-transparent p-3 flex gap-2 justify-end">
                  <button onClick={() => fileRef.current?.click()} className="btn btn-light btn-xs"><IconCamera size={14} /> Ambil Ulang</button>
                  <button onClick={() => setFoto(null)} className="btn btn-light btn-xs"><IconX size={14} /> Hapus</button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2.5 bg-ruby-100 text-ruby-700 text-[0.8rem] font-semibold rounded-lg px-3.5 py-3">
              <IconAlert size={17} className="shrink-0 mt-0.5" /> {error}
            </div>
          )}

          <button onClick={submit} disabled={!valid} className="btn btn-primary btn-lg w-full">
            {busy ? "Menyimpan…" : mode === "masuk" ? "Simpan Presensi Masuk" : "Simpan Presensi Pulang"}
          </button>
          <p className="text-center text-[0.7rem] text-ink-500 -mt-2">
            Data tersimpan di sistem loket · batas keterlambatan {`>`} 10 menit dari jadwal shift
          </p>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children, now, defLabel }: { children: ReactNode; now: Date; defLabel?: string }) {
  return (
    <div className="min-h-screen bg-papergrid">
      <div className="max-w-md mx-auto px-4 py-6">
        <header className="flex items-center gap-2.5 mb-5 rise">
          <span className="w-10 h-10 rounded-xl bg-ink-900 text-brand-400 flex items-center justify-center">
            <LogoMark size={24} />
          </span>
          <div>
            <p className="font-display font-extrabold text-ink-900 leading-tight">SIPELOK</p>
            <p className="text-[0.65rem] font-bold tracking-[0.14em] uppercase text-ink-500">Presensi Piket · BPS Kab. Konawe</p>
          </div>
          <span className="ml-auto text-right">
            <span className="font-display font-bold text-ink-800 tnum text-lg">{pad(now.getHours())}:{pad(now.getMinutes())}</span>
            {defLabel && <Badge tone="brand" className="mt-0.5">{defLabel}</Badge>}
          </span>
        </header>
        {children}
        <footer className="text-center text-[0.68rem] text-ink-500 mt-6">
          Badan Pusat Statistik Kabupaten Konawe · Layanan Terpadu
        </footer>
      </div>
    </div>
  );
}
