import clsx from 'clsx/lite'
import { useState } from 'react'

import { templates } from './templates.ts'

// Workbench zoom levels, 1x to 4x
const ZOOMS = ['zoom-100', 'zoom-200', 'zoom-300', 'zoom-400']

export function App() {
  // ?template=<name>&label=<item> shows just that label at print size, for scripts/export.ts
  const params = new URLSearchParams(location.search)
  const template = params.get('template')
  const label = params.get('label')
  if (template && label) {
    return (
      <div id="label" className="w-fit">
        {templates[template].labels[label]}
      </div>
    )
  }
  return <Preview />
}

function Preview() {
  const [zoom, setZoom] = useState(3)
  return (
    <div className="min-h-screen bg-zinc-900 font-sans text-zinc-100">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-8 py-4 backdrop-blur-sm">
        <h1 className="text-lg font-semibold tracking-tight">Print labels</h1>
        <div className="flex items-center gap-1 rounded-lg bg-zinc-800 p-1 text-sm" role="group" aria-label="Zoom">
          {ZOOMS.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setZoom(index + 1)}
              aria-pressed={index + 1 === zoom}
              className={clsx(
                'rounded-md px-3 py-1 tabular-nums transition-colors',
                index + 1 === zoom ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-400 hover:text-zinc-100'
              )}
            >
              {index + 1}x
            </button>
          ))}
        </div>
      </header>
      <main className="flex flex-col gap-12 px-8 py-10">
        {Object.entries(templates).map(([name, { title, labels }]) => (
          <section key={name}>
            <h2 className="mb-6 text-sm font-medium text-zinc-400">
              {title} <span className="text-zinc-600">· {Object.keys(labels).length}</span>
            </h2>
            <div className="flex flex-wrap gap-8">
              {Object.entries(labels).map(([item, element]) => (
                <figure key={item} className="flex flex-col gap-2">
                  <div className={clsx('w-fit shadow-lg ring-1 shadow-black/40 ring-black/20', ZOOMS[zoom - 1])}>
                    {element}
                  </div>
                  <figcaption>
                    <a href={`?template=${name}&label=${item}`} className="text-xs text-zinc-500 hover:text-zinc-200">
                      {item}
                    </a>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}
