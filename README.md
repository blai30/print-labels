# print-labels

Designs printable labels in the browser and exports each label as its own vector PDF. Built with Vite, React, TypeScript, and Tailwind CSS. Keyboard switch lid labels (Avery 6460) are the first template.

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

Run `npm run dev` and edit a template's label component. The workbench shows every label at 1x to 4x. Click a label's name to open it alone at print size, the same page the export prints.

The export starts its own Vite server and prints each label with Playwright's Chromium headless shell. Each PDF is exactly the size of the label's root element, so a template sets its size in its component. `exports/<template>/labels.csv` lists the PDFs from the last run (header `label`, one absolute path per line) for Affinity Data Merge.

## Templates

Each template is a folder in `src/templates/` with an `index.ts` that returns its title and one rendered label per item. Add it to `src/templates.ts` to show it in the workbench and the export.

### Keyboard switches

`src/templates/switches/` makes one lid label per keyboard switch, sized for Avery 6460 (1" x 2-5/8", 66.675 x 25.4 mm). Each label has the brand, name, and type, force (actuation to bottom-out), pre-travel, and total travel, the stem, top, and bottom materials with their colors, and an isometric icon of the switch. Missing values print as a gray `?`.

Each switch is one JSON file in `data/`, named `<brand>-<name>.json` in lowercase words joined by hyphens (like `hmx-butter.json`). Copy an existing one to start. `types.ts` has the `Switch` type with a note on every field. Only `color`, `finish`, `led`, and `style` change the icon. The icon outline style (`black`, `tinted`, or `none`) is `LINES` in `SwitchLabel.tsx`.

## Avery 6460 sheet in Affinity

`affinity/switches.afpub` is an Affinity template for Avery 6460 sheets (US Letter, 3 x 10). Page 1 has a picture frame at every label position for drag and drop. Page 2 has a Data Merge Layout that fills the sheet from `labels.csv`.

Menu names below are from Affinity Publisher 2 and may differ slightly in the current Affinity app.

Fill a sheet by hand:

1. Run `npm run export -- switches`.
2. Open `switches.afpub` and go to page 1.
3. Drag a PDF from `exports/switches` in File Explorer onto a frame. It scales to fit and centers.
4. Select the placed PDF and set it to Passthrough in the context toolbar (prints the PDF as is, without needing the fonts).
5. Repeat for the other frames. Drag a different PDF onto a frame to swap it.

Fill a sheet with Data Merge:

1. Run `npm run export -- switches`.
2. Open `switches.afpub` and go to page 2.
3. Open Window > Data Merge Manager and check the data source is `exports/switches/labels.csv` (select it again if the repo moved).
4. Click Generate. Affinity makes a new document with the labels placed in order, one per cell.
5. In the new document, drag any PDF onto a label to swap it.

Unconfirmed: whether Data Merge accepts PDFs (not just images). If it doesn't, fill the sheet by hand.

Print:

1. File > Print, pick the printer, and set Scale to 100% (not fit to page).
2. Print one sheet on plain paper first and hold it against a label sheet to check alignment.

### Building the Affinity template

Only needed if `switches.afpub` is lost.

Measurements are from Avery's 6460 template PDF (https://www.avery.com/templates/6460):

| Measurement                           | Value            |
| ------------------------------------- | ---------------- |
| Top margin                            | 12.7 mm          |
| Left margin                           | 4.7625 mm        |
| Column pitch (left edge to left edge) | 69.85 mm         |
| Row pitch                             | 25.4 mm          |
| Gap between columns                   | 3.175 mm         |
| Label                                 | 66.675 x 25.4 mm |
| Corner radius                         | 2.54 mm          |

1. File > New. Pick Print, set the page to Letter, portrait, units to Millimeters, margins and bleed to 0, and turn off Facing Pages. Add a second page (Pages panel > Add Pages).
2. On page 1, pick the Picture Frame Rectangle Tool and drag out a frame.
3. In the Transform panel (anchor top left), set X 4.7625, Y 12.7, W 66.675, H 25.4.
4. With the frame selected, open Properties in the context toolbar. Set Scaling to Scale to Max Fit and both alignments to Center.
5. Press Ctrl+J to duplicate, then set X to 74.6125. Press Ctrl+J again and the copy lands at 144.4625 (Ctrl+J repeats the last move).
6. Select the three frames, press Ctrl+J, and set Y to 38.1. Press Ctrl+J eight more times for 10 rows.
7. On page 2, pick the Data Merge Layout Tool and drag out a layout. In the context toolbar set 3 columns, 10 rows, cell size 66.675 x 25.4, horizontal spacing 3.175, vertical spacing 0. In the Transform panel set X 4.7625, Y 12.7.
8. Draw a picture frame that fills the first cell and set Scale to Max Fit and Center as in step 4.
9. Open Window > Data Merge Manager, click Select Data Source, and pick `exports/switches/labels.csv`.
10. Select the picture frame in the first cell, open the Fields panel, and double-click the `label` field.
11. Save as `affinity/switches.afpub`.
