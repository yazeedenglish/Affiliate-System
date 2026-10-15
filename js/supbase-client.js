
const SUPABASE_URL = "https://cyplzuamsejgjjrtmonw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_-I00mqrbbZF-wtJudW6nFA_FD-tuAgy";

window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);
