import type { LucideIcon } from 'lucide-react'
import { MoveDown, MoveVertical, Weight } from 'lucide-react'
import type { ReactNode } from 'react'

import { type LineStyle, SwitchIcon } from './SwitchIcon.tsx'
import type { Part, Switch } from './types.ts'

const LINES: LineStyle = 'black'

const Missing = () => <span className="text-zinc-400">?</span>

const shown = (value: number | undefined, digits?: number) =>
  value === undefined ? <Missing /> : digits === undefined ? value : value.toFixed(digits)

function Spec({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="size-2.25 shrink-0 text-zinc-700" strokeWidth={3} />
      <span>{children}</span>
    </div>
  )
}

// Right-aligned so the units line up
const Travel = ({ value }: { value: number | undefined }) => (
  <>
    <span className="inline-block w-[3ch] text-right">{shown(value, 1)}</span> mm
  </>
)

function Material({ part }: { part: Part }) {
  return (
    <div className="flex items-center gap-1.25">
      <svg viewBox="0 0 1 1" className="size-1.5 shrink-0 rounded-[0.3mm] ring-[0.15mm] ring-black/60">
        <rect width={1} height={1} fill={part.color ?? '#ffffff'} />
      </svg>
      <span>{part.material ?? <Missing />}</span>
    </div>
  )
}

/** One Avery 6460 label (1" x 2-5/8") */
export function SwitchLabel({ data }: { data: Switch }) {
  return (
    <div className="flex h-24 w-63 gap-2.75 overflow-hidden bg-white px-3.25 py-2 font-sans font-features-['ss05'] text-zinc-900">
      <div className="flex min-w-0 flex-1 flex-col whitespace-nowrap">
        <div className="mb-0.5 text-[6pt]/2.25 text-zinc-500">{data.brand}</div>
        <div className="text-[11pt]/4.25 font-semibold">{data.name}</div>
        <div className="mt-0.5 text-[7.5pt]/3 font-medium capitalize">
          {data.type}
          {data.silent && ' · Silent'}
        </div>
        <div className="mt-auto grid h-8 grid-cols-[--spacing(16)_auto] grid-rows-3 gap-x-2.25 font-mono font-features-['ss09'] text-[6pt]/none">
          <Spec icon={Weight}>
            {/* Actuation to bottom-out */}
            {data.actuation !== undefined && <>{data.actuation}–</>}
            {shown(data.bottomOut)} g
          </Spec>
          <Material part={data.stem} />
          <Spec icon={MoveDown}>
            <Travel value={data.preTravel} />
          </Spec>
          <Material part={data.top} />
          <Spec icon={MoveVertical}>
            <Travel value={data.travel} />
          </Spec>
          <Material part={data.bottom} />
        </div>
      </div>
      <div className="aspect-square h-full shrink-0 py-px">
        <SwitchIcon data={data} lines={LINES} />
      </div>
    </div>
  )
}
