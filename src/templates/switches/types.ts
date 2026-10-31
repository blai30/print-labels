// The shape of a switch file in data/, named <brand>-<name>.json in lowercase words joined by hyphens (like
// hmx-butter.json). Leave out any optional field you don't know.

export type Switch = {
  name: string
  brand: string
  type: 'linear' | 'tactile' | 'clicky'
  /** Where you bought them */
  vendor?: string
  silent?: boolean
  /** Actuation force in grams */
  actuation?: number
  /** Bottom-out force in grams */
  bottomOut?: number
  /** Pre-travel in mm */
  preTravel?: number
  /** Total travel in mm */
  travel?: number
  /** Free text, like "22 mm two-stage" */
  spring?: string
  pins?: 3 | 5
  /** Lubed by the factory, a vendor, or you */
  lubed?: boolean
  filmed?: boolean
  /** The LED opening: a full-width slot (default) or a frosted diffuser panel */
  top: Part & { led?: 'slot' | 'diffuser' }
  bottom: Part
  /** A plain cross (default), a Kailh BOX shroud, or [ + ] bracket walls */
  stem: Part & { style?: 'mx' | 'box' | 'wall' }
  /** Anything that isn't data, like where a value came from or who lubed them. Not printed. */
  notes?: string
}

/** Milky draws like opaque. Leave out color on a clear part for colorless glass, or keep it for tinted clear. */
export type Finish = 'opaque' | 'clear' | 'milky' | 'smoky'

export type Part = {
  /** Free text, like "POM" or "Nylon" */
  material?: string
} & ({ color: `#${string}`; finish?: Finish } | { color?: `#${string}`; finish: 'clear' })
