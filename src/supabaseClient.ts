import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://yhmrowedxdlgfdvdkcng.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_UBXK5sDQcUCn-T-WXmDNnw_3WsofvGZ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
