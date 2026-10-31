// Color and geometry for a flat isometric icon of a generic MX-style switch, measured from Gateron's STEP models and
// Cherry's drawings and seen in true isometric from the north-west, so the LED side is the lower-left face.
import type { Part, Switch } from './types.ts'

export type Point = [number, number]
type Point3 = [number, number, number]
type Ring = [Point[], number]
type Tone = 'top' | 'left' | 'right' | 'interior' | 'deep' | 'line'
export type Palette = Record<Tone, string> & { see: number; rim: string }
export type Face = { points: Point[]; fill: string; holes?: Point[][] }

// Color: sRGB <-> Oklab and OKLCH

const clamp = (value: number) => Math.min(Math.max(value, 0), 1)
const toLinear = (channel: number) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
const toSrgb = (channel: number) => (channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055)

function hexToOklab(color: string): Point3 {
  const [red, green, blue] = [1, 3, 5].map((i) => toLinear(parseInt(color.slice(i, i + 2), 16) / 255))
  const long = (0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue) ** (1 / 3)
  const medium = (0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue) ** (1 / 3)
  const short = (0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue) ** (1 / 3)
  return [
    0.2104542553 * long + 0.793617785 * medium - 0.0040720468 * short,
    1.9779984951 * long - 2.428592205 * medium + 0.4505937099 * short,
    0.0259040371 * long + 0.7827717662 * medium - 0.808675766 * short,
  ]
}

function hexToOklch(color: string): Point3 {
  const [lightness, greenRed, blueYellow] = hexToOklab(color)
  return [lightness, Math.hypot(greenRed, blueYellow), Math.atan2(blueYellow, greenRed)]
}

function oklchToLinear(lightness: number, chroma: number, hue: number): Point3 {
  const greenRed = chroma * Math.cos(hue)
  const blueYellow = chroma * Math.sin(hue)
  const long = (lightness + 0.3963377774 * greenRed + 0.2158037573 * blueYellow) ** 3
  const medium = (lightness - 0.1055613458 * greenRed - 0.0638541728 * blueYellow) ** 3
  const short = (lightness - 0.0894841775 * greenRed - 1.291485548 * blueYellow) ** 3
  return [
    4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short,
    -1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short,
    -0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short,
  ]
}

// Hex for an OKLCH color, lowering chroma at the same lightness and hue until it fits in sRGB
function oklchToHex(lightness: number, chroma: number, hue: number) {
  lightness = clamp(lightness)
  const fits = (value: number) =>
    oklchToLinear(lightness, value, hue).every((channel) => channel >= -1e-6 && channel <= 1 + 1e-6)
  if (!fits(chroma)) {
    let low = 0
    let high = chroma
    for (let i = 0; i < 32; i++) {
      const middle = (low + high) / 2
      if (fits(middle)) low = middle
      else high = middle
    }
    chroma = low
  }
  const channels = oklchToLinear(lightness, chroma, hue)
  return (
    '#' +
    channels
      .map((channel) =>
        Math.round(clamp(toSrgb(clamp(channel))) * 255)
          .toString(16)
          .padStart(2, '0')
      )
      .join('')
  )
}

// Oklab mix from first (0) to second (1)
export function mix(first: string, second: string, amount: number) {
  const start = hexToOklch(first)
  const end = hexToOklch(second)
  const toLab = ([lightness, chroma, hue]: Point3) => [lightness, chroma * Math.cos(hue), chroma * Math.sin(hue)]
  const endLab = toLab(end)
  const [lightness, greenRed, blueYellow] = toLab(start).map((low, i) => low + (endLab[i] - low) * amount)
  return oklchToHex(lightness, Math.hypot(greenRed, blueYellow), Math.atan2(blueYellow, greenRed))
}

// Left-face lightness: very dark picks lift to a visible gray and very light picks stay off paper white
function knee(lightness: number) {
  if (lightness < 0.45) return 0.42 + (lightness * 0.03) / 0.45
  if (lightness <= 0.88) return lightness
  return 0.88 + ((lightness - 0.88) * 0.02) / 0.12
}

function tones(color: string): Record<Tone, string> {
  const [lightness, chroma, hue] = hexToOklch(color)
  const base = knee(lightness)
  return {
    top: oklchToHex(base + 0.08, chroma, hue),
    left: oklchToHex(base, chroma, hue),
    right: oklchToHex(base - 0.1, chroma, hue),
    interior: oklchToHex(base - 0.18, chroma, hue),
    deep: oklchToHex(Math.max(base - 0.32, 0.22), chroma, hue),
    line: oklchToHex(Math.max(base - 0.34, 0.2), chroma, hue),
  }
}

const COLORLESS = { top: '#e4f1f6', left: '#cedee5', right: '#b7cbd4', interior: '#a1b5bd', deep: '#7d9199' }

// Face tones for a part, how much of the inside shows through (see), and the rim band tone
export function palette(part: Part): Palette {
  // Only a clear part can leave out its color
  if (!part.color) return { ...COLORLESS, line: tones(COLORLESS.left).line, see: 0.5, rim: '#a1b5bd' }
  const base = tones(part.color)
  const whiten = part.finish === 'clear' ? 0.45 : part.finish === 'smoky' ? 0.1 : 0
  // Lines stay at full strength on see-through parts
  const faces = Object.fromEntries(
    Object.entries(base).map(([tone, value]) => [tone, tone === 'line' ? value : mix(value, '#ffffff', whiten)])
  )
  return {
    ...(faces as Record<Tone, string>),
    see: part.finish === 'clear' ? 0.5 : part.finish === 'smoky' ? 0.35 : 0,
    rim: base.top,
  }
}

// Geometry: x east, y north (the LED side), z up from the PCB, all in mm. The camera looks from the north-west.

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

// The bottom housing's west face, which tapers in near the bottom
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

// Parts

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

  // Flange at the plate line, drawn as one continuous ledge with a notch around the plate clip
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

  // The latch panels are legs of the top housing, so they take its color
  faces.push(onWest(3.3, 5.9, 1.5, 4.3, top.right), onWest(-5.9, -3.3, 1.5, 4.3, top.right))
  return faces
}

const NOTCH = 4.4
const BACK = 3.95
const SILL = 6.85
const [TAN_NORTH, TAN_SIDE, TAN_SOUTH] = [34, 22, 15].map((angle) => Math.tan(angle * (Math.PI / 180)))

// Top housing base outline at height z (6.0 to 7.4), optionally with the LED notch cut into the north edge
function slabRing(z: number, notch: boolean): Ring {
  const halfX = 7.33 - (z - 6.0) * TAN_SIDE
  const north = 7.33 - (z - 6.0) * TAN_NORTH
  const south = -(7.33 - (z - 6.0) * TAN_SOUTH)
  const ring = rounded(-halfX, halfX, south, north, 1.0)
  if (notch) ring.splice(6, 0, [NOTCH, north], [NOTCH, BACK], [-NOTCH, BACK], [-NOTCH, north])
  return [ring, z]
}

// Top housing above the corner pockets: a plus shape of a north-south and an east-west band
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
    // Base below the sill, the sill's full-width light slot, then the notched base above the sill
    faces = [
      ...solid([slabRing(6.0, false), slabRing(SILL, false)], colors),
      flat(rect(-NOTCH, NOTCH, 4.85, 5.85), SILL, colors.deep),
      ...solid([slabRing(SILL, true), slabRing(7.4, true)], colors, { 6: 'interior', 7: 'interior' }),
      // Edges 3 and 4 are the notch's east side wall and back wall
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
    // A frosted panel set back into a window in the upper half of the LED face
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

// A stem's faces, the faces seen through its openings (clipped to them), and faces drawn in front of those
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
      // The west wall is in front of the cross, so it's drawn after the clipped inside
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
