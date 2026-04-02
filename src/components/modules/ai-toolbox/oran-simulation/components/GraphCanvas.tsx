import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import type { GraphEdge, GraphHighlight, GraphNode } from "../lib/graphData";
import { type Locale, localizeHighlightTitle, t } from "../lib/graphI18n";

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string | null;
  focusNodeId: string | null;
  highlight: GraphHighlight | null;
  onSelectNode: (nodeId: string | null) => void;
  locale: Locale;
  showHeader?: boolean;
}

type TransformState = {
  x: number;
  y: number;
  scale: number;
};

type InteractionState =
  | {
      type: "pan";
      pointerId: number;
      startX: number;
      startY: number;
      originX: number;
      originY: number;
      moved: boolean;
    }
  | null;

type PointerState = {
  clientX: number;
  clientY: number;
  inside: boolean;
};

const WORLD_WIDTH = 1640;
const WORLD_HEIGHT = 980;
const LAYOUT_SPREAD_X = 1.1;
const LAYOUT_SPREAD_Y = 1.08;
const EXPANDED_WORLD_WIDTH = WORLD_WIDTH * LAYOUT_SPREAD_X;
const EXPANDED_WORLD_HEIGHT = WORLD_HEIGHT * LAYOUT_SPREAD_Y;
const CLICK_MOVE_THRESHOLD = 11;
const FOCUS_DURATION_MS = 420;
const PAN_DRAG_DAMPING = 0.92;
const PIXEL_SIZE_SCALE = 0.84;
const NODE_SIZE_CURVE = {
  minInput: 15,
  maxInput: 30,
  minScaled: 15.2,
  maxScaled: 21.8,
  exponent: 0.78,
} as const;
const TAIL_RENDER_SPAN = 4.8;
const HOVER_RADIUS = {
  base: 22,
  tail: 20,
  focusBonus: 8,
} as const;
const NODE_OPACITY = {
  dimmedByHighlight: 0.22,
  selectedConnected: 0.94,
  selectedUnrelated: 0.36,
  tailFloor: 0.3,
  nodeFloor: 0.52,
  selectedBoost: 1.18,
  hoveredBoost: 1.1,
} as const;
const EDGE_STYLE = {
  default: {
    baseOpacity: 0.2,
    weightOpacity: 0.2,
    highlightMinOpacity: 0.44,
    highlightBase: 0.3,
    highlightWeight: 0.2,
    widthBase: 0.6,
    widthWeight: 0.82,
    highlightWidthBase: 1.48,
    highlightWidthWeight: 0.44,
    stroke: "rgba(255,255,255,0.38)",
  },
  hover: {
    directMinOpacity: 0.76,
    directBase: 0.5,
    directWeight: 0.26,
    highlightMinOpacity: 0.42,
    highlightBase: 0.28,
    highlightWeight: 0.18,
    unrelatedFade: 0.5,
    stroke: "rgba(245,247,248,0.72)",
    widthBase: 1.24,
    widthWeight: 0.38,
  },
  selected: {
    directMinOpacity: 0.76,
    directBase: 0.58,
    directWeight: 0.32,
    highlightMinOpacity: 0.56,
    highlightBase: 0.38,
    highlightWeight: 0.22,
    unrelatedFade: 0.92,
    stroke: "rgba(180,214,223,0.88)",
    unrelatedStroke: "rgba(226, 232, 236, 0.81)",
    widthBase: 1.92,
    widthWeight: 0.72,
    unrelatedWidthBase: 0.92,
    unrelatedWidthWeight: 0.36,
  },
} as const;

const codeLines = [
  "scan.index(signal_batch_014)",
  "graph.trace(source -> fact -> mechanism -> outcome)",
  "if confidence > threshold: commit_edge()",
  "cluster.resolve(long_tail_signals)",
  "evidence.rank(reliability, relevance)",
  "search.neighbor(node_id, depth=1)",
  "world_model.update(memory_bank)",
  "path.score(weight * confidence)",
];

const indexLabels = ["IDX-014", "TRACE-29", "LINKMAP", "SIGNAL-88", "CLUSTER-A4"];

const migrationSeeds = [
  ["source_tiktok_comment_summary", "platform_tiktok"],
  ["source_user_interview_notes", "user_young_women_18_24"],
  ["brand_headease", "product_scalp_repair_serum"],
  ["product_scalp_repair_serum", "mechanism_benefit_clarity"],
  ["mechanism_native_platform_fit", "outcome_share_potential"],
  ["mechanism_trust_formation", "outcome_conversion_interest"],
] as const;

function toLayoutPosition(x: number, y: number) {
  return {
    x: x * LAYOUT_SPREAD_X,
    y: y * LAYOUT_SPREAD_Y,
  };
}

function getNodeRenderMetrics(size: number, isTail: boolean) {
  if (isTail) {
    return {
      scaledSize: TAIL_RENDER_SPAN,
      unit: 3.2,
      gap: 1,
      radius: 1,
      span: TAIL_RENDER_SPAN,
    };
  }

  const clamped = Math.min(NODE_SIZE_CURVE.maxInput, Math.max(NODE_SIZE_CURVE.minInput, size));
  const progress =
    (clamped - NODE_SIZE_CURVE.minInput) /
    (NODE_SIZE_CURVE.maxInput - NODE_SIZE_CURVE.minInput);
  const curvedProgress = Math.pow(progress, NODE_SIZE_CURVE.exponent);
  const curvedSize =
    NODE_SIZE_CURVE.minScaled +
    curvedProgress * (NODE_SIZE_CURVE.maxScaled - NODE_SIZE_CURVE.minScaled);
  const scaledSize = curvedSize * PIXEL_SIZE_SCALE;
  const unit = scaledSize > 17.5 ? 2.35 : scaledSize > 14.5 ? 2.1 : 1.9;
  const gap = scaledSize > 17 ? 0.92 : 0.82;
  const radius = Math.max(2, Math.floor(scaledSize / unit));
  const span = radius * (unit + gap) + unit / 2;

  return {
    scaledSize,
    unit,
    gap,
    radius,
    span,
  };
}

export default function GraphCanvas({
  nodes,
  edges,
  selectedNodeId,
  focusNodeId,
  highlight,
  onSelectNode,
  locale,
  showHeader = true,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const interactionRef = useRef<InteractionState>(null);
  const hoveredNodeRef = useRef<string | null>(null);
  const pointerDownNodeRef = useRef<string | null>(null);
  const pointerStateRef = useRef<PointerState>({
    clientX: 0,
    clientY: 0,
    inside: false,
  });
  const overlayFrameRef = useRef<number | null>(null);
  const focusFrameRef = useRef<number | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [transform, setTransform] = useState<TransformState>({
    x: 60,
    y: 40,
    scale: 0.72,
  });

  const transformRef = useRef(transform);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const nodesById = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes],
  );
  const nodesByIdRef = useRef(nodesById);

  const neighborMap = useMemo(() => {
    const next = new Map<string, Set<string>>();
    edges.forEach((edge) => {
      next.set(edge.source, new Set([...(next.get(edge.source) ?? []), edge.target]));
      next.set(edge.target, new Set([...(next.get(edge.target) ?? []), edge.source]));
    });
    return next;
  }, [edges]);

  const selectedNeighborhood = useMemo(() => {
    if (!selectedNodeId) {
      return new Set<string>();
    }
    return new Set([selectedNodeId, ...(neighborMap.get(selectedNodeId) ?? [])]);
  }, [selectedNodeId, neighborMap]);

  const highlightNodes = useMemo(() => new Set(highlight?.nodeIds ?? []), [highlight]);
  const highlightEdges = useMemo(() => new Set(highlight?.edgeIds ?? []), [highlight]);

  const orderedEdges = useMemo(() => {
    const background: GraphEdge[] = [];
    const activeHighlight: GraphEdge[] = [];
    const selectedRelated: GraphEdge[] = [];
    const hoverRelated: GraphEdge[] = [];

    edges.forEach((edge) => {
      const isHoverEdge =
        Boolean(hoveredNodeId) &&
        (edge.source === hoveredNodeId || edge.target === hoveredNodeId);
      const isSelectedEdge =
        Boolean(selectedNodeId) &&
        (edge.source === selectedNodeId || edge.target === selectedNodeId);
      const isHighlightEdge = highlightEdges.has(edge.id);

      if (isHoverEdge) {
        hoverRelated.push(edge);
        return;
      }

      if (isSelectedEdge) {
        selectedRelated.push(edge);
        return;
      }

      if (isHighlightEdge) {
        activeHighlight.push(edge);
        return;
      }

      background.push(edge);
    });

    return [...background, ...activeHighlight, ...selectedRelated, ...hoverRelated];
  }, [edges, highlightEdges, hoveredNodeId, selectedNodeId]);

  const hoveredEdges = useMemo(
    () =>
      hoveredNodeId
        ? edges.filter(
            (edge) => edge.source === hoveredNodeId || edge.target === hoveredNodeId,
          )
        : [],
    [edges, hoveredNodeId],
  );

  const animatedFlowEdges = useMemo(
    () =>
      edges.filter(
        (edge) =>
          edge.weight > 0.68 ||
          edge.confidence > 0.78 ||
          highlightEdges.has(edge.id),
      ),
    [edges, highlightEdges],
  );

  const migrationPairs = useMemo(
    () =>
      migrationSeeds
        .map(([sourceId, targetId]) => {
          const source = nodesById.get(sourceId);
          const target = nodesById.get(targetId);
          if (!source || !target) {
            return null;
          }
          return { source, target };
        })
        .filter((pair): pair is { source: GraphNode; target: GraphNode } => Boolean(pair)),
    [nodesById],
  );

  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
    nodesByIdRef.current = nodesById;
  }, [nodes, edges, nodesById]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;
    const scale =
      Math.min(width / EXPANDED_WORLD_WIDTH, height / EXPANDED_WORLD_HEIGHT) * 0.96;
    setTransform({
      scale,
      x: 28,
      y: (height - EXPANDED_WORLD_HEIGHT * scale) / 2,
    });
  }, []);

  useEffect(() => {
    if (!focusNodeId || !containerRef.current) {
      return;
    }

    const node = nodesById.get(focusNodeId);
    if (!node) {
      return;
    }

    if (focusFrameRef.current !== null) {
      cancelAnimationFrame(focusFrameRef.current);
    }

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const start = transformRef.current;
    const targetPoint = toLayoutPosition(node.x, node.y);
    const targetX = width / 2 - targetPoint.x * start.scale;
    const targetY = height / 2 - targetPoint.y * start.scale;
    const startTime = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - startTime) / FOCUS_DURATION_MS);
      const eased = 1 - Math.pow(1 - progress, 3);

      setTransform((current) => ({
        ...current,
        x: start.x + (targetX - start.x) * eased,
        y: start.y + (targetY - start.y) * eased,
      }));

      if (progress < 1) {
        focusFrameRef.current = requestAnimationFrame(step);
      } else {
        focusFrameRef.current = null;
      }
    };

    focusFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (focusFrameRef.current !== null) {
        cancelAnimationFrame(focusFrameRef.current);
        focusFrameRef.current = null;
      }
    };
  }, [focusNodeId, nodesById]);

  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) {
      return;
    }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(container.clientWidth * dpr));
      canvas.height = Math.max(1, Math.floor(container.clientHeight * dpr));
      canvas.style.width = `${container.clientWidth}px`;
      canvas.style.height = `${container.clientHeight}px`;
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    return () => {
      if (overlayFrameRef.current !== null) {
        cancelAnimationFrame(overlayFrameRef.current);
      }
      if (focusFrameRef.current !== null) {
        cancelAnimationFrame(focusFrameRef.current);
      }
    };
  }, []);

  function screenToWorld(clientX: number, clientY: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      return { x: 0, y: 0 };
    }

    const currentTransform = transformRef.current;
    return {
      x: (clientX - rect.left - currentTransform.x) / currentTransform.scale,
      y: (clientY - rect.top - currentTransform.y) / currentTransform.scale,
    };
  }

  function worldToScreen(worldX: number, worldY: number) {
    const currentTransform = transformRef.current;
    const position = toLayoutPosition(worldX, worldY);
    return {
      x: position.x * currentTransform.scale + currentTransform.x,
      y: position.y * currentTransform.scale + currentTransform.y,
    };
  }

  function findNearestNode(clientX: number, clientY: number) {
    const world = screenToWorld(clientX, clientY);
    let nearestNodeId: string | null = null;
    let nearestDistanceSq = Number.POSITIVE_INFINITY;
    const currentScale = transformRef.current.scale;

    nodesRef.current.forEach((node) => {
      const position = toLayoutPosition(node.x, node.y);
      const dx = position.x - world.x;
      const dy = position.y - world.y;
      const distanceSq = dx * dx + dy * dy;
      const metrics = getNodeRenderMetrics(node.size, Boolean(node.isTail));
      const threshold =
        Math.max(
          node.isTail ? HOVER_RADIUS.tail : HOVER_RADIUS.base,
          metrics.span + (node.isTail ? 6 : HOVER_RADIUS.focusBonus),
        ) / currentScale;
      const thresholdSq = threshold * threshold;

      if (distanceSq <= thresholdSq && distanceSq < nearestDistanceSq) {
        nearestDistanceSq = distanceSq;
        nearestNodeId = node.id;
      }
    });

    return { world, nearestNodeId };
  }

  function updateHoveredNode(nextHoveredNodeId: string | null) {
    if (hoveredNodeRef.current === nextHoveredNodeId) {
      return;
    }
    hoveredNodeRef.current = nextHoveredNodeId;
    setHoveredNodeId(nextHoveredNodeId);
  }

  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const drawParticle = (
      x: number,
      y: number,
      alpha: number,
      size = 2,
      color = "255,255,255",
    ) => {
      ctx.fillStyle = `rgba(${color},${alpha})`;
      ctx.fillRect(Math.round(x) - size / 2, Math.round(y) - size / 2, size, size);
    };

    const drawQuadraticPoint = (
      source: { x: number; y: number },
      target: { x: number; y: number },
      progress: number,
      bend: number,
    ) => {
      const control = {
        x: (source.x + target.x) / 2,
        y: (source.y + target.y) / 2 - bend,
      };
      const inv = 1 - progress;
      return {
        x:
          inv * inv * source.x +
          2 * inv * progress * control.x +
          progress * progress * target.x,
        y:
          inv * inv * source.y +
          2 * inv * progress * control.y +
          progress * progress * target.y,
      };
    };

    const renderOverlay = (timestamp: number) => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      const t = timestamp * 0.001;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      animatedFlowEdges.slice(0, 20).forEach((edge, index) => {
        const source = nodesByIdRef.current.get(edge.source);
        const target = nodesByIdRef.current.get(edge.target);
        if (!source || !target) {
          return;
        }

        const sourcePoint = worldToScreen(source.x, source.y);
        const targetPoint = worldToScreen(target.x, target.y);
        const progress = (t * (0.035 + edge.weight * 0.02) + index * 0.17) % 1;
        const bend = (targetPoint.y - sourcePoint.y) * 0.12;
        const point = drawQuadraticPoint(sourcePoint, targetPoint, progress, bend);
        const active =
          highlightEdges.has(edge.id) ||
          selectedNeighborhood.has(edge.source) ||
          selectedNeighborhood.has(edge.target);

        drawParticle(
          point.x,
          point.y,
          active ? 0.34 : 0.14,
          active ? 2.4 : 1.6,
          active ? "180,214,223" : "255,255,255",
        );
      });

      migrationPairs.forEach((pair, index) => {
        const sourcePoint = worldToScreen(pair.source.x, pair.source.y);
        const targetPoint = worldToScreen(pair.target.x, pair.target.y);
        const progress = (t * 0.016 + index * 0.23) % 1;
        const point = drawQuadraticPoint(
          sourcePoint,
          targetPoint,
          progress,
          20 + index * 4,
        );

        drawParticle(point.x, point.y, 0.12, 1.8, "180,214,223");
      });

      const pointerState = pointerStateRef.current;
      if (pointerState.inside) {
        const rect = container.getBoundingClientRect();
        const screenX = pointerState.clientX - rect.left;
        const screenY = pointerState.clientY - rect.top;
        const hovered = hoveredNodeRef.current
          ? nodesByIdRef.current.get(hoveredNodeRef.current) ?? null
          : null;

        if (hovered) {
          const position = worldToScreen(hovered.x, hovered.y);
          const metrics = getNodeRenderMetrics(hovered.size, Boolean(hovered.isTail));
          const bracketSize = Math.max(
            18,
            metrics.span * transformRef.current.scale + 10,
          );
          const corner = bracketSize * 0.32;
          const stroke = "rgba(245,247,248,0.88)";

          ctx.strokeStyle = stroke;
          ctx.lineWidth = 1;

          ctx.beginPath();
          ctx.moveTo(position.x - bracketSize, position.y - bracketSize + corner);
          ctx.lineTo(position.x - bracketSize, position.y - bracketSize);
          ctx.lineTo(position.x - bracketSize + corner, position.y - bracketSize);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(position.x + bracketSize - corner, position.y - bracketSize);
          ctx.lineTo(position.x + bracketSize, position.y - bracketSize);
          ctx.lineTo(position.x + bracketSize, position.y - bracketSize + corner);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(position.x - bracketSize, position.y + bracketSize - corner);
          ctx.lineTo(position.x - bracketSize, position.y + bracketSize);
          ctx.lineTo(position.x - bracketSize + corner, position.y + bracketSize);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(position.x + bracketSize - corner, position.y + bracketSize);
          ctx.lineTo(position.x + bracketSize, position.y + bracketSize);
          ctx.lineTo(position.x + bracketSize, position.y + bracketSize - corner);
          ctx.stroke();

          ctx.setLineDash([2, 4]);
          ctx.strokeStyle = "rgba(255,255,255,0.14)";
          ctx.beginPath();
          ctx.moveTo(position.x - bracketSize * 1.8, position.y);
          ctx.lineTo(position.x - bracketSize - 3, position.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(position.x + bracketSize + 3, position.y);
          ctx.lineTo(position.x + bracketSize * 1.8, position.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(position.x, position.y - bracketSize * 1.8);
          ctx.lineTo(position.x, position.y - bracketSize - 3);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(position.x, position.y + bracketSize + 3);
          ctx.lineTo(position.x, position.y + bracketSize * 1.8);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.font = "11px 'Pixelify Sans'";
          ctx.fillStyle = "rgba(180,214,223,0.96)";
          ctx.textAlign = "left";
          ctx.fillText(
            hovered.label,
            position.x + bracketSize + 6,
            position.y - bracketSize + 6,
          );

          ctx.font = "9px 'Space Mono'";
          ctx.fillStyle = "rgba(255,255,255,0.36)";
          ctx.fillText(
            `[${Math.round(hovered.x)},${Math.round(hovered.y)}]`,
            position.x + bracketSize + 6,
            position.y - bracketSize + 18,
          );
        }

        const world = screenToWorld(pointerState.clientX, pointerState.clientY);
        const cursorStroke = hovered ? "rgba(180,214,223,0.78)" : "rgba(255,255,255,0.2)";

        ctx.strokeStyle = cursorStroke;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(screenX - 16, screenY);
        ctx.lineTo(screenX - 5, screenY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(screenX + 5, screenY);
        ctx.lineTo(screenX + 16, screenY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(screenX, screenY - 16);
        ctx.lineTo(screenX, screenY - 5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(screenX, screenY + 5);
        ctx.lineTo(screenX, screenY + 16);
        ctx.stroke();

        ctx.strokeStyle = hovered ? "rgba(180,214,223,0.42)" : "rgba(255,255,255,0.1)";
        ctx.beginPath();
        ctx.moveTo(screenX - 10, screenY - 10);
        ctx.lineTo(screenX - 10, screenY - 6);
        ctx.lineTo(screenX - 6, screenY - 6);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(screenX + 10, screenY - 10);
        ctx.lineTo(screenX + 10, screenY - 6);
        ctx.lineTo(screenX + 6, screenY - 6);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(screenX - 10, screenY + 10);
        ctx.lineTo(screenX - 10, screenY + 6);
        ctx.lineTo(screenX - 6, screenY + 6);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(screenX + 10, screenY + 10);
        ctx.lineTo(screenX + 10, screenY + 6);
        ctx.lineTo(screenX + 6, screenY + 6);
        ctx.stroke();

        ctx.font = "9px 'Space Mono'";
        ctx.fillStyle = "rgba(255,255,255,0.32)";
        ctx.textAlign = "left";
        ctx.fillText(
          `[${Math.round(world.x / LAYOUT_SPREAD_X)},${Math.round(world.y / LAYOUT_SPREAD_Y)}]`,
          screenX + 18,
          screenY + 4,
        );
      }

      overlayFrameRef.current = requestAnimationFrame(renderOverlay);
    };

    overlayFrameRef.current = requestAnimationFrame(renderOverlay);
    return () => {
      if (overlayFrameRef.current !== null) {
        cancelAnimationFrame(overlayFrameRef.current);
      }
    };
  }, [animatedFlowEdges, highlightEdges, migrationPairs, selectedNeighborhood]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      pointerStateRef.current.clientX = event.clientX;
      pointerStateRef.current.clientY = event.clientY;
      pointerStateRef.current.inside = true;

      const { nearestNodeId } = findNearestNode(event.clientX, event.clientY);
      updateHoveredNode(nearestNodeId);

      const interaction = interactionRef.current;
      if (!interaction || interaction.type !== "pan") {
        return;
      }

      const dx = event.clientX - interaction.startX;
      const dy = event.clientY - interaction.startY;
      interaction.moved =
        interaction.moved ||
        Math.abs(dx) > CLICK_MOVE_THRESHOLD ||
        Math.abs(dy) > CLICK_MOVE_THRESHOLD;

      if (!interaction.moved) {
        return;
      }

      setTransform((current) => ({
        ...current,
        x: interaction.originX + dx * PAN_DRAG_DAMPING,
        y: interaction.originY + dy * PAN_DRAG_DAMPING,
      }));
    };

    const handlePointerLeave = () => {
      pointerStateRef.current.inside = false;
      updateHoveredNode(null);
    };

    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  function handleWheel(event: ReactWheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const cursorX = event.clientX - rect.left;
    const cursorY = event.clientY - rect.top;
    const delta = event.deltaY > 0 ? 0.93 : 1.07;

    setTransform((current) => {
      const nextScale = Math.min(2.15, Math.max(0.46, current.scale * delta));
      return {
        scale: nextScale,
        x: cursorX - ((cursorX - current.x) / current.scale) * nextScale,
        y: cursorY - ((cursorY - current.y) / current.scale) * nextScale,
      };
    });
  }

  function startPan(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();

    const { nearestNodeId } = findNearestNode(event.clientX, event.clientY);
    pointerDownNodeRef.current = nearestNodeId;
    updateHoveredNode(nearestNodeId);
    pointerStateRef.current.clientX = event.clientX;
    pointerStateRef.current.clientY = event.clientY;
    pointerStateRef.current.inside = true;

    event.currentTarget.setPointerCapture(event.pointerId);
    interactionRef.current = {
      type: "pan",
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: transformRef.current.x,
      originY: transformRef.current.y,
      moved: false,
    };
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const interaction = interactionRef.current;
    if (!interaction || interaction.type !== "pan") {
      return;
    }

    if (event.currentTarget.hasPointerCapture(interaction.pointerId)) {
      event.currentTarget.releasePointerCapture(interaction.pointerId);
    }

    const totalDx = event.clientX - interaction.startX;
    const totalDy = event.clientY - interaction.startY;
    const movedDistance = Math.sqrt(totalDx * totalDx + totalDy * totalDy);
    const treatedAsDrag = interaction.moved || movedDistance > CLICK_MOVE_THRESHOLD;

    if (!treatedAsDrag) {
      const { nearestNodeId } = findNearestNode(event.clientX, event.clientY);
      const nextNodeId =
        nearestNodeId ?? pointerDownNodeRef.current ?? hoveredNodeRef.current ?? null;
      onSelectNode(nextNodeId === selectedNodeId ? null : nextNodeId);
    }

    pointerDownNodeRef.current = null;
    interactionRef.current = null;
  }

  function handlePointerCancel(event: ReactPointerEvent<HTMLDivElement>) {
    const interaction = interactionRef.current;
    if (interaction && event.currentTarget.hasPointerCapture(interaction.pointerId)) {
      event.currentTarget.releasePointerCapture(interaction.pointerId);
    }

    pointerStateRef.current.inside = false;
    pointerDownNodeRef.current = null;
    interactionRef.current = null;
    updateHoveredNode(null);
  }

  const canvasHint =
    locale === "en"
      ? "Drag to pan. Scroll to zoom. Hover to inspect one-hop links. Click to lock analysis."
      : "拖拽平移，滚轮缩放；悬停查看一跳关系，点击进入锁定分析状态。";

  function edgePath(edge: GraphEdge) {
    const source = nodesById.get(edge.source);
    const target = nodesById.get(edge.target);
    if (!source || !target) {
      return "";
    }

    const sourcePoint = toLayoutPosition(source.x, source.y);
    const targetPoint = toLayoutPosition(target.x, target.y);
    const dx = targetPoint.x - sourcePoint.x;
    const controlX = sourcePoint.x + dx * 0.5;
    const controlY = sourcePoint.y + (targetPoint.y - sourcePoint.y) * 0.18;
    return `M ${sourcePoint.x} ${sourcePoint.y} Q ${controlX} ${controlY} ${targetPoint.x} ${targetPoint.y}`;
  }

  function nodeOpacity(node: GraphNode) {
    const inHighlight = highlightNodes.size === 0 || highlightNodes.has(node.id);
    const isHovered = hoveredNodeId === node.id;
    const isSelected = selectedNodeId === node.id;
    const connectedToSelected = selectedNodeId ? selectedNeighborhood.has(node.id) : false;

    let opacity = node.opacity;

    if (!inHighlight) {
      opacity *= NODE_OPACITY.dimmedByHighlight;
    }

    if (selectedNodeId) {
      if (isSelected) {
        return Math.min(1, opacity * NODE_OPACITY.selectedBoost);
      }
      if (connectedToSelected) {
        opacity *= NODE_OPACITY.selectedConnected;
      } else {
        opacity *= NODE_OPACITY.selectedUnrelated;
      }
    } else if (hoveredNodeId) {
      if (isHovered) {
        return Math.min(1, opacity * NODE_OPACITY.hoveredBoost);
      }
    }

    if (node.isTail) {
      return Math.max(NODE_OPACITY.tailFloor, opacity);
    }

    return Math.max(NODE_OPACITY.nodeFloor, opacity);
  }

  function edgeOpacity(edge: GraphEdge) {
    const isHoverEdge =
      Boolean(hoveredNodeId) &&
      (edge.source === hoveredNodeId || edge.target === hoveredNodeId);
    const isSelectedEdge =
      Boolean(selectedNodeId) &&
      (edge.source === selectedNodeId || edge.target === selectedNodeId);
    const isHighlightEdge = highlightEdges.has(edge.id);

    const opacity =
      EDGE_STYLE.default.baseOpacity + edge.weight * EDGE_STYLE.default.weightOpacity;

    if (selectedNodeId) {
      if (isSelectedEdge) {
        return Math.max(
          EDGE_STYLE.selected.directMinOpacity,
          EDGE_STYLE.selected.directBase + edge.weight * EDGE_STYLE.selected.directWeight,
        );
      }
      if (isHighlightEdge) {
        return Math.max(
          EDGE_STYLE.selected.highlightMinOpacity,
          EDGE_STYLE.selected.highlightBase +
            edge.weight * EDGE_STYLE.selected.highlightWeight,
        );
      }
      return opacity * EDGE_STYLE.selected.unrelatedFade;
    }

    if (hoveredNodeId) {
      if (isHoverEdge) {
        return Math.max(
          EDGE_STYLE.hover.directMinOpacity,
          EDGE_STYLE.hover.directBase + edge.weight * EDGE_STYLE.hover.directWeight,
        );
      }
      if (isHighlightEdge) {
        return Math.max(
          EDGE_STYLE.hover.highlightMinOpacity,
          EDGE_STYLE.hover.highlightBase + edge.weight * EDGE_STYLE.hover.highlightWeight,
        );
      }
      return opacity * EDGE_STYLE.hover.unrelatedFade;
    }

    if (isHighlightEdge) {
      return Math.max(
        EDGE_STYLE.default.highlightMinOpacity,
        EDGE_STYLE.default.highlightBase +
          edge.weight * EDGE_STYLE.default.highlightWeight,
      );
    }

    return opacity;
  }

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={startPan}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={() => {
        pointerStateRef.current.inside = false;
        pointerDownNodeRef.current = null;
        interactionRef.current = null;
        updateHoveredNode(null);
      }}
      className="kernel-shell open-frame relative h-full overflow-hidden rounded-none text-white cursor-none select-none"
    >
      <div className="scan-grid absolute inset-0 opacity-35" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/[0.05] to-transparent" />
      <div className="pointer-events-none animate-scan-line absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/[0.08] via-white/[0.02] to-transparent" />

      {showHeader ? (
        <div className="pointer-events-none absolute left-6 top-5 right-6 flex items-start justify-between">
          <div>
            <div className="font-pixel text-[11px] uppercase tracking-[0.34em] text-white/42">
              {t(locale, "canvasTitle")}
            </div>
            <div className="mt-2 font-display text-[26px] leading-none tracking-[0.08em] text-white">
              SYSTEM KERNEL
            </div>
          </div>
          <div className="font-pixel text-[11px] uppercase tracking-[0.2em] text-white/46">
            {localizeHighlightTitle(locale, highlight)}
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-y-20 left-6 w-40 space-y-2 text-[10px] text-white/[0.16]">
        {codeLines.slice(0, 4).map((line) => (
          <div key={line} className="font-code tracking-[0.08em]">
            {line}
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute bottom-16 right-8 space-y-2 text-right text-[10px] text-white/[0.16]">
        {indexLabels.map((label) => (
          <div key={label} className="font-pixel tracking-[0.22em]">
            {label}
          </div>
        ))}
      </div>

      <svg className="h-full w-full">
        <defs>
          <pattern id="kernel-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          </pattern>
        </defs>

        <rect x="0" y="0" width="100%" height="100%"  />

        <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`}>
          <LaneGuide x={toLayoutPosition(60, 0).x} label={t(locale, "laneSource")} />
          <LaneGuide x={toLayoutPosition(420, 0).x} label={t(locale, "laneFact")} />
          <LaneGuide x={toLayoutPosition(1125, 0).x} label={t(locale, "laneMechanism")} />
          <LaneGuide x={toLayoutPosition(1410, 0).x} label={t(locale, "laneOutcome")} />

          {orderedEdges.map((edge, index) => {
            const active = highlightEdges.has(edge.id);
            const hoverRelated =
              Boolean(hoveredNodeId) &&
              (edge.source === hoveredNodeId || edge.target === hoveredNodeId);
            const selectedRelated =
              Boolean(selectedNodeId) &&
              (edge.source === selectedNodeId || edge.target === selectedNodeId);
            const selectedBackground = Boolean(selectedNodeId) && !selectedRelated && !active;
            const stroke = selectedRelated
              ? EDGE_STYLE.selected.stroke
              : selectedBackground
                ? EDGE_STYLE.selected.unrelatedStroke
              : hoverRelated
                ? EDGE_STYLE.hover.stroke
                : active
                  ? EDGE_STYLE.selected.stroke
                  : EDGE_STYLE.default.stroke;
            const dash = edge.confidence < 0.55 ? "5 8" : "4 12";
            const edgeAnimation =
              selectedRelated
                ? `edge-breathe ${8.2 + edge.confidence * 1.6}s ease-in-out infinite, data-flow ${6.6 - edge.weight * 1.45}s linear infinite`
                : active || edge.weight > 0.7
                  ? `edge-breathe ${9 + edge.confidence * 2}s ease-in-out infinite, data-flow ${11 - edge.weight * 2.5}s linear infinite`
                : `edge-breathe ${10 + edge.weight * 2.5}s ease-in-out infinite`;

            return (
              <path
                key={edge.id}
                d={edgePath(edge)}
                fill="none"
                stroke={stroke}
                strokeWidth={
                  selectedRelated
                    ? EDGE_STYLE.selected.widthBase +
                      edge.weight * EDGE_STYLE.selected.widthWeight
                    : selectedBackground
                      ? EDGE_STYLE.selected.unrelatedWidthBase +
                        edge.weight * EDGE_STYLE.selected.unrelatedWidthWeight
                    : hoverRelated
                      ? EDGE_STYLE.hover.widthBase + edge.weight * EDGE_STYLE.hover.widthWeight
                      : active
                        ? EDGE_STYLE.default.highlightWidthBase +
                          edge.weight * EDGE_STYLE.default.highlightWidthWeight
                        : EDGE_STYLE.default.widthBase +
                          edge.weight * EDGE_STYLE.default.widthWeight
                }
                strokeOpacity={edgeOpacity(edge)}
                strokeDasharray={dash}
                style={{
                  animation: edgeAnimation,
                  animationDelay: `${(index % 9) * -0.6}s`,
                }}
              />
            );
          })}

          {hoveredEdges.map((edge) => (
            <g key={`hover-overlay-${edge.id}`}>
              <path
                d={edgePath(edge)}
                fill="none"
                stroke="rgba(180,214,223,0.1)"
                strokeWidth={3.4}
                strokeLinecap="round"
                strokeOpacity={0.5}
              />
              <path
                d={edgePath(edge)}
                fill="none"
                stroke="rgba(245,247,248,0.72)"
                strokeWidth={1.45}
                strokeLinecap="round"
                strokeOpacity={0.66}
                strokeDasharray={edge.confidence < 0.55 ? "5 8" : "4 12"}
              />
            </g>
          ))}

          {nodes.map((node, index) => {
            const selected = selectedNodeId === node.id;
            const hovered = hoveredNodeId === node.id;
            const highlighted = highlightNodes.has(node.id);
            const visibleLabel = node.showLabel || selected || highlighted || hovered;
            const metrics = getNodeRenderMetrics(node.size, Boolean(node.isTail));
            const ambientAnimation = node.isTail
              ? `ambient-tail ${10 + (index % 5)}s ease-in-out infinite`
              : `ambient-node ${6 + (index % 4) * 0.9}s ease-in-out infinite`;
            const emphasisAnimation =
              selected || highlighted
                ? ", pulse-slow 5.8s ease-in-out infinite"
                : hovered
                  ? ", pulse-slow 7.2s ease-in-out infinite"
                  : "";

            return (
              <g
                key={node.id}
                transform={`translate(${toLayoutPosition(node.x, node.y).x} ${toLayoutPosition(node.x, node.y).y})`}
              >
                <g
                  style={{
                    animation: ambientAnimation + emphasisAnimation,
                    animationDelay: `${((index % 7) - 3) * 0.7}s`,
                    transformBox: "fill-box",
                    transformOrigin: "center",
                  }}
                >
                  <PixelNode
                    size={node.size}
                    opacity={nodeOpacity(node)}
                    selected={selected}
                    hovered={hovered}
                    isTail={Boolean(node.isTail)}
                  />

                  {selected && <BracketFrame span={metrics.span} selected={selected} />}

                  {selected && (
                    <text
                      x={metrics.span + 18}
                      y={-metrics.span - 12}
                      className="font-code text-[10px] uppercase tracking-[0.18em] fill-[rgba(255,255,255,0.64)]"
                    >
                      [{Math.round(node.x)},{Math.round(node.y)}]
                    </text>
                  )}

                  {visibleLabel && (
                    <g transform={`translate(${metrics.span + 16} ${node.isTail ? -2 : -10})`}>
                      <text className="font-pixel text-[11px] uppercase tracking-[0.16em] fill-[rgba(255,255,255,0.82)]">
                        {node.label}
                      </text>
                    </g>
                  )}
                </g>
              </g>
            );
          })}
        </g>
      </svg>

      <canvas ref={overlayCanvasRef} className="pointer-events-none absolute inset-0 z-20" />

      <div className="pointer-events-none absolute bottom-5 left-6 border border-white/10 bg-white/[0.03] px-4 py-3 font-pixel text-[11px] uppercase tracking-[0.22em] text-white/52">
        {canvasHint}
      </div>
    </div>
  );
}

function PixelNode({
  size,
  opacity,
  selected,
  hovered,
  isTail,
}: {
  size: number;
  opacity: number;
  selected: boolean;
  hovered: boolean;
  isTail: boolean;
}) {
  const metrics = getNodeRenderMetrics(size, isTail);
  const { unit, gap, radius } = metrics;
  const pixels: Array<{ x: number; y: number; alpha: number }> = [];

  if (isTail) {
    return (
      <g>
        <rect
          x={-1.8}
          y={-1.8}
          width={3.6}
          height={3.6}
          fill={hovered ? "rgba(245,247,248,1)" : "rgba(248,249,250,0.96)"}
          fillOpacity={Math.max(0.5, opacity)}
        />
        <rect
          x={2.2}
          y={-1.05}
          width={1.7}
          height={1.7}
          fill="rgba(248,249,250,0.8)"
          fillOpacity={Math.max(0.28, opacity * 0.82)}
        />
        <rect
          x={-3.8}
          y={0.9}
          width={1.4}
          height={1.4}
          fill="rgba(248,249,250,0.74)"
          fillOpacity={Math.max(0.24, opacity * 0.68)}
        />
      </g>
    );
  }

  for (let gx = -radius; gx <= radius; gx += 1) {
    for (let gy = -radius; gy <= radius; gy += 1) {
      const dist = Math.sqrt(gx * gx + gy * gy);
      if (dist > radius + 0.2) {
        continue;
      }

      const alpha = dist < radius * 0.38 ? 1 : dist < radius * 0.72 ? 0.84 : 0.56;
      pixels.push({
        x: gx * (unit + gap),
        y: gy * (unit + gap),
        alpha,
      });
    }
  }

  return (
    <g>
      {selected ? (
        <rect
          x={-(radius + 3) * (unit + gap)}
          y={-(radius + 3) * (unit + gap)}
          width={(radius * 2 + 6) * (unit + gap)}
          height={(radius * 2 + 6) * (unit + gap)}
          fill="rgba(180,214,223,0.05)"
        />
      ) : null}
      {pixels.map((pixel, index) => (
        <rect
          key={`${pixel.x}-${pixel.y}-${index}`}
          x={pixel.x - unit / 2}
          y={pixel.y - unit / 2}
          width={unit}
          height={unit}
          fill={
            selected
              ? "rgba(248,249,250,1)"
              : hovered
                ? "rgba(245,247,248,0.98)"
                : "rgba(244,246,248,0.98)"
          }
          fillOpacity={opacity * pixel.alpha}
        />
      ))}
    </g>
  );
}

function BracketFrame({
  span,
  selected,
}: {
  span: number;
  selected: boolean;
}) {
  const offset = span + 10;
  const arm = 10;
  const stroke = selected ? "rgba(180,214,223,0.92)" : "rgba(255,255,255,0.78)";

  return (
    <g className="animate-bracket" stroke={stroke} strokeWidth="1.1" fill="none">
      <path d={`M ${-offset} ${-offset + arm} L ${-offset} ${-offset} L ${-offset + arm} ${-offset}`} />
      <path d={`M ${offset - arm} ${-offset} L ${offset} ${-offset} L ${offset} ${-offset + arm}`} />
      <path d={`M ${-offset} ${offset - arm} L ${-offset} ${offset} L ${-offset + arm} ${offset}`} />
      <path d={`M ${offset - arm} ${offset} L ${offset} ${offset} L ${offset} ${offset - arm}`} />
      <path d={`M ${-offset - 12} 0 L ${-offset - 2} 0`} opacity="0.45" />
      <path d={`M ${offset + 2} 0 L ${offset + 12} 0`} opacity="0.45" />
      <path d={`M 0 ${-offset - 12} L 0 ${-offset - 2}`} opacity="0.45" />
      <path d={`M 0 ${offset + 2} L 0 ${offset + 12}`} opacity="0.45" />
    </g>
  );
}

function LaneGuide({ x, label }: { x: number; label: string }) {
  return (
    <g>
      <path d={`M ${x} 88 L ${x} 900`} stroke="rgba(255,255,255,0.09)" strokeDasharray="4 12" />
      <path d={`M ${x + 250} 88 L ${x + 250} 900`} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 12" />
      <text
        x={x + 12}
        y={70}
        className="font-pixel text-[11px] uppercase tracking-[0.22em] fill-[rgba(255,255,255,0.42)]"
      >
        {label}
      </text>
    </g>
  );
}
