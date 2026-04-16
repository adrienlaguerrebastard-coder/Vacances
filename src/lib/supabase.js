import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
const hasSupabaseConfig = Boolean(url && key);

export const SUPABASE_CONFIG_ERROR =
  !hasSupabaseConfig
    ? "Variables Supabase manquantes (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)"
    : "";

const errorClient = new Proxy(
  {},
  {
    get() {
      if (SUPABASE_CONFIG_ERROR) {
        throw new Error(SUPABASE_CONFIG_ERROR);
      }
      return undefined;
    },
    has() {
      return false;
    }
  }
);

export const supabase = hasSupabaseConfig ? createClient(url, key) : errorClient;
