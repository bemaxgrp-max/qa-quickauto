import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gnhyjetfqjcsirvyjpda.supabase.co';
const supabaseAnonKey = 'sb_publishable_ErROnqQPuZJRssOiHFPJ2w_jbM4nW2u';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
