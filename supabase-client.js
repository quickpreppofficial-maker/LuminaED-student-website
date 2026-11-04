/* Shared LuminaED Supabase client. The publishable key is safe for browser use;
   database access must still be protected by Supabase Row Level Security. */
(() => {
  const SUPABASE_URL = "https://rgtzisppiqorzfguypmq.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_oumb66B5j9JtbeTymGFSng_SZ5U8ahx";

  if (!window.supabase?.createClient) {
    console.error("LuminaED: Supabase JS did not load.");
    return;
  }

  window.luminaSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );
})();
