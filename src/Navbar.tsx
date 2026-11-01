import { Tags } from 'lucide-react'
import type { ReactNode } from 'react'

const PAGES = {
  labels: { title: 'Labels', href: '/' },
  icon: { title: 'Switch icon', href: '/icon' },
}

type Page = keyof typeof PAGES

export function Navbar({ current, children }: { current: Page; children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-4 border-b border-zinc-800 bg-zinc-900/85 px-4 backdrop-blur-md sm:gap-6 sm:px-6">
      <a href="/" className="flex items-center gap-2.5 rounded-md outline-zinc-100 focus-visible:outline-2">
        <span className="grid size-7 place-items-center rounded-md bg-zinc-100 text-zinc-900">
          <Tags className="size-4" strokeWidth={2.25} />
        </span>
        <span className="text-sm font-semibold tracking-tight max-sm:sr-only">Print labels</span>
      </a>
      <span className="h-5 w-px bg-zinc-800 max-sm:hidden" aria-hidden />
      <nav aria-label="Pages" className="flex h-full gap-4 sm:gap-5">
        {Object.entries(PAGES).map(([page, { title, href }]) => (
          <a
            key={page}
            href={href}
            aria-current={page === current ? 'page' : undefined}
            className="relative flex items-center text-sm whitespace-nowrap text-zinc-400 outline-zinc-100 transition-colors after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full hover:text-zinc-100 focus-visible:outline-2 aria-[current=page]:font-medium aria-[current=page]:text-zinc-100 aria-[current=page]:after:bg-zinc-100"
          >
            {title}
          </a>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-3">{children}</div>
    </header>
  )
}
