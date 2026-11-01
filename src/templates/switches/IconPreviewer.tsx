import { Check, Copy } from 'lucide-react'
import { type ReactNode, useEffect, useId, useState } from 'react'

import { Navbar } from '../../Navbar.tsx'
import { switches } from './index.ts'
import { type LineStyle, SwitchIcon } from './SwitchIcon.tsx'
import { SwitchLabel } from './SwitchLabel.tsx'
import type { Finish, Part, Switch } from './types.ts'

type Hex = `#${string}`
type Led = NonNullable<Switch['top']['led']>
type StemStyle = NonNullable<Switch['stem']['style']>
// Color stays in state while colorless, so switching back to tinted keeps it
type PartState = { color: Hex; finish: Finish; colorless: boolean }

const FINISHES: Record<Finish, string> = { opaque: 'Opaque', clear: 'Clear', milky: 'Milky', smoky: 'Smoky' }
const LEDS: Record<Led, string> = { slot: 'Slot', diffuser: 'Diffuser' }
const STEM_STYLES: Record<StemStyle, string> = { mx: 'MX', box: 'BOX', wall: 'Wall' }
const LINES: Record<LineStyle, string> = { black: 'Black', tinted: 'Tinted', none: 'None' }
const BACKGROUNDS = { paper: 'Paper', gray: 'Gray', dark: 'Dark' }
const SIZES = { small: 'Small', medium: 'Medium', large: 'Large' }
const PARTS = ['top', 'bottom', 'stem'] as const
const CHOICES = ['led', 'style', 'lines', 'background', 'size'] as const

type Options = Record<(typeof PARTS)[number], PartState> & {
  led: Led
  style: StemStyle
  lines: LineStyle
  background: keyof typeof BACKGROUNDS
  size: keyof typeof SIZES
}

const fromPart = (part: Part): PartState => ({
  color: part.color ?? '#ffffff',
  finish: part.finish ?? 'opaque',
  colorless: !part.color,
})

const toPart = ({ color, finish, colorless }: PartState): Part =>
  colorless && finish === 'clear' ? { finish } : { color, finish }

// "deafab-opaque", or "clear" for colorless
const encodePart = (state: PartState) =>
  state.colorless && state.finish === 'clear' ? 'clear' : `${state.color.slice(1)}-${state.finish}`

function decodePart(value: string | null, fallback: PartState): PartState {
  const [, hex, finish] = value?.match(/^(?:([0-9a-f]{6})-)?(opaque|clear|milky|smoky)$/) ?? []
  if (hex) return { color: `#${hex}`, finish: finish as Finish, colorless: false }
  return finish === 'clear' ? { ...fallback, finish, colorless: true } : fallback
}

const pick = <T extends string>(choices: Record<T, unknown>, value: string | null, fallback: T) =>
  value !== null && Object.hasOwn(choices, value) ? (value as T) : fallback

const fromSwitch = ({ top, bottom, stem }: Switch) => ({
  top: fromPart(top),
  bottom: fromPart(bottom),
  stem: fromPart(stem),
  led: top.led ?? 'slot',
  style: stem.style ?? 'mx',
})

function parse(params: URLSearchParams): Options {
  const fallback = fromSwitch(Object.values(switches)[0])
  return {
    top: decodePart(params.get('top'), fallback.top),
    bottom: decodePart(params.get('bottom'), fallback.bottom),
    stem: decodePart(params.get('stem'), fallback.stem),
    led: pick(LEDS, params.get('led'), fallback.led),
    style: pick(STEM_STYLES, params.get('style'), fallback.style),
    lines: pick(LINES, params.get('lines'), 'black'),
    background: pick(BACKGROUNDS, params.get('background'), 'paper'),
    size: pick(SIZES, params.get('size'), 'large'),
  }
}

function serialize(options: Options) {
  const params = new URLSearchParams()
  for (const part of PARTS) params.set(part, encodePart(options[part]))
  for (const choice of CHOICES) params.set(choice, options[choice])
  return params
}

export function IconPreviewer() {
  const [options, setOptions] = useState(() => parse(new URLSearchParams(location.search)))
  const { led, style, lines, background, size } = options
  const set = (patch: Partial<Options>) => setOptions({ ...options, ...patch })

  // Debounced, since Chrome throttles rapid history updates like a dragged color picker
  useEffect(() => {
    const timer = setTimeout(() => history.replaceState(null, '', `?${serialize(options)}`), 250)
    return () => clearTimeout(timer)
  }, [options])

  const data: Switch = {
    brand: 'Brand',
    name: 'Switch name',
    type: 'linear',
    top: { ...toPart(options.top), led },
    bottom: toPart(options.bottom),
    stem: { ...toPart(options.stem), style },
  }
  const json = JSON.stringify({ top: data.top, bottom: data.bottom, stem: data.stem }, null, 2)

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-900 font-sans text-zinc-100 lg:h-dvh">
      <Navbar current="icon" />
      <div className="grid flex-1 lg:min-h-0 lg:grid-cols-[22rem_1fr]">
        <aside className="flex flex-col divide-y divide-zinc-800 border-zinc-800 lg:overflow-y-auto lg:border-r">
          <label className="flex flex-col gap-2 p-6">
            <span className="text-xs font-medium text-zinc-400">Load preset</span>
            {/* Always shows the placeholder, so picking the same preset again resets to it */}
            <select
              value=""
              onChange={(event) => set(fromSwitch(switches[event.target.value]))}
              className="h-9 rounded-md bg-zinc-800 px-2 text-sm outline-zinc-100 focus-visible:outline-2"
            >
              <option value="" disabled>
                Choose a switch…
              </option>
              {Object.entries(switches).map(([name, { brand, name: title }]) => (
                <option key={name} value={name}>
                  {brand} {title}
                </option>
              ))}
            </select>
          </label>
          <PartEditor title="Top housing" state={options.top} onChange={(top) => set({ top })}>
            <Segmented label="LED" options={LEDS} value={led} onChange={(led) => set({ led })} />
          </PartEditor>
          <PartEditor title="Bottom housing" state={options.bottom} onChange={(bottom) => set({ bottom })} />
          <PartEditor title="Stem" state={options.stem} onChange={(stem) => set({ stem })}>
            <Segmented label="Style" options={STEM_STYLES} value={style} onChange={(style) => set({ style })} />
          </PartEditor>
          <div className="flex flex-col gap-4 p-6">
            <h2 className="text-sm font-semibold">Display</h2>
            <Segmented label="Lines" options={LINES} value={lines} onChange={(lines) => set({ lines })} />
            <Segmented
              label="Background"
              options={BACKGROUNDS}
              value={background}
              onChange={(background) => set({ background })}
            />
            <Segmented label="Size" options={SIZES} value={size} onChange={(size) => set({ size })} />
          </div>
        </aside>
        <main className="flex flex-col gap-8 p-8 lg:overflow-y-auto">
          <div
            data-background={background}
            className="grid min-h-128 place-items-center rounded-xl p-10 data-[background=dark]:bg-zinc-950 data-[background=gray]:bg-zinc-500 data-[background=paper]:bg-white"
          >
            <div
              data-size={size}
              className="data-[size=large]:size-112 data-[size=medium]:size-64 data-[size=small]:size-32"
            >
              <SwitchIcon data={data} lines={lines} />
            </div>
          </div>
          <div className="flex flex-wrap items-start gap-8">
            <figure className="flex flex-col gap-2">
              <div className="w-fit zoom-[2] shadow-lg ring-1 shadow-black/40 ring-black/20">
                <SwitchLabel data={data} />
              </div>
              <figcaption className="text-xs text-zinc-500">Label at 2x, as printed</figcaption>
            </figure>
            <div className="relative min-w-72 flex-1">
              <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 font-mono text-xs/5 text-zinc-300">{json}</pre>
              <CopyButton text={json} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function PartEditor({
  title,
  state,
  onChange,
  children,
}: {
  title: string
  state: PartState
  onChange: (state: PartState) => void
  children?: ReactNode
}) {
  const set = (patch: Partial<PartState>) => onChange({ ...state, ...patch })
  const clear = state.finish === 'clear'
  const colorless = clear && state.colorless
  return (
    <fieldset className="flex flex-col gap-4 p-6">
      <legend className="contents text-sm font-semibold">{title}</legend>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={state.color}
          disabled={colorless}
          onChange={(event) => set({ color: event.target.value as Hex })}
          aria-label={`${title} color`}
          className="h-9 w-12 shrink-0 cursor-pointer rounded-md bg-zinc-800 p-1 outline-zinc-100 focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-30 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch-wrapper]:p-0"
        />
        <HexInput
          label={`${title} hex`}
          value={state.color}
          disabled={colorless}
          onChange={(color) => set({ color })}
        />
        <select
          value={state.finish}
          onChange={(event) => set({ finish: event.target.value as Finish })}
          aria-label={`${title} finish`}
          className="h-9 min-w-0 flex-1 rounded-md bg-zinc-800 px-2 text-sm outline-zinc-100 focus-visible:outline-2"
        >
          {Object.entries(FINISHES).map(([finish, name]) => (
            <option key={finish} value={finish}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-zinc-300 has-disabled:cursor-not-allowed has-disabled:opacity-40">
        <input
          type="checkbox"
          checked={state.colorless}
          disabled={!clear}
          onChange={(event) => set({ colorless: event.target.checked })}
          className="size-4 accent-zinc-100"
        />
        Colorless (clear only)
      </label>
      {children}
    </fieldset>
  )
}

// Commits only complete hex colors, so typing doesn't fight the picker
function HexInput({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string
  value: Hex
  disabled: boolean
  onChange: (color: Hex) => void
}) {
  const [text, setText] = useState<string>(value)
  const [synced, setSynced] = useState(value)
  if (value !== synced) {
    setSynced(value)
    setText(value)
  }
  return (
    <input
      type="text"
      value={text}
      disabled={disabled}
      spellCheck={false}
      onChange={(event) => {
        setText(event.target.value)
        const hex = '#' + event.target.value.trim().replace(/^#/, '').toLowerCase()
        if (/^#[0-9a-f]{6}$/.test(hex)) onChange(hex as Hex)
      }}
      onBlur={() => setText(value)}
      aria-label={label}
      className="h-9 w-24 shrink-0 rounded-md bg-zinc-800 px-2 font-mono text-sm outline-zinc-100 focus-visible:outline-2 disabled:opacity-30"
    />
  )
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Record<T, string>
  value: T
  onChange: (value: T) => void
}) {
  const name = useId()
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="contents text-xs font-medium text-zinc-400">{label}</legend>
      <div className="flex gap-1 rounded-lg bg-zinc-800 p-1 text-sm">
        {(Object.keys(options) as T[]).map((option) => (
          // relative keeps the sr-only radio inside the scroll container
          <label
            key={option}
            className="relative flex-1 cursor-pointer rounded-md px-3 py-1 text-center text-zinc-400 transition-colors hover:text-zinc-100 has-checked:bg-zinc-100 has-checked:text-zinc-900 has-focus-visible:outline-2 has-focus-visible:outline-zinc-100"
          >
            <input
              type="radio"
              name={name}
              checked={option === value}
              onChange={() => onChange(option)}
              className="sr-only"
            />
            {options[option]}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Copy JSON"
      title="Copy JSON"
      className="absolute top-2 right-2 grid size-8 place-items-center rounded-md bg-zinc-800 text-zinc-400 outline-zinc-100 transition-colors hover:text-zinc-100 focus-visible:outline-2"
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
    </button>
  )
}
