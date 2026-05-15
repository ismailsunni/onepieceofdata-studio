// Renders every slide of a carousel composition (fps=1, one frame = one PNG).
// Run: npm run carousel [-- <CompositionId>]   (defaults to Top100Wishlist)

import path from 'node:path'
import { mkdir, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { bundle } from '@remotion/bundler'
import { renderStill, selectComposition } from '@remotion/renderer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const ENTRY = path.join(ROOT, 'src', 'index.ts')

const COMPOSITION_ID = process.argv[2] ?? 'Top100Wishlist'
const OUT_DIR = path.join(ROOT, 'out', 'carousel', COMPOSITION_ID)

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true })
  await mkdir(OUT_DIR, { recursive: true })

  console.log('Bundling…')
  const serveUrl = await bundle({ entryPoint: ENTRY })

  console.log(`Resolving composition "${COMPOSITION_ID}" (fetches Supabase data)…`)
  const composition = await selectComposition({
    serveUrl,
    id: COMPOSITION_ID,
    // calculateMetadata reads process.env.SUPABASE_*; pass them through.
    envVariables: {
      SUPABASE_URL: process.env.SUPABASE_URL ?? '',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? '',
    },
  })

  const total = composition.durationInFrames
  console.log(`Rendering ${total} slides → ${OUT_DIR}`)

  for (let frame = 0; frame < total; frame++) {
    const file = path.join(
      OUT_DIR,
      `slide-${String(frame + 1).padStart(2, '0')}.png`
    )
    await renderStill({
      composition,
      serveUrl,
      output: file,
      frame,
      imageFormat: 'png',
      // 2× super-sample for crisper text and portraits.
      // Output dimensions become 2160×2700.
      scale: 2,
      envVariables: {
        SUPABASE_URL: process.env.SUPABASE_URL ?? '',
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? '',
      },
    })
    console.log(`  ✓ slide ${frame + 1}/${total}`)
  }

  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
