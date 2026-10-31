import type { ReactElement } from 'react'

import switches from './templates/switches/index.ts'

// Labels are keyed by item file name
export type Template = { title: string; labels: Record<string, ReactElement> }

export const templates: Record<string, Template> = { switches }
