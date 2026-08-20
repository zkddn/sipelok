import { useEffect, useMemo, useState, type ReactNode } from "react";
import { copyText } from "../lib/hooks";
import { isBackendMode } from "../lib/supabaseClient";
import {
  IconAlert,
  IconBook,
  IconCheck,
  IconCopy,
  IconDatabase,
  IconGlobe,
  IconQr,
  IconRocket,
  IconShield,
  IconTerminal,
  LogoMark,
} from "../components/icons";
import { Badge, SectionLabel } from "../components/ui";

/* ---------- blok kode dengan tombol salin ---------- */

function CodeBlock({ label, code, lang = "bash" }: { label: string; code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden border border-ink-700 bg-ink-900 text-mist-100">
      <div className="flex items-center gap-2 px-4 py-2 bg-ink-950/60 border-b border-ink-700">
        <span className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-ruby-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-amberx-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-lagoon-500/70" />
        </span>
        <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-mist-300">{label}</span>
        <span className="ml-auto text-[0.62rem] font-bold text-mist-400 uppercase">{lang}</span>
        <button
          onClick={async () => {
            await copyText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          }}
          className={`ml-2 inline-flex items-center gap-1 text-[0.68rem] font-bold rounded-md px-2 py-1 transition-colors ${
            copied ? "bg-lagoon-600 text-white" : "bg-white/5 hover:bg-white/15 text-mist-200"
          }`}
        >
          {copied ? <IconCheck size={12} /> : <IconCopy size={12} />} {copied ? "Tersalin" : "Salin"}
        </button>
      </div>
      <pre className="px-4 py-3.5 text-[0.78rem] leading-relaxed overflow-x-auto slim-scroll tnum">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* ---------- kerangka bagian bernomor ---------- */

function Step({
  n,
  icon,
  title,
  lead,
  children,
  id,
}: {
  n: string;
  icon: ReactNode;
  title: string;
  lead: string;
  children: ReactNode;
  id: string;
}) {
  return (
    <section id={id} className="scroll-mt-24 card overflow-hidden rise">
      <div className="flex items-center gap-4 px-6 py-5 bg-ink-900 text-mist-50">
        <span className="font-display font-extrabold text-5xl text-brand-500 leading-none select-none">{n}</span>
        <span className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-brand-400 flex items-center justify-center shrink-0">
          {icon}
        </span>
        <div>
          <h2 className="font-display font-extrabold text-xl leading-tight">{title}</h2>
          <p className="text-[0.78rem] text-mist-300 font-semibold mt-0.5">{lead}</p>
        </div>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </section>
  );
}

function P({ children }: { children: ReactNode }) {
  return <p className="text-sm text-ink-700 leading-relaxed">{children}</p>;
}

function Callout({ tone, children }: { tone: "warn" | "info" | "ok"; children: ReactNode }) {
  const map = {
    warn: "bg-amberx-100 text-amberx-700 border-amberx-500/30",
    info: "bg-lagoon-100 text-lagoon-700 border-lagoon-600/25",
    ok: "bg-brand-100 text-brand-600 border-brand-500/30",
  } as const;
  const icon = tone === "warn" ? <IconAlert size={17} /> : tone === "ok" ? <IconCheck size={17} /> : <IconBook size={17} />;
  return (
    <div className={`flex items-start gap-2.5 border rounded-xl px-4 py-3 text-[0.8rem] font-semibold leading-relaxed ${map[tone]}`}>
      <span className="shrink-0 mt-0.5">{icon}</span>
      <div>{children}</div>
    </div>
  );
}

/* ---------- diagram alur ---------- */

function FlowDiagram() {
  return (
    <svg viewBox="0 0 920 190" className="w-full h-auto" role="img" aria-label="Diagram alur SIPELOK">
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#e2571b" />
        </marker>
      </defs>
      {[
        { x: 10, label: "PC Loket", sub: "tampilkan QR", icon: "pc" },
        { x: 240, label: "HP Petugas", sub: "scan + foto", icon: "hp" },
        { x: 470, label: "Supabase", sub: "database & realtime", icon: "db" },
        { x: 700, label: "Konsol Admin", sub: "rekap & cetak", icon: "admin" },
      ].map((b) => (
        <g key={b.x}>
          <rect x={b.x} y={52} width={190} height={86} rx={14} fill="#0e2a38" stroke="#1d4a5e" strokeWidth={1.5} />
          <rect x={b.x} y={52} width={190} height={6} rx={3} fill="#e2571b" opacity={0.85} />
          <text x={b.x + 95} y={96} textAnchor="middle" fill="#f2ede4" fontSize={15.5} fontWeight={800} fontFamily="'Bricolage Grotesque', sans-serif">
            {b.label}
          </text>
          <text x={b.x + 95} y={118} textAnchor="middle" fill="#8fb3c2" fontSize={11} fontWeight={600}>
            {b.sub}
          </text>
        </g>
      ))}
      {/* garis alur */}
      <line x1={200} y1={82} x2={238} y2={82} stroke="#e2571b" strokeWidth={2.5} strokeDasharray="7 6" markerEnd="url(#arr)" className="flowline" />
      <line x1={430} y1={108} x2={468} y2={108} stroke="#e2571b" strokeWidth={2.5} strokeDasharray="7 6" markerEnd="url(#arr)" className="flowline" />
      <line x1={660} y1={82} x2={698} y2={82} stroke="#e2571b" strokeWidth={2.5} strokeDasharray="7 6" markerEnd="url(#arr)" className="flowline" />
      {/* label panah */}
      <text x={219} y={70} textAnchor="middle" fill="#e2571b" fontSize={10.5} fontWeight={800}>QR</text>
      <text x={449} y={128} textAnchor="middle" fill="#e2571b" fontSize={10.5} fontWeight={800}>tulis data</text>
      <text x={679} y={70} textAnchor="middle" fill="#e2571b" fontSize={10.5} fontWeight={800}>realtime</text>
      {/* jalur balik ke loket */}
      <path d="M 795 138 C 795 175, 105 175, 105 138" fill="none" stroke="#3a89a8" strokeWidth={2} strokeDasharray="5 6" markerEnd="url(#arr)" className="flowline" opacity={0.8} />
      <text x={450} y={172} textAnchor="middle" fill="#3a89a8" fontSize={10.5} fontWeight={800}>umpan presensi tampil langsung di layar loket</text>
      {/* ikon kecil */}
      <g stroke="#e2571b" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x={88} y={18} width={34} height={24} rx={4} />
        <path d="M99 48h12M105 42v6" />
      </g>
      <g stroke="#e2571b" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x={320} y={16} width={18} height={30} rx={4} />
        <path d="M326 40h6" />
      </g>
      <g stroke="#e2571b" strokeWidth={2} fill="none">
        <ellipse cx={565} cy={24} rx={16} ry={6} />
        <path d="M549 24v14c0 3.3 7.2 6 16 6s16-2.7 16-6V24" strokeLinecap="round" />
      </g>
      <g stroke="#e2571b" strokeWidth={2} fill="none" strokeLinecap="round">
        <path d="M778 20v22M770 26l8-7 8 7M766 42h24" />
      </g>
    </svg>
  );
}

/* ---------- checklist rilis ---------- */

const CHECKLIST: Array<{ id: string; label: string; desc: string }> = [
  { id: "https", label: "Terbitkan di alamat HTTPS", desc: "Netlify/Vercel — kamera HP wajib HTTPS agar izin scan & foto berfungsi." },
  { id: "db", label: "Hubungkan database Supabase", desc: "Agar PC loket, HP petugas, dan admin melihat data yang sama." },
  { id: "pw", label: "Ganti sandi akun admin bawaan", desc: "Menu Pengaturan → Ganti Kata Sandi. Jangan biarkan sandi demo." },
  { id: "petugas", label: "Isi daftar petugas sesuai SK piket", desc: "Menu Petugas Piket — hapus contoh, masukkan pegawai Anda." },
  { id: "jadwal", label: "Susun jadwal piket mingguan", desc: "Menu Jadwal Piket — bisa rotasi otomatis, lalu unduh CSV untuk papan kantor." },
  { id: "uji", label: "Uji alur lengkap dengan 2 perangkat", desc: "Buka loket di PC, scan QR dari HP, cek data masuk di rekap admin." },
  { id: "sosialisasi", label: "Sosialisasikan ke seluruh petugas", desc: "Scan saat mulai piket (foto atribut), scan lagi saat serah terima." },
  { id: "cetak", label: "Coba cetak rekap mingguan", desc: "Tab Rekap → tombol Cetak → tersimpan sebagai PDF resmi ber-kop." },
];

function Checklist() {
  const [done, setDone] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("sipelok.checklist.v1") ?? "[]") as string[];
    } catch {
      return [];
    }
  });
  const toggle = (id: string) => {
    const next = done.includes(id) ? done.filter((x) => x !== id) : [...done, id];
    setDone(next);
    try {
      localStorage.setItem("sipelok.checklist.v1", JSON.stringify(next));
    } catch {
      /* abaikan */
    }
  };
  const pct = Math.round((done.length / CHECKLIST.length) * 100);
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-2.5 rounded-full bg-mist-200 overflow-hidden">
          <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[0.72rem] font-extrabold text-ink-600 tnum">{done.length}/{CHECKLIST.length} · {pct}%</span>
      </div>
      <ul className="grid sm:grid-cols-2 gap-2.5">
        {CHECKLIST.map((c) => {
          const on = done.includes(c.id);
          return (
            <li key={c.id}>
              <button
                onClick={() => toggle(c.id)}
                className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-all group ${
                  on ? "border-lagoon-600/50 bg-lagoon-100/60" : "border-mist-200 bg-white hover:border-brand-500/50"
                }`}
              >
                <span className="flex items-start gap-3">
                  <span
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                      on ? "bg-lagoon-600 border-lagoon-600 text-white" : "border-mist-300 text-transparent group-hover:border-brand-500"
                    }`}
                  >
                    <IconCheck size={14} />
                  </span>
                  <span>
                    <span className={`block text-sm font-bold ${on ? "text-lagoon-700 line-through decoration-lagoon-600/40" : "text-ink-900"}`}>{c.label}</span>
                    <span className="block text-[0.72rem] text-ink-500 font-semibold mt-0.5 leading-snug">{c.desc}</span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------- isi SQL & env ---------- */

const SQL_SCHEMA = `-- Jalankan di Supabase: SQL Editor → New query → tempel → Run
create table petugas (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  nip text,
  dibuat timestamptz default now()
);

create table jadwal_piket (
  id uuid primary key default gen_random_uuid(),
  hari int not null check (hari between 1 and 6),
  shift int not null check (shift in (1, 2)),
  petugas_id uuid references petugas (id) on delete set null,
  unique (hari, shift)
);

create table presensi (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null,
  shift int not null check (shift in (1, 2)),
  petugas_id uuid references petugas (id),
  nama text not null,
  jam_masuk timestamptz not null default now(),
  jam_keluar timestamptz,
  foto_masuk text,   -- foto terkompres (dataURL) / path storage
  foto_keluar text
);
create index presensi_tanggal_idx on presensi (tanggal);

create table akun (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  pw_hash text not null,
  salt text,
  role text not null default 'admin'
);

create table sesi_qr (
  token text primary key,
  tanggal date not null,
  shift int not null,
  dibuat timestamptz default now()
);

-- Mode demo internal kantor: izinkan akses via anon key.
-- Untuk keamanan lebih baik, batasi dengan kebijakan RLS per peran.
alter table petugas enable row level security;
alter table jadwal_piket enable row level security;
alter table presensi enable row level security;
alter table sesi_qr enable row level security;

create policy "semua" on petugas for all using (true) with check (true);
create policy "semua" on jadwal_piket for all using (true) with check (true);
create policy "semua" on presensi for all using (true) with check (true);
create policy "semua" on sesi_qr for all using (true) with check (true);`;

const ENV_SAMPLE = `# file .env di akar proyek (jangan unggah ke Git)
VITE_SUPABASE_URL=https://xxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...`;

const CONTOH_KODE = `import { supabase } from "./supabaseClient";

// contoh: mengganti saveRecords() di src/lib/store.ts
export async function simpanPresensi(r: PresensiRecord) {
  const { error } = await supabase!.from("presensi").insert({
    tanggal: r.date,
    shift: r.shift,
    petugas_id: r.petugasId,
    nama: r.nama,
    jam_masuk: r.masuk,
    foto_masuk: r.fotoMasuk,
  });
  if (error) throw error;
}

// contoh: rekap admin membaca dari database
const { data } = await supabase!
  .from("presensi")
  .select("*")
  .gte("tanggal", "2025-01-01")
  .order("jam_masuk", { ascending: false });`;

const STRUKTUR = `sipelok/
├─ index.html            → kerangka & font
├─ src/
│  ├─ App.tsx            → router hash (/, /loket, /scan/:token, /admin, /panduan)
│  ├─ lib/
│  │  ├─ store.ts        → ★ semua logika data (ganti sini saat pindah database)
│  │  ├─ supabaseClient.ts → jembatan Supabase (opsional)
│  │  └─ hooks.ts        → jam hidup, router, salin teks
│  ├─ pages/
│  │  ├─ Gateway.tsx     → papan pilihan akses
│  │  ├─ Loket.tsx       → layar QR di PC pelayanan
│  │  ├─ Scan.tsx        → halaman HP petugas
│  │  ├─ Admin.tsx       → login + rekap + jadwal + pengaturan
│  │  └─ Panduan.tsx     → halaman ini
│  └─ components/        → ikon SVG & elemen UI`;

const LANGKAH_LOKAL = `# 1) pasang dependensi
npm install

# 2) jalankan mode pengembangan (hot reload)
npm run dev        # buka http://localhost:5173

# 3) bangun versi produksi
npm run build      # hasil di folder dist/

# 4) pratinjau hasil build
npm run preview`;

const LANGKAH_DEPLOY = `# Opsi A — Netlify Drop (paling cepat, tanpa Git)
#   1. npm run build
#   2. buka https://app.netlify.com/drop
#   3. seret folder dist/ → langsung dapat alamat HTTPS

# Opsi B — Vercel / Netlify via Git
#   hubungkan repositori, framework: Vite,
#   build command: npm run build | output: dist

# Opsi C — GitHub Pages
npm run build      # lalu unggah isi dist/ ke branch gh-pages`;

/* ---------- halaman ---------- */

export default function Panduan() {
  const sections = useMemo(
    () => [
      ["lokal", "01 Lokal", <IconTerminal key="a" size={13} />],
      ["publikasi", "02 Publikasi", <IconGlobe key="b" size={13} />],
      ["database", "03 Database", <IconDatabase key="c" size={13} />],
      ["rilis", "04 Rilis Kantor", <IconRocket key="d" size={13} />],
    ] as const,
    []
  );

  const [active, setActive] = useState("lokal");
  useEffect(() => {
    const onScroll = () => {
      for (const [id] of sections) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 140) setActive(id);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [sections]);

  return (
    <div className="min-h-screen bg-papergrid">
      {/* header */}
      <header className="bg-board text-mist-50 relative overflow-hidden">
        <span className="absolute -right-16 -top-16 w-64 h-64 rounded-full border-[18px] border-brand-500/10" />
        <span className="absolute right-40 top-20 w-24 h-24 rounded-full border-8 border-lagoon-600/15" />
        <div className="max-w-5xl mx-auto px-4 py-10 relative">
          <a href="#/" className="inline-flex items-center gap-2 text-[0.72rem] font-extrabold uppercase tracking-[0.14em] text-mist-300 hover:text-brand-400 transition-colors">
            ← Kembali ke SIPELOK
          </a>
          <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-4">
            <div className="flex items-center gap-4">
              <span className="w-14 h-14 rounded-2xl bg-brand-500 text-ink-950 flex items-center justify-center">
                <LogoMark size={32} />
              </span>
              <div>
                <p className="text-[0.68rem] font-extrabold tracking-[0.18em] uppercase text-brand-400">BPS Kabupaten Konawe</p>
                <h1 className="font-display font-extrabold text-4xl sm:text-5xl leading-none mt-1">
                  Panduan <span className="text-brand-500">Implementasi</span>
                </h1>
              </div>
            </div>
            <p className="max-w-sm text-sm text-mist-300 font-semibold leading-relaxed">
              Empat langkah membawa SIPELOK dari prototipe di browser menjadi sistem piket loket yang benar-benar dipakai di kantor.
            </p>
          </div>

          <nav className="mt-8 flex flex-wrap gap-2">
            {sections.map(([id, label, icon]) => (
              <button
                key={id}
                onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.75rem] font-extrabold transition-all border ${
                  active === id
                    ? "bg-brand-500 text-ink-950 border-brand-500 shadow-lg shadow-brand-500/25"
                    : "bg-white/5 text-mist-200 border-white/10 hover:bg-white/10"
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        {/* status mode */}
        <div className="card p-4 flex flex-wrap items-center gap-3 rise">
          <span className="w-10 h-10 rounded-xl bg-ink-900 text-brand-400 flex items-center justify-center shrink-0">
            <IconDatabase size={20} />
          </span>
          <div className="flex-1 min-w-52">
            <p className="font-display font-bold text-ink-900">Mode penyimpanan saat ini: {isBackendMode ? "Supabase (database daring)" : "localStorage (demo satu browser)"}</p>
            <p className="text-[0.75rem] text-ink-500 font-semibold mt-0.5">
              {isBackendMode
                ? "Bagus! Semua perangkat berbagi data yang sama."
                : "Cocok untuk uji coba. Ikuti Langkah 03 agar PC loket, HP petugas, dan admin berbagi data."}
            </p>
          </div>
          <Badge tone={isBackendMode ? "lagoon" : "amber"}>{isBackendMode ? "SIAP PRODUKSI" : "MODE DEMO"}</Badge>
        </div>

        {/* 01 lokal */}
        <Step id="lokal" n="01" icon={<IconTerminal size={20} />} title="Jalankan & pahami di komputer Anda" lead="Butuh: Node.js 18+ (unduh gratis di nodejs.org)">
          <P>
            Seluruh aplikasi ini adalah proyek <strong>React + Vite + TypeScript</strong>. Titik terpenting untuk memahami dan memperbaiki
            aplikasi ada di <strong>src/lib/store.ts</strong> — semua aturan presensi, token QR, jadwal, dan akun berkumpul di sana, sehingga
            perbaikan logika cukup dilakukan di satu tempat.
          </P>
          <CodeBlock label="Terminal" code={LANGKAH_LOKAL} />
          <CodeBlock label="Struktur proyek" code={STRUKTUR} lang="teks" />
          <Callout tone="info">
            Ingin mengubah jam shift, batas keterlambatan, atau nama kantor? Semuanya berupa konstanta di bagian atas{" "}
            <strong>src/lib/store.ts</strong> (SHIFTS, TOLERANSI_MENIT) — ubah, simpan, dan mode dev langsung memperbarui tampilan.
          </Callout>
        </Step>

        {/* 02 publikasi */}
        <Step id="publikasi" n="02" icon={<IconGlobe size={20} />} title="Publikasikan agar bisa dibuka dari HP" lead="Hasil build adalah situs statis — gratis di-hosting di mana saja">
          <P>
            Petugas memindai QR dari layar PC, lalu <strong>HP-nya membuka alamat web</strong>. Artinya aplikasi harus bisa diakses lewat
            jaringan — paling mudah dengan menerbitkannya ke hosting statis gratis.
          </P>
          <CodeBlock label="Langkah publikasi" code={LANGKAH_DEPLOY} />
          <Callout tone="warn">
            <strong>Wajib HTTPS.</strong> Kamera HP (untuk foto atribut & pemindai) hanya diizinkan browser pada halaman aman. Alamat{" "}
            <em>http://192.168.…</em> atau <em>http://namakomputer</em> akan <strong>menolak akses kamera</strong>. Gunakan alamat bawaan
            Netlify/Vercel (sudah HTTPS), atau domain kantor dengan sertifikat SSL.
          </Callout>
          <P>
            Setelah terbit, tautkan QR ke alamat tersebut — aplikasi mendeteksi alamatnya sendiri secara otomatis, jadi cukup ganti URL yang
            diakses PC loket. Petugas tidak perlu memasang aplikasi apa pun; halaman scan bisa <strong>ditambahkan ke layar utama HP</strong>{" "}
            agar terasa seperti aplikasi.
          </P>
        </Step>

        {/* 03 database */}
        <Step id="database" n="03" icon={<IconDatabase size={20} />} title="Hubungkan database agar semua perangkat sinkron" lead="Supabase — gratis untuk kantor kecil, tanpa server sendiri">
          <P>
            Pada mode demo, data tersimpan di <strong>localStorage browser masing-masing perangkat</strong> — presensi dari HP petugas belum
            tentu sampai ke PC admin. Untuk pemakaian nyata, semua perangkat harus menulis ke satu tempat: <strong>Supabase</strong>{" "}
            (PostgreSQL + sinkronisasi realtime, paket gratisnya lebih dari cukup untuk satu kantor).
          </P>

          <div className="card p-4 bg-ink-900 border-ink-700">
            <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-mist-300 mb-3 flex items-center gap-2">
              <IconQr size={14} className="text-brand-400" /> Alur data produksi
            </p>
            <FlowDiagram />
          </div>

          <ol className="space-y-2.5 text-sm text-ink-700 font-semibold list-decimal list-inside marker:text-brand-600 marker:font-extrabold">
            <li>Buat akun & proyek gratis di <strong>supabase.com</strong> (pilih region terdekat, mis. Singapura).</li>
            <li>Buka <strong>SQL Editor → New query</strong>, tempel skema berikut, klik <strong>Run</strong>.</li>
            <li>Salin <em>URL proyek</em> dan <em>anon public key</em> (Settings → API) ke file <strong>.env</strong>.</li>
            <li>Ganti fungsi-fungsi data di <strong>src/lib/store.ts</strong> dengan panggilan Supabase (contoh di bawah).</li>
            <li>Jalankan ulang <code className="bg-mist-100 rounded px-1.5 py-0.5 text-[0.78rem]">npm run build</code> lalu terbitkan ulang.</li>
          </ol>

          <CodeBlock label="Skema database (.sql)" code={SQL_SCHEMA} lang="sql" />
          <CodeBlock label=".env" code={ENV_SAMPLE} lang="env" />
          <CodeBlock label="Contoh penggantian di store.ts" code={CONTOH_KODE} lang="ts" />

          <Callout tone="ok">
            Tabel di atas sudah memetakan persis kebutuhan Anda: <strong>nama, jam masuk, jam pulang, foto atribut, dan dua shift per hari</strong>.
            Kolom <em>foto_masuk</em> menerima foto terkompres otomatis (±50–80 KB per foto) yang sudah dibuat aplikasi saat petugas memotret.
          </Callout>
        </Step>

        {/* 04 rilis */}
        <Step id="rilis" n="04" icon={<IconRocket size={20} />} title="Rilis & operasikan di kantor" lead="Centang satu per satu — progres tersimpan di browser ini">
          <Checklist />
          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            <Callout tone="info">
              <strong>Tempatkan PC loket</strong> di meja pelayanan dengan layar selalu menampilkan <em>#/loket</em>. Tekan{" "}
              <strong>Perbarui QR</strong> bila token ingin diganti — QR lama langsung hangus.
            </Callout>
            <Callout tone="info">
              <strong>Rutin mingguan:</strong> susun jadwal piket Senin, unduh CSV-nya untuk papan pengumuman, lalu Jumat sore cetak rekap
              mingguan dari tab Rekap untuk arsip Kepala Kantor.
            </Callout>
          </div>
        </Step>

        {/* FAQ */}
        <section className="card p-6 rise">
          <SectionLabel>Tanya Jawab Singkat</SectionLabel>
          <div className="mt-4 divide-y divide-mist-200">
            {[
              [
                "Apakah aman memakai versi localStorage untuk produksi?",
                "Hanya bila seluruh akses (scan, rekap, admin) dilakukan pada SATU perangkat/browser yang sama. Begitu ada HP petugas yang berbeda, data mereka tidak akan terkumpul. Karena itu Langkah 03 (database) penting untuk pemakaian nyata.",
              ],
              [
                "HP petugas tidak bisa membuka kamera, kenapa?",
                "Hampir selalu karena halaman dibuka lewat http (bukan https). Terbitkan aplikasi di Netlify/Vercel yang sudah HTTPS, atau minta petugas mengetik ulang tautan bila QR gagal terbaca — tautan juga tertulis di bawah QR.",
              ],
              [
                "Bagaimana kalau internet kantor mati?",
                "Layar loket & halaman yang sudah termuat tetap berjalan (data lokal). Namun sinkronisasi antar perangkat dan database memerlukan koneksi. Untuk kantor dengan internet tidak stabil, pertimbangkan satu PC bersama sebagai titik presensi.",
              ],
              [
                "Bisakah foto langsung diunggah ke penyimpanan Supabase (bukan dataURL)?",
                "Bisa dan dianjurkan bila jumlah petugas besar: buat bucket Storage 'foto-atribut', unggah file, simpan path-nya. Untuk ±16 foto/hari, dataURL terkompres sudah cukup hemat.",
              ],
              [
                "Bagaimana cara mengganti jam shift atau toleransi keterlambatan?",
                "Ubah konstanta SHIFTS dan TOLERANSI_MENIT di src/lib/store.ts, bangun ulang, terbitkan ulang. Semua halaman otomatis mengikuti.",
              ],
            ].map(([q, a], i) => (
              <details key={i} className="group py-3.5">
                <summary className="flex items-center gap-3 cursor-pointer list-none font-bold text-sm text-ink-900 hover:text-brand-600 transition-colors">
                  <span className="w-6 h-6 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center text-[0.7rem] font-extrabold shrink-0 group-open:bg-brand-500 group-open:text-ink-950 transition-colors">
                    {i + 1}
                  </span>
                  {q}
                  <span className="ml-auto text-mist-400 group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="text-[0.82rem] text-ink-600 leading-relaxed mt-2.5 pl-9">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* footer */}
        <footer className="text-center pb-8 pt-2">
          <p className="inline-flex items-center gap-2 text-[0.72rem] font-bold text-ink-500">
            <IconShield size={14} className="text-brand-500" />
            SIPELOK · Sistem Presensi Piket Loket · Badan Pusat Statistik Kabupaten Konawe
          </p>
          <div className="mt-3 flex justify-center gap-2">
            <a href="#/loket" className="btn btn-light btn-sm">Buka Layar Loket</a>
            <a href="#/admin" className="btn btn-primary btn-sm">Masuk Konsol Admin</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
