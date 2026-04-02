import type { ReactNode } from "react";
import {
  type HighlightMode,
  type GraphEdge,
  type GraphNode,
  getEvidenceSources,
  getPrimaryPaths,
  getTopConnectedNodeIds,
  graphDataset,
} from "../lib/graphData";
import {
  type Locale,
  getFilterLabel,
  getLayerLabel,
  t,
} from "../lib/graphI18n";

interface DetailPanelProps {
  node: GraphNode | null;
  onHighlight: (mode: HighlightMode) => void;
  onClose: () => void;
  locale: Locale;
}

function toLabel(nodeId: string) {
  return graphDataset.nodeMap.get(nodeId)?.label ?? nodeId;
}

function renderPath(path: string[]) {
  return path.map(toLabel).join(" -> ");
}

function topEdgeScore(edges: GraphEdge[]) {
  if (edges.length === 0) {
    return { weight: "0.00", confidence: "0.00" };
  }

  const strongest = [...edges].sort(
    (left, right) =>
      right.weight * right.confidence - left.weight * left.confidence,
  )[0];

  return {
    weight: strongest.weight.toFixed(2),
    confidence: strongest.confidence.toFixed(2),
  };
}

export default function DetailPanel({
  node,
  onHighlight,
  onClose,
  locale,
}: DetailPanelProps) {
  if (!node) {
    return null;
  }

  const connectedEdges = graphDataset.undirected.get(node.id) ?? [];
  const incomingEdges = graphDataset.incoming.get(node.id) ?? [];
  const outgoingEdges = graphDataset.outgoing.get(node.id) ?? [];
  const strongest = topEdgeScore(connectedEdges);
  const paths = getPrimaryPaths(node.id);
  const evidence = getEvidenceSources(node.id);
  const topConnections = getTopConnectedNodeIds(node.id).map(toLabel);

  const upstream = incomingEdges
    .slice(0, 4)
    .map((edge) => `${toLabel(edge.source)} (${edge.weight.toFixed(2)})`);
  const downstream = outgoingEdges
    .slice(0, 4)
    .map((edge) => `${toLabel(edge.target)} (${edge.weight.toFixed(2)})`);

  return (
    <div className="open-frame oran-detail-panel animate-panel w-full max-w-[300px] text-white">
      <aside className="kernel-shell flex max-h-[min(78vh,450px)] w-full flex-col gap-4 overflow-y-auto px-5 py-5 shadow-[0_28px_80px_rgba(0,0,0,0.42)]">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="font-pixel text-[11px] uppercase tracking-[0.34em] text-white/44">
              {t(locale, "nodeDetail")}
            </div>
            <div className="mt-2 font-display text-[28px] leading-none tracking-[0.08em] text-white">
              {node.label}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Tag>{getFilterLabel(locale, node.filterType)}</Tag>
              <Tag>{getLayerLabel(locale, node.layer)}</Tag>
              <Tag>{node.entityType}</Tag>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="border border-white/12 px-3 py-2 font-pixel text-[10px] uppercase tracking-[0.2em] text-white/62 transition hover:border-white/22 hover:text-white"
          >
            {t(locale, "close")}
          </button>
        </div>

        <KernelSection title={t(locale, "basicInfo")}>
          <GridInfo
            items={[
              [t(locale, "nodeName"), node.label],
              [t(locale, "nodeType"), node.entityType],
              [t(locale, "layer"), getLayerLabel(locale, node.layer)],
              [t(locale, "nodeId"), node.id],
              ["CONNECTIONS", String(connectedEdges.length)],
              ["COORD", `${Math.round(node.x)}, ${Math.round(node.y)}`],
              ["WEIGHT", node.weight.toFixed(2)],
              ["TOP EDGE", strongest.weight],
              ["CONFIDENCE", strongest.confidence],
            ]}
          />
        </KernelSection>

        <KernelSection title={t(locale, "nodeSummary")}>
          <p className="text-sm leading-7 text-white/72">{node.summary}</p>
        </KernelSection>

        <KernelSection title={t(locale, "keyAttributes")}>
          {node.sourceDetails ? (
            <GridInfo
              items={[
                [t(locale, "sourceType"), node.sourceDetails.sourceType],
                [t(locale, "sourceSummary"), node.sourceDetails.shortSummary],
                [t(locale, "reliability"), `${Math.round(node.sourceDetails.reliability * 100)}%`],
                [t(locale, "excerpt"), node.sourceDetails.excerpt],
              ]}
            />
          ) : null}

          {node.factDetails ? (
            <GridInfo
              items={[
                [t(locale, "category"), node.factDetails.category],
                [
                  t(locale, "relatedContext"),
                  [
                    ...(node.factDetails.relatedBrands ?? []),
                    ...(node.factDetails.relatedPlatforms ?? []),
                    ...(node.factDetails.relatedUsers ?? []),
                  ].join(" / ") || t(locale, "none"),
                ],
                [t(locale, "topConnections"), topConnections.join(" / ") || t(locale, "none")],
              ]}
            />
          ) : null}

          {node.mechanismDetails ? (
            <GridInfo
              items={[
                [t(locale, "impactDirection"), node.mechanismDetails.impactDirection],
                [
                  t(locale, "triggeredBy"),
                  incomingEdges.map((edge) => toLabel(edge.source)).slice(0, 4).join(" / ") ||
                    t(locale, "none"),
                ],
                [
                  t(locale, "impacts"),
                  outgoingEdges.map((edge) => toLabel(edge.target)).slice(0, 4).join(" / ") ||
                    t(locale, "none"),
                ],
              ]}
            />
          ) : null}

          {node.outcomeDetails ? (
            <GridInfo
              items={[
                [t(locale, "currentTendency"), node.outcomeDetails.currentTendency],
                [
                  t(locale, "upstreamDrivers"),
                  incomingEdges.map((edge) => toLabel(edge.source)).slice(0, 4).join(" / ") ||
                    t(locale, "none"),
                ],
                [t(locale, "riskHint"), node.outcomeDetails.riskHint],
              ]}
            />
          ) : null}
        </KernelSection>

        <KernelSection title="FLOW">
          <GridInfo
            items={[
              [t(locale, "triggeredBy"), upstream.join(" / ") || t(locale, "none")],
              [t(locale, "impacts"), downstream.join(" / ") || t(locale, "none")],
            ]}
          />
        </KernelSection>

        <KernelSection title={t(locale, "linkedPaths")}>
          <div className="space-y-2">
            {paths.length > 0 ? (
              paths.map((path) => (
                <div
                  key={path.join("-")}
                  className="border border-white/10 bg-white/[0.03] px-4 py-3 font-code text-xs leading-6 text-white/72"
                >
                  {renderPath(path)}
                </div>
              ))
            ) : (
              <div className="border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/50">
                {t(locale, "noPath")}
              </div>
            )}
          </div>
        </KernelSection>

        <KernelSection title={t(locale, "evidenceBasis")}>
          <div className="space-y-2">
            {node.layer === "source" ? (
              <div className="border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-white/68">
                {t(locale, "sourceSelf")}
              </div>
            ) : evidence.length > 0 ? (
              evidence.map((item) => {
                const sourceNode = graphDataset.nodeMap.get(item.sourceId);
                return (
                  <div
                    key={item.sourceId}
                    className="border border-white/10 bg-white/[0.03] px-4 py-3"
                  >
                    <div className="font-pixel text-[11px] uppercase tracking-[0.18em] text-white/44">
                      {sourceNode?.label ?? item.sourceId}
                    </div>
                    <div className="mt-2 text-sm leading-7 text-white/66">
                      {sourceNode?.sourceDetails?.shortSummary ?? t(locale, "noSourceSummary")}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/50">
                {t(locale, "noEvidence")}
              </div>
            )}
          </div>
        </KernelSection>

        <div className="mt-auto flex flex-col gap-3 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={() => onHighlight("influence")}
            className="border border-[var(--scan-cold)] bg-[var(--scan-cold-soft)] px-4 py-3 text-left font-pixel text-sm uppercase tracking-[0.2em] text-[var(--pixel-white)] transition hover:bg-[rgba(180,214,223,0.24)]"
          >
            TRACE PATH
          </button>
          <div className="grid grid-cols-3 gap-2">
            <MiniAction label="UP" onClick={() => onHighlight("upstream")} />
            <MiniAction label="DOWN" onClick={() => onHighlight("downstream")} />
            <MiniAction label="LINKS" onClick={() => onHighlight("strong")} />
          </div>
        </div>
      </aside>
    </div>
  );
}

function KernelSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 border border-white/10 bg-white/[0.02] px-4 py-4">
      <div className="font-pixel text-[11px] uppercase tracking-[0.28em] text-white/42">
        {title}
      </div>
      {children}
    </section>
  );
}

function GridInfo({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="grid gap-3">
      {items.map(([label, value]) => (
        <div key={`${label}-${value}`} className="grid gap-1">
          <div className="font-pixel text-[10px] uppercase tracking-[0.22em] text-white/36">
            {label}
          </div>
          <div className="text-sm leading-7 text-white/74">{value}</div>
        </div>
      ))}
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="border border-white/12 px-2 py-1 font-pixel text-[10px] uppercase tracking-[0.18em] text-white/58">
      {children}
    </span>
  );
}

function MiniAction({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border border-white/10 px-3 py-2 font-pixel text-[10px] uppercase tracking-[0.2em] text-white/58 transition hover:border-white/18 hover:text-white"
    >
      {label}
    </button>
  );
}
