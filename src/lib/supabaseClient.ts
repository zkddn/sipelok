/* =========================================================
   SIPELOK — jembatan Supabase (opsional)
   ---------------------------------------------------------
   Versi bawaan aplikasi menyimpan data di localStorage agar
   bisa langsung dicoba tanpa server. Untuk implementasi
   multi-perangkat (PC loket + banyak HP petugas), hubungkan
   Supabase:

   1. Buat proyek gratis di https://supabase.com
   2. Jalankan SQL pada halaman #/panduan (tab Database)
   3. Isi dua variabel lingkungan di bawah (Vite):
        VITE_SUPABASE_URL=https://xxxx.supabase.co
        VITE_SUPABASE_ANON_KEY=xxxx
   4. Ganti fungsi di src/lib/store.ts (getRecords, saveRecords,
      checkIn, checkOut, getPetugas, getJadwal, ...) dengan
      panggilan supabase.from("...") — contoh ada di panduan.

   Paket @supabase/supabase-js sudah terpasang di proyek ini.
   ========================================================= */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** `null` selama env belum diisi — aplikasi otomatis memakai mode localStorage. */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const isBackendMode = supabase !== null;
