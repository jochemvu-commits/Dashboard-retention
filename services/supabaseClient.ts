import { createClient } from '@supabase/supabase-js';

// TEMPORARY - hardcoded for testing
const supabaseUrl = 'https://tjdktruivfkmwsancwzy.supabase.co';
const supabaseAnonKey = 'sb_publishable_vBnHjcDLG5QSOFiLFhL1UQ_MgXDT4yf';

console.log('URL:', supabaseUrl);
console.log('KEY exists:', !!supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);