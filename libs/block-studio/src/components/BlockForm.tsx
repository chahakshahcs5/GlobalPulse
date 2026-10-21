'use client';

import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { FormEditor } from './FormEditor';
import { getAtPath } from '../path';
import type { FormSection } from '../form-schema';
import type { ValidationIssue } from '../validation';

export interface BlockFormProps {
  sections: FormSection[];
  /** The payload being edited, from its root. */
  payload: Record<string, unknown>;
  /**
   * The payload as it was when it was loaded, for marking what changed.
   */
  baseline?: Record<string, unknown>;
  onChange: (path: string, value: unknown) => void;
  issues: Map<string, ValidationIssue[]>;
}

/**
 * The form for a whole block.
 *
 * A block is not one thing but several: what it says, how it is presented,
 * how it is described for readers who cannot see it, where it came from and
 * what it cites. Editing them as one flat list of fields loses that shape,
 * so each is a section of its own, and each section's fields are grouped by
 * what they are for.
 *
 * The sections and the groups are generated from the block's own schema, so
 * a block type with nothing to say about its provenance simply has no
 * provenance section.
 */
export function BlockForm({ sections, payload, baseline, onChange, issues }: BlockFormProps) {
  const [open, setOpen] = React.useState<Record<string, boolean>>({});

  if (sections.length === 0) {
    return <p className="text-[13px] text-slate-500">This block has no editable fields.</p>;
  }

  // The content section is open by default; the rest start closed, because
  // they are used far less often and there is no reason to crowd the form.
  const isOpen = (sectionId: string, index: number) => open[sectionId] ?? index === 0;

  const toggle = (sectionId: string, index: number) =>
    setOpen((previous) => {
      const current = previous[sectionId] ?? index === 0;
      return { ...previous, [sectionId]: !current };
    });

  return (
    <div className="space-y-3">
      {sections.map((section, index) => {
        const expanded = isOpen(section.id, index);
        const sectionData = getAtPath(payload, section.path);

        return (
          <section
            key={section.id}
            className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30"
          >
            <button
              type="button"
              onClick={() => toggle(section.id, index)}
              aria-expanded={expanded}
              className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/60"
            >
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              )}
              <span className="flex-1 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                {section.label}
              </span>
            </button>

            {expanded && (
              <div className="border-t border-slate-200 p-3 dark:border-slate-800">
                {section.description && (
                  <p className="mb-3 text-[11px] leading-relaxed text-slate-500">
                    {section.description}
                  </p>
                )}

                <div className="space-y-4">
                  {section.groups.map((group) => (
                    <div key={group.id}>
                      {group.id !== 'default' && (
                        <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          {group.label}
                        </h4>
                      )}
                      <FormEditor
                        fields={group.fields}
                        path={section.path}
                        data={sectionData}
                        baseline={getAtPath(baseline, section.path)}
                        onChange={onChange}
                        issues={issues}
                        payload={payload}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
