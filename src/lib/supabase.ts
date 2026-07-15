import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
    console.warn(
    "[CariñinesGym] Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Crea un archivo .env.local para conectar con Supabase."
  );
}

// No usamos autenticacion: cada persona elige un nombre en el dispositivo y
// ese nombre se guarda como "owner" en las filas de Supabase.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      persistSession: false,
    },
  }
);
