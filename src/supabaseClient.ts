import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLIC_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing from environment variables. The app may not function correctly.');
}

// Ensure we don't pass an empty string to createClient if we can avoid it, 
// though createClient('') will still likely throw or fail. 
// We'll wrap it or use a dummy if necessary to at least allow the UI to load.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
