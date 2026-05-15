import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLIC_KEY;

const isPlaceholder = (val: string | undefined) => 
  !val || 
  val.includes('YOUR_') || 
  val === 'placeholder' || 
  val.includes('placeholder.supabase.co') ||
  val.includes('supabase.co') && val.length < 30 || // URL too short
  val.length < 20; // Key too short

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && !isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseAnonKey));

if (!isSupabaseConfigured) {
  console.error('Supabase credentials missing or invalid in environment variables.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);

export const logAction = async (action: string, entityType: string, entityId?: string, details?: any) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('audit_logs').insert([{
      userId: user.id,
      action,
      entityType,
      entityId,
      details
    }]);
  } catch (error) {
    console.error('Audit log error:', error);
  }
};
