import {
  type GraphNode,
  type GraphViewMode,
} from "../lib/graphData";
import { type Locale, getViewLabel, t } from "../lib/graphI18n";

interface StatusBarProps {
  graphName: string;
  totalNodes: number;
  totalEdges: number;
  activeNodeCount: number;
  viewMode: GraphViewMode;
  dataStatus: string;
  focusNode: GraphNode | null;
  locale: Locale;
}

export default function StatusBar({
  graphName,
  totalNodes,
  totalEdges,
  activeNodeCount,
  viewMode,
  dataStatus,
  focusNode,
  locale,
}: StatusBarProps) {
  return (
    <div className="workbench-shell open-frame rounded-[26px] px-5 py-4 text-[var(--workbench-ink)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="font-pixel text-[10px] uppercase tracking-[0.34em] text-black/44">
            {t(locale, "brand")}
          </div>
          <div className="max-w-3xl truncate font-display text-[28px] leading-none tracking-[0.06em] text-black">
            {graphName}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-black/52">
            <span>{dataStatus}</span>
            <span className="font-code text-[11px] uppercase tracking-[0.14em]">
              {getViewLabel(locale, viewMode)}
            </span>
            <span className="font-code text-[11px] uppercase tracking-[0.14em]">
              FOCUS / {focusNode ? focusNode.label : t(locale, "idle")}
            </span>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-5">
          <Metric label={t(locale, "nodes")} value={String(totalNodes)} />
          <Metric label={t(locale, "edges")} value={String(totalEdges)} />
          <Metric label={t(locale, "active")} value={String(activeNodeCount)} />
          <Metric
            label="FOCUS"
            value={focusNode ? focusNode.label : t(locale, "idle")}
            emphasize={Boolean(focusNode)}
          />
          <Metric label="MODE" value="SYSTEM KERNEL" />
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="rounded-[18px] border border-black/10 bg-white/55 px-3 py-2.5 text-[var(--workbench-ink)]">
      <div className="font-pixel text-[10px] uppercase tracking-[0.28em] text-black/42">
        {label}
      </div>
      <div
        className={
          emphasize
            ? "mt-1.5 font-pixel text-sm tracking-[0.08em] text-[rgba(73,111,120,0.95)]"
            : "mt-1.5 font-pixel text-sm tracking-[0.08em] text-black"
        }
      >
        {value}
      </div>
    </div>
  );
}
