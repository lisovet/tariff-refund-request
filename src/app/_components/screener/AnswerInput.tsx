'use client'

import { useMemo, useRef, useState } from 'react'
import type { Question } from '@contexts/screener'
import { COUNTRIES, filterCountries } from '@contexts/screener'
import { Button } from '@/app/_components/ui'

/**
 * Per-kind answer input + submission. Each kind renders its own
 * affordances and emits a typed value via onSubmit. The orchestrator
 * (ScreenerFlow) advances the flow on receipt.
 *
 * Per PRD 01: yes/no questions submit-on-click (no extra Continue
 * needed); typed inputs require an explicit Continue / See my results.
 */

type AnyAnswer = unknown

interface Props {
  readonly question: Question
  readonly onSubmit: (value: AnyAnswer) => void
  readonly onBack: () => void
  readonly canGoBack: boolean
}

const CATEGORIES = [
  { id: 'apparel_fashion', label: 'Apparel & fashion' },
  { id: 'jewelry_watches', label: 'Jewelry & watches' },
  { id: 'consumer_electronics', label: 'Consumer electronics' },
  { id: 'furniture_home', label: 'Furniture & home goods' },
  { id: 'footwear', label: 'Footwear' },
  { id: 'toys_games', label: 'Toys & games' },
  { id: 'machinery_parts', label: 'Machinery & parts' },
  { id: 'steel_metals', label: 'Steel & metals' },
  { id: 'other', label: 'Other (please specify)' },
] as const

const CLEARANCE_PATHS = [
  { id: 'broker', label: 'A third-party customs broker' },
  { id: 'carrier', label: 'The carrier (DHL / FedEx / UPS)' },
  { id: 'ace_self_filed', label: 'I self-filed via ACE' },
  { id: 'mixed', label: 'A mix of the above' },
] as const

const SHIPMENT_BANDS = [
  { id: 'under_5', label: 'Fewer than 5' },
  { id: '5_50', label: 'Between 5 and 50' },
  { id: '50_500', label: 'Between 50 and 500' },
  { id: '500_plus', label: 'More than 500' },
] as const

const DUTY_BANDS = [
  { id: 'band_under_5k', label: 'Under $5,000' },
  { id: 'band_5k_50k', label: '$5,000 — $50,000' },
  { id: 'band_50k_500k', label: '$50,000 — $500,000' },
  { id: 'band_500k_5m', label: '$500,000 — $5,000,000' },
  { id: 'band_over_5m', label: 'Over $5,000,000' },
] as const

export function AnswerInput({ question, onSubmit, onBack, canGoBack }: Props) {
  return (
    <div className="mt-12 space-y-8">
      {renderInput(question, onSubmit)}

      {canGoBack && (
        <div>
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-ink/60 underline underline-offset-[6px] decoration-ink/20 hover:decoration-ink"
          >
            ← Previous
          </button>
        </div>
      )}
    </div>
  )
}

function renderInput(
  question: Question,
  onSubmit: (value: AnyAnswer) => void,
): React.ReactNode {
  switch (question.kind) {
    case 'yes_no':
      return (
        <div className="flex flex-wrap gap-4">
          <Button onClick={() => onSubmit('yes')}>Yes</Button>
          <Button onClick={() => onSubmit('no')}>No</Button>
        </div>
      )
    case 'yes_no_unknown':
      return (
        <div className="flex flex-wrap gap-4">
          <Button onClick={() => onSubmit('yes')}>Yes</Button>
          <Button onClick={() => onSubmit('no')}>No</Button>
          <Button variant="underline" onClick={() => onSubmit('dont_know')}>
            I don&apos;t know
          </Button>
        </div>
      )
    case 'country':
      return <CountryInput onSubmit={onSubmit} />
    case 'clearance_path':
      return (
        <ChoiceList
          choices={CLEARANCE_PATHS}
          onPick={(id) => onSubmit(id)}
        />
      )
    case 'shipment_band':
      return (
        <ChoiceList
          choices={SHIPMENT_BANDS}
          onPick={(id) => onSubmit(id)}
        />
      )
    case 'duty_band':
      return (
        <ChoiceList choices={DUTY_BANDS} onPick={(id) => onSubmit(id)} />
      )
    case 'multi_category':
      return <MultiCategoryInput onSubmit={onSubmit} />
    case 'email_capture':
      return <EmailCaptureInput onSubmit={onSubmit} />
  }
}

// --- per-kind subcomponents ------------------------------------------------

function ChoiceList({
  choices,
  onPick,
}: {
  readonly choices: ReadonlyArray<{ id: string; label: string }>
  readonly onPick: (id: string) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      {choices.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onPick(c.id)}
          className="rounded-card border border-rule bg-paper-2 px-5 py-4 text-left text-ink transition-colors duration-160 ease-paper hover:border-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {c.label}
        </button>
      ))}
    </div>
  )
}

function CountryInput({
  onSubmit,
}: {
  readonly onSubmit: (value: AnyAnswer) => void
}) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const listboxId = 'country-listbox'
  const inputRef = useRef<HTMLInputElement>(null)

  const matches = useMemo(() => filterCountries(query), [query])
  const canSubmit = (selected ?? query.trim()).length > 0

  function choose(name: string): void {
    setSelected(name)
    setQuery(name)
    setOpen(false)
    setActiveIndex(0)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActiveIndex((i) => Math.min(i + 1, matches.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && open && matches[activeIndex]) {
      e.preventDefault()
      choose(matches[activeIndex].name)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        const value = selected ?? query.trim()
        if (value.length > 0) onSubmit(value)
      }}
    >
      <label className="flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
          Country
        </span>
        <div className="relative w-full max-w-md">
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              open && matches[activeIndex]
                ? `country-option-${matches[activeIndex].iso}`
                : undefined
            }
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelected(null)
              setOpen(true)
              setActiveIndex(0)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              // Delay so a click on an option fires before close.
              setTimeout(() => setOpen(false), 120)
            }}
            onKeyDown={handleKeyDown}
            className="w-full rounded-card border border-rule bg-paper-2 px-4 py-3 text-ink focus:border-ink focus:outline-none"
            aria-label="Country"
            autoComplete="off"
            placeholder="Start typing…"
          />
          {open && matches.length > 0 && (
            <ul
              id={listboxId}
              role="listbox"
              className="absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-auto rounded-card border border-rule bg-paper shadow-sm"
            >
              {matches.map((c, i) => (
                <li
                  key={c.iso}
                  id={`country-option-${c.iso}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  className={`cursor-pointer px-4 py-2 text-ink ${
                    i === activeIndex ? 'bg-paper-2' : ''
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    choose(c.name)
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  {c.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </label>
      <div className="flex gap-4">
        <Button type="submit" disabled={!canSubmit}>
          Continue
        </Button>
        <Button variant="underline" onClick={() => onSubmit('unknown')}>
          I don&apos;t know
        </Button>
      </div>
    </form>
  )
}

// Keep an import reference so tree-shaking doesn't drop the seed data
// when consumed only via `filterCountries`.
export const _COUNTRIES_SEEN = COUNTRIES.length

const OTHER_TEXT_MAX = 120

function MultiCategoryInput({
  onSubmit,
}: {
  readonly onSubmit: (value: AnyAnswer) => void
}) {
  const [picked, setPicked] = useState<string[]>([])
  const [otherText, setOtherText] = useState('')
  const otherChecked = picked.includes('other')

  const toggle = (id: string) => {
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    )
  }

  const handleContinue = () => {
    const trimmed = otherText.trim().slice(0, OTHER_TEXT_MAX)
    const selection = {
      categories: picked,
      ...(otherChecked && trimmed.length > 0 ? { otherText: trimmed } : {}),
    }
    onSubmit(selection)
  }

  return (
    <div className="flex flex-col gap-3">
      {CATEGORIES.map((c) => (
        <label
          key={c.id}
          className="flex cursor-pointer items-center gap-3 rounded-card border border-rule bg-paper-2 px-5 py-3 text-ink"
        >
          <input
            type="checkbox"
            checked={picked.includes(c.id)}
            onChange={() => toggle(c.id)}
            className="h-4 w-4 accent-accent"
            aria-label={c.label}
          />
          <span>{c.label}</span>
        </label>
      ))}
      {otherChecked && (
        <label className="flex flex-col gap-2 px-1">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
            What else? (optional)
          </span>
          <input
            type="text"
            value={otherText}
            onChange={(e) => setOtherText(e.target.value.slice(0, OTHER_TEXT_MAX))}
            maxLength={OTHER_TEXT_MAX}
            placeholder="e.g. medical devices"
            className="w-full max-w-md rounded-card border border-rule bg-paper-2 px-4 py-3 text-ink focus:border-ink focus:outline-none"
            aria-label="Other category"
          />
        </label>
      )}
      <div className="mt-2">
        <Button disabled={picked.length === 0} onClick={handleContinue}>
          Continue
        </Button>
      </div>
    </div>
  )
}

function EmailCaptureInput({
  onSubmit,
}: {
  readonly onSubmit: (value: AnyAnswer) => void
}) {
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault()
        if (!isValidEmail(email)) return
        if (company.trim().length === 0) return
        onSubmit({ company: company.trim(), email: email.trim() })
      }}
    >
      <label className="flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
          Company
        </span>
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="w-full max-w-md rounded-card border border-rule bg-paper-2 px-4 py-3 text-ink focus:border-ink focus:outline-none"
          aria-label="Company"
          required
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
          Work email
        </span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full max-w-md rounded-card border border-rule bg-paper-2 px-4 py-3 text-ink focus:border-ink focus:outline-none"
          aria-label="Email"
          required
        />
      </label>
      <p className="text-xs text-ink/60">
        We never sell or share your information. Your results stay yours.
      </p>
      <div>
        <Button type="submit">See my results</Button>
      </div>
    </form>
  )
}

function isValidEmail(value: string): boolean {
  // Permissive but real-shape email check.
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}
