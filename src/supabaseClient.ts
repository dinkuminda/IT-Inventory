import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLIC_KEY;

const isPlaceholder = (val: string | undefined) => 
  !val || 
  val.includes('YOUR_') || 
  val === 'placeholder' || 
  val.length < 10;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && !isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseAnonKey));

if (!isSupabaseConfigured) {
  console.error('Supabase credentials missing or invalid in environment variables.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
