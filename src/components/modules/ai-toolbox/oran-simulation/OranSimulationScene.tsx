import { startTransition, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import GraphCanvas from "./components/GraphCanvas";
import GraphControls from "./components/GraphControls";
import DetailPanel from "./components/DetailPanel";
import StatusBar from "./components/StatusBar";
import {
  buildNodeHighlight,
  getConnectedNodeIds,
  getViewNodeIds,
  graphDataset,
  type GraphHighlight,
  type GraphFilterType,
  type GraphViewMode,
} from "./lib/graphData";
import { type Locale, t } from "./lib/graphI18n";

const allTypes: GraphFilterType[] = [
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

function buildLockHighlight(nodeId: string): GraphHighlight {
  const influence = buildNodeHighlight(nodeId, "influence");
  const upstream = buildNodeHighlight(nodeId, "upstream");
  const downstream = buildNodeHighlight(nodeId, "downstream");
  const strong = buildNodeHighlight(nodeId, "strong");

  return {
    mode: "influence",
    title: `${influence.title} / lock analysis`,
    nodeIds: [
      ...new Set([
        ...influence.nodeIds,
        ...upstream.nodeIds,
        ...downstream.nodeIds,
        ...strong.nodeIds,
      ]),
    ],
    edgeIds: [
      ...new Set([
        ...influence.edgeIds,
        ...upstream.edgeIds,
        ...downstream.edgeIds,
        ...strong.edgeIds,
      ]),
    ],
  };
}

const defaultHighlight = buildNodeHighlight("product_scalp_repair_serum", "influence");

export default function OranSimulationScene({
  locale,
  onBack,
}: {
  locale: Locale;
  onBack?: () => void;
}) {
  const [viewMode, setViewMode] = useState<GraphViewMode>("global");
  const [activeTypes, setActiveTypes] = useState<GraphFilterType[]>(allTypes);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<GraphHighlight | null>(defaultHighlight);

  const activeTypeSet = useMemo(() => new Set(activeTypes), [activeTypes]);
  const viewNodeIds = useMemo(() => getViewNodeIds(viewMode), [viewMode]);

  const selectedRelatedIds = useMemo(
    () => new Set(selectedNodeId ? [selectedNodeId, ...getConnectedNodeIds(selectedNodeId)] : []),
    [selectedNodeId],
  );

  const visibleNodeIds = useMemo(() => {
    const next = new Set<string>();

    graphDataset.nodes.forEach((node) => {
      const allowedByView = viewNodeIds.has(node.id);
      const forced = selectedRelatedIds.has(node.id) || Boolean(highlight?.nodeIds.includes(node.id));

      if ((allowedByView && activeTypeSet.has(node.filterType)) || forced) {
        next.add(node.id);
      }
    });

    return next;
  }, [activeTypeSet, highlight, selectedRelatedIds, viewNodeIds]);

  const visibleNodes = useMemo(
    () => graphDataset.nodes.filter((node) => visibleNodeIds.has(node.id)),
    [visibleNodeIds],
  );

  const visibleEdges = useMemo(
    () => graphDataset.edges.filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)),
    [visibleNodeIds],
  );

  const selectedNode = selectedNodeId ? graphDataset.nodeMap.get(selectedNodeId) ?? null : null;

  const activeNodeCount =
    highlight?.nodeIds.length ||
    (selectedNodeId ? selectedRelatedIds.size : visibleNodes.filter((node) => !node.isTail).length);

  function handleToggleType(type: GraphFilterType) {
    startTransition(() => {
      setActiveTypes((current) =>
        current.includes(type) ? current.filter((item) => item !== type) : [...current, type],
      );
    });
  }

  function handleSelectNode(nodeId: string | null) {
    startTransition(() => {
      setSelectedNodeId(nodeId);
      if (!nodeId) {
        setHighlight(defaultHighlight);
      } else {
        setHighlight(buildLockHighlight(nodeId));
      }
    });
  }

  function handleSearchSelect(nodeId: string) {
    startTransition(() => {
      setSelectedNodeId(nodeId);
      setFocusNodeId(nodeId);
      setHighlight(buildLockHighlight(nodeId));
    });
  }

  return (
    <div className="oran-simulation-root h-full min-h-0 overflow-hidden px-4 py-4 text-[var(--workbench-ink)]">
      <div className="flex h-full w-full flex-col gap-4">
        {onBack ? (
          <div className="flex items-center">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/60 text-black/58 transition-colors hover:text-black"
              aria-label="返回首页"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        <StatusBar
          graphName={t(locale, "graphName")}
          totalNodes={graphDataset.nodes.length}
          totalEdges={graphDataset.edges.length}
          activeNodeCount={activeNodeCount}
          viewMode={viewMode}
          dataStatus={t(locale, "dataStatus")}
          focusNode={selectedNode}
          locale={locale}
        />

        <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[272px_minmax(0,1fr)]">
          <GraphControls
            nodes={graphDataset.nodes}
            viewMode={viewMode}
            onViewModeChange={(nextView) => startTransition(() => setViewMode(nextView))}
            activeTypes={activeTypeSet}
            onToggleType={handleToggleType}
            onResetTypes={() => setActiveTypes(allTypes)}
            onSelectNode={handleSearchSelect}
            locale={locale}
          />

          <section className="kernel-shell open-frame flex min-h-0 flex-col gap-3 rounded-[32px] p-3 text-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-2 pb-3">
              <div>
                <div className="font-pixel text-[11px] uppercase tracking-[0.34em] text-white/42">
                  SYSTEM MODE
                </div>
                <div className="mt-1.5 font-display text-[21px] leading-none tracking-[0.08em] text-white">
                  TRACE WORKSPACE
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <KernelChip label="STATUS" value="SIMULATION READY" />
                <KernelChip label="ACTIVE GRAPH" value={String(visibleNodes.length)} />
                <KernelChip label="FOCUS" value={selectedNode ? selectedNode.label : "GLOBAL"} />
              </div>
            </div>

            <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1.22fr)_320px]">
              <div className="min-h-0">
                <GraphCanvas
                  nodes={visibleNodes}
                  edges={visibleEdges}
                  selectedNodeId={selectedNodeId}
                  focusNodeId={focusNodeId}
                  highlight={highlight}
                  onSelectNode={handleSelectNode}
                  locale={locale}
                />
              </div>

              <DetailPanel
                node={selectedNode}
                onHighlight={(mode) => {
                  if (!selectedNodeId) {
                    return;
                  }
                  setHighlight(buildNodeHighlight(selectedNodeId, mode));
                }}
                onClose={() => handleSelectNode(null)}
                locale={locale}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function KernelChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <div className="font-pixel text-[10px] uppercase tracking-[0.24em] text-white/38">
        {label}
      </div>
      <div className="mt-1.5 font-pixel text-sm uppercase tracking-[0.12em] text-white/84">
        {value}
      </div>
    </div>
  );
}
