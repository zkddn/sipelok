import type { ReactNode } from "react";
import { IconCamera, IconX } from "./icons";
import { menitTerlambat, type PresensiRecord } from "../lib/store";

/* ---------- Badge ---------- */

type Tone = "ink" | "brand" | "lagoon" | "amber" | "ruby" | "mist";

const tones: Record<Tone, string> = {
  ink: "bg-ink-900 text-mist-50",
  brand: "bg-brand-100 text-brand-600",
  lagoon: "bg-lagoon-100 text-lagoon-700",
  amber: "bg-amberx-100 text-amberx-700",
  ruby: "bg-ruby-100 text-ruby-700",
  mist: "bg-mist-100 text-ink-700",
};

export function Badge({ tone = "mist", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={`chip ${tones[tone]} ${className}`}>{children}</span>;
}

export function RecordStatus({ r }: { r: PresensiRecord }) {
  const telat = menitTerlambat(r);
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {r.keluar ? (
        <Badge tone="ink">Selesai</Badge>
      ) : (
        <Badge tone="lagoon">
          <span className="w-1.5 h-1.5 rounded-full bg-lagoon-600 live-dot inline-block" />
          Bertugas
        </Badge>
      )}
      {telat > 0 && <Badge tone="amber">+{telat} mnt</Badge>}
    </span>
  );
}

/* ---------- Foto / inisial ---------- */

const hueFrom = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
};

export function initialsOf(nama: string): string {
  const parts = nama.replace(/,.*$/, "").split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function PhotoTile({
  src,
  nama,
  className = "w-11 h-11",
  rounded = "rounded-lg",
  iconClass = "w-4 h-4",
}: {
  src: string | null;
  nama: string;
  className?: string;
  rounded?: string;
  iconClass?: string;
}) {
  if (src) {
    return <img src={src} alt={`Foto ${nama}`} className={`${className} ${rounded} object-cover border border-mist-200`} />;
  }
  const h = hueFrom(nama);
  return (
    <span
      className={`${className} ${rounded} inline-flex items-center justify-center font-display font-bold text-mist-50 relative overflow-hidden shrink-0`}
      style={{ background: `linear-gradient(140deg, hsl(${h} 32% 38%), hsl(${(h + 40) % 360} 38% 24%))` }}
      title="Belum ada foto"
    >
      {initialsOf(nama)}
      <IconCamera size={12} className={`${iconClass} absolute bottom-0.5 right-0.5 opacity-60 w-3 h-3`} />
    </span>
  );
}

/* ---------- Modal ---------- */

export function Modal({
  open,
  onClose,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 fadein" role="dialog" aria-modal>
      <button aria-label="Tutup" className="absolute inset-0 bg-ink-950/70 cursor-default" onClick={onClose} />
      <div className={`relative card p-5 w-full ${wide ? "max-w-3xl" : "max-w-md"} max-h-[88vh] overflow-y-auto slim-scroll rise`}>
        <button
          onClick={onClose}
          aria-label="Tutup dialog"
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-mist-100 hover:bg-mist-200 text-ink-700 flex items-center justify-center transition-colors"
        >
          <IconX size={16} />
        </button>
        {children}
      </div>
    </div>
  );
}

/* ---------- Lain-lain ---------- */

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[0.7rem] font-extrabold tracking-[0.14em] uppercase text-ink-500 flex items-center gap-2">
      <span className="w-4 h-[3px] rounded-full bg-brand-500 inline-block" />
      {children}
    </p>
  );
}

export function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="text-center py-10 px-4">
      <svg viewBox="0 0 80 60" className="w-20 mx-auto mb-3 text-mist-300" fill="none" stroke="currentColor" strokeWidth="2.5">
        <rect x="8" y="10" width="64" height="42" rx="6" />
        <path d="M8 22h64" strokeLinecap="round" />
        <circle cx="16" cy="16" r="1.6" fill="currentColor" stroke="none" />
        <circle cx="22" cy="16" r="1.6" fill="currentColor" stroke="none" />
        <path d="M20 38l8-7 7 5 10-10 15 12" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="font-display font-bold text-ink-800">{title}</p>
      <p className="text-sm text-ink-500 mt-1 max-w-xs mx-auto">{desc}</p>
    </div>
  );
}
