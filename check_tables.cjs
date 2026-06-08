const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://hsjfdbdzeqcdqnnjghpe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzamZkYmR6ZXFjZHFubmpnaHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MjU3NDQsImV4cCI6MjA5MTAwMTc0NH0.fwic5i4tVK3x3_yDgI_jbNv0Sbjbv4C1Q8N4__tGKQo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data, error } = await supabase.rpc('get_tables'); // Check if there is a custom function
  console.log('RPC get_tables:', data, error);

  // Let's also check if we can query common table names
  const commonTables = ['exchange_rates', 'catalog_settings', 'settings', 'catalog_exchange_rates', 'inventory_items'];
  for (const t of commonTables) {
    const { data: rows, error: err } = await supabase.from(t).select('*').limit(1);
    console.log(`Table ${t}:`, rows ? 'Exists' : 'Does not exist/Error', err ? err.message : 'No error');
  }
}

main();
