/**
 * Reads narration.json, calls ElevenLabs TTS for each line, and writes
 * MP3 files into public/audio/. Run once after editing the script:
 *
 *   npm run narrate
 *
 * Files are committed to the repo so renders are deterministic — no need
 * to re-hit the TTS API on every render.
 */
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import fs from 'node:fs/promises'
import path from 'node:path'

interface NarrationConfig {
  voiceId: string
  model: string
  settings: {
    stability: number
    similarityBoost: number
    style: number
    useSpeakerBoost: boolean
  }
  lines: Record<string, string>
}

async function main() {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not set (see .env.example).')
  }

  const root = process.cwd()
  const cfgRaw = await fs.readFile(path.join(root, 'narration.json'), 'utf8')
  const cfg = JSON.parse(cfgRaw) as NarrationConfig

  const outDir = path.join(root, 'public', 'audio')
  await fs.mkdir(outDir, { recursive: true })

  const client = new ElevenLabsClient({ apiKey })

  for (const [name, text] of Object.entries(cfg.lines)) {
    process.stdout.write(`▸ ${name} … `)
    const stream = await client.textToSpeech.convert(cfg.voiceId, {
      text,
      modelId: cfg.model,
      voiceSettings: cfg.settings,
    })

    const chunks: Buffer[] = []
    for await (const chunk of stream as unknown as AsyncIterable<Uint8Array>) {
      chunks.push(Buffer.from(chunk))
    }
    const buf = Buffer.concat(chunks)
    const file = path.join(outDir, `${name}.mp3`)
    await fs.writeFile(file, buf)
    process.stdout.write(`${(buf.length / 1024).toFixed(1)} KB\n`)
  }

  console.log(`\nDone. ${Object.keys(cfg.lines).length} files in public/audio/.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
