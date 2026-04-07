import { startTransition, useEffect, useMemo, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import GraphCanvas from "./components/GraphCanvas";
import DetailPanel from "./components/DetailPanel";
import {
  buildNodeHighlight,
  getConnectedNodeIds,
  getViewNodeIds,
  graphDataset,
  type GraphHighlight,
} from "./lib/graphData";
import { t, type Locale } from "./lib/graphI18n";

const allTypes = [
  "source",
  "brand",
  "product",
  "user",
  "platform",
  "selling_point",
  "mechanism",
  "risk",
  "result",
] as const;

const LOADING_DURATION_MS = 2200;

const topMetricLabels: Record<
  Locale,
  {
    status: string;
    nodes: string;
    edges: string;
    focus: string;
    active: string;
    global: string;
  }
> = {
  zh: {
    status: "状态",
    nodes: "节点",
    edges: "边",
    focus: "聚焦",
    active: "激活",
    global: "全局",
  },
  en: {
    status: "STATUS",
    nodes: "NODES",
    edges: "EDGES",
    focus: "FOCUS",
    active: "ACTIVE",
    global: "GLOBAL",
  },
};

const sceneCopy: Record<
  Locale,
  {
    streamEyebrow: string;
    loadingTitle: string;
    loadingSubtitle: string;
    graphBlankTitle: string;
    graphBlankSubtitle: string;
    pendingFocus: string;
    readyStatus: string;
    loadingStatus: string;
    graphMode: string;
    cards: Array<{
      label: string;
      title: string;
      bullets: string[];
      source: string;
    }>;
  }
> = {
  zh: {
    streamEyebrow: "INPUTS",
    loadingTitle: "正在从附件中抽取信息...",
    loadingSubtitle: "解析品牌上下文、用户线索与营销动作，随后生成信息流和推演图谱。",
    graphBlankTitle: "图谱舞台待命中",
    graphBlankSubtitle: "附件内容读取完成后，这里会生成完整节点图谱。",
    pendingFocus: "PENDING",
    readyStatus: "READY",
    loadingStatus: "EXTRACTING",
    graphMode: "SYSTEM KERNEL",
    cards: [
      {
        label: "现实世界种子",
        title: "现实世界种子",
        bullets: ["品牌核心症状 / 认知度 / 知名度", "当前市场声量与竞品态势"],
        source: "来源: OranInsight 策略报告",
      },
      {
        label: "潜在触达用户画像",
        title: "潜在触达用户画像",
        bullets: ["按平台划分用户包", "年龄层级、兴趣偏好、行为模式"],
        source: "来源: OranInsight 策略报告",
      },
      {
        label: "营销活动策划",
        title: "营销活动策划",
        bullets: ["活动主题 / 发布时间 / 内容节奏", "卖点方向 / 达人组合 / 预算分配"],
        source: "来源: OranInsight 策略报告",
      },
    ],
  },
  en: {
    streamEyebrow: "INPUTS",
    loadingTitle: "Extracting information from attachments...",
    loadingSubtitle:
      "Parsing brand context, audience signals, and campaign actions before generating the stream and graph.",
    graphBlankTitle: "Graph stage on standby",
    graphBlankSubtitle: "The node graph will appear here after attachment parsing completes.",
    pendingFocus: "PENDING",
    readyStatus: "READY",
    loadingStatus: "EXTRACTING",
    graphMode: "SYSTEM KERNEL",
    cards: [
      {
        label: "Real-world seeds",
        title: "Real-world seeds",
        bullets: ["Core brand symptoms / awareness / recognition", "Current market voice and competitor pressure"],
        source: "Source: OranInsight strategy report",
      },
      {
        label: "Reachable audience profile",
        title: "Reachable audience profile",
        bullets: ["Audience packs by platform", "Age tiers, interests, and behavior patterns"],
        source: "Source: OranInsight strategy report",
      },
      {
        label: "Campaign plan",
        title: "Campaign plan",
        bullets: ["Campaign theme / launch timing / content cadence", "Message angles / creator mix / budget split"],
        source: "Source: OranInsight strategy report",
      },
    ],
  },
};

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
  attachmentNames = [],
  promptValue = "",
}: {
  locale: Locale;
  onBack?: () => void;
  attachmentNames?: string[];
  promptValue?: string;
}) {
  const [phase, setPhase] = useState<"loading" | "ready">("loading");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [detailPanelNodeId, setDetailPanelNodeId] = useState<string | null>(null);
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<GraphHighlight | null>(defaultHighlight);

  const copy = sceneCopy[locale];
  const metricLabels = topMetricLabels[locale];
  const activeTypeSet = useMemo(() => new Set(allTypes), []);
  const viewNodeIds = useMemo(() => getViewNodeIds("global"), []);
  const isReady = phase === "ready";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPhase("ready");
    }, LOADING_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, []);

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
  const detailPanelNode = detailPanelNodeId
    ? graphDataset.nodeMap.get(detailPanelNodeId) ?? null
    : null;
  const activeNodeCount =
    highlight?.nodeIds.length ||
    (selectedNodeId ? selectedRelatedIds.size : visibleNodes.filter((node) => !node.isTail).length);

  function handleSelectNode(nodeId: string | null) {
    startTransition(() => {
      setSelectedNodeId(nodeId);
      setDetailPanelNodeId(nodeId);
      setFocusNodeId(nodeId);

      if (!nodeId) {
        setHighlight(defaultHighlight);
      } else {
        setHighlight(buildLockHighlight(nodeId));
      }
    });
  }

  function handleCloseDetailPanel() {
    startTransition(() => {
      setDetailPanelNodeId(null);
    });
  }

  return (
    <div className="oran-simulation-root relative h-full min-h-0 overflow-hidden text-[var(--workbench-ink)]">
      <ResizablePanelGroup direction="horizontal" className="h-full w-full">
        <ResizablePanel defaultSize={50} minSize={28} className="min-w-0">
          <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-white px-8 py-8 text-[var(--workbench-ink)]">
            {isReady ? (
              <InfoStream
                cards={copy.cards}
                eyebrow={copy.streamEyebrow}
                onBack={onBack}
                attachmentNames={attachmentNames}
                promptValue={promptValue}
              />
            ) : (
              <LoadingStream
                copy={copy}
                onBack={onBack}
                attachmentNames={attachmentNames}
                promptValue={promptValue}
              />
            )}
          </section>
        </ResizablePanel>

        <ResizableHandle
          withHandle
          className="bg-transparent after:w-[3px] after:bg-black/8 hover:after:bg-orange-300/70"
        />

        <ResizablePanel defaultSize={50} minSize={30} className="min-w-0">
          <section className="kernel-shell open-frame relative h-full min-h-0 min-w-0 overflow-hidden rounded-none text-white">
            <div className="pointer-events-none absolute inset-x-6 top-5 z-20 flex flex-wrap items-start justify-between gap-x-6 gap-y-3 border-b border-black/12 bg-white/92 pb-3 pt-1 text-black shadow-[0_1px_0_rgba(0,0,0,0.05)]">
              <div className="font-pixel text-[11px] uppercase tracking-[0.3em] text-black/44">
                ORAN SIM / GRAPH STAGE
              </div>
              <div className="font-pixel text-[11px] uppercase tracking-[0.24em] text-black/48">
                {locale === "zh" ? "系统内核" : copy.graphMode}
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.22em] text-black/78">
                <InlineMetric
                  label={metricLabels.status}
                  value={isReady ? copy.readyStatus : copy.loadingStatus}
                />
                <InlineMetric
                  label={metricLabels.nodes}
                  value={isReady ? String(visibleNodes.length) : "--"}
                />
                <InlineMetric
                  label={metricLabels.edges}
                  value={isReady ? String(visibleEdges.length) : "--"}
                />
                <InlineMetric
                  label={metricLabels.focus}
                  value={
                    isReady
                      ? selectedNode
                        ? selectedNode.label
                        : metricLabels.global
                      : copy.pendingFocus
                  }
                />
                <InlineMetric
                  label={metricLabels.active}
                  value={isReady ? String(activeNodeCount) : "--"}
                />
              </div>
            </div>

            {isReady ? (
              <GraphCanvas
                nodes={visibleNodes}
                edges={visibleEdges}
                selectedNodeId={selectedNodeId}
                focusNodeId={focusNodeId}
                horizontalOffset={detailPanelNode ? 400 : 0}
                highlight={highlight}
                onSelectNode={handleSelectNode}
                locale={locale}
                showHeader={false}
              />
            ) : (
              <BlankGraphStage title={copy.graphBlankTitle} subtitle={copy.graphBlankSubtitle} />
            )}

            {isReady && detailPanelNode ? (
              <div
                className="absolute inset-0 z-30 flex items-center justify-center bg-black/32 p-5"
                onClick={handleCloseDetailPanel}
              >
                <div className="w-fit max-w-[300px]" onClick={(event) => event.stopPropagation()}>
                  <DetailPanel
                    node={detailPanelNode}
                    onHighlight={(mode) => {
                      if (!selectedNodeId) {
                        return;
                      }
                      setHighlight(buildNodeHighlight(selectedNodeId, mode));
                    }}
                    locale={locale}
                  />
                </div>
              </div>
            ) : null}
          </section>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function LoadingStream({
  copy,
  onBack,
  attachmentNames,
  promptValue,
}: {
  copy: (typeof sceneCopy)[Locale];
  onBack?: () => void;
  attachmentNames?: string[];
  promptValue?: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-2 items-center justify-center text-[10px] leading-none text-black/62 transition-colors hover:text-black"
              aria-label="Back"
            >
              {"<"}
            </button>
          ) : null}
          <div className="font-pixel text-[20px] uppercase tracking-[0.28em] text-orange-500">
            {copy.streamEyebrow}
          </div>
        </div>
        <div className="max-w-[14ch] font-display text-[34px] leading-none tracking-[0.05em] text-black">
          {copy.loadingTitle}
        </div>
        <p className="max-w-xl text-sm leading-7 text-black/58">{copy.loadingSubtitle}</p>
      </div>

      <div className="mt-10 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-orange-400 animate-pulse" />
        <span className="h-2.5 w-2.5 rounded-full bg-orange-400/80 animate-pulse [animation-delay:180ms]" />
        <span className="h-2.5 w-2.5 rounded-full bg-orange-400/60 animate-pulse [animation-delay:360ms]" />
      </div>

      {attachmentNames && attachmentNames.length > 0 ? (
        <div className="mt-8 space-y-3 rounded-[24px] bg-black/[0.035] px-5 py-5">
          <div className="font-pixel text-[10px] uppercase tracking-[0.24em] text-black/32">ATTACHMENTS</div>
          <div className="flex flex-wrap gap-2">
            {attachmentNames.map((name) => (
              <span
                key={name}
                className="rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs text-black/58"
              >
                {name}
              </span>
            ))}
          </div>
          {promptValue ? <div className="text-sm leading-7 text-black/50">{promptValue}</div> : null}
        </div>
      ) : null}

      <div className="mt-8 grid gap-4">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="relative overflow-hidden rounded-[24px] bg-black/[0.035] px-5 py-5"
          >
            <div className="absolute inset-y-0 left-0 w-1 bg-orange-400/90" />
            <div className="space-y-3 pl-3">
              <div className="h-4 w-24 rounded-full bg-black/10 animate-pulse" />
              <div className="h-8 w-48 rounded-full bg-black/10 animate-pulse" />
              <div className="h-3 w-full rounded-full bg-black/10 animate-pulse" />
              <div className="h-3 w-4/5 rounded-full bg-black/10 animate-pulse" />
              <div className="h-3 w-2/3 rounded-full bg-black/10 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoStream({
  eyebrow,
  cards,
  onBack,
  attachmentNames,
  promptValue,
}: {
  eyebrow: string;
  cards: (typeof sceneCopy)[Locale]["cards"];
  onBack?: () => void;
  attachmentNames?: string[];
  promptValue?: string;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-2 items-center justify-center text-[15px] leading-none text-black/50 transition-colors hover:text-black"
            aria-label="Back"
          >
            {"<"}
          </button>
        ) : null}
        <div className="font-pixel text-[20px] uppercase tracking-[0.28em] text-orange-500">{eyebrow}</div>
      </div>
      <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-3">
        {attachmentNames && attachmentNames.length > 0 ? (
          <div className="mb-4 space-y-3 rounded-[24px] bg-black/[0.03] px-5 py-5">
            <div className="font-pixel text-[10px] uppercase tracking-[0.24em] text-black/28">ATTACHMENTS</div>
            <div className="flex flex-wrap gap-2">
              {attachmentNames.map((name) => (
                <span
                  key={name}
                  className="rounded-full border border-black/10 bg-white/85 px-3 py-1 text-xs text-black/58"
                >
                  {name}
                </span>
              ))}
            </div>
            {promptValue ? <div className="text-sm leading-7 text-black/48">{promptValue}</div> : null}
          </div>
        ) : null}
        <div className="grid gap-4">
          {cards.map((card, index) => (
            <article
              key={card.title}
              className="animate-panel relative overflow-hidden rounded-[0px] border border-black/10 bg-black/[0.015] px-1 py-4"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              
              <div className="flex items-start gap-4 pl-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500/12 font-pixel text-[20px] uppercase tracking-[0.18em] text-orange-500">
                  01
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-pixel text-[10px] uppercase tracking-[0.24em] text-black/20">
                    {card.label}
                  </div>
                  <div className="mt-2 text-[20px] font-normal leading-tight text-black/70">{card.title}</div>
                  <div className="mt-4 space-y-2 text-sm leading-7 text-black/50">
                    {card.bullets.map((bullet) => (
                      <div key={bullet}>- {bullet}</div>
                    ))}
                  </div>
                  <div className="mt-5 mr-5 text-right text-xs text-black/50">{card.source}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function BlankGraphStage({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden rounded-[32px]">
      <div className="scan-grid absolute inset-0 opacity-25" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/[0.05] to-transparent" />
      <div className="pointer-events-none animate-scan-line absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/[0.08] via-white/[0.02] to-transparent" />
      <div className="relative z-10 max-w-md text-center">
        <div className="font-pixel text-[12px] uppercase tracking-[0.28em] text-white/42">GRAPH</div>
        <div className="mt-4 font-display text-[34px] leading-none tracking-[0.08em] text-white/84">{title}</div>
        <p className="mt-4 text-sm leading-7 text-white/50">{subtitle}</p>
      </div>
    </div>
  );
}

function InlineMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-black/38">{label}</span>
      <span className="text-black">{value}</span>
    </div>
  );
}
