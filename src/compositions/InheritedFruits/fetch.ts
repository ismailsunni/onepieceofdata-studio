// Devil fruits that have belonged to more than one person — the fruit's power
// returns to the world when its user dies, and someone else eventually finds
// it. The pairing is hand-curated (chronology isn't in the database), but
// every name/fruit combo is verified against `character_devil_fruit` at build
// time, and artificial copies (the Egghead Seraphim) are excluded since those
// are cloned replicas, not the same fruit passing hands.
import { supabase } from '../../lib/supabase'

interface Succession {
  fruitName: string
  fruitModel: string | null
  englishName: string
  fromId: string
  toId: string
  note: string
}

const SUCCESSIONS: Succession[] = [
  {
    fruitName: 'Bomu Bomu no Mi',
    fruitModel: null,
    englishName: 'Bomb-Bomb Fruit',
    fromId: 'Ganzui',
    toId: 'Gem',
    note: 'From a Rocks Pirate to Baroque Works’ Mr. 5',
  },
  {
    fruitName: 'Jiki Jiki no Mi',
    fruitModel: null,
    englishName: 'Magnet-Magnet Fruit',
    fromId: 'John',
    toId: 'Eustass_Kid',
    note: 'From a Rocks Pirate to a Worst Generation captain',
  },
  {
    fruitName: 'Suke Suke no Mi',
    fruitModel: null,
    englishName: 'Clear-Clear Fruit',
    fromId: 'Absalom',
    toId: 'Shiryu',
    note: 'From Thriller Bark to Impel Down’s breakout',
  },
  {
    fruitName: 'Mane Mane no Mi',
    fruitModel: null,
    englishName: 'Clone-Clone Fruit',
    fromId: 'Kurozumi_Higurashi',
    toId: 'Bentham',
    note: 'From Wano’s past to Mr. 2 Bon Kurei',
  },
  {
    fruitName: 'Bari Bari no Mi',
    fruitModel: null,
    englishName: 'Barrier-Barrier Fruit',
    fromId: 'Kurozumi_Semimaru',
    toId: 'Bartolomeo',
    note: 'From Wano’s past to the Barto Club',
  },
  {
    fruitName: 'Soru Soru no Mi',
    fruitModel: null,
    englishName: 'Soul-Soul Fruit',
    fromId: 'Carmel',
    toId: 'Charlotte_Linlin',
    note: 'Devoured, fruit and all, by a young Big Mom',
  },
  {
    fruitName: 'Mera Mera no Mi',
    fruitModel: null,
    englishName: 'Flame-Flame Fruit',
    fromId: 'Portgas_D._Ace',
    toId: 'Sabo',
    note: 'From one sworn brother to another, at Dressrosa',
  },
  {
    fruitName: 'Gura Gura no Mi',
    fruitModel: null,
    englishName: 'Tremor-Tremor Fruit',
    fromId: 'Edward_Newgate',
    toId: 'Marshall_D._Teach',
    note: 'Stolen from Whitebeard at Marineford',
  },
  {
    fruitName: 'Hito Hito no Mi',
    fruitModel: 'Nika',
    englishName: 'Human-Human Fruit, Model: Nika',
    fromId: 'Joy_Boy',
    toId: 'Monkey_D._Luffy',
    note: '900 years later, the Sun God returns',
  },
]

export interface FruitLink {
  id: string
  name: string
  imageUrl: string | null
}

export interface FruitSuccessionEntry {
  fruitName: string
  englishName: string
  from: FruitLink
  to: FruitLink
  note: string
}

export interface InheritedFruitsSnapshot {
  fruits: FruitSuccessionEntry[]
}

function characterImageUrl(id: string): string {
  const ascii = id.normalize('NFD').replace(/\p{Diacritic}/gu, '')
  return `${process.env.SUPABASE_URL}/storage/v1/object/public/character-images/${encodeURIComponent(ascii)}.png`
}

async function imageExists(url: string): Promise<boolean> {
  try {
    return (await fetch(url, { method: 'HEAD' })).ok
  } catch {
    return false
  }
}

export async function loadInheritedFruitsSnapshot(): Promise<InheritedFruitsSnapshot> {
  const ids = Array.from(
    new Set(SUCCESSIONS.flatMap((s) => [s.fromId, s.toId]))
  )

  const [{ data: chars, error: charErr }, { data: fruitRows, error: fruitErr }] =
    await Promise.all([
      supabase.from('character').select('id, name').in('id', ids),
      supabase
        .from('character_devil_fruit')
        .select('character_id, fruit_name, fruit_model, is_artificial')
        .in('character_id', ids),
    ])
  if (charErr) throw charErr
  if (fruitErr) throw fruitErr

  const nameById = new Map((chars ?? []).map((c) => [String(c.id), c.name as string]))
  const fruitsByCharId = new Map<string, typeof fruitRows>()
  for (const r of fruitRows ?? []) {
    const key = String(r.character_id)
    fruitsByCharId.set(key, [...(fruitsByCharId.get(key) ?? []), r])
  }

  const link = async (id: string): Promise<FruitLink> => {
    const name = nameById.get(id)
    if (!name) throw new Error(`InheritedFruits: character "${id}" not found`)
    const url = characterImageUrl(id)
    return { id, name, imageUrl: (await imageExists(url)) ? url : null }
  }

  const fruits: FruitSuccessionEntry[] = []
  for (const s of SUCCESSIONS) {
    for (const id of [s.fromId, s.toId]) {
      const row = (fruitsByCharId.get(id) ?? []).find(
        (r) => r.fruit_name === s.fruitName && (r.fruit_model ?? null) === s.fruitModel
      )
      if (!row) {
        throw new Error(`InheritedFruits: "${id}" is not recorded eating "${s.fruitName}"`)
      }
      if (row.is_artificial) {
        throw new Error(`InheritedFruits: "${id}"'s "${s.fruitName}" is an artificial copy`)
      }
    }
    fruits.push({
      fruitName: s.fruitName,
      englishName: s.englishName,
      from: await link(s.fromId),
      to: await link(s.toId),
      note: s.note,
    })
  }

  return { fruits }
}
