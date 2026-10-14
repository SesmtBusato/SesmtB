import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://olrtzxamixygmrftcczc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_yMjEr3IZPAu7ncs40hMtPg_mbcZtCPw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
