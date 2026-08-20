import { useEffect } from "react";
import { seedDemo } from "./lib/store";
import { initBackend } from "./lib/backend";
import { navigate, useHashRoute } from "./lib/hooks";
import Gateway from "./pages/Gateway";
import Loket from "./pages/Loket";
import Scan from "./pages/Scan";
import Admin from "./pages/Admin";
import Panduan from "./pages/Panduan";

function NotFound() {
  return (
    <div className="min-h-screen bg-papergrid flex items-center justify-center p-6">
      <div className="card p-8 text-center max-w-sm rise">
        <p className="font-display font-extrabold text-6xl text-brand-500">404</p>
        <h1 className="font-display font-extrabold text-xl text-ink-900 mt-2">Halaman tidak ditemukan</h1>
        <p className="text-sm text-ink-500 mt-1.5">Alamat yang kamu tuju bukan bagian dari SIPELOK.</p>
        <button className="btn btn-primary mt-5" onClick={() => navigate("/")}>Ke Beranda</button>
      </div>
    </div>
  );
}

export default function App() {
  const route = useHashRoute();

  useEffect(() => {
    // Coba hubungkan ke API PHP/MySQL lebih dulu.
    // Jika tidak ada server (mode statis), jalankan data contoh lokal.
    let aktif = true;
    void initBackend().then((mode) => {
      if (aktif && mode === "local") seedDemo();
    });
    return () => {
      aktif = false;
    };
  }, []);

  const parts = route.split("/").filter(Boolean);

  if (parts.length === 0) return <Gateway />;
  if (parts[0] === "loket") return <Loket />;
  if (parts[0] === "scan") return <Scan token={parts[1]} />;
  if (parts[0] === "admin") return <Admin />;
  if (parts[0] === "panduan") return <Panduan />;
  return <NotFound />;
}
