import type { LucideIcon } from 'lucide-react'
import { MoveDown, MoveVertical, Weight } from 'lucide-react'
import type { ReactNode } from 'react'

import { type LineStyle, SwitchIcon } from './SwitchIcon.tsx'
import type { Part, Switch } from './types.ts'

// The icon outline style on every label
const LINES: LineStyle = 'black'

// A value the switch file doesn't have
const Missing = () => <span className="text-zinc-400">?</span>

const shown = (value: number | undefined, digits?: number) =>
  value === undefined ? <Missing /> : digits === undefined ? value : value.toFixed(digits)

function Spec({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="flex items-center gap-[1.7mm]">
      <Icon className="size-[2.4mm] shrink-0 text-zinc-700" strokeWidth={3} />
      <span>{children}</span>
    </div>
  )
}

// A travel distance with one decimal, right-aligned in a three-character slot
const Travel = ({ value }: { value: number | undefined }) => (
  <>
    <span className="inline-block w-[3ch] text-right">{shown(value, 1)}</span> mm
  </>
)

// A part's color swatch and material. A clear part with no color gets a white swatch.
function Material({ part }: { part: Part }) {
  return (
    <div className="flex items-center gap-[1.4mm]">
      <svg viewBox="0 0 1 1" className="size-[1.6mm] shrink-0 rounded-[0.3mm] shadow-[0_0_0_0.15mm_rgb(0_0_0/0.6)]">
        <rect width={1} height={1} fill={part.color ?? '#ffffff'} />
      </svg>
      <span>{part.material ?? <Missing />}</span>
    </div>
  )
}

/** One Avery 6460 label (1" x 2-5/8"): brand, name, and type, three spec rows beside the stem, top, and bottom materials, and the icon */
export function SwitchLabel({ data }: { data: Switch }) {
  const { actuation, bottomOut } = data
  return (
    <div className="flex h-[25.4mm] w-[66.675mm] gap-[3mm] overflow-hidden bg-white px-[3.5mm] py-[2.2mm] font-sans [font-feature-settings:'ss03','ss05'] text-zinc-900">
      <div className="flex min-w-0 flex-1 flex-col whitespace-nowrap">
        <div className="mb-[0.5mm] text-[6pt] leading-[2.3mm] text-zinc-500">{data.brand}</div>
        <div className="text-[11pt] leading-[4.4mm] font-semibold">{data.name}</div>
        <div className="mt-[0.5mm] text-[7.5pt] leading-[3.2mm] font-medium capitalize">
          {data.type}
          {data.silent && ' · Silent'}
        </div>
        <div className="mt-auto grid grid-cols-[17mm_auto] grid-rows-[repeat(3,2.8mm)] gap-x-[2.5mm] font-mono [font-feature-settings:'ss09'] text-[6pt] leading-none">
          <Spec icon={Weight}>
            {/* Actuation to bottom-out, like 57–63.5 g */}
            {actuation !== undefined && <>{actuation}–</>}
            {shown(bottomOut)} g
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
      <div className="aspect-square h-full shrink-0 py-[0.3mm]">
        <SwitchIcon data={data} lines={LINES} className="block size-full" />
      </div>
    </div>
  )
}
