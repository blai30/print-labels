# print-labels

Designs printable labels in the browser and exports each as its own vector PDF. Built with Vite, React, TypeScript, and Tailwind CSS.

## Setup

Needs Node.js 26+.

1. Run `npm install`.
2. Run `npx playwright install chromium --only-shell` (the headless browser the export prints with).

## Commands

```
npm run dev                                 # workbench with every template's labels, hot reloaded
npm run export                              # every label as a PDF into exports/<template>/
npm run export -- switches                  # one template
npm run export -- switches hmx-butter       # just these labels
npm run build                               # type check and build
npm run lint                                # oxlint
npm run fmt                                 # oxfmt (npm run fmt:check to only check)
```

## Designing labels

Run `npm run dev` and edit a template's label component. Click a label's name in the workbench to open it alone at print size, the same page the export prints.

The export starts its own Vite server and prints each label with Playwright's Chromium headless shell. Each PDF is the size of the label's root element. `exports/<template>/labels.csv` lists the PDFs from the last run for data merge.

## Templates

Each template is a folder in `src/templates/` with an `index.ts` that returns its title and one label per item. Add it to `src/templates.ts` to show it in the workbench and the export.

### Keyboard switches

`src/templates/switches/` makes one lid label per switch for Avery 6460 (1" x 2-5/8"). Each label has the brand, name, type, force, travel, materials, and an isometric icon of the switch. Silent switches get a `SILENT` tag. Missing values print as a gray `?`.

Each switch is a JSON file in `data/` named `<brand>-<name>.json` (like `hmx-butter.json`). Copy an existing one to start. `types.ts` has a note on every field. The icon outline style is `LINES` in `SwitchLabel.tsx`.

## Avery 6460 sheet

US Letter, 3 columns by 10 rows. Measurements are from Avery's 6460 template (https://www.avery.com/templates/6460):

| Measurement        | Value                     |
| ------------------ | ------------------------- |
| Page               | 215.9 x 279.4 mm          |
| Label              | 66.675 x 25.4 mm          |
| Corner radius      | 2.54 mm                   |
| Top margin         | 12.7 mm                   |
| Left margin        | 4.7625 mm                 |
| Column gap         | 3.175 mm                  |
| Row gap            | 0 mm                      |
| Column X positions | 4.7625, 74.6125, 144.4625 |
| Row Y positions    | 12.7 + 25.4 per row       |
