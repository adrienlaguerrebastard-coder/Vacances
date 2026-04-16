import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const SUPABASE_CONFIG_ERROR =
  !url || !key
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
    }
  }
);

export const supabase = SUPABASE_CONFIG_ERROR ? errorClient : createClient(url, key);
