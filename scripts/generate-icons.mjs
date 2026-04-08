#!/usr/bin/env node
/**
 * generate-icons.mjs
 *
 * Generates PWA app icons from the source SVG.
 * Reads:  assets/icons/woodshed-icon.svg
 * Writes: public/icon-192.png
 *         public/icon-512.png
 *         public/icon-maskable-512.png
 *
 * The "any" icons fill the full canvas with the brand background and
 * place the SVG centered. The maskable icon scales the SVG into the
 * inner 80% safe zone (Android adaptive icons mask the outer 20%).
 *
 * Run via:  npm run generate:icons
 * Auto-run: npm run build (via prebuild hook)
 */

import sharp from 'sharp'
import { mkdir, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot  = resolve(__dirname, '..')
const SOURCE    = resolve(repoRoot, 'assets/icons/woodshed-icon.svg')
const OUT_DIR   = resolve(repoRoot, 'public')

// Brand background — must match manifest background_color and CLAUDE.md
// --color-background-primary token.
const BG = '#0a0a0a'

// Maskable safe zone: Android adaptive icons may crop the outer 20% of
// the canvas. Content must live within the inner 80%.
const MASKABLE_SAFE_RATIO = 0.8

async function generate({ size, maskable, outName }) {
  const svgBuffer = await readFile(SOURCE)
  const contentSize = maskable
    ? Math.round(size * MASKABLE_SAFE_RATIO)
    : size
  const offset = Math.round((size - contentSize) / 2)

  // Render the SVG into the content area at the right size.
  const rendered = await sharp(svgBuffer, { density: 384 })
    .resize(contentSize, contentSize, { fit: 'contain' })
    .png()
    .toBuffer()

  // Composite onto a brand-colored canvas.
  const outPath = resolve(OUT_DIR, outName)
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: rendered, top: offset, left: offset }])
    .png()
    .toFile(outPath)

  console.log(`  ✓ ${outName}  (${size}×${size}${maskable ? ', maskable' : ''})`)
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  console.log(`Generating PWA icons from ${SOURCE}`)
  await generate({ size: 192, maskable: false, outName: 'icon-192.png' })
  await generate({ size: 512, maskable: false, outName: 'icon-512.png' })
  await generate({ size: 512, maskable: true,  outName: 'icon-maskable-512.png' })
  console.log('Done.')
}

main().catch((err) => {
  console.error('Icon generation failed:', err)
  process.exit(1)
})
