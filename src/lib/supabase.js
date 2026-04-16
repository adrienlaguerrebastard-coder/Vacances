import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const SUPABASE_CONFIG_ERROR =
  !url || !key
    ? "Variables Supabase manquantes (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)"
    : "";

const missingConfigClient = new Proxy(
  {},
  {
    get() {
      throw new Error(SUPABASE_CONFIG_ERROR);
    }
  }
);

export const supabase = SUPABASE_CONFIG_ERROR ? missingConfigClient : createClient(url, key);
