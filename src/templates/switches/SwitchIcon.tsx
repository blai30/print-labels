import { type ReactNode, useId } from 'react'

import {
  bottomHousing,
  type Face,
  mix,
  palette,
  type Palette,
  type Point,
  rect,
  solid,
  STEMS,
  topHousing,
} from './geometry.ts'
import type { Switch } from './types.ts'

const LINE = '#262626'
const SILHOUETTE = 0.66
const SEAM = 0.33
// Shared frame so icons line up across labels
const PAD = SILHOUETTE + 0.2
const VIEW_BOX = [-13.1 - PAD, -18.4 - PAD, 26.2 + 2 * PAD, 24.5 + 2 * PAD].map((value) => value.toFixed(2)).join(' ')

/** Black outline and seams, seams in a darker shade of each part's color, or no lines */
export type LineStyle = 'black' | 'tinted' | 'none'

const path = (points: Point[]) => 'M' + points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' L') + 'Z'

// The fill-colored stroke closes hairline gaps between faces
function Faces({ faces }: { faces: Face[] }) {
  return faces.map((face, index) => (
    <path
      key={index}
      d={path(face.points) + (face.holes ?? []).map(path).join('')}
      fill={face.fill}
      fillRule="evenodd"
      stroke={face.fill}
      strokeWidth={0.04}
      strokeLinejoin="round"
    />
  ))
}

// Faces drawn thick in the line color behind a part, so a line shows around it
function Outline({ faces, color, width }: { faces: Face[]; color: string; width: number }) {
  return (
    <path
      d={faces.map((face) => path(face.points)).join('')}
      fill={color}
      stroke={color}
      strokeWidth={(2 * width).toFixed(2)}
      strokeLinejoin="round"
    />
  )
}

function Seam({ faces, colors, lines }: { faces: Face[]; colors: Palette; lines: LineStyle }) {
  if (lines === 'black') return <Outline faces={faces} color={LINE} width={SEAM} />
  if (lines === 'tinted') return <Outline faces={faces} color={colors.line} width={SEAM * 1.4} />
  return null
}

function Clip({ id, shapes, children }: { id: string; shapes: Point[][]; children: ReactNode }) {
  return (
    <>
      <clipPath id={id}>
        {shapes.map((points, index) => (
          <path key={index} d={path(points)} />
        ))}
      </clipPath>
      <g clipPath={`url(#${id})`}>{children}</g>
    </>
  )
}

export function SwitchIcon({ data, lines }: { data: Switch; lines: LineStyle }) {
  const id = useId()
  const bottom = palette(data.bottom)
  const top = palette(data.top)
  const stemColors = palette(data.stem)
  const base = bottomHousing(data)
  const stemStyle = STEMS[data.stem.style ?? 'mx']
  const housing = topHousing(data, stemStyle.hole)
  const stem = stemStyle.draw(stemColors)
  // Seen through a see-through top housing
  const body = rect(-3.65, 3.65, -2.8, 2.8)
  const stemBody = solid(
    [
      [body, 6.0],
      [body, 11.0],
    ],
    stemColors
  )

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={VIEW_BOX} className="block size-full">
      {/* Black lines add a silhouette behind everything; each part's seam goes behind its own faces */}
      {lines === 'black' && (
        <Outline
          faces={[...base.faces, ...housing.faces, ...stem.faces, ...stem.front]}
          color={LINE}
          width={SILHOUETTE}
        />
      )}
      <Seam faces={base.faces} colors={bottom} lines={lines} />
      <Faces faces={base.faces} />
      {bottom.see > 0 && <path d={path(base.glint)} fill="#ffffff" />}
      <Seam faces={housing.faces} colors={top} lines={lines} />
      {top.see > 0 ? (
        <>
          {/* Each housing face, then the stem body clipped to it as a solid mix */}
          {housing.faces.map((face, index) => (
            <g key={index}>
              <Faces faces={[face]} />
              <Clip id={`${id}-see-${index}`} shapes={[face.points]}>
                <Faces
                  faces={stemBody.map((part) => ({ points: part.points, fill: mix(face.fill, part.fill, top.see) }))}
                />
              </Clip>
            </g>
          ))}
          <Clip id={`${id}-rim`} shapes={[housing.outline]}>
            <path d={path(housing.outline)} fill="none" stroke={top.rim} strokeWidth={1.4} strokeLinejoin="round" />
          </Clip>
          <path d={path(housing.glint)} fill="#ffffff" />
        </>
      ) : (
        <Faces faces={housing.faces} />
      )}
      {housing.diffuser && (
        <>
          <pattern
            id={`${id}-texture`}
            width={0.9}
            height={0.9}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(30)"
          >
            <path d="M0,0 L0.9,0 M0,0 L0,0.9" stroke={housing.diffuser.texture} strokeWidth={0.16} />
          </pattern>
          <path d={path(housing.diffuser.window)} fill={housing.diffuser.recess} />
          <Clip id={`${id}-diffuser`} shapes={[housing.diffuser.window]}>
            <path d={path(housing.diffuser.panel)} fill={housing.diffuser.frost} />
            <path d={path(housing.diffuser.panel)} fill={`url(#${id}-texture)`} />
          </Clip>
        </>
      )}
      <Seam faces={[...stem.faces, ...stem.front]} colors={stemColors} lines={lines} />
      <Faces faces={stem.faces} />
      {stem.clipped.map(([shapes, inside], index) => (
        <Clip key={index} id={`${id}-stem-${index}`} shapes={shapes}>
          <Faces faces={inside} />
        </Clip>
      ))}
      <Faces faces={stem.front} />
    </svg>
  )
}
