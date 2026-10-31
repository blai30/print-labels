// Flat isometric icon of an MX-style switch, measured from Gateron's STEP models and Cherry's drawings.
// Seen from the north-west, so the LED side is the lower-left face.
import type { Part, Switch } from './types.ts'

export type Point = [number, number]
type Point3 = [number, number, number]
type Ring = [Point[], number]
type Tone = 'top' | 'left' | 'right' | 'interior' | 'deep'
export type Palette = Record<Tone, string> & { line: string; see: number; rim: string }
export type Face = { points: Point[]; fill: string; holes?: Point[][] }

export const mix = (first: string, second: string, amount: number) =>
  `color-mix(in oklab, ${first}, ${second} ${amount * 100}%)`
const shade = (color: string, lightness: string) => `oklch(from ${color} ${lightness} c h)`

// Left-face lightness, lifting very dark colors and keeping very light ones off paper white
const KNEE = 'max(min(l, 0.88 + (l - 0.88) / 6), 0.42 + l / 15)'
const LIGHTNESS: Record<Tone, string> = {
  top: `calc(${KNEE} + 0.08)`,
  left: KNEE,
  right: `calc(${KNEE} - 0.1)`,
  interior: `calc(${KNEE} - 0.18)`,
  deep: `max(${KNEE} - 0.32, 0.22)`,
}
// Tinted lines, never whitened
const LINE = `max(${KNEE} - 0.34, 0.2)`

const COLORLESS = { top: '#e4f1f6', left: '#cedee5', right: '#b7cbd4', interior: '#a1b5bd', deep: '#7d9199' }

// Face tones, how much of the inside shows through (see), and the rim tone
export function palette({ color, finish }: Part): Palette {
  if (!color) return { ...COLORLESS, line: shade(COLORLESS.left, LINE), see: 0.5, rim: COLORLESS.interior }
  const whiten = finish === 'clear' ? 0.45 : finish === 'smoky' ? 0.1 : 0
  const faces = Object.fromEntries(
    Object.entries(LIGHTNESS).map(([tone, lightness]) => [
      tone,
      whiten ? mix(shade(color, lightness), '#ffffff', whiten) : shade(color, lightness),
    ])
  ) as Record<Tone, string>
  return {
    ...faces,
    line: shade(color, LINE),
    see: finish === 'clear' ? 0.5 : finish === 'smoky' ? 0.35 : 0,
    rim: shade(color, LIGHTNESS.top),
  }
}

// x east, y north (the LED side), z up from the PCB, in mm
export const project = ([x, y, z]: Point3): Point => [-0.8660254 * (x + y), 0.5 * (y - x) - z]
const depth = ([x, y, z]: Point3) => -x + y + z

function newell(polygon: Point3[]): Point3 | undefined {
  let nx = 0
  let ny = 0
  let nz = 0
  polygon.forEach(([x1, y1, z1], i) => {
    const [x2, y2, z2] = polygon[(i + 1) % polygon.length]
    nx += (y1 - y2) * (z1 + z2)
    ny += (z1 - z2) * (x1 + x2)
    nz += (x1 - x2) * (y1 + y2)
  })
  const length = Math.sqrt(nx * nx + ny * ny + nz * nz)
  return length > 1e-9 ? [nx / length, ny / length, nz / length] : undefined
}

const facing = ([nx, ny, nz]: Point3) => -nx + ny + nz > 1e-6

function autoTone([nx, ny, nz]: Point3): Tone {
  if (nz >= Math.max(-nx, ny)) return 'top'
  return ny >= -nx ? 'left' : 'right'
}

export const rect = (x0: number, x1: number, y0: number, y1: number): Point[] => [
  [x1, y0],
  [x1, y1],
  [x0, y1],
  [x0, y0],
]

function arc(cx: number, cy: number, radius: number, start: number, end: number, steps = 5): Point[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const angle = (start + ((end - start) * i) / steps) * (Math.PI / 180)
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]
  })
}

// Counterclockwise from above, starting on the east side of the north-east corner
function rounded(x0: number, x1: number, y0: number, y1: number, radius: number): Point[] {
  return [
    ...arc(x1 - radius, y1 - radius, radius, 0, 90),
    ...arc(x0 + radius, y1 - radius, radius, 90, 180),
    ...arc(x0 + radius, y0 + radius, radius, 180, 270),
    ...arc(x1 - radius, y0 + radius, radius, 270, 360),
  ]
}

function cross(arm: number, halfEw: number, halfNs: number): Point[] {
  return [
    [arm, -halfEw],
    [arm, halfEw],
    [halfNs, halfEw],
    [halfNs, arm],
    [-halfNs, arm],
    [-halfNs, halfEw],
    [-arm, halfEw],
    [-arm, -halfEw],
    [-halfNs, -halfEw],
    [-halfNs, -arm],
    [halfNs, -arm],
    [halfNs, -halfEw],
  ]
}

// Visible faces of a loft through (outline, z) rings, back to front, top cap last
export function solid(rings: Ring[], colors: Palette, overrides: Record<number, Tone> = {}): Face[] {
  const sides: [number, Face][] = []
  for (let ring = 0; ring < rings.length - 1; ring++) {
    const [low, z0] = rings[ring]
    const [high, z1] = rings[ring + 1]
    low.forEach((_, i) => {
      const following = (i + 1) % low.length
      const quad: Point3[] = [
        [...low[i], z0],
        [...low[following], z0],
        [...high[following], z1],
        [...high[i], z1],
      ]
      const normal = newell(quad)
      if (!normal || !facing(normal)) return
      const centroid = [0, 1, 2].map((axis) => quad.reduce((sum, point) => sum + point[axis], 0) / 4) as Point3
      sides.push([depth(centroid), { points: quad.map(project), fill: colors[overrides[i] ?? autoTone(normal)] }])
    })
  }
  sides.sort((first, second) => first[0] - second[0])
  const [outline, z] = rings.at(-1)!
  return [...sides.map(([, face]) => face), flat(outline, z, colors.top)]
}

const flat = (points: Point[], z: number, fill: string): Face => ({
  points: points.map(([x, y]) => project([x, y, z])),
  fill,
})

// The bottom housing's west face tapers in near the base
function westX(z: number) {
  if (z >= 3.3) return -7.0
  if (z >= 1.1) return -(6.33 + (0.67 * (z - 1.1)) / 2.2)
  return -6.33
}

function onWest(y0: number, y1: number, z0: number, z1: number, fill: string): Face {
  const heights = [z0, ...[1.1, 3.3].filter((z) => z0 < z && z < z1), z1]
  const up = heights.map((z): Point3 => [westX(z), y1, z])
  const down = heights.toReversed().map((z): Point3 => [westX(z), y0, z])
  return { points: [...up, ...down].map(project), fill }
}

const onNorth = (points: Point[], fill: string, y = 7.0): Face => ({
  points: points.map(([x, z]) => project([x, y, z])),
  fill,
})

export function bottomHousing(data: Switch): Face[] {
  const bottom = palette(data.bottom)
  const top = palette(data.top)
  const faces = solid(
    [
      [rect(-6.33, 6.33, -7.0, 7.0), 0.5],
      [rect(-6.33, 6.33, -7.0, 7.0), 1.1],
      [rect(-7.0, 7.0, -7.0, 7.0), 3.3],
      [rect(-7.0, 7.0, -7.0, 7.0), 6.0],
    ],
    bottom
  )

  faces.push(
    // Plate clip on the north face: a slot with the tapered arm in it
    onNorth(
      [
        [-2.8, 1.4],
        [2.8, 1.4],
        [2.8, 6.0],
        [-2.8, 6.0],
      ],
      bottom.interior
    ),
    onNorth(
      [
        [-2.3, 1.4],
        [2.3, 1.4],
        [0.95, 5.6],
        [-0.95, 5.6],
      ],
      bottom.left
    ),
    // Shadow under the flange
    onNorth(
      [
        [-7.0, 4.3],
        [-2.8, 4.3],
        [-2.8, 5.0],
        [-7.0, 5.0],
      ],
      bottom.interior
    ),
    onNorth(
      [
        [2.8, 4.3],
        [7.0, 4.3],
        [7.0, 5.0],
        [2.8, 5.0],
      ],
      bottom.interior
    ),
    onWest(-7.0, 7.0, 4.3, 5.0, bottom.interior),
    // U-channel in the west face's central block
    {
      points: (
        [
          [-7.0, -2.0, 4.3],
          [-7.0, 2.0, 4.3],
          [westX(3.3), 1.85, 3.3],
          [westX(1.5), 1.75, 1.5],
          [westX(1.5), -1.75, 1.5],
          [westX(3.3), -1.85, 3.3],
        ] as Point3[]
      ).map(project),
      fill: bottom.interior,
    }
  )

  // Flange at the plate line, notched around the plate clip
  const radius = 0.9
  const flange: Point[] = [
    ...arc(7.8 - radius, 7.8 - radius, radius, 0, 90),
    [2.5, 7.8],
    [2.5, 7.0],
    [-2.5, 7.0],
    [-2.5, 7.8],
    ...arc(-7.8 + radius, 7.8 - radius, radius, 90, 180),
    ...arc(-7.8 + radius, -7.8 + radius, radius, 180, 270),
    [-2.5, -7.8],
    [-2.5, -7.0],
    [2.5, -7.0],
    [2.5, -7.8],
    ...arc(7.8 - radius, -7.8 + radius, radius, 270, 360),
  ]
  faces.push(
    ...solid(
      [
        [flange, 5.0],
        [flange, 6.0],
      ],
      bottom
    )
  )

  // Latch panels are legs of the top housing
  faces.push(onWest(3.3, 5.9, 1.5, 4.3, top.right), onWest(-5.9, -3.3, 1.5, 4.3, top.right))
  return faces
}

const NOTCH = 4.4
const BACK = 3.95
const SILL = 6.85
const [TAN_NORTH, TAN_SIDE, TAN_SOUTH] = [34, 22, 15].map((angle) => Math.tan(angle * (Math.PI / 180)))

// Top housing base outline at z (6.0 to 7.4), optionally notched for the LED
function slabRing(z: number, notch: boolean): Ring {
  const halfX = 7.33 - (z - 6.0) * TAN_SIDE
  const north = 7.33 - (z - 6.0) * TAN_NORTH
  const south = -(7.33 - (z - 6.0) * TAN_SOUTH)
  const ring = rounded(-halfX, halfX, south, north, 1.0)
  if (notch) ring.splice(6, 0, [NOTCH, north], [NOTCH, BACK], [-NOTCH, BACK], [-NOTCH, north])
  return [ring, z]
}

// Top housing above the corner pockets, a plus shape
function towerRing(z: number, notch: boolean): Ring {
  const halfX = 6.764 - ((6.764 - 5.0) * (z - 7.4)) / 3.6
  const north = 7.33 - (z - 6.0) * TAN_NORTH
  const south = -6.955 + ((6.955 - 5.0) * (z - 7.4)) / 3.6
  const northEdge: Point[] = notch
    ? [
        [4.95, north],
        [NOTCH, north],
        [NOTCH, BACK],
        [-NOTCH, BACK],
        [-NOTCH, north],
        [-4.95, north],
      ]
    : [
        [4.95, north],
        [-4.95, north],
      ]
  return [
    [
      [halfX, 3.05],
      [4.95, 3.05],
      ...northEdge,
      [-4.95, 3.05],
      [-halfX, 3.05],
      [-halfX, -3.05],
      [-4.95, -3.05],
      [-4.95, south],
      [4.95, south],
      [4.95, -3.05],
      [halfX, -3.05],
    ],
    z,
  ]
}

const northFace = (x: number, z: number): Point3 => [x, 7.33 - (z - 6.0) * TAN_NORTH, z]
const westSlope = (z: number) =>
  z <= 7.4 ? -(7.33 - ((7.33 - 6.764) * (z - 6.0)) / 1.4) : -(6.764 - ((6.764 - 5.0) * (z - 7.4)) / 3.6)

export function topHousing(data: Switch, hole: Point[]) {
  const colors = palette(data.top)
  const notch = data.top.led !== 'diffuser'
  let faces: Face[]
  if (notch) {
    // Base, the sill's light slot, then the notched base above the sill
    faces = [
      ...solid([slabRing(6.0, false), slabRing(SILL, false)], colors),
      flat(rect(-NOTCH, NOTCH, 4.85, 5.85), SILL, colors.deep),
      ...solid([slabRing(SILL, true), slabRing(7.4, true)], colors, { 6: 'interior', 7: 'interior' }),
      // Edges 3 and 4 are the notch walls
      ...solid([towerRing(7.4, true), towerRing(11.0, true)], colors, { 3: 'interior', 4: 'interior' }),
    ]
  } else {
    faces = [
      ...solid([slabRing(6.0, false), slabRing(7.4, false)], colors),
      ...solid([towerRing(7.4, false), towerRing(11.0, false)], colors),
    ]
  }
  faces.push(flat(hole, 11.0, colors.interior))
  const outline = towerRing(11.0, notch)[0].map(([x, y]) => project([x, y, 11.0]))
  const glint = (
    [
      [6.6, 1.35],
      [6.6, 2.05],
      [7.4, 2.05],
      [10.4, 2.05],
      [10.4, 1.35],
      [7.4, 1.35],
    ] as Point[]
  ).map(([z, y]) => project([westSlope(z), y, z]))

  let diffuser
  if (!notch) {
    // Frosted panel recessed into the upper LED face
    const corners = (
      [
        [-4.25, 8.0],
        [4.25, 8.0],
        [4.25, 10.7],
        [-4.25, 10.7],
      ] as Point[]
    ).map(([x, z]) => northFace(x, z))
    const frost = mix(colors.left, '#eef2f5', 0.55)
    diffuser = {
      window: corners.map(project),
      panel: corners.map(([x, y, z]) => project([x, y - 0.45, z])),
      recess: colors.interior,
      frost,
      texture: mix(frost, colors.right, 0.35),
    }
  }
  return { faces, outline, glint, diffuser }
}

// Faces, faces seen through openings (clipped to them), and faces drawn over those
type Stem = { faces: Face[]; clipped: [Point[][], Face[]][]; front: Face[] }

const STEM_CROSS = cross(2.0, 0.65, 0.55)

export const STEMS: Record<NonNullable<Switch['stem']['style']>, { hole: Point[]; draw: (colors: Palette) => Stem }> = {
  mx: {
    hole: rect(-3.8, 3.8, -2.95, 2.95),
    draw: (colors) => ({
      faces: [
        ...solid(
          [
            [rect(-3.65, 3.65, -2.8, 2.8), 11.0],
            [rect(-3.3, 3.3, -2.5, 2.5), 11.7],
          ],
          colors
        ),
        ...solid(
          [
            [STEM_CROSS, 11.7],
            [STEM_CROSS, 15.2],
          ],
          colors
        ),
      ],
      clipped: [],
      front: [],
    }),
  },
  box: {
    hole: rect(-3.45, 3.45, -3.45, 3.45),
    draw: (colors) => {
      const outer = rect(-3.4, 3.4, -3.4, 3.4)
      const faces = solid(
        [
          [outer, 11.0],
          [outer, 14.8],
        ],
        colors
      )
      const opening = rounded(-2.55, 2.55, -2.55, 2.55, 1.0)
        .toReversed()
        .map(([x, y]) => project([x, y, 14.8]))
      faces[faces.length - 1] = { ...flat(outer, 14.8, colors.top), holes: [opening] }
      const inside = [
        { points: opening, fill: colors.interior },
        ...solid(
          [
            [STEM_CROSS, 11.2],
            [STEM_CROSS, 14.8],
          ],
          colors
        ),
      ]
      return { faces, clipped: [[[opening], inside]], front: [] }
    },
  },
  wall: {
    hole: rect(-3.8, 3.8, -2.97, 2.97),
    draw: (colors) => {
      const top = 15.1
      const west: Point[] = [
        [-3.65, -2.8],
        [-1.42, -2.8],
        [-1.99, -2.1],
        [-2.85, -2.1],
        [-2.85, 2.1],
        [-1.99, 2.1],
        [-1.42, 2.8],
        [-3.65, 2.8],
      ]
      const east = west.map(([x, y]): Point => [-x, -y])
      const opening: Point[] = [
        [2.85, -2.1],
        [2.85, 2.1],
        [1.99, 2.1],
        [1.42, 2.8],
        [-1.42, 2.8],
        [-1.99, 2.1],
        [-2.85, 2.1],
        [-2.85, -2.1],
        [-1.99, -2.1],
        [-1.42, -2.8],
        [1.42, -2.8],
        [1.99, -2.1],
      ]
      const slot = (
        [
          [1.42, 2.8, 11.5],
          [-1.42, 2.8, 11.5],
          [-1.42, 2.8, top],
          [1.42, 2.8, top],
        ] as Point3[]
      ).map(project)
      const topOpening = flat(opening, top, colors.interior)
      const faces = [
        ...solid(
          [
            [rect(-3.65, 3.65, -2.8, 2.8), 11.0],
            [rect(-3.65, 3.65, -2.8, 2.8), 11.5],
          ],
          colors
        ),
        ...solid(
          [
            [east, 11.5],
            [east, top],
          ],
          colors
        ),
      ]
      const inside = [
        topOpening,
        { points: slot, fill: colors.interior },
        ...solid(
          [
            [STEM_CROSS, 11.5],
            [STEM_CROSS, top],
          ],
          colors
        ),
      ]
      // The west wall sits in front of the cross
      return {
        faces,
        clipped: [[[topOpening.points, slot], inside]],
        front: solid(
          [
            [west, 11.5],
            [west, top],
          ],
          colors
        ),
      }
    },
  },
}
