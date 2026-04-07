import { createClient } from '@supabase/supabase-js';

// Project: dinkuminda's Project
const SUPABASE_URL = "https://wshzrohkcjgemxnwjivp.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_bzYyDVKFby6_lFR5uNtMkQ_D4sofBpa";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
