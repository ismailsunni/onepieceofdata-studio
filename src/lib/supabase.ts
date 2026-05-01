import { createClient } from '@supabase/supabase-js'

// Used in calculateMetadata (Node side) at build time, so we read from
// process.env directly rather than the Vite-style VITE_* prefix used in
// the React project.
const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error(
    'SUPABASE_URL and SUPABASE_ANON_KEY must be set (see .env.example).'
  )
}

export const supabase = createClient(url, key)
