import { createElement } from 'react'

import type { Template } from '../../templates.ts'
import { SwitchLabel } from './SwitchLabel.tsx'
import type { Switch } from './types.ts'

export const switches: Record<string, Switch> = Object.fromEntries(
  Object.entries(import.meta.glob<Switch>('./data/*.json', { eager: true, import: 'default' })).map(([file, data]) => [
    file.slice('./data/'.length, -'.json'.length),
    data,
  ])
)

export default {
  title: 'Keyboard switches',
  labels: Object.fromEntries(
    Object.entries(switches).map(([name, data]) => [name, createElement(SwitchLabel, { data })])
  ),
} satisfies Template
