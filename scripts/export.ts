// Prints each label to exports/<template>/<label>.pdf, plus labels.csv for Affinity Data Merge with --csv. Usage in README.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'

import { chromium } from 'playwright'
import { createServer } from 'vite'

const server = await createServer({ server: { port: 0 }, logLevel: 'warn' })
await server.listen()
const browser = await chromium.launch()
try {
  const { templates } = (await server.ssrLoadModule('/src/templates.ts')) as {
    templates: Record<string, { labels: object }>
  }
  const { values, positionals } = parseArgs({ options: { csv: { type: 'boolean' } }, allowPositionals: true })
  const [only, ...items] = positionals
  const page = await browser.newPage()
  for (const name of only ? [only] : Object.keys(templates)) {
    const labels = items.length ? items : Object.keys(templates[name].labels).sort()
    const folder = path.resolve(import.meta.dirname, '../exports', name)
    const table = path.join(folder, 'labels.csv')
    mkdirSync(folder, { recursive: true })
    // A stale CSV could point Data Merge at old labels
    rmSync(table, { force: true })
    const pdfs = []
    for (const label of labels) {
      await page.goto(new URL(`?template=${name}&label=${label}`, server.resolvedUrls!.local[0]).href)
      await page.evaluate('document.fonts.ready')
      // The PDF takes the label component's size
      const box = (await page.locator('#label').boundingBox())!
      const pdf = path.join(folder, `${label}.pdf`)
      await page.pdf({ path: pdf, width: `${box.width}px`, height: `${box.height}px`, printBackground: true })
      pdfs.push(pdf)
    }
    if (values.csv) {
      writeFileSync(table, ['label', ...pdfs].join('\n') + '\n')
    }
    console.log(`${pdfs.length} label${pdfs.length === 1 ? '' : 's'} in ${folder}`)
  }
} finally {
  await browser.close()
  await server.close()
}
