import { useMemo, useState } from "react";
import { Check, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { normalizeParsedInputs } from "./parsedInputsData";
import type { ParsedInputSection } from "./workflowTypes";

interface EditableParsedInputsProps {
  value?: ParsedInputSection[] | null;
  onChange?: (next: ParsedInputSection[]) => void;
  className?: string;
}

export default function EditableParsedInputs({
  value,
  onChange,
  className,
}: EditableParsedInputsProps) {
  const sections = useMemo(() => normalizeParsedInputs(value), [value]);
  const [editingSections, setEditingSections] = useState<Record<number, boolean>>({});

  const updateField = (sectionIndex: number, fieldIndex: number, nextValue: string) => {
    const nextSections = sections.map((section, currentSectionIndex) => ({
      ...section,
      fields: section.fields.map((field, currentFieldIndex) =>
        currentSectionIndex === sectionIndex && currentFieldIndex === fieldIndex
          ? { ...field, value: nextValue }
          : field,
      ),
    }));

    onChange?.(nextSections);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {sections.map((section, sectionIndex) => (
        <div key={section.title} className="rounded-xl border border-border/60 p-5 bg-card/90">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-normal text-accent/80">{section.title}</h3>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md text-accent/80 hover:bg-accent/10 hover:text-accent"
              onClick={() =>
                setEditingSections((current) => ({
                  ...current,
                  [sectionIndex]: !current[sectionIndex],
                }))
              }
            >
              {editingSections[sectionIndex] ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Pencil className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>

          <div className="space-y-2.5">
            {section.fields.map((field, fieldIndex) => (
              <div
                key={`${section.title}-${field.label}`}
                className="flex items-start justify-between gap-4 border-b border-border/20 py-1.5 last:border-0"
              >
                <span className="flex-shrink-0 text-xs text-muted-foreground/60">
                  {field.label}
                </span>

                {editingSections[sectionIndex] ? (
                  <Textarea
                    value={field.value}
                    onChange={(event) =>
                      updateField(sectionIndex, fieldIndex, event.target.value)
                    }
                    className="min-h-[44px] w-full max-w-[420px] resize-y rounded-md border-border/20 bg-transparent px-2 py-1 text-xs leading-5 text-foreground/70 text-right"
                  />
                ) : (
                  <span className="ml-4 text-right text-xs text-foreground/70">
                    {field.value}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
