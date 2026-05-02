/**
 * Print the voices this ElevenLabs account can use right now.
 * Useful on the free tier — only some voices are accessible without
 * upgrading. Run:
 *
 *   npm run voices
 *
 * Then copy the voiceId of one you like into narration.json.
 */
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

async function main() {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY is not set.')

  const client = new ElevenLabsClient({ apiKey })
  const res = await client.voices.search({ pageSize: 100 })
  const voices = res.voices ?? []

  console.log(`\n${voices.length} voice(s) available:\n`)
  for (const v of voices) {
    const labels = v.labels ?? {}
    const desc = [labels.gender, labels.accent, labels.description]
      .filter(Boolean)
      .join(' · ')
    console.log(`  ${v.voiceId}  ${v.name}${desc ? `  (${desc})` : ''}`)
  }
  console.log('')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
