import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xaotzsgpepwtixzkuslx.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhhb3R6c2dwZXB3dGl4emt1c2x4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Mzg1NTksImV4cCI6MjA3NjIxNDU1OX0.ZLIrY7ZkHRAioaTIG7Tmi6eOc-AFE2iO0KccXO07uyM";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export { supabase as s };
