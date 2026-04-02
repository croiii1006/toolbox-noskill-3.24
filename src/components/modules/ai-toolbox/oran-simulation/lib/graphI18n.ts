import type {
  GraphFilterType,
  GraphHighlight,
  GraphLayer,
  GraphViewMode,
} from "./graphData";

export type Locale = "zh" | "en";

const messages = {
  zh: {
    brand: "ORAN Sim",
    graphName: "HeadEase 头皮修护精华营销推演图谱",
    dataStatus: "模拟图谱 / 可进入推演",
    controlsEyebrow: "ORAN 控制台",
    controlsTitle: "图谱筛选器",
    controlsDesc:
      "搜索实体、切换视图，并筛出本次模拟推演所使用的知识切片。",
    searchNode: "搜索节点",
    searchPlaceholder: "搜索 HeadEase、TikTok、Trust Formation...",
    viewMode: "视图模式",
    nodeTypes: "节点类型",
    reset: "重置",
    readingHint: "阅读提示",
    readingHintDesc:
      "从左到右表示证据到结果。节点越大代表锚点越强，外围淡化节点代表可追溯但权重更低的长尾信号。",
    nodeDetail: "节点详情",
    selectNode: "选择一个节点",
    emptyDetailDesc:
      "点击任意关键来源、事实、机制或结果节点，查看摘要、证据链、强关联节点和模拟路径。",
    emptyDetailHint:
      "悬停会显示一跳关系；点击后会锁定节点、聚焦子图，并开放上下游路径高亮。",
    close: "关闭",
    basicInfo: "基本信息",
    nodeName: "节点名称",
    nodeType: "节点类型",
    layer: "所属层级",
    nodeId: "节点 ID",
    nodeSummary: "节点摘要",
    keyAttributes: "关键属性",
    sourceType: "来源类型",
    sourceSummary: "来源摘要",
    excerpt: "摘录",
    reliability: "可靠度",
    category: "所属类别",
    relatedContext: "相关上下文",
    topConnections: "最强关联",
    impactDirection: "影响方向",
    triggeredBy: "由谁触发",
    impacts: "影响结果",
    currentTendency: "当前模拟倾向",
    upstreamDrivers: "上游关键驱动",
    riskHint: "风险提示",
    linkedPaths: "关联路径",
    noPath: "当前节点暂未生成多跳主路径。",
    evidenceBasis: "来源依据",
    sourceSelf: "该节点本身就是一个一级证据来源。",
    noSourceSummary: "暂无来源摘要",
    noEvidence: "当前节点尚未解析出上游来源依据。",
    none: "无",
    nodes: "节点数",
    edges: "边数",
    active: "激活节点",
    idle: "空闲",
    canvasTitle: "交互知识图谱舞台",
    canvasDefaultScan: "全局图谱扫描中",
    laneSource: "第一层 来源",
    laneFact: "第二层 事实",
    laneMechanism: "第三层 机制",
    laneOutcome: "第四层 结果",
    language: "语言",
    chinese: "中文",
    english: "English",
  },
  en: {
    brand: "ORAN Sim",
    graphName: "HeadEase Scalp Repair Simulation Graph",
    dataStatus: "Mock Graph / Simulation Ready",
    controlsEyebrow: "ORAN Controls",
    controlsTitle: "Simulation Filters",
    controlsDesc:
      "Search entities, switch graph views, and isolate the knowledge slice used for simulation reasoning.",
    searchNode: "Search Node",
    searchPlaceholder: "Search HeadEase, TikTok, Trust Formation...",
    viewMode: "View Mode",
    nodeTypes: "Node Types",
    reset: "Reset",
    readingHint: "Reading Hint",
    readingHintDesc:
      "Left to right means evidence to outcome. Bigger nodes are stronger anchors, and faint tails represent weaker but traceable signals.",
    nodeDetail: "Node Detail",
    selectNode: "Select a node",
    emptyDetailDesc:
      "Click any key source, fact, mechanism, or outcome node to inspect its summary, evidence chain, strongest links, and simulation path.",
    emptyDetailHint:
      "Hover shows one-hop context. Click locks the node, centers the subgraph, and unlocks upstream or downstream highlighting.",
    close: "Close",
    basicInfo: "Basic Info",
    nodeName: "Node Name",
    nodeType: "Node Type",
    layer: "Layer",
    nodeId: "Node ID",
    nodeSummary: "Node Summary",
    keyAttributes: "Key Attributes",
    sourceType: "Source Type",
    sourceSummary: "Source Summary",
    excerpt: "Excerpt",
    reliability: "Reliability",
    category: "Category",
    relatedContext: "Related Context",
    topConnections: "Top Connections",
    impactDirection: "Impact Direction",
    triggeredBy: "Triggered By",
    impacts: "Impacts",
    currentTendency: "Current Tendency",
    upstreamDrivers: "Upstream Drivers",
    riskHint: "Risk Hint",
    linkedPaths: "Linked Paths",
    noPath: "No multi-hop path stored for this node yet.",
    evidenceBasis: "Evidence Basis",
    sourceSelf: "This node is itself a primary evidence source.",
    noSourceSummary: "No source summary",
    noEvidence: "No upstream source was resolved for this node.",
    none: "None",
    nodes: "Nodes",
    edges: "Edges",
    active: "Active",
    idle: "Idle",
    canvasTitle: "Interactive Knowledge Stage",
    canvasDefaultScan: "Global graph scan",
    laneSource: "Layer 1  Source",
    laneFact: "Layer 2  Fact",
    laneMechanism: "Layer 3  Mechanism",
    laneOutcome: "Layer 4  Outcome",
    language: "Language",
    chinese: "中文",
    english: "English",
  },
} as const;

const filterLabelMap: Record<Locale, Record<GraphFilterType, string>> = {
  zh: {
    source: "来源",
    brand: "品牌",
    product: "产品",
    user: "用户",
    platform: "平台",
    selling_point: "卖点",
    mechanism: "机制",
    risk: "风险",
    result: "结果",
  },
  en: {
    source: "Source",
    brand: "Brand",
    product: "Product",
    user: "User",
    platform: "Platform",
    selling_point: "Selling Point",
    mechanism: "Mechanism",
    risk: "Risk",
    result: "Result",
  },
};

const viewLabelMap: Record<Locale, Record<GraphViewMode, string>> = {
  zh: {
    global: "全局视图",
    source: "来源视图",
    user: "用户视图",
    platform: "平台视图",
    risk: "风险视图",
    result_path: "结果路径视图",
  },
  en: {
    global: "Global View",
    source: "Source View",
    user: "User View",
    platform: "Platform View",
    risk: "Risk View",
    result_path: "Result Path View",
  },
};

const layerLabelMap: Record<Locale, Record<GraphLayer, string>> = {
  zh: {
    source: "来源层",
    fact: "事实层",
    mechanism: "机制层",
    outcome: "结果层",
  },
  en: {
    source: "Source Layer",
    fact: "Fact Layer",
    mechanism: "Mechanism Layer",
    outcome: "Outcome Layer",
  },
};

export function t(locale: Locale, key: keyof (typeof messages)["zh"]) {
  return messages[locale][key];
}

export function getFilterLabel(locale: Locale, filterType: GraphFilterType) {
  return filterLabelMap[locale][filterType];
}

export function getViewLabel(locale: Locale, viewMode: GraphViewMode) {
  return viewLabelMap[locale][viewMode];
}

export function getLayerLabel(locale: Locale, layer: GraphLayer) {
  return layerLabelMap[locale][layer];
}

export function localizeHighlightTitle(locale: Locale, highlight: GraphHighlight | null) {
  if (!highlight) {
    return t(locale, "canvasDefaultScan");
  }

  if (locale === "en") {
    return highlight.title;
  }

  return highlight.title
    .replace(" strong links", " 强关联")
    .replace(" upstream path", " 上游路径")
    .replace(" downstream path", " 下游路径")
    .replace(" influence path", " 影响路径");
}
