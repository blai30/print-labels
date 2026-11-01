import type { LucideIcon } from 'lucide-react'
import { MoveDown, MoveVertical, Weight } from 'lucide-react'
import type { ReactNode } from 'react'

import { SwitchIcon } from './SwitchIcon.tsx'
import type { Part, Switch } from './types.ts'

function Spec({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="size-2.25 shrink-0 text-zinc-700" strokeWidth={3} />
      <span>{children}</span>
    </div>
  )
}

function Material({ part }: { part: Part }) {
  return (
    <div className="flex items-center gap-1.25">
      <svg viewBox="0 0 1 1" className="size-1.5 shrink-0 rounded-[0.3mm] ring-[0.15mm] ring-black/60">
        <rect width={1} height={1} fill={part.color ?? '#ffffff'} />
      </svg>
      <span>{part.material ?? <span className="text-zinc-500">?</span>}</span>
    </div>
  )
}

/** One Avery 6460 label (1" x 2-5/8") */
export function SwitchLabel({ data }: { data: Switch }) {
  return (
    <div className="flex h-24 w-63 gap-2.75 overflow-hidden bg-white px-3.25 py-2 font-sans font-features-['ss05'] text-zinc-900">
      <div className="flex min-w-0 flex-1 flex-col whitespace-nowrap">
        <div className="mb-0.5 text-[5.25pt]/2.25 tracking-wider text-zinc-600 uppercase">{data.brand}</div>
        <div className="text-[11pt]/4.25 font-semibold tracking-tight">{data.name}</div>
        <div className="mt-0.5 text-[7.5pt]/3 font-medium capitalize">
          {data.type}
          {data.silent && (
            <span className="ml-1.25 inline-block rounded-xs px-0.5 py-px align-[0.1em] text-[5pt]/none font-semibold tracking-wide text-zinc-800 uppercase inset-ring-[0.2mm]">
              Silent
            </span>
          )}
        </div>
        <div className="mt-auto grid h-8 grid-cols-[--spacing(14)_auto] grid-rows-3 gap-x-2.25 text-[6pt]/none tabular-nums">
          <Spec icon={Weight}>
            {/* Actuation to bottom-out */}
            {data.actuation !== undefined && <>{data.actuation}–</>}
            {data.bottomOut ?? <span className="text-zinc-500">?</span>} g
          </Spec>
          <Material part={data.stem} />
          <Spec icon={MoveDown}>{data.preTravel?.toFixed(1) ?? <span className="text-zinc-500">?</span>} mm</Spec>
          <Material part={data.top} />
          <Spec icon={MoveVertical}>{data.travel?.toFixed(1) ?? <span className="text-zinc-500">?</span>} mm</Spec>
          <Material part={data.bottom} />
        </div>
      </div>
      <div className="aspect-square h-full shrink-0 py-px">
        <SwitchIcon data={data} lines="black" />
      </div>
    </div>
  )
}
