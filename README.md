# print-labels

Designs printable labels in the browser and exports each as its own vector PDF. Built with Vite, React, TypeScript, and Tailwind CSS.

## Setup

Needs Node.js 26+ and pnpm.

1. Run `pnpm install`.
2. Run `pnpm exec playwright install chromium --only-shell` (the headless browser the export prints with).

## Commands

```
pnpm dev                        # workbench with every template's labels, hot reloaded
pnpm export                     # every label as a PDF into exports/<template>/
pnpm export switches            # one template
pnpm export switches hmx-butter # just these labels
pnpm export --csv               # also write labels.csv for data merge
pnpm build                      # type check and build
pnpm lint                       # oxlint
pnpm fmt                        # oxfmt (pnpm fmt:check to only check)
```

## Designing labels

Run `pnpm dev` and edit a template's label component. Click a label's name in the workbench to open it alone at print size, the same page the export prints.

The export starts its own Vite server and prints each label with Playwright's Chromium headless shell. Each PDF is the size of the label's root element. With `--csv`, `exports/<template>/labels.csv` lists the PDFs from the last run for data merge.

Use static font files, not variable ones. Chromium embeds variable fonts in PDFs as Type3 outlines, and Affinity flags those as missing fonts. Geist is in `src/assets/fonts/` as the official static builds (Regular, Medium, SemiBold). Add the weight's file from [vercel/geist-font](https://github.com/vercel/geist-font/tree/main/fonts/Geist/webfonts) if a label needs another one.

## Templates

Each template is a folder in `src/templates/` with an `index.ts` that returns its title and one label per item. Add it to `src/templates.ts` to show it in the workbench and the export.

### Keyboard switches

`src/templates/switches/` makes one lid label per switch for Avery 6460 (1" x 2-5/8"). Each label has the brand, name, type, force, total travel, the stem and housing materials, and an isometric icon of the switch. Each material sits next to a small outline of its part in the part's color. Silent switches have it in the type (like "Silent Linear"). Missing values print as a gray `?`.

Each switch is a JSON file in `data/` named `<brand>-<name>.json` (like `hmx-butter.json`). Copy an existing one to start. `types.ts` has a note on every field. The icon outline style is the `lines` prop on `SwitchIcon` in `SwitchLabel.tsx`.

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
