'use client'

import { useCallback, useState, type ReactElement } from 'react'

/**
 * Center pane: entry-extraction form per PRD 04 + task #53. Saves
 * via POST /api/cases/[id]/entries which atomically writes the
 * entry, an entry_source_record (provenance never null), and an
 * audit_log row.
 *
 * Tests inject `onSave` to bypass the network. When onSave is not
 * provided, the form posts to the real route. The selected document
 * (right-pane viewer) provides the recoverySourceId — for v1 the
 * caller passes it via the `recoverySourceId` prop; #82 will wire
 * it dynamically from the active doc.
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
  readonly recoverySourceId?: string
  readonly initial?: Partial<ExtractionDraft>
  /**
   * Test seam — when provided, called instead of the real network
   * POST. Production callers leave it undefined so the form hits
   * the route handler.
   */
  readonly onSave?: (draft: ExtractionDraft) => void | Promise<void>
}

export function ExtractionFormPanel({
  caseId,
  recoverySourceId,
  initial,
  onSave,
}: ExtractionFormPanelProps): ReactElement {
  const [draft, setDraft] = useState<ExtractionDraft>({
    ...EMPTY_DRAFT,
    ...initial,
  })
  const [savedAt, setSavedAt] = useState<Date | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)

  const save = useCallback(async () => {
    setError(undefined)
    if (onSave) {
      try {
        await onSave(draft)
        setSavedAt(new Date())
      } catch (err) {
        setError(String((err as Error)?.message ?? err))
      }
      return
    }
    if (!recoverySourceId) {
      setError('No source document selected — pick a document on the right pane first.')
      return
    }
    try {
      const res = await fetch(`/api/cases/${encodeURIComponent(caseId)}/entries`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          entryNumber: draft.entryNumber,
          entryDate: draft.entryDate || undefined,
          importerOfRecord: draft.importerOfRecord || undefined,
          dutyAmountUsdCents: draft.dutyAmountUsdCents
            ? Number(draft.dutyAmountUsdCents)
            : undefined,
          htsCodes: draft.htsCodes
            ? draft.htsCodes.split(',').map((s) => s.trim()).filter(Boolean)
            : undefined,
          recoverySourceId,
        }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        setError(body.error ?? `HTTP ${res.status}`)
        return
      }
      setSavedAt(new Date())
    } catch (err) {
      setError(String((err as Error)?.message ?? err))
    }
  }, [caseId, draft, onSave, recoverySourceId])

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
          {savedAt && !error && (
            <p
              data-testid="extraction-saved-at"
              className="font-mono text-xs text-ink/65"
            >
              Saved {savedAt.toISOString().slice(11, 19)}Z
            </p>
          )}
          {error && (
            <p
              data-testid="extraction-error"
              role="alert"
              className="font-mono text-xs text-ink/85"
            >
              {error}
            </p>
          )}
        </div>
      </form>

      <p className="mt-8 max-w-prose font-mono text-[10px] uppercase tracking-[0.16em] text-ink/45">
        Save writes the entry, an entry_source_record (provenance), and an audit_log row. Pick a
        source document in the right pane before saving.
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
