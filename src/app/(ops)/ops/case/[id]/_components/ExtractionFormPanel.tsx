'use client'

import { useCallback, useState, type ReactElement } from 'react'

/**
 * Center pane: entry-extraction form per PRD 04. v1 stub — captures
 * the entry-row fields the analyst would fill from the document on
 * the right; persistence lands with the entries schema (#55+).
 *
 * Saves are intentionally local-only at v1 so the form is exercised
 * end-to-end in the workspace without coupling to schema work.
 */

const EMPTY_DRAFT: ExtractionDraft = {
  entryNumber: '',
  entryDate: '',
  importerOfRecord: '',
  dutyAmountUsdCents: '',
  htsCodes: '',
}

interface ExtractionDraft {
  entryNumber: string
  entryDate: string
  importerOfRecord: string
  dutyAmountUsdCents: string
  htsCodes: string
}

export interface ExtractionFormPanelProps {
  readonly caseId: string
  readonly initial?: Partial<ExtractionDraft>
  /** Test seam — defaults to console.info so v1 has zero side effects. */
  readonly onSave?: (draft: ExtractionDraft) => void
}

export function ExtractionFormPanel({
  caseId,
  initial,
  onSave,
}: ExtractionFormPanelProps): ReactElement {
  const [draft, setDraft] = useState<ExtractionDraft>({
    ...EMPTY_DRAFT,
    ...initial,
  })
  const [savedAt, setSavedAt] = useState<Date | undefined>(undefined)

  const save = useCallback(() => {
    if (onSave) onSave(draft)
    setSavedAt(new Date())
  }, [draft, onSave])

  const update = useCallback(
    (patch: Partial<ExtractionDraft>) => setDraft((prev) => ({ ...prev, ...patch })),
    [],
  )

  return (
    <section
      aria-label="Entry extraction form"
      className="border-r border-rule p-6"
    >
      <header className="flex items-baseline justify-between">
        <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-ink/55">
          Entry extraction
        </h2>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/45">
          Case <span data-testid="extraction-case-id">{caseId}</span>
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
        className="mt-6 space-y-5"
      >
        <Field
          id="entry-number"
          label="Entry number"
          mono
          value={draft.entryNumber}
          onChange={(v) => update({ entryNumber: v })}
        />
        <Field
          id="entry-date"
          label="Entry date"
          mono
          placeholder="YYYY-MM-DD"
          value={draft.entryDate}
          onChange={(v) => update({ entryDate: v })}
        />
        <Field
          id="ior"
          label="Importer of record"
          value={draft.importerOfRecord}
          onChange={(v) => update({ importerOfRecord: v })}
        />
        <Field
          id="duty"
          label="Duty (USD cents)"
          mono
          placeholder="e.g. 250000"
          value={draft.dutyAmountUsdCents}
          onChange={(v) => update({ dutyAmountUsdCents: v })}
        />
        <Field
          id="hts"
          label="HTS codes (comma-separated)"
          mono
          value={draft.htsCodes}
          onChange={(v) => update({ htsCodes: v })}
        />

        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            data-testid="extraction-save"
            className="border border-ink bg-ink px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-paper hover:bg-ink/85"
          >
            Save extraction <kbd className="ml-2 text-paper/70">s</kbd>
          </button>
          {savedAt && (
            <p
              data-testid="extraction-saved-at"
              className="font-mono text-xs text-ink/65"
            >
              Saved {savedAt.toISOString().slice(11, 19)}Z
            </p>
          )}
        </div>
      </form>

      <p className="mt-8 max-w-prose font-mono text-[10px] uppercase tracking-[0.16em] text-ink/45">
        Persistence lands with the entries schema (task #55). v1 is a local-state stub so the
        workspace UI is exercisable end-to-end.
      </p>
    </section>
  )
}

interface FieldProps {
  readonly id: string
  readonly label: string
  readonly value: string
  readonly onChange: (value: string) => void
  readonly mono?: boolean
  readonly placeholder?: string
}

function Field({ id, label, value, onChange, mono, placeholder }: FieldProps): ReactElement {
  return (
    <label htmlFor={id} className="block">
      <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-ink/55">
        {label}
      </span>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        data-testid={`extraction-field-${id}`}
        className={`mt-2 w-full border border-rule bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-accent ${
          mono ? 'font-mono' : ''
        }`}
      />
    </label>
  )
}
