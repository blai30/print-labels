import { createElement } from 'react'

import type { Template } from '../../templates.ts'
import { SwitchLabel } from './SwitchLabel.tsx'
import type { Switch } from './types.ts'

const switches = import.meta.glob<Switch>('./data/*.json', { eager: true, import: 'default' })

export default {
  title: 'Keyboard switches',
  labels: Object.fromEntries(
    Object.entries(switches).map(([file, data]) => [
      file.slice('./data/'.length, -'.json'.length),
      createElement(SwitchLabel, { data }),
    ])
  ),
} satisfies Template
