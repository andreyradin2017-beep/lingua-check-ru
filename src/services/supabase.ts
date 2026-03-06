import { createClient } from "@supabase/supabase-js";
import { logger } from "../utils/logger";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  logger.error("Supabase credentials missing! Check .env file.", "supabase");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
