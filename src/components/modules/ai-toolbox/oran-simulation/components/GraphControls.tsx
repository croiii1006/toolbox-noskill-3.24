import { useDeferredValue, useMemo, useState, type ReactNode } from "react";
import {
  type GraphFilterType,
  type GraphNode,
  type GraphViewMode,
} from "../lib/graphData";
import { type Locale, getFilterLabel, getViewLabel, t } from "../lib/graphI18n";
import { cn } from "@/lib/utils";

interface GraphControlsProps {
  nodes: GraphNode[];
  viewMode: GraphViewMode;
  onViewModeChange: (viewMode: GraphViewMode) => void;
  activeTypes: Set<GraphFilterType>;
  onToggleType: (type: GraphFilterType) => void;
  onResetTypes: () => void;
  onSelectNode: (nodeId: string) => void;
  locale: Locale;
}

const viewOptions: GraphViewMode[] = [
  "global",
  "source",
  "user",
  "platform",
  "risk",
  "result_path",
];

const typeOptions: GraphFilterType[] = [
  "source",
  "brand",
  "product",
  "user",
  "platform",
  "selling_point",
  "mechanism",
  "risk",
  "result",
];

function filterCount(nodes: GraphNode[], type: GraphFilterType) {
  return nodes.filter((node) => node.filterType === type && !node.isTail).length;
}

export default function GraphControls({
  nodes,
  viewMode,
  onViewModeChange,
  activeTypes,
  onToggleType,
  onResetTypes,
  onSelectNode,
  locale,
}: GraphControlsProps) {
  const [query, setQuery] = useState("");
  const [showTypes, setShowTypes] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const results = useMemo(() => {
    const keyword = deferredQuery.trim().toLowerCase();
    if (keyword.length < 2) {
      return [];
    }

    return nodes
      .filter((node) => !node.isTail)
      .filter(
        (node) =>
          node.label.toLowerCase().includes(keyword) ||
          node.id.toLowerCase().includes(keyword) ||
          node.summary.toLowerCase().includes(keyword),
      )
      .slice(0, 8);
  }, [deferredQuery, nodes]);

  return (
    <aside className="workbench-shell open-frame flex h-full min-h-0 flex-col gap-4 overflow-hidden rounded-[28px] px-5 py-5 text-[var(--workbench-ink)]">
      <div className="space-y-2">
        <div className="font-pixel text-[10px] uppercase tracking-[0.34em] text-black/42">
          {t(locale, "controlsEyebrow")}
        </div>
        <div className="font-display text-[24px] leading-none tracking-[0.06em] text-black">
          {t(locale, "controlsTitle")}
        </div>
        <p className="max-w-[28ch] text-xs leading-6 text-black/58">
          {t(locale, "controlsDesc")}
        </p>
      </div>

      <WorkbenchSection title={t(locale, "searchNode")}>
        <div className="border border-black/10 bg-white/78 px-4 py-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t(locale, "searchPlaceholder")}
            className="w-full bg-transparent font-code text-sm text-black outline-none placeholder:text-black/32"
          />
        </div>
        {results.length > 0 ? (
          <div className="space-y-2 border border-black/10 bg-white/78 p-2">
            {results.map((result, index) => (
              <button
                key={result.id}
                type="button"
                onClick={() => {
                  setQuery(result.label);
                  onSelectNode(result.id);
                }}
                className="flex w-full items-start justify-between border border-transparent px-3 py-2 text-left transition hover:border-black/10 hover:bg-black/[0.03]"
              >
                <div>
                  <div className="font-body text-sm text-black">{result.label}</div>
                  <div className="font-code text-[11px] text-black/42">
                    IDX {String(index + 1).padStart(2, "0")} / {result.id}
                  </div>
                </div>
                <div className="font-pixel text-[10px] uppercase tracking-[0.18em] text-black/45">
                  {result.layer}
                </div>
              </button>
            ))}
          </div>
        ) : null}
      </WorkbenchSection>

      <WorkbenchSection title={t(locale, "viewMode")}>
        <div className="flex flex-wrap gap-2">
          {viewOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onViewModeChange(option)}
              className={cn(
                "border px-3 py-1.5 font-pixel text-[10px] uppercase tracking-[0.14em] transition",
                viewMode === option
                  ? "border-black/18 bg-black text-white"
                  : "border-black/10 bg-white/72 text-black/54 hover:border-black/18 hover:text-black",
              )}
            >
              {getViewLabel(locale, option)}
            </button>
          ))}
        </div>
      </WorkbenchSection>

      <WorkbenchSection
        title={t(locale, "nodeTypes")}
        rightAction={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTypes((current) => !current)}
              className="font-pixel text-[10px] uppercase tracking-[0.2em] text-black/48 transition hover:text-black"
            >
              {showTypes ? "HIDE" : "SHOW"}
            </button>
            <button
              type="button"
              onClick={onResetTypes}
              className="font-pixel text-[10px] uppercase tracking-[0.2em] text-black/48 transition hover:text-black"
            >
              {t(locale, "reset")}
            </button>
          </div>
        }
      >
        {showTypes ? (
          <div className="grid gap-2">
            {typeOptions.map((type) => {
              const active = activeTypes.has(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onToggleType(type)}
                  className={cn(
                    "flex items-center justify-between border px-4 py-2.5 text-left transition",
                    active
                      ? "border-black/18 bg-black text-white"
                      : "border-black/10 bg-white/72 text-black/66 hover:border-black/18 hover:text-black",
                  )}
                >
                  <span className="text-sm">{getFilterLabel(locale, type)}</span>
                  <span className="font-pixel text-[10px] uppercase tracking-[0.18em] opacity-72">
                    {String(filterCount(nodes, type)).padStart(2, "0")}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {typeOptions.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onToggleType(type)}
                className={cn(
                  "border px-3 py-1.5 font-pixel text-[10px] uppercase tracking-[0.14em] transition",
                  activeTypes.has(type)
                    ? "border-black/18 bg-black text-white"
                    : "border-black/10 bg-white/72 text-black/54 hover:border-black/18 hover:text-black",
                )}
              >
                {getFilterLabel(locale, type)}
              </button>
            ))}
          </div>
        )}
      </WorkbenchSection>

      <div className="mt-auto border-t border-black/8 pt-3">
        <button
          type="button"
          onClick={() => setShowHint((current) => !current)}
          className="flex w-full items-center justify-between font-pixel text-[11px] uppercase tracking-[0.22em] text-black/48 transition hover:text-black"
        >
          <span>{t(locale, "readingHint")}</span>
          <span>{showHint ? "[-]" : "[+]"}</span>
        </button>
        {showHint ? (
          <p className="mt-3 text-sm leading-6 text-black/56">
            {t(locale, "readingHintDesc")}
          </p>
        ) : null}
      </div>
    </aside>
  );
}

function WorkbenchSection({
  title,
  children,
  rightAction,
}: {
  title: string;
  children: ReactNode;
  rightAction?: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between border-b border-black/8 pb-2">
        <div className="font-pixel text-[11px] uppercase tracking-[0.28em] text-black/42">
          {title}
        </div>
        {rightAction}
      </div>
      {children}
    </section>
  );
}
