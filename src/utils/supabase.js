import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create Supabase client only if environment variables are available
// This allows the app to function without Supabase configuration
let supabaseClient = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.warn('Failed to initialize Supabase client:', error);
  }
} else {
  console.info('Supabase not configured. Some features may be limited.');
}

export const supabase = supabaseClient;

// Helper function to check if Supabase is available
export const isSupabaseAvailable = () => {
  return supabaseClient !== null;
};