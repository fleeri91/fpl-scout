'use client'

export function PageFooter({
  pageLabel,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: {
  pageLabel: string
  canPrev: boolean
  canNext: boolean
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <footer className="border-border flex flex-0 items-center justify-end border-t px-7.5 py-2">
      <div className="flex items-center gap-3">
        <button
          onClick={onPrev}
          disabled={!canPrev}
          className="border-border rounded-(--r-ctl) border px-2.75 py-1 text-xs text-(--fg2) disabled:opacity-30"
        >
          ←
        </button>
        <span className="mono text-[11px] text-(--fg3)">{pageLabel}</span>
        <button
          onClick={onNext}
          disabled={!canNext}
          className="border-border rounded-(--r-ctl) border px-2.75 py-1 text-xs text-(--fg2) disabled:opacity-30"
        >
          →
        </button>
      </div>
    </footer>
  )
}
