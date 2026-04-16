import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
const hasSupabaseConfig = Boolean(url && key);

export const SUPABASE_CONFIG_ERROR =
  !hasSupabaseConfig
    ? "Variables Supabase manquantes (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)"
    : "";

function throwConfigError() {
  if (hasSupabaseConfig) {
    throw new Error("Supabase fallback client used unexpectedly");
  }
  throw new Error(SUPABASE_CONFIG_ERROR);
}

const errorClient = new Proxy(
  {},
  {
    get() {
      throwConfigError();
    },
    has() {
      throwConfigError();
    }
  }
);

export const supabase = hasSupabaseConfig ? createClient(url, key) : errorClient;
