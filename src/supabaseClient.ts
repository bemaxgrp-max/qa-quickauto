import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hsjfdbdzeqcdqnnjghpe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzamZkYmR6ZXFjZHFubmpnaHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MjU3NDQsImV4cCI6MjA5MTAwMTc0NH0.fwic5i4tVK3x3_yDgI_jbNv0Sbjbv4C1Q8N4__tGKQo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
