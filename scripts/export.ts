// Prints every label to its own PDF in exports/<template>/, plus labels.csv listing the PDFs for Affinity Data Merge.
//   npm run export                          every template
//   npm run export -- switches              one template
//   npm run export -- switches hmx-butter   just these labels
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { chromium } from 'playwright'
import { createServer } from 'vite'

const OUTPUT = path.resolve(import.meta.dirname, '../exports')

const server = await createServer({ server: { port: 0 }, logLevel: 'warn' })
await server.listen()
const browser = await chromium.launch()
try {
  // The templates come from the app's own code, so data globs and JSON work the same as in the browser
  const { templates } = (await server.ssrLoadModule('/src/templates.ts')) as {
    templates: Record<string, { labels: object }>
  }
  const [only, ...items] = process.argv.slice(2)
  const page = await browser.newPage()
  for (const name of only ? [only] : Object.keys(templates)) {
    const labels = items.length ? items : Object.keys(templates[name].labels).sort()
    const folder = path.join(OUTPUT, name)
    const table = path.join(folder, 'labels.csv')
    mkdirSync(folder, { recursive: true })
    // A stale CSV could point Data Merge at labels from an earlier run
    rmSync(table, { force: true })
    const pdfs = []
    for (const label of labels) {
      await page.goto(new URL(`?template=${name}&label=${label}`, server.resolvedUrls!.local[0]).href)
      await page.evaluate('document.fonts.ready')
      // The page is exactly the label's size, so each template sets its size in one place: its component
      const box = (await page.locator('#label').boundingBox())!
      const pdf = path.join(folder, `${label}.pdf`)
      await page.pdf({ path: pdf, width: `${box.width}px`, height: `${box.height}px`, printBackground: true })
      pdfs.push(pdf)
    }
    writeFileSync(table, ['label', ...pdfs].join('\n') + '\n')
    console.log(`${pdfs.length} label${pdfs.length === 1 ? '' : 's'} in ${folder}`)
  }
} finally {
  await browser.close()
  await server.close()
}
