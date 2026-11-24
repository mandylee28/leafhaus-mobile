// Leafhaus — Supabase client.
// Config comes from EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
// in .env (see .env.example). Without real values the app runs in local mode
// and stores orders in AsyncStorage on the device only.

import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  url &&
  key &&
  !url.includes('YOUR-PROJECT') &&
  !key.includes('YOUR-ANON-KEY')
);

export const supabase = isSupabaseConfigured
  ? createClient(url, key)
  : null;
