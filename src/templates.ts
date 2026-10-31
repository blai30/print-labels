import type { ReactElement } from 'react'

import switches from './templates/switches/index.ts'

/** A kind of label: its title in the app and one rendered label per item, keyed by the item's file name */
export type Template = {
  title: string
  labels: Record<string, ReactElement>
}

// Each key is the template's name in URLs and in exports/<name>
export const templates: Record<string, Template> = { switches }
