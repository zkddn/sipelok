import { useEffect, useState, type ReactNode } from "react";
import { copyText, navigate } from "../lib/hooks";
import { getBackendMode, pingBackend, type BackendMode } from "../lib/backend";
import {
  IconAlert,
  IconArrowRight,
  IconBook,
  IconCheck,
  IconCopy,
  IconDatabase,
  IconGlobe,
  IconMonitor,
  IconPhoneScan,
  IconQr,
  IconRocket,
  IconShield,
  IconTerminal,
  LogoMark,
} from "../components/icons";
import { Badge, ModeBadge, SectionLabel } from "../components/ui";

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
      <pre className="p-4 text-[0.78rem] leading-relaxed overflow-x-auto slim-scroll tnum whitespace-pre">{code}</pre>
    </div>
  );
}

/* ---------- kartu langkah ---------- */

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-4 rise">
      <span className="shrink-0 w-9 h-9 rounded-xl bg-brand-500 text-ink-950 font-display font-extrabold flex items-center justify-center text-lg shadow-lg shadow-brand-500/25">
        {n}
      </span>
      <div className="flex-1 min-w-0 pb-2">
        <h3 className="font-display font-bold text-ink-900 text-lg leading-snug">{title}</h3>
        <div className="mt-2 space-y-3 text-sm text-ink-600 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

/* ---------- baris checklist yang tersimpan ---------- */

const CHECK_KEY = "sipelok.panduan.checklist";

function Checklist() {
  const [done, setDone] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem(CHECK_KEY) ?? "{}");
    } catch {
      return {};
    }
  });
  const items = [
    ["xampp", "XAMPP (Apache + PHP + MySQL) terpasang di PC server"],
    ["build", "Hasil build (folder dist) disalin ke htdocs, mis. htdocs/sipelok"],
    ["db", "Database sipelok dibuat & skema diimpor lewat phpMyAdmin"],
    ["config", "api/config.php disesuaikan (akun & sandi MySQL, API_KEY)"],
    ["api", "api.php?action=ping mengembalikan ok:true di peramban"],
    ["lokasi", "PC loket & HP petugas terhubung ke jaringan/Wi-Fi yang sama"],
    ["uji", "Uji coba penuh: QR tampil → HP scan → masuk & pulang → rekap"],
    ["akun", "Kata sandi admin bawaan sudah diganti"],
  ] as const;
  const toggle = (k: string) => {
    const next = { ...done, [k]: !done[k] };
    setDone(next);
    try {
      localStorage.setItem(CHECK_KEY, JSON.stringify(next));
    } catch {
      /* abaikan */
    }
  };
  const count = items.filter(([k]) => done[k]).length;
  return (
    <div className="card p-5 rise">
      <div className="flex items-center justify-between gap-3">
        <SectionLabel>Checklist Implementasi</SectionLabel>
        <Badge tone={count === items.length ? "lagoon" : "mist"} className="tnum">
          {count}/{items.length} selesai
        </Badge>
      </div>
      <ul className="mt-4 space-y-2">
        {items.map(([k, label]) => (
          <li key={k}>
            <button
              onClick={() => toggle(k)}
              className={`w-full flex items-center gap-3 text-left rounded-lg border px-3.5 py-2.5 text-sm font-semibold transition-all ${
                done[k]
                  ? "border-lagoon-600/40 bg-lagoon-100 text-lagoon-700"
                  : "border-mist-200 bg-mist-50 text-ink-700 hover:border-mist-300"
              }`}
            >
              <span
                className={`shrink-0 w-5 h-5 rounded-md flex items-center justify-center border-2 transition-colors ${
                  done[k] ? "bg-lagoon-600 border-lagoon-600 text-white" : "border-mist-300 bg-white text-transparent"
                }`}
              >
                <IconCheck size={12} />
              </span>
              <span className={done[k] ? "line-through opacity-80" : ""}>{label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- status koneksi langsung ---------- */

function ConnStatus() {
  const [mode, setMode] = useState<BackendMode>(() => getBackendMode());
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let on = true;
    void pingBackend().then((r) => {
      if (!on) return;
      setMode(r.ok ? "db" : "local");
      setDetail(r.detail);
    });
    return () => {
      on = false;
    };
  }, [busy]);
  const ok = mode === "db";
  return (
    <div
      className={`rounded-2xl border p-5 flex flex-wrap items-center gap-4 rise ${
        ok ? "border-lagoon-600/40 bg-lagoon-100/60" : "border-amberx-500/40 bg-amberx-100/50"
      }`}
    >
      <span className={`w-12 h-12 rounded-xl flex items-center justify-center ${ok ? "bg-lagoon-600 text-white" : "bg-amberx-500 text-ink-950"}`}>
        {ok ? <IconDatabase size={26} /> : <IconAlert size={26} />}
      </span>
      <div className="flex-1 min-w-52">
        <p className="font-display font-bold text-ink-900">{ok ? "Terhubung ke MySQL" : "Belum terhubung ke server PHP"}</p>
        <p className="text-[0.78rem] text-ink-600 font-semibold mt-0.5">
          {detail || (ok ? "api.php aktif dan database dapat diakses." : "Aplikasi berjalan dalam mode demo (data lokal peramban).")}
        </p>
      </div>
      <button onClick={() => setBusy((b) => !b)} className="btn btn-light btn-sm">
        <IconArrowRight size={14} className="rotate-180" /> Uji Ulang
      </button>
    </div>
  );
}

/* ---------- halaman ---------- */

const NAV = [
  ["arsitektur", "Arsitektur"],
  ["instalasi", "Instalasi"],
  ["database", "Database"],
  ["jaringan", "Jaringan Kantor"],
  ["api", "API"],
  ["checklist", "Checklist"],
] as const;

export default function Panduan() {
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="min-h-screen bg-papergrid">
      {/* header */}
      <header className="bg-board text-mist-50 sticky top-0 z-40 shadow-lg shadow-ink-950/20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5 group">
            <span className="w-9 h-9 rounded-lg bg-brand-500 text-ink-950 flex items-center justify-center group-hover:rotate-[-6deg] transition-transform">
              <LogoMark size={22} />
            </span>
            <span className="font-display font-bold leading-tight hidden sm:block">
              SIPELOK
              <span className="block text-[0.62rem] font-body font-semibold tracking-[0.14em] uppercase text-mist-300">
                Panduan Implementasi
              </span>
            </span>
          </button>
          <nav className="ml-auto flex items-center gap-1 overflow-x-auto slim-scroll">
            {NAV.map(([id, label]) => (
              <button
                key={id}
                onClick={() => go(id)}
                className="px-3 py-1.5 rounded-full text-[0.72rem] font-bold text-mist-300 hover:text-mist-50 hover:bg-white/5 whitespace-nowrap transition-colors"
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-12">
        {/* pembuka */}
        <section className="rise">
          <div className="flex items-center gap-2 mb-3">
            <Badge tone="brand">
              <IconBook size={12} /> PHP + MySQL
            </Badge>
            <ModeBadge />
          </div>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-ink-900 leading-[1.05]">
            Pasang di Kantor
            <span className="block text-brand-500">dengan XAMPP, Selesai.</span>
          </h1>
          <p className="text-ink-600 max-w-2xl mt-4 leading-relaxed">
            SIPELOK dirancang agar mudah diimplementasikan: sebuah aplikasi web statis yang berbicara dengan{" "}
            <strong className="text-ink-900">satu berkas PHP (api.php)</strong> dan{" "}
            <strong className="text-ink-900">database MySQL</strong>. Tidak perlu Node.js, tidak perlu layanan cloud —
            cukup XAMPP di satu PC yang menyala, lalu seluruh kantor bisa mengaksesnya lewat jaringan lokal.
          </p>
        </section>

        <ConnStatus />

        {/* ===== arsitektur ===== */}
        <section id="arsitektur" className="scroll-mt-24">
          <SectionLabel>Arsitektur</SectionLabel>
          <h2 className="font-display font-bold text-2xl text-ink-900 mt-2">Tiga bagian, satu folder</h2>
          <div className="grid md:grid-cols-3 gap-4 mt-5">
            {[
              {
                icon: <IconMonitor size={22} />,
                t: "Aplikasi Web (statis)",
                d: "Hasil build React: index.html + aset. Dibuka PC loket (layar QR), HP petugas (scan), dan admin (rekap).",
                tone: "bg-brand-100 text-brand-600",
              },
              {
                icon: <IconTerminal size={22} />,
                t: "api.php (PHP)",
                d: "Satu berkas penghubung: menerima data presensi, jadwal, akun, dan sesi QR. Dilindungi kunci API.",
                tone: "bg-lagoon-100 text-lagoon-700",
              },
              {
                icon: <IconDatabase size={22} />,
                t: "MySQL",
                d: "Satu database bernama sipelok berisi 5 tabel. Foto atribut disimpan sebagai berkas di api/uploads/.",
                tone: "bg-amberx-100 text-amberx-700",
              },
            ].map((c, i) => (
              <div key={c.t} className="card card-hover p-5 rise" style={{ animationDelay: `${i * 0.06}s` }}>
                <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.tone}`}>{c.icon}</span>
                <h3 className="font-display font-bold text-ink-900 mt-3">{c.t}</h3>
                <p className="text-sm text-ink-600 mt-1.5 leading-relaxed">{c.d}</p>
              </div>
            ))}
          </div>
          <div className="card p-5 mt-4 rise">
            <SectionLabel>Struktur Folder Hasil Build (dist/)</SectionLabel>
            <CodeBlock
              lang="tree"
              label="Salin seluruh isi dist/ ke htdocs/sipelok"
              code={`sipelok/
├── index.html          ← aplikasi (buka ini di peramban)
├── assets/             ← CSS & JS hasil build
├── manifest.webmanifest
├── icon.svg
├── api/
│   ├── api.php         ← SATU-SATUNYA berkas PHP
│   ├── config.php      ← ubah kredensial MySQL & API_KEY di sini
│   └── uploads/        ← foto atribut disimpan di sini
└── database/
    └── sipelok.sql     ← skema database (impor via phpMyAdmin)`}
            />
          </div>
        </section>

        {/* ===== instalasi ===== */}
        <section id="instalasi" className="scroll-mt-24">
          <SectionLabel>Instalasi</SectionLabel>
          <h2 className="font-display font-bold text-2xl text-ink-900 mt-2">Enam langkah sampai siap pakai</h2>
          <div className="card p-6 mt-5 space-y-6">
            <Step n={1} title="Pasang XAMPP di PC server">
              <p>
                Unduh XAMPP (gratis) dari <strong>apachefriends.org</strong>, lalu instal. XAMPP sudah berisi Apache,
                PHP, dan MySQL — tidak perlu memasang apa pun lagi. Setelah terpasang, buka{" "}
                <strong>XAMPP Control Panel</strong> dan klik <strong>Start</strong> pada modul{" "}
                <strong>Apache</strong> dan <strong>MySQL</strong>.
              </p>
            </Step>

            <Step n={2} title="Salin aplikasi ke htdocs">
              <p>
                Salin <strong>seluruh isi folder hasil build (dist/)</strong> ke dalam folder XAMPP:
              </p>
              <CodeBlock lang="path" label="Windows (XAMPP)" code={`C:\\xampp\\htdocs\\sipelok`} />
              <p>
                Setelah ini aplikasi dapat dibuka di <code className="tnum bg-mist-100 rounded px-1.5 py-0.5">http://localhost/sipelok</code>.
              </p>
            </Step>

            <Step n={3} title="Buat database & impor skema">
              <p>
                Buka <code className="tnum bg-mist-100 rounded px-1.5 py-0.5">http://localhost/phpmyadmin</code>, klik tab{" "}
                <strong>Import</strong>, pilih berkas <strong>database/sipelok.sql</strong>, lalu klik <strong>Go</strong>.
                Database <strong>sipelok</strong> beserta 5 tabelnya akan terbuat otomatis.
              </p>
              <CodeBlock
                lang="sql"
                label="Alternatif lewat terminal MySQL"
                code={`mysql -u root -p < sipelok.sql`}
              />
            </Step>

            <Step n={4} title="Sesuaikan config.php">
              <p>
                Buka <code className="tnum bg-mist-100 rounded px-1.5 py-0.5">api/config.php</code>. Untuk XAMPP bawaan,
                nilai default biasanya sudah benar (root, sandi kosong). <strong>Ganti API_KEY</strong> dengan nilai acak
                Anda sendiri.
              </p>
              <CodeBlock
                lang="php"
                label="api/config.php"
                code={`define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');        // isi jika MySQL Anda bersandi
define('DB_NAME', 'sipelok');

define('API_KEY', 'sipelok-2026');  // ← ganti dengan nilai acak`}
              />
              <div className="flex items-start gap-2.5 bg-amberx-100 text-amberx-700 text-[0.8rem] font-semibold rounded-lg px-3.5 py-3">
                <IconAlert size={16} className="shrink-0 mt-0.5" />
                Jika API_KEY di config.php berbeda dengan konstanta API_KEY di src/lib/backend.ts, bangun ulang
                aplikasi setelah menyamakannya, atau biarkan keduanya memakai nilai yang sama.
              </div>
            </Step>

            <Step n={5} title="Pastikan api.php hidup">
              <p>Buka alamat ini di peramban PC server:</p>
              <CodeBlock lang="url" label="Tes koneksi" code={`http://localhost/sipelok/api/api.php?action=ping`} />
              <p>
                Jika muncul <code className="tnum bg-mist-100 rounded px-1.5 py-0.5">{"{\"ok\":true,...}"}</code>, berarti
                PHP dan MySQL sudah terhubung. Lencana di halaman ini juga akan berubah menjadi{" "}
                <strong>MySQL Aktif</strong>.
              </p>
            </Step>

            <Step n={6} title="Masuk & mulai gunakan">
              <p>
                Buka <code className="tnum bg-mist-100 rounded px-1.5 py-0.5">http://localhost/sipelok/#/admin</code> dan
                masuk dengan akun bawaan:
              </p>
              <div className="inline-flex items-center gap-3 bg-ink-900 text-mist-50 rounded-xl px-4 py-3 tnum text-sm">
                <span className="font-bold">admin</span>
                <span className="text-mist-400">/</span>
                <span className="font-bold">bpskonawe</span>
                <span className="text-mist-400 text-[0.7rem] font-semibold">(segera ganti sandi)</span>
              </div>
              <p>
                Tambah daftar petugas di tab <strong>Petugas</strong>, atur giliran di tab <strong>Jadwal Piket</strong>,
                lalu buka <strong>Loket</strong> di PC pelayanan dan biarkan petugas memindai QR dengan HP.
              </p>
            </Step>
          </div>
        </section>

        {/* ===== database ===== */}
        <section id="database" className="scroll-mt-24">
          <SectionLabel>Database</SectionLabel>
          <h2 className="font-display font-bold text-2xl text-ink-900 mt-2">Skema ringkas (5 tabel)</h2>
          <div className="grid md:grid-cols-2 gap-4 mt-5">
            {[
              ["petugas", "Daftar pegawai yang mendapat giliran piket (id, nama, nip)."],
              ["presensi", "Catatan masuk & pulang per shift, plus nama berkas foto atribut."],
              ["jadwal", "Giliran mingguan: hari (1=Senin…6=Sabtu) × shift (1=Pagi, 2=Siang)."],
              ["akun", "Akun konsol admin (peran admin / viewer); sandi di-hash oleh aplikasi."],
              ["sesi", "Token QR yang dibuat layar loket; kedaluwarsa otomatis setelah 3 hari."],
            ].map(([t, d], i) => (
              <div key={t} className="card p-4 flex items-start gap-3.5 rise" style={{ animationDelay: `${i * 0.05}s` }}>
                <span className="shrink-0 w-9 h-9 rounded-lg bg-ink-900 text-brand-400 flex items-center justify-center">
                  <IconDatabase size={17} />
                </span>
                <div>
                  <p className="font-display font-bold text-ink-900 tnum">{t}</p>
                  <p className="text-[0.8rem] text-ink-600 mt-0.5 leading-relaxed">{d}</p>
                </div>
              </div>
            ))}
            <div className="card p-4 flex items-start gap-3.5 rise border-lagoon-600/30" style={{ animationDelay: "0.25s" }}>
              <span className="shrink-0 w-9 h-9 rounded-lg bg-lagoon-600 text-white flex items-center justify-center">
                <IconShield size={17} />
              </span>
              <div>
                <p className="font-display font-bold text-ink-900">Cadangkan rutin</p>
                <p className="text-[0.8rem] text-ink-600 mt-0.5 leading-relaxed">
                  Ekspor database lewat phpMyAdmin (tab <strong>Export</strong>) atau{" "}
                  <code className="tnum bg-mist-100 rounded px-1 py-0.5">mysqldump -u root sipelok &gt; cadangan.sql</code>{" "}
                  setiap minggu, dan simpan folder <strong>api/uploads/</strong> bersama cadangan tersebut.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== jaringan ===== */}
        <section id="jaringan" className="scroll-mt-24">
          <SectionLabel>Jaringan Kantor</SectionLabel>
          <h2 className="font-display font-bold text-2xl text-ink-900 mt-2">Agar HP petugas bisa ikut mengakses</h2>
          <div className="card p-6 mt-5 space-y-4">
            <p className="text-sm text-ink-600 leading-relaxed">
              Petugas memindai QR dengan HP, jadi HP harus bisa membuka aplikasi yang sama. Caranya: sambungkan PC
              server dan HP ke <strong>jaringan/Wi-Fi yang sama</strong>, lalu akses aplikasi lewat{" "}
              <strong>alamat IP PC server</strong> (bukan localhost).
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-mist-200 bg-mist-50 p-4">
                <p className="flex items-center gap-2 font-display font-bold text-ink-900 text-sm">
                  <IconMonitor size={16} className="text-brand-600" /> 1 · Lihat IP PC server
                </p>
                <CodeBlock lang="cmd" label="Windows: Command Prompt" code={`ipconfig\n# cari "IPv4 Address", mis. 192.168.1.10`} />
              </div>
              <div className="rounded-xl border border-mist-200 bg-mist-50 p-4">
                <p className="flex items-center gap-2 font-display font-bold text-ink-900 text-sm">
                  <IconPhoneScan size={16} className="text-brand-600" /> 2 · Buka lewat IP di HP & PC loket
                </p>
                <CodeBlock lang="url" label="Ganti dengan IP Anda" code={`http://192.168.1.10/sipelok\nhttp://192.168.1.10/sipelok/#/loket`} />
              </div>
            </div>
            <div className="flex items-start gap-2.5 bg-lagoon-100 text-lagoon-700 text-[0.8rem] font-semibold rounded-lg px-3.5 py-3">
              <IconGlobe size={16} className="shrink-0 mt-0.5" />
              Jika Windows Firewall memblokir, izinkan Apache (httpd.exe) pada jaringan Private. QR di layar loket
              otomatis memakai alamat yang sedang dibuka, sehingga HP tinggal memindai tanpa mengetik apa pun.
            </div>
          </div>
        </section>

        {/* ===== api ===== */}
        <section id="api" className="scroll-mt-24">
          <SectionLabel>API</SectionLabel>
          <h2 className="font-display font-bold text-2xl text-ink-900 mt-2"> Endpoint api.php</h2>
          <div className="card overflow-hidden mt-5 rise">
            <div className="overflow-x-auto slim-scroll">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="bg-ink-900 text-mist-50 text-left text-[0.68rem] uppercase tracking-wider">
                    <th className="px-4 py-3 font-extrabold">Aksi</th>
                    <th className="px-4 py-3 font-extrabold">Metode</th>
                    <th className="px-4 py-3 font-extrabold">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["?action=ping", "GET", "Cek API & database hidup"],
                    ["?action=bootstrap", "GET", "Ambil seluruh data (petugas, presensi, jadwal, akun, sesi)"],
                    ["?action=sig", "GET", "Tanda perubahan; dipoll aplikasi ±3,5 detik untuk sinkronisasi"],
                    ["?action=save&table=…", "POST", "Simpan baris (UPSERT). Butuh header X-Sipelok-Key"],
                    ["?action=delete&table=…&id=…", "POST", "Hapus satu baris. Butuh header X-Sipelok-Key"],
                    ["?action=clear&table=…", "POST", "Kosongkan tabel. Butuh header X-Sipelok-Key"],
                  ].map(([a, m, d], i) => (
                    <tr key={a} className={`border-b border-mist-100 last:border-0 ${i % 2 ? "bg-mist-50/60" : ""}`}>
                      <td className="px-4 py-2.5 tnum font-bold text-ink-800 whitespace-nowrap">{a}</td>
                      <td className="px-4 py-2.5">
                        <Badge tone={m === "GET" ? "lagoon" : "amber"}>{m}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-ink-600">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ===== checklist ===== */}
        <section id="checklist" className="scroll-mt-24">
          <Checklist />
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button onClick={() => navigate("/loket")} className="btn btn-primary">
              <IconQr size={16} /> Buka Layar Loket
            </button>
            <button onClick={() => navigate("/admin")} className="btn btn-light">
              <IconRocket size={16} /> Buka Konsol Admin
            </button>
            <span className="text-[0.72rem] text-ink-500 font-semibold">
              Butuh bantuan? Jalankan langkah di atas berurutan — tiap langkah punya penanda sukses yang jelas.
            </span>
          </div>
        </section>
      </main>

      <footer className="border-t border-mist-200 mt-8">
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-wrap items-center gap-3 text-[0.72rem] text-ink-500 font-semibold">
          <span className="w-7 h-7 rounded-lg bg-ink-900 text-brand-400 flex items-center justify-center">
            <LogoMark size={16} />
          </span>
          SIPELOK · Presensi Piket Loket — BPS Kabupaten Konawe
          <span className="ml-auto tnum">PHP + MySQL · tanpa cloud</span>
        </div>
      </footer>
    </div>
  );
}
