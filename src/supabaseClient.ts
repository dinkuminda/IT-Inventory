import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLIC_KEY = import.meta.env.VITE_SUPABASE_PUBLIC_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLIC_KEY) {
  console.error("Supabase environment variables are missing! Please check your AI Studio Settings.");
}

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_PUBLIC_KEY || '');
