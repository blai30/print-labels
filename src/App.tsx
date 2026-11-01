import { useState } from 'react'

import { Navbar } from './Navbar.tsx'
import { templates } from './templates.ts'
import { IconPreviewer } from './templates/switches/IconPreviewer.tsx'

const ZOOMS = [1, 2, 3, 4]

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
  return location.pathname.startsWith(`${import.meta.env.BASE_URL}icon`) ? <IconPreviewer /> : <Preview />
}

function Preview() {
  const [zoom, setZoom] = useState(3)
  return (
    <div className="min-h-dvh bg-zinc-900 font-sans text-zinc-100">
      <Navbar current="labels">
        <div
          className="flex items-center gap-0.5 rounded-lg bg-zinc-800/80 p-0.5 text-xs"
          role="group"
          aria-label="Zoom"
        >
          {ZOOMS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setZoom(level)}
              aria-pressed={level === zoom}
              className="h-7 rounded-md px-2 text-zinc-400 tabular-nums outline-zinc-100 transition-colors hover:text-zinc-100 focus-visible:outline-2 aria-pressed:bg-zinc-100 aria-pressed:font-medium aria-pressed:text-zinc-900 sm:px-2.5"
            >
              {level}x
            </button>
          ))}
        </div>
      </Navbar>
      <main className="flex flex-col gap-12 px-4 py-10 sm:px-6">
        {Object.entries(templates).map(([name, { title, labels }]) => (
          <section key={name}>
            <h2 className="mb-6 text-sm font-medium text-zinc-400">
              {title} <span className="text-zinc-600">· {Object.keys(labels).length}</span>
            </h2>
            <div className="flex flex-wrap gap-8">
              {Object.entries(labels).map(([item, element]) => (
                <figure key={item} className="flex flex-col gap-2">
                  <div className="w-fit shadow-lg ring-1 shadow-black/40 ring-black/20" style={{ zoom }}>
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
