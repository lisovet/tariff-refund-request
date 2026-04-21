'use client'

import { useState } from 'react'
import type { Question } from '@contexts/screener'
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
  { id: 'electronics', label: 'Electronics' },
  { id: 'apparel', label: 'Apparel' },
  { id: 'home_goods', label: 'Home goods' },
  { id: 'industrial', label: 'Industrial / equipment' },
  { id: 'auto_parts', label: 'Auto parts' },
  { id: 'food_beverage', label: 'Food / beverage' },
  { id: 'other', label: 'Other' },
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
  const [country, setCountry] = useState('')
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (country.trim().length > 0) onSubmit(country.trim())
      }}
    >
      <label className="flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-ink/60">
          Country (ISO code or name)
        </span>
        <input
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full max-w-md rounded-card border border-rule bg-paper-2 px-4 py-3 text-ink focus:border-ink focus:outline-none"
          aria-label="Country"
        />
      </label>
      <div className="flex gap-4">
        <Button type="submit">Continue</Button>
        <Button variant="underline" onClick={() => onSubmit('unknown')}>
          I don&apos;t know
        </Button>
      </div>
    </form>
  )
}

function MultiCategoryInput({
  onSubmit,
}: {
  readonly onSubmit: (value: AnyAnswer) => void
}) {
  const [picked, setPicked] = useState<string[]>([])
  const toggle = (id: string) => {
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    )
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
      <div className="mt-2">
        <Button
          disabled={picked.length === 0}
          onClick={() => onSubmit(picked)}
        >
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
