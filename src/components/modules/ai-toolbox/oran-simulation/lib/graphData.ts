import {
  baseEdges,
  baseNodes,
  tailGroups,
} from "./graphMockData";

export type GraphLayer = "source" | "fact" | "mechanism" | "outcome";
export type GraphViewMode =
  | "global"
  | "source"
  | "user"
  | "platform"
  | "risk"
  | "result_path";
export type GraphFilterType =
  | "source"
  | "brand"
  | "product"
  | "user"
  | "platform"
  | "selling_point"
  | "mechanism"
  | "risk"
  | "result";
export type RelationType =
  | "contains"
  | "mentions"
  | "supports"
  | "belongs_to"
  | "targets"
  | "fits_platform"
  | "emphasizes"
  | "compares_with"
  | "triggers"
  | "conflicts_with"
  | "increases"
  | "reduces"
  | "leads_to";
export type HighlightMode = "upstream" | "downstream" | "influence" | "strong";

export interface SourceDetails {
  title: string;
  sourceType: string;
  shortSummary: string;
  reliability: number;
  excerpt: string;
}

export interface FactDetails {
  category: string;
  relatedBrands?: string[];
  relatedPlatforms?: string[];
  relatedUsers?: string[];
}

export interface MechanismDetails {
  impactDirection: string;
}

export interface OutcomeDetails {
  currentTendency: string;
  riskHint: string;
}

export interface GraphNode {
  id: string;
  label: string;
  layer: GraphLayer;
  filterType: GraphFilterType;
  entityType: string;
  summary: string;
  x: number;
  y: number;
  size: number;
  weight: number;
  opacity: number;
  color: string;
  accent: string;
  isTail?: boolean;
  showLabel?: boolean;
  sourceDetails?: SourceDetails;
  factDetails?: FactDetails;
  mechanismDetails?: MechanismDetails;
  outcomeDetails?: OutcomeDetails;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationType: RelationType;
  weight: number;
  confidence: number;
  summary: string;
}

export interface GraphHighlight {
  mode: HighlightMode;
  title: string;
  nodeIds: string[];
  edgeIds: string[];
}

export interface EvidenceReference {
  sourceId: string;
  score: number;
}

export interface GraphDataset {
  graphName: string;
  dataStatus: string;
  targetMarket: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  nodeMap: Map<string, GraphNode>;
  edgeMap: Map<string, GraphEdge>;
  outgoing: Map<string, GraphEdge[]>;
  incoming: Map<string, GraphEdge[]>;
  undirected: Map<string, GraphEdge[]>;
  defaultVisibleNodeIds: Set<string>;
}

export interface TailNodeGroup {
  prefix: string;
  count: number;
  layer: GraphLayer;
  filterType: GraphFilterType;
  entityType: string;
  anchors: string[];
  relationType: RelationType;
  secondaryTargets: string[];
  summaryPrefix: string;
}

export const graphRelationTypes: RelationType[] = [
  "contains",
  "mentions",
  "supports",
  "belongs_to",
  "targets",
  "fits_platform",
  "emphasizes",
  "compares_with",
  "triggers",
  "conflicts_with",
  "increases",
  "reduces",
  "leads_to",
];

export const layerLabels: Record<GraphLayer, string> = {
  source: "Source Layer",
  fact: "Fact Layer",
  mechanism: "Mechanism Layer",
  outcome: "Outcome Layer",
};

export const filterLabels: Record<GraphFilterType, string> = {
  source: "Source",
  brand: "Brand",
  product: "Product",
  user: "User",
  platform: "Platform",
  selling_point: "Selling Point",
  mechanism: "Mechanism",
  risk: "Risk",
  result: "Result",
};

export const viewLabels: Record<GraphViewMode, string> = {
  global: "Global View",
  source: "Source View",
  user: "User View",
  platform: "Platform View",
  risk: "Risk View",
  result_path: "Result Path View",
};

export const relationLabels: Record<RelationType, string> = {
  contains: "contains",
  mentions: "mentions",
  supports: "supports",
  belongs_to: "belongs to",
  targets: "targets",
  fits_platform: "fits platform",
  emphasizes: "emphasizes",
  compares_with: "compares with",
  triggers: "triggers",
  conflicts_with: "conflicts with",
  increases: "increases",
  reduces: "reduces",
  leads_to: "leads to",
};

function buildAdjacency(edges: GraphEdge[]) {
  const outgoing = new Map<string, GraphEdge[]>();
  const incoming = new Map<string, GraphEdge[]>();
  const undirected = new Map<string, GraphEdge[]>();

  edges.forEach((edge) => {
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge]);
    incoming.set(edge.target, [...(incoming.get(edge.target) ?? []), edge]);
    undirected.set(edge.source, [...(undirected.get(edge.source) ?? []), edge]);
    undirected.set(edge.target, [...(undirected.get(edge.target) ?? []), edge]);
  });

  return { outgoing, incoming, undirected };
}

function createTailGraph(base: GraphNode[]) {
  const anchorMap = new Map(base.map((node) => [node.id, node]));
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  tailGroups.forEach((group) => {
    for (let index = 0; index < group.count; index += 1) {
      const anchorId = group.anchors[index % group.anchors.length];
      const anchor = anchorMap.get(anchorId);
      if (!anchor) {
        continue;
      }

      const label = `${group.prefix}_${String(index + 1).padStart(2, "0")}`;
      const radius = 68 + (index % 4) * 16;
      const angle = (Math.PI / 6) * index + (group.layer === "source" ? Math.PI : 0.3);
      const x = anchor.x + Math.cos(angle) * radius;
      const y = anchor.y + Math.sin(angle) * radius;
      const secondaryTarget =
        group.secondaryTargets[index % group.secondaryTargets.length];

      nodes.push({
        id: label,
        label,
        layer: group.layer,
        filterType: group.filterType,
        entityType: group.entityType,
        summary: `${group.summaryPrefix} ${label} preserves low-confidence evidence rather than a confirmed conclusion.`,
        x,
        y,
        size: group.layer === "source" ? 8 : 9,
        weight: 0.28 + (index % 3) * 0.04,
        opacity: 0.28,
        color: group.layer === "source" ? "#3466ff" : "#22c55e",
        accent: group.layer === "source" ? "#88aaff" : "#7ee6a8",
        isTail: true,
      });

      edges.push({
        id: `edge_${label}_anchor`,
        source: anchorId,
        target: label,
        relationType: group.relationType,
        weight: 0.28 + (index % 4) * 0.04,
        confidence: 0.42 + (index % 3) * 0.05,
        summary: `${label} is stored as a weak signal under ${anchor.label}.`,
      });

      edges.push({
        id: `edge_${label}_target`,
        source: label,
        target: secondaryTarget,
        relationType: group.layer === "source" ? "mentions" : "supports",
        weight: 0.24 + (index % 3) * 0.05,
        confidence: 0.36 + (index % 4) * 0.05,
        summary: `${label} lightly reinforces ${secondaryTarget}.`,
      });
    }
  });

  return { nodes, edges };
}

function buildDefaultVisibleNodeIds(nodes: GraphNode[]) {
  return new Set(
    nodes
      .filter(
        (node) =>
          node.showLabel ||
          node.id === "brand_headease" ||
          node.id === "product_scalp_repair_serum" ||
          node.filterType === "mechanism" ||
          node.filterType === "result" ||
          (node.filterType === "user" && !node.isTail) ||
          (node.filterType === "platform" && !node.isTail) ||
          (node.filterType === "selling_point" &&
            !node.isTail &&
            node.entityType === "selling_point"),
      )
      .map((node) => node.id),
  );
}

function buildGraphDataset(): GraphDataset {
  const tailGraph = createTailGraph(baseNodes);
  const nodes = [...baseNodes, ...tailGraph.nodes];
  const edges = [...baseEdges, ...tailGraph.edges];
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const edgeMap = new Map(edges.map((edge) => [edge.id, edge]));
  const adjacency = buildAdjacency(edges);

  return {
    graphName: "HeadEase Scalp Repair Simulation Graph",
    dataStatus: "Mock Graph / Simulation Ready",
    targetMarket: "United States",
    nodes,
    edges,
    nodeMap,
    edgeMap,
    outgoing: adjacency.outgoing,
    incoming: adjacency.incoming,
    undirected: adjacency.undirected,
    defaultVisibleNodeIds: buildDefaultVisibleNodeIds(nodes),
  };
}

export const graphDataset = buildGraphDataset();

export function getEdgeScore(edge: GraphEdge) {
  return edge.weight * edge.confidence;
}

export function getConnectedEdges(nodeId: string) {
  return graphDataset.undirected.get(nodeId) ?? [];
}

export function getConnectedNodeIds(nodeId: string) {
  const connected = new Set<string>();
  getConnectedEdges(nodeId).forEach((edge) => {
    connected.add(edge.source === nodeId ? edge.target : edge.source);
  });
  return [...connected];
}

export function getTopConnectedNodeIds(nodeId: string, limit = 3) {
  return [...getConnectedEdges(nodeId)]
    .sort((left, right) => getEdgeScore(right) - getEdgeScore(left))
    .slice(0, limit)
    .map((edge) => (edge.source === nodeId ? edge.target : edge.source));
}

function getPathEdgeIds(nodeIds: string[]) {
  const edgeIds: string[] = [];
  for (let index = 0; index < nodeIds.length - 1; index += 1) {
    const edge = graphDataset.edges.find(
      (candidate) =>
        candidate.source === nodeIds[index] &&
        candidate.target === nodeIds[index + 1],
    );
    if (edge) {
      edgeIds.push(edge.id);
    }
  }
  return edgeIds;
}

function findBestPath(
  startId: string,
  direction: "upstream" | "downstream",
  depthLimit = 6,
) {
  const targetLayer = direction === "upstream" ? "source" : "outcome";

  function search(
    nodeId: string,
    visited: Set<string>,
    depth: number,
  ): { nodeIds: string[]; score: number } | null {
    const node = graphDataset.nodeMap.get(nodeId);
    if (!node) {
      return null;
    }
    if (depth > 0 && node.layer === targetLayer) {
      return { nodeIds: [nodeId], score: 1 };
    }
    if (depth >= depthLimit) {
      return null;
    }

    const edges =
      direction === "upstream"
        ? graphDataset.incoming.get(nodeId) ?? []
        : graphDataset.outgoing.get(nodeId) ?? [];

    let best: { nodeIds: string[]; score: number } | null = null;

    edges.forEach((edge) => {
      const nextId = direction === "upstream" ? edge.source : edge.target;
      if (visited.has(nextId)) {
        return;
      }

      const branch = search(nextId, new Set([...visited, nextId]), depth + 1);
      if (!branch) {
        return;
      }

      const candidate = {
        nodeIds:
          direction === "upstream"
            ? [...branch.nodeIds, nodeId]
            : [nodeId, ...branch.nodeIds],
        score: branch.score * getEdgeScore(edge),
      };

      if (!best || candidate.score > best.score) {
        best = candidate;
      }
    });

    return best;
  }

  return search(startId, new Set([startId]), 0);
}

export function getPrimaryPaths(nodeId: string) {
  const upstream = findBestPath(nodeId, "upstream");
  const downstream = findBestPath(nodeId, "downstream");
  const paths: string[][] = [];

  if (upstream && upstream.nodeIds.length > 1) {
    paths.push(upstream.nodeIds);
  }
  if (downstream && downstream.nodeIds.length > 1) {
    paths.push(downstream.nodeIds);
  }

  return paths.slice(0, 2);
}

export function getEvidenceSources(nodeId: string, limit = 2): EvidenceReference[] {
  const collected = new Map<string, number>();

  function walk(currentId: string, score: number, depth: number, visited: Set<string>) {
    if (depth > 5) {
      return;
    }
    const node = graphDataset.nodeMap.get(currentId);
    if (!node) {
      return;
    }
    if (node.layer === "source" && currentId !== nodeId) {
      collected.set(currentId, Math.max(collected.get(currentId) ?? 0, score));
      return;
    }

    (graphDataset.incoming.get(currentId) ?? []).forEach((edge) => {
      if (visited.has(edge.source)) {
        return;
      }
      walk(
        edge.source,
        score * getEdgeScore(edge),
        depth + 1,
        new Set([...visited, edge.source]),
      );
    });
  }

  walk(nodeId, 1, 0, new Set([nodeId]));

  return [...collected.entries()]
    .map(([sourceId, score]) => ({ sourceId, score }))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

function expandFromSeeds(seedIds: string[], depthLimit: number) {
  const visible = new Set(seedIds);
  const queue = seedIds.map((id) => ({ id, depth: 0 }));

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || current.depth >= depthLimit) {
      continue;
    }

    (graphDataset.undirected.get(current.id) ?? []).forEach((edge) => {
      const nextId = edge.source === current.id ? edge.target : edge.source;
      if (visible.has(nextId)) {
        return;
      }
      visible.add(nextId);
      queue.push({ id: nextId, depth: current.depth + 1 });
    });
  }

  return visible;
}

export function getViewNodeIds(viewMode: GraphViewMode) {
  if (viewMode === "global") {
    return new Set(graphDataset.nodes.map((node) => node.id));
  }

  if (viewMode === "source") {
    return expandFromSeeds(
      graphDataset.nodes
        .filter((node) => node.layer === "source")
        .map((node) => node.id),
      2,
    );
  }

  if (viewMode === "user") {
    return expandFromSeeds(
      graphDataset.nodes
        .filter((node) => node.filterType === "user")
        .map((node) => node.id),
      3,
    );
  }

  if (viewMode === "platform") {
    return expandFromSeeds(
      graphDataset.nodes
        .filter((node) => node.filterType === "platform")
        .map((node) => node.id),
      3,
    );
  }

  if (viewMode === "risk") {
    return expandFromSeeds(
      graphDataset.nodes
        .filter((node) => node.filterType === "risk")
        .map((node) => node.id),
      3,
    );
  }

  return expandFromSeeds(
    graphDataset.nodes
      .filter(
        (node) =>
          node.layer === "mechanism" ||
          node.layer === "outcome" ||
          node.id === "brand_headease" ||
          node.id === "product_scalp_repair_serum",
      )
      .map((node) => node.id),
    3,
  );
}

export function buildNodeHighlight(nodeId: string, mode: HighlightMode): GraphHighlight {
  const node = graphDataset.nodeMap.get(nodeId);
  if (!node) {
    return { mode, title: "", nodeIds: [], edgeIds: [] };
  }

  if (mode === "strong") {
    return {
      mode,
      title: `${node.label} strong links`,
      nodeIds: [nodeId, ...getTopConnectedNodeIds(nodeId, 4)],
      edgeIds: [...getConnectedEdges(nodeId)]
        .sort((left, right) => getEdgeScore(right) - getEdgeScore(left))
        .slice(0, 4)
        .map((edge) => edge.id),
    };
  }

  if (mode === "upstream") {
    const upstream = findBestPath(nodeId, "upstream");
    const nodeIds = upstream?.nodeIds ?? [nodeId];
    return { mode, title: `${node.label} upstream path`, nodeIds, edgeIds: getPathEdgeIds(nodeIds) };
  }

  if (mode === "downstream") {
    const downstream = findBestPath(nodeId, "downstream");
    const nodeIds = downstream?.nodeIds ?? [nodeId];
    return { mode, title: `${node.label} downstream path`, nodeIds, edgeIds: getPathEdgeIds(nodeIds) };
  }

  const upstream = findBestPath(nodeId, "upstream");
  const downstream = findBestPath(nodeId, "downstream");
  const nodeIds = [
    ...(upstream?.nodeIds ?? [nodeId]),
    ...(downstream?.nodeIds ?? []).slice(1),
  ];

  return {
    mode,
    title: `${node.label} influence path`,
    nodeIds,
    edgeIds: getPathEdgeIds(nodeIds),
  };
}
