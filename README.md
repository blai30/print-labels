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

The export starts its own Vite server and prints each label with Playwright's Chromium headless shell. Each PDF is the size of the label's root element. `exports/<template>/labels.csv` lists the PDFs from the last run for Affinity Data Merge.

## Templates

Each template is a folder in `src/templates/` with an `index.ts` that returns its title and one label per item. Add it to `src/templates.ts` to show it in the workbench and the export.

### Keyboard switches

`src/templates/switches/` makes one lid label per switch for Avery 6460 (1" x 2-5/8"). Each label has the brand, name, type, force, travel, materials, and an isometric icon of the switch. Silent switches get a `SILENT` tag. Missing values print as a gray `?`.

Each switch is a JSON file in `data/` named `<brand>-<name>.json` (like `hmx-butter.json`). Copy an existing one to start. `types.ts` has a note on every field. The icon outline style is `LINES` in `SwitchLabel.tsx`.

## Printing on Avery 6460

`affinity/switches.afpub` is an Affinity template for Avery 6460 sheets (US Letter, 3 x 10). Page 1 has a picture frame at every label position. Page 2 has a Data Merge Layout that fills the sheet from `labels.csv`. Menu names are from Affinity Publisher 2.

1. Run `npm run export -- switches`.
2. Fill the sheet by hand or with Data Merge:
   - By hand: on page 1, drag PDFs from `exports/switches` onto the frames and set each one to Passthrough in the context toolbar (prints the PDF as is, no fonts needed)
   - Data Merge: on page 2, open Window > Data Merge Manager, check the data source is `exports/switches/labels.csv`, and click Generate (unconfirmed whether Data Merge accepts PDFs, fill by hand if it doesn't)
3. File > Print with Scale at 100%. Print one sheet on plain paper first and hold it against a label sheet to check alignment.

### Building the Affinity template

`switches.afpub` isn't in the repo. Measurements are from Avery's 6460 template (https://www.avery.com/templates/6460):

| Measurement | Value            |
| ----------- | ---------------- |
| Top margin  | 12.7 mm          |
| Left margin | 4.7625 mm        |
| Column gap  | 3.175 mm         |
| Label       | 66.675 x 25.4 mm |

1. File > New. Pick Print, Letter, portrait, millimeters, margins and bleed at 0, Facing Pages off. Add a second page.
2. On page 1, draw a frame with the Picture Frame Rectangle Tool. In the Transform panel (anchor top left), set X 4.7625, Y 12.7, W 66.675, H 25.4. In Properties, set Scaling to Scale to Max Fit and both alignments to Center.
3. Press Ctrl+J and set X to 74.6125. Press Ctrl+J again for 144.4625.
4. Select the row, press Ctrl+J, and set Y to 38.1. Press Ctrl+J eight more times for 10 rows.
5. On page 2, draw a layout with the Data Merge Layout Tool. Set 3 columns, 10 rows, cell size 66.675 x 25.4, horizontal spacing 3.175, vertical spacing 0, at X 4.7625, Y 12.7.
6. Draw a picture frame over the first cell with the same Max Fit and Center settings.
7. In Data Merge Manager, select `exports/switches/labels.csv` as the data source. Select the frame and double-click the `label` field in the Fields panel.
8. Save as `affinity/switches.afpub`.
