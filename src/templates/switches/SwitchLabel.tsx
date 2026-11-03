import type { LucideIcon } from 'lucide-react'
import { ArrowDownToLine, Weight } from 'lucide-react'
import type { ReactNode } from 'react'

import { palette, type Point } from './geometry.ts'
import { ICON_ASPECT, SwitchIcon } from './SwitchIcon.tsx'
import type { Part, Switch } from './types.ts'

const missing = <span className="text-neutral-500">?</span>

function Spec({ icon: Icon, value, unit }: { icon: LucideIcon; value: ReactNode; unit: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="size-2.5 shrink-0" strokeWidth={2.5} />
      <span className={`text-[8.5pt]/none font-medium [text-box:trim-both_cap_alphabetic]`}>
        {value}
        <span className="ml-px text-[6pt] font-normal tracking-normal">{unit}</span>
      </span>
    </div>
  )
}

// Each part on Lucide's 24 x 24 grid: the stem as a square, the top housing narrowing upward, the bottom housing narrowing downward.
// All three are 17 tall with an average width of 17, so they hold the same area of color.
const STEM: Point[] = [
  [3.5, 3.5],
  [20.5, 3.5],
  [20.5, 20.5],
  [3.5, 20.5],
]
const TOP: Point[] = [
  [5.25, 3.5],
  [18.75, 3.5],
  [22.25, 20.5],
  [1.75, 20.5],
]
const BOTTOM: Point[] = [
  [1.75, 3.5],
  [22.25, 3.5],
  [18.75, 20.5],
  [5.25, 20.5],
]

// A closed path through the points with each corner rounded, like Lucide's shapes
function roundedPath(points: Point[], radius = 2) {
  const toward = ([fromX, fromY]: Point, [toX, toY]: Point) => {
    const length = Math.hypot(toX - fromX, toY - fromY)
    const cut = Math.min(radius, length / 2) / length
    return `${fromX + (toX - fromX) * cut},${fromY + (toY - fromY) * cut}`
  }
  const corners = points.map((corner, index) => {
    const previous = points.at(index - 1)!
    const next = points[(index + 1) % points.length]
    return `${index ? 'L' : 'M'}${toward(corner, previous)} Q${corner.join(',')} ${toward(corner, next)}`
  })
  return corners.join(' ') + 'Z'
}

// A material beside an outline of its part in the part's color, drawn like the Lucide spec icons
function Material({ part, shape }: { part: Part; shape: Point[] }) {
  return (
    <div className="flex items-center gap-1.25">
      <svg viewBox="0 0 24 24" className="size-2 shrink-0">
        <path
          d={roundedPath(shape)}
          fill={palette(part).left}
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </svg>
      <span className="[text-box:trim-both_cap_alphabetic]">{part.material ?? missing}</span>
    </div>
  )
}

/** One Avery 6460 label (1" x 2-5/8") */
export function SwitchLabel({ data }: { data: Switch }) {
  const { actuation, bottomOut } = data
  // Actuation to bottom-out
  const force =
    actuation === undefined && bottomOut === undefined ? (
      missing
    ) : (
      <>
        {actuation ?? missing}–{bottomOut ?? missing}
      </>
    )
  return (
    // The brand's caps start at the top padding. The extra px matches the gap under the travel text, which centers on its taller icon.
    <div className="flex h-24 w-63 gap-2.75 overflow-hidden bg-white px-3.25 pt-2.25 pb-2 font-sans text-black">
      <div className="flex min-w-0 flex-1 flex-col whitespace-nowrap">
        <div className="text-[5.5pt]/2.25 font-medium tracking-wider uppercase [text-box:trim-start_cap_alphabetic]">
          {data.brand}
        </div>
        <div className="text-[12pt]/4.5 font-semibold tracking-[-0.01em]">{data.name}</div>
        <div className="text-[7.5pt]/3 font-medium capitalize">
          {data.silent && <span className="font-semibold">Silent </span>}
          {data.type}
        </div>
        <div className="mt-auto flex h-7 gap-x-1">
          {/* Both columns span the block top to bottom, so their first and last rows share edges */}
          <div className="flex w-20 flex-col justify-between">
            <Spec icon={Weight} value={force} unit="g" />
            <Spec icon={ArrowDownToLine} value={data.travel?.toFixed(1) ?? missing} unit="mm" />
          </div>
          <div className="flex grow flex-col justify-between text-[6.5pt]/none font-normal">
            <Material part={data.stem} shape={STEM} />
            <Material part={data.top} shape={TOP} />
            <Material part={data.bottom} shape={BOTTOM} />
          </div>
        </div>
      </div>
      {/* The icon anchors the right edge, whole, with room around it */}
      <div className="h-18 shrink-0 self-center" style={{ aspectRatio: ICON_ASPECT }}>
        <SwitchIcon data={data} lines="black" />
      </div>
    </div>
  )
}
