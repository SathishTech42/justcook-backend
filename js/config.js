// ============================================================
// JustCook — Global Config (Supabase Frontend)
// ============================================================

window.SUPABASE_URL = 'https://zaxgfjpdiupeyhgrllbw.supabase.co';
// Anon key from Supabase Dashboard -> Settings -> API
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpheGdmanBkaWhwZXloZ3JsbGJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMTY1MzQsImV4cCI6MjA5NTU5MjUzNH0.12AplYRjXVtlmCEgAoVQ-jT_nj6_dM13iP5JEgKCybs';

if (window.SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {
    window.supabaseClient = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
} else {
    console.error("⚠️ SUPABASE_ANON_KEY is missing! Realtime and Login will not work until you add it in js/config.js");
}
