import { supabase } from '../../lib/supabase'

export interface BountyRow {
  id: string
  name: string
  bounty: number
}

export async function fetchTopBounties(limit = 10): Promise<BountyRow[]> {
  const { data, error } = await supabase
    .from('character')
    .select('id, name, bounty')
    .not('bounty', 'is', null)
    .order('bounty', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []).map((r) => ({
    id: String(r.id),
    name: r.name ?? 'Unknown',
    bounty: r.bounty ?? 0,
  }))
}
