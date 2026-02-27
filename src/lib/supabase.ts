import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase muhit o\'zgaruvchilari topilmadi');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
supabase secrets set NEWSAPI_KEY=8d4042d86da64fb2a8ccd12f3dd7fdc2
