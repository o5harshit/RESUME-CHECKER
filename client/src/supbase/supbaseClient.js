import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_supabaseUrl;
const supabaseAnonKey = import.meta.env.VITE_supabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
