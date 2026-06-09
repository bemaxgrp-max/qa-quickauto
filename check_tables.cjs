const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://gnhyjetfqjcsirvyjpda.supabase.co';
const supabaseAnonKey = 'sb_publishable_ErROnqQPuZJRssOiHFPJ2w_jbM4nW2u';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data, error } = await supabase.rpc('get_tables'); // Check if there is a custom function
  console.log('RPC get_tables:', data, error);

  // Let's also check if we can query common table names
  const commonTables = ['exchange_rates', 'customers', 'inventory_items', 'services', 'orders', 'order_items'];
  for (const t of commonTables) {
    const { data: rows, error: err } = await supabase.from(t).select('*').limit(1);
    console.log(`Table ${t}:`, rows ? 'Exists' : 'Does not exist/Error', err ? err.message : 'No error');
  }
}

main();
