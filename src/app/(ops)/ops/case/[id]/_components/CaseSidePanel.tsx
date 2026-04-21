'use client'

import { useState } from 'react'
import { AuditTimeline, type AuditTimelineEntry } from './AuditTimeline'
import { DocumentViewerPanel, type CaseDocumentSummary } from './DocumentViewerPanel'

/**
 * Tabbed right pane of the case workspace. Two tabs for v1:
 *
 *   Documents — reuses DocumentViewerPanel (task #47).
 *   Audit     — placeholder; full audit-log viewer lands with
 *               task #79.
 *
 * The tab widget is keyboard-operable and uses real `role="tab"`
 * semantics so accessibility tools see the pair correctly.
 */

export interface CaseSidePanelProps {
  readonly caseId: string
  readonly documents: readonly CaseDocumentSummary[]
  readonly auditEntries?: readonly AuditTimelineEntry[]
}

type TabId = 'docs' | 'audit'

export function CaseSidePanel({
  documents,
  auditEntries,
}: CaseSidePanelProps) {
  const [active, setActive] = useState<TabId>('docs')
  return (
    <aside className="flex flex-col border-l border-rule bg-paper">
      <div
        role="tablist"
        aria-label="Case side-panel tabs"
        className="flex border-b border-rule"
      >
        <TabButton id="docs" active={active} setActive={setActive}>
          Documents
        </TabButton>
        <TabButton id="audit" active={active} setActive={setActive}>
          Audit
        </TabButton>
      </div>

      {active === 'docs' ? (
        <div
          role="tabpanel"
          id="tab-docs-panel"
          data-testid="tab-docs-panel"
          aria-labelledby="tab-docs"
        >
          <DocumentViewerPanel documents={documents} />
        </div>
      ) : null}

      {active === 'audit' ? (
        <div
          role="tabpanel"
          id="tab-audit-panel"
          data-testid="tab-audit-panel"
          aria-labelledby="tab-audit"
        >
          <AuditTimeline entries={auditEntries ?? []} />
        </div>
      ) : null}
    </aside>
  )
}

function TabButton({
  id,
  active,
  setActive,
  children,
}: {
  id: TabId
  active: TabId
  setActive: (id: TabId) => void
  children: string
}) {
  const selected = active === id
  const className = selected
    ? 'flex-1 border-b-2 border-ink bg-paper px-4 py-3 font-mono text-xs uppercase tracking-[0.15em] text-ink'
    : 'flex-1 border-b-2 border-transparent bg-paper-2 px-4 py-3 font-mono text-xs uppercase tracking-[0.15em] text-ink/60 hover:text-ink'
  return (
    <button
      role="tab"
      id={`tab-${id}`}
      aria-selected={selected}
      aria-controls={`tab-${id}-panel`}
      tabIndex={selected ? 0 : -1}
      onClick={() => setActive(id)}
      className={className}
    >
      {children}
    </button>
  )
}
