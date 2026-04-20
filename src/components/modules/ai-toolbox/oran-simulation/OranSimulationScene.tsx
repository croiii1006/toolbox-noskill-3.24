import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Clock3,
  Database,
  FileStack,
  FileText,
  GitBranch,
  Layers3,
  ListChecks,
  MonitorCog,
  PlayCircle,
  Radar,
  Sparkles,
  Users,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { PixelProgress } from "@/components/modules/skills/PixelProgress";
import GraphCanvas from "./components/GraphCanvas";
import DetailPanel from "./components/DetailPanel";
import { buildNodeHighlight, graphDataset, type GraphHighlight } from "./lib/graphData";
import { type Locale } from "./lib/graphI18n";
import type {
  OranSimRunTab,
  OranSimWorkspaceView,
  OranSimulationSceneSnapshot,
  OranSimulationSetupState,
} from "./workflowTypes";

const STEPS: Array<{
  id: OranSimWorkspaceView;
  no: string;
  label: string;
  desc: string;
  icon: typeof Sparkles;
}> = [
  { id: "setup", no: "01", label: "创建模拟任务", desc: "绑定文件、方向、周期与平台范围", icon: Sparkles },
  { id: "parsed", no: "02", label: "解析输入材料", desc: "提取结构化输入与三层模拟基础", icon: FileStack },
  { id: "scope", no: "03", label: "确定模拟方向", desc: "收敛主问题、对比方向、目标行为", icon: Radar },
  { id: "graph", no: "04", label: "构建语义图谱", desc: "连接品牌、平台、人群、竞品与风险", icon: GitBranch },
  { id: "environment", no: "05", label: "搭建仿真环境", desc: "生成平台规则、时间切片与衰减机制", icon: Layers3 },
  { id: "clusters", no: "06", label: "生成 Agent 群体", desc: "得到可运行的集群层与行为参数", icon: Users },
  { id: "activation", no: "07", label: "设定初始激活策略", desc: "定义首波种子、阈值与止损策略", icon: PlayCircle },
  { id: "monitor", no: "08", label: "并行运行模拟", desc: "观察扩散、衰减、反馈与方向差异", icon: Clock3 },
  { id: "report", no: "09", label: "输出预测报告", desc: "折叠为可决策的结构化结论", icon: ListChecks },
];

const MESSAGES = [
  "正在绑定洞察报告、策划方案与补充材料...",
  "正在从输入材料中提取现实世界种子、潜在人群画像与活动策划...",
  "正在收敛本次真正要模拟的问题、重点平台与目标行为...",
  "正在围绕品牌、卖点、人群、平台、竞品和风险搭建语义图谱...",
  "正在加载平台规则、时间环境、内容衰减与外部扰动参数...",
  "正在生成高意向核心人群、泛兴趣扩圈人群与专业判断型用户...",
  "正在确定首波平台、种子规模、扩圈阈值与风险观察词...",
  "正在分发第一波内容种子，并持续更新扩散过程与生命周期曲线...",
  "正在整合模拟结果，生成最终预测报告与方向建议...",
];

const PAUSES = [
  { at: 3, text: "已完成输入解析与范围确认。右侧可查看本次模拟问题、主方向、重点平台与目标行为。" },
  { at: 7, text: "图谱、环境与 Agent 群体已就绪。建议先检查激活策略，再进入运行监控。" },
  { at: 9, text: "最终预测报告已经生成。可以查看方向建议、扩散路径、人群贡献与风险提示。" },
];

const RUN_TABS: Array<{ id: OranSimRunTab; label: string }> = [
  { id: "diffusion", label: "扩散过程" },
  { id: "segments", label: "人群分层反馈" },
  { id: "lifecycle", label: "生命周期曲线" },
  { id: "compare", label: "多方向对比" },
];

const RUN_ROWS: Record<OranSimRunTab, string[][]> = {
  diffusion: [
    ["D01", "daily_exposure 12 / daily_engagement 4 / 首波种子投放"],
    ["D05", "daily_exposure 26 / daily_engagement 8 / 高意向人群开始放大"],
    ["D12", "daily_exposure 48 / daily_engagement 16 / 小红书种草扩圈"],
    ["D21", "daily_exposure 72 / daily_engagement 22 / 抖音评论链放大"],
  ],
  segments: [
    ["高意向核心人群", "segment_exposure 34% / engagement 29% / completion 62% / interaction 41%"],
    ["泛兴趣扩圈人群", "segment_exposure 28% / engagement 24% / completion 45% / interaction 27%"],
    ["价格敏感观望人群", "segment_exposure 17% / engagement 11% / completion 31% / interaction 15%"],
  ],
  lifecycle: [
    ["方向 A：长期安全有效", "peak_day D21 / inflection_day D33 / decay_rate 0.37 / suggested_refresh_day D28"],
    ["方向 B：高压场景头皮稳定在线", "peak_day D12 / inflection_day D19 / decay_rate 0.54 / suggested_refresh_day D16"],
  ],
  compare: [
    ["direction_a_curve", "方向 A 起量略慢，但续航更稳，适合承担中后段转化"],
    ["direction_b_curve", "方向 B 起量快但衰减更早，更适合作为首波注意力突破"],
    ["suggested_budget_split", "方向 A 58% / 方向 B 42%"],
  ],
};

const highlightDefault = buildNodeHighlight("product_scalp_repair_serum", "influence");

function latestView(progress: number): OranSimWorkspaceView {
  return progress <= 0 ? "checklist" : STEPS[Math.min(progress - 1, STEPS.length - 1)].id;
}

function titleOf(view: OranSimWorkspaceView) {
  const map: Record<OranSimWorkspaceView, string> = {
    checklist: "任务清单",
    files: "输入文件 / 记忆阅读",
    setup: "Setup 摘要",
    parsed: "输入解析结果",
    scope: "模拟范围摘要",
    graph: "知识图谱工作区",
    environment: "环境建模面板",
    clusters: "Agent Cluster 面板",
    activation: "初始激活策略",
    monitor: "模拟运行监控",
    report: "最终预测报告",
  };
  return map[view];
}

function setupRows(setup: OranSimulationSetupState, files: string[]) {
  return [
    ["项目名称", setup.projectName],
    ["品牌名称", setup.brandName],
    ["模拟周期", `${setup.cycleDays} 天`],
    ["目标平台", setup.platforms.join(" / ") || "未设置"],
    ["主方向", setup.mainDirection || setup.simulationQuestion || "未设置"],
    ["对比方向", setup.compareDirections.join(" / ") || "无"],
    ["竞品扰动", setup.competitorDisturbance ? "启用" : "关闭"],
    ["风险反馈", setup.riskFeedback ? "启用" : "关闭"],
    ["上传文件", files.join(" / ") || "未附带文件"],
  ];
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border/30 bg-background overflow-hidden shadow-sm">
      <div className="border-b border-border/20 px-4 py-2.5">
        <div className="font-pixel text-sm tracking-[0.08em] text-foreground">{title}</div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function RowsCard({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <Card title={title}>
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border/20 bg-muted/20 px-4 py-3">
            <div className="font-pixel text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">{label}</div>
            <div className="mt-2 text-sm leading-6 text-foreground/75">{value}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function WorkspaceShell({
  kicker,
  title,
  subtitle,
  children,
}: {
  kicker: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/30 bg-background overflow-hidden shadow-sm">
      <div className="border-b border-border/20 px-6 py-4">
        <div className="font-pixel text-[10px] uppercase tracking-[0.24em] text-accent/80">{kicker}</div>
        <div className="mt-2 font-pixel text-base tracking-[0.06em] text-foreground">{title}</div>
        <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function SetupCompactBar({
  brandName,
  simulationQuestion,
  attachmentNames,
}: {
  brandName: string;
  simulationQuestion: string;
  attachmentNames: string[];
}) {
  return (
    <div className="rounded-xl border border-border/20 bg-muted/20 px-4 py-3 flex items-center gap-4 flex-wrap text-sm">
      <div className="flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-muted-foreground/50" />
        <span className="text-xs text-foreground/70">{brandName || "未设置品牌名称"}</span>
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <Radar className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
        <span className="truncate text-xs text-foreground/70">
          {simulationQuestion || "未设置预测问题"}
        </span>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <Database className="h-3.5 w-3.5 text-muted-foreground/50" />
        <span className="text-xs text-foreground/70">记忆库({attachmentNames.length})</span>
        {attachmentNames.map((name) => (
          <span
            key={name}
            className="inline-flex h-5 items-center rounded-full border border-border/30 bg-foreground/5 px-2 text-[10px] text-foreground/70"
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function OranSimulationScene({
  locale,
  setup,
  sceneSnapshot,
  attachmentNames,
  onBack,
  onSnapshotChange,
}: {
  locale: Locale;
  setup: OranSimulationSetupState;
  sceneSnapshot: OranSimulationSceneSnapshot;
  attachmentNames: string[];
  onBack?: () => void;
  onSnapshotChange: (next: OranSimulationSceneSnapshot) => void;
}) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    sceneSnapshot.selectedNodeId ?? highlightDefault.nodeIds[0] ?? "product_scalp_repair_serum",
  );
  const leftRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const progress = sceneSnapshot.progress;
  const selectedView = sceneSnapshot.selectedView;
  const runTab = sceneSnapshot.runTab;
  const isCompleted = progress >= STEPS.length;
  const unlocked = new Set(STEPS.filter((_, i) => progress >= i + 1).map((step) => step.id));
  const activeNode = selectedNodeId ? graphDataset.nodeMap.get(selectedNodeId) ?? null : null;
  const highlight: GraphHighlight | null = useMemo(
    () => (selectedNodeId ? buildNodeHighlight(selectedNodeId, "influence") : highlightDefault),
    [selectedNodeId],
  );

  useEffect(() => {
    if (progress >= STEPS.length) return;
    const timer = window.setTimeout(() => {
      onSnapshotChange({
        ...sceneSnapshot,
        progress: progress + 1,
        selectedView:
          selectedView === latestView(progress) || selectedView === "checklist"
            ? latestView(progress + 1)
            : selectedView,
      });
    }, progress === 0 ? 800 : progress === 7 ? 1600 : 1200);
    return () => window.clearTimeout(timer);
  }, [onSnapshotChange, progress, sceneSnapshot, selectedView]);

  useEffect(() => {
    if (leftRef.current) leftRef.current.scrollTop = leftRef.current.scrollHeight;
  }, [progress]);

  useEffect(() => {
    setSelectedNodeId(sceneSnapshot.selectedNodeId);
  }, [sceneSnapshot.selectedNodeId]);

  const pickView = (view: OranSimWorkspaceView) =>
    onSnapshotChange({ ...sceneSnapshot, selectedView: view });
  const pickTab = (tab: OranSimRunTab) =>
    onSnapshotChange({ ...sceneSnapshot, runTab: tab });
  const pickNode = (nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    onSnapshotChange({ ...sceneSnapshot, selectedView: "graph", selectedNodeId: nodeId });
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup
          direction={isMobile ? "vertical" : "horizontal"}
          autoSaveId={`oran-simulation-scene-${isMobile ? "vertical" : "horizontal"}-split`}
          className="h-full"
        >
          <ResizablePanel defaultSize={50} minSize={isMobile ? 35 : 30} className="min-h-0 min-w-0">
            <div
              className={cn(
                "flex h-full min-h-0 flex-col",
                isMobile ? "border-b border-border/20" : "border-r border-border/20",
              )}
            >
          <div className="px-4 py-2 border-b border-border/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              {onBack ? (
                <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-muted/40">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>返回</span>
                </button>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-pixel text-xs text-muted-foreground/60">ORAN SIM</span>
              <PixelProgress progress={progress} status={isCompleted ? "done" : "running"} />
            </div>
          </div>

          <div ref={leftRef} className="oran-sim-scrollbar-hidden flex-1 overflow-y-auto">
            <div className="px-6 py-6 pb-[60px]">
              <div className="max-w-3xl mx-auto space-y-4">
                <SetupCompactBar
                  brandName={setup.brandName}
                  simulationQuestion={setup.simulationQuestion || setup.mainDirection}
                  attachmentNames={attachmentNames}
                />

                <button
                  type="button"
                  onClick={() => pickView("files")}
                  className="flex w-full items-center justify-between rounded-xl border border-border/30 bg-background px-5 py-4 text-left transition-colors hover:bg-muted/20"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-accent/80" />
                    <div>
                      <div className="font-pixel text-sm text-foreground">输入文件 / 记忆阅读</div>
                      <div className="mt-1 text-xs text-muted-foreground">已绑定 {attachmentNames.length} 份材料，可查看洞察、策划与补充材料</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
                </button>

                <button
                  type="button"
                  onClick={() => pickView("checklist")}
                  className="flex w-full items-center justify-between rounded-xl border border-border/30 bg-background px-5 py-4 text-left transition-colors hover:bg-muted/20"
                >
                  <div className="flex items-center gap-3">
                    <ListChecks className="h-4 w-4 text-accent/80" />
                    <div>
                      <div className="font-pixel text-sm text-foreground">任务清单</div>
                      <div className="mt-1 text-xs text-muted-foreground">9 个阶段，当前已完成 {Math.min(progress, STEPS.length)}/9</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
                </button>

                <Card title="WORKFLOW">
                  <div className="space-y-0">
                    {STEPS.map((step, index) => {
                      const Icon = step.icon;
                      const active = selectedView === step.id;
                      const ready = unlocked.has(step.id);
                      return (
                        <div key={step.id}>
                          <button
                            type="button"
                            disabled={!ready}
                            onClick={() => pickView(step.id)}
                            className={cn(
                              "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-all",
                              ready ? "hover:bg-muted/20" : "cursor-default opacity-45",
                              active && "border border-accent/25 bg-accent/5",
                            )}
                          >
                            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", active ? "text-accent/80" : "text-muted-foreground/80")} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-pixel text-sm text-foreground">{step.label}</span>
                                <span className="font-pixel text-[10px] text-muted-foreground/60">{step.no}</span>
                              </div>
                              <div className="mt-1 text-xs leading-6 text-muted-foreground">{step.desc}</div>
                            </div>
                            {ready ? <ChevronRight className="mt-0.5 h-4 w-4 text-muted-foreground/60" /> : null}
                          </button>
                          {index < STEPS.length - 1 ? <div className="ml-[11px] h-4 border-l border-dashed border-border/60" /> : null}
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {progress >= 5 ? (
                  <Card title="AGENT CLUSTER">
                    <div className="space-y-2">
                      {["创建图谱工程器", "创建环境建模器", "创建人群行为分析器", "创建平台扩散观测器", "创建报告归因器"]
                        .slice(0, Math.max(2, Math.min(progress, 5)))
                        .map((agent) => (
                          <div key={agent} className="flex items-center gap-3 rounded-xl border border-border/20 bg-muted/20 px-4 py-3">
                            <Sparkles className="h-4 w-4 text-accent/80" />
                            <span className="text-sm text-foreground/75">{agent}</span>
                          </div>
                        ))}
                    </div>
                  </Card>
                ) : null}

                {MESSAGES.slice(0, progress).map((message) => (
                  <div key={message} className="rounded-xl border border-border/20 bg-background px-4 py-3 shadow-sm">
                    <div className="flex items-start gap-3">
                      <MonitorCog className="mt-0.5 h-4 w-4 shrink-0 text-accent/80" />
                      <div className="text-sm leading-7 text-foreground/70">{message}</div>
                    </div>
                  </div>
                ))}

                {PAUSES.filter((item) => progress >= item.at).map((item) => (
                  <div key={item.text} className="rounded-xl border border-accent/25 bg-accent/5 px-4 py-4 text-sm leading-7 text-foreground/80">
                    {item.text}
                  </div>
                ))}

                {isCompleted ? (
                  <div className="rounded-xl border border-border/30 bg-background px-4 py-4 text-sm leading-7 text-foreground/80 shadow-sm">
                    群体智能预测任务已完成，右侧最终报告可直接用于内容、投放与预算决策。
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

            </div>
          </ResizablePanel>
          <ResizableHandle className="bg-border/20 transition-colors hover:bg-accent/30" />
          <ResizablePanel defaultSize={50} minSize={isMobile ? 35 : 32} className="min-h-0 min-w-0">
            <div className="h-full min-h-0 overflow-hidden flex flex-col bg-background animate-in slide-in-from-right-4 duration-300">
            <div className="px-5 py-3 border-b border-border/20 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-pixel text-[10px] uppercase tracking-[0.24em] text-accent/80">Current Workspace</span>
                  <span className="rounded-full border border-border/40 bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                    {String(Math.min(Math.max(progress, 1), STEPS.length)).padStart(2, "0")}
                  </span>
                </div>
                <div className="mt-1 font-pixel text-sm text-foreground">{titleOf(selectedView)}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">当前阶段产物与结构化工作区</div>
              </div>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="p-5">
                <div className="mx-auto w-full max-w-[1120px]">
                  {selectedView === "checklist" ? (
                    <WorkspaceShell kicker="Task List" title="本次模拟待办" subtitle="按阶段查看本次预测任务的完整工作流">
                      <RowsCard title="TASKS" rows={STEPS.map((step) => [step.label, step.desc])} />
                    </WorkspaceShell>
                  ) : null}

                  {selectedView === "files" ? (
                    <WorkspaceShell kicker="Files" title="输入文件清单" subtitle="洞察报告、策划方案与补充材料会在模拟前统一进入解析">
                      <RowsCard title="BOUND FILES" rows={attachmentNames.map((name, index) => [`文件 ${index + 1}`, name])} />
                    </WorkspaceShell>
                  ) : null}

                  {selectedView === "setup" ? (
                    <WorkspaceShell kicker="Simulation Setup" title="Setup 摘要" subtitle="本次任务的输入边界、周期、平台范围与方向定义">
                      <SetupCompactBar
                        brandName={setup.brandName}
                        simulationQuestion={setup.simulationQuestion || setup.mainDirection}
                        attachmentNames={attachmentNames}
                      />
                    </WorkspaceShell>
                  ) : null}

                  {selectedView === "parsed" ? (
                    <WorkspaceShell kicker="Parsed Inputs" title="输入解析结果" subtitle="将洞察与策划收敛为可运行的三层结构化输入">
                      <div className="grid gap-4">
                        <RowsCard title="现实世界种子" rows={[["品牌资产", "海飞丝去屑心智"], ["当前品牌认知", "专业去屑但年轻感不足"], ["市场趋势", "头皮稳定与成分安全双线并进"], ["核心竞品", "清扬、吕、卡诗"], ["风险议题", "高功效表述过度承诺"]]} />
                        <RowsCard title="潜在触达用户画像" rows={[["目标人群包", "高压通勤白领 / 熬夜党 / 成分党"], ["年龄层", "22-34"], ["兴趣圈层", "头皮护理 / 精致通勤 / 功效洗护"], ["意向层级", "中高"], ["内容偏好", "前后对比、场景痛点、专业解释"], ["平台分布", "抖音 > 小红书 > 天猫"]]} />
                        <RowsCard title="营销活动策划" rows={[["活动主题", "头皮稳定在线 60 天"], ["卖点方向", "长期安全有效 + 高压场景稳定"], ["内容形式", "短视频 + 图文种草 + 直播挂车"], ["节奏计划", "首周起量 / 中段扩圈 / 后段转化"], ["KPI 目标", "互动增长、收藏提升、站内转化"]]} />
                      </div>
                    </WorkspaceShell>
                  ) : null}

                  {selectedView === "scope" ? (
                    <WorkspaceShell kicker="Simulation Scope" title="模拟范围摘要" subtitle="把材料中的全量信息收敛成这次真正要模拟的问题和范围">
                      <RowsCard title="SCOPE" rows={[["本次模拟问题", "海飞丝在 60 天内围绕头皮稳定方向的传播放大路径与衰减风险是什么"], ["主方向", setup.mainDirection || "未设置"], ["对比方向", setup.compareDirections.join(" / ") || "无"], ["重点平台", setup.platforms.join(" / ")], ["重点人群", "高压通勤白领 / 熬夜党 / 成分党"], ["目标行为", "完播、评论、收藏、搜索、购买转化"], ["周期范围", `${setup.cycleDays} 天`], ["关注指标", "总互动、峰值日、衰减日、风险触发率"]]} />
                    </WorkspaceShell>
                  ) : null}

                  {selectedView === "graph" ? (
                    <WorkspaceShell kicker="Semantic Graph" title="知识图谱工作区" subtitle="围绕品牌、卖点、人群、平台、竞品与风险构建语义关系图">
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {["品牌", "卖点方向", "用户问题", "人群", "平台", "竞品", "风险点", "行为目标"].map((label) => (
                            <span key={label} className="rounded-full border border-border/30 bg-muted/20 px-3 py-1 text-xs text-muted-foreground">{label}</span>
                          ))}
                        </div>
                        <div className="grid min-h-[560px] gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
                          <div className="overflow-hidden rounded-xl border border-border/30 bg-background shadow-sm">
                            <GraphCanvas
                              nodes={graphDataset.nodes}
                              edges={graphDataset.edges}
                              selectedNodeId={selectedNodeId}
                              focusNodeId={selectedNodeId}
                              highlight={highlight}
                              onSelectNode={pickNode}
                              locale={locale}
                              showHeader={false}
                            />
                          </div>
                          <div className="rounded-xl border border-border/30 bg-background p-3 shadow-sm">
                            {activeNode ? (
                              <DetailPanel node={activeNode} onHighlight={() => {}} locale={locale} />
                            ) : (
                              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">点击节点查看详情</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </WorkspaceShell>
                  ) : null}

                  {selectedView === "environment" ? (
                    <WorkspaceShell kicker="Environment Model" title="环境建模面板" subtitle="环境不是人设卡，而是可运行的市场规则、时间切片与扰动机制">
                      <RowsCard title="ENVIRONMENT" rows={[["平台环境", "抖音高爆发 / 小红书长尾沉淀"], ["时间环境", "按日切片，峰值窗口集中在 D05-D21"], ["内容衰减机制", "baseline 0.37 / saturation 0.72"], ["外部扰动", `${setup.competitorDisturbance ? "competitor_noise_level 0.42" : "competitor_noise_level 0.00"} / ${setup.riskFeedback ? "risk_shock_enabled true" : "risk_shock_enabled false"}`], ["baseline_exposure_weight", "1.32"], ["interaction_amplification_factor", "1.68"], ["active_hours", "12:00 / 20:00 / 23:00"], ["time_slice", "1 day"]]} />
                    </WorkspaceShell>
                  ) : null}

                  {selectedView === "clusters" ? (
                    <WorkspaceShell kicker="Agent Clusters" title="Agent Cluster 面板" subtitle="这里展示的是可运行的群体层，而不是静态 persona 卡片">
                      <RowsCard title="CLUSTERS" rows={[["高意向核心人群", "population_weight 0.34 / intent 0.88 / influence 0.76"], ["泛兴趣扩圈人群", "population_weight 0.28 / intent 0.58 / share 0.42"], ["价格敏感观望人群", "population_weight 0.17 / ignore 0.54 / threshold 0.71"], ["情绪传播型用户", "population_weight 0.12 / comment 0.62 / share 0.55"], ["成分/专业判断型用户", "population_weight 0.09 / platform_affinity 小红书"], ["总体参数", "total_agent_count 12800 / total_rounds 60 / seed_population_size 420"]]} />
                    </WorkspaceShell>
                  ) : null}

                  {selectedView === "activation" ? (
                    <WorkspaceShell kicker="Activation Strategy" title="初始激活策略" subtitle="定义第一波从哪里开始，什么时候扩圈，什么时候止损">
                      <RowsCard title="ACTIVATION" rows={[["initial_content_direction", setup.mainDirection || "未设置"], ["seed_audience_clusters", "高意向核心人群 / 情绪传播型用户"], ["seed_size", "420"], ["initial_platform", "抖音"], ["first_wave_days", "D01-D05"], ["expansion_trigger_threshold", "0.31"], ["stop_loss_threshold", "0.12"], ["risk_watch_keywords", "过度功效 / 头皮刺激 / 价格战"]]} />
                    </WorkspaceShell>
                  ) : null}

                  {selectedView === "monitor" ? (
                    <WorkspaceShell kicker="Simulation Monitor" title="模拟运行监控" subtitle="实时查看扩散过程、人群反馈、生命周期与多方向对比">
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {RUN_TABS.map((tab) => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => pickTab(tab.id)}
                              className={cn(
                                "rounded-full border px-4 py-2 text-sm transition-all",
                                runTab === tab.id ? "border-accent/25 bg-accent/5 text-accent/80" : "border-border/30 bg-background text-muted-foreground hover:text-foreground",
                              )}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>
                        <RowsCard title="MONITOR" rows={RUN_ROWS[runTab]} />
                      </div>
                    </WorkspaceShell>
                  ) : null}

                  {selectedView === "report" ? (
                    <WorkspaceShell kicker="Final Report" title="最终预测报告" subtitle="把仿真结果折叠成可直接用于营销与预算决策的结构化结论">
                      <div className="space-y-4">
                        <RowsCard title="到策划决策" rows={[["decision_status", "GO"], ["recommended_direction", "方向 A：长期安全有效"], ["rejected_direction", "方向 B：高压场景头皮稳定在线"], ["next_step", "优先做方向 A 稳定放量"], ["decision_confidence", "0.82"]]} />
                        <RowsCard title="方向性指标" rows={[["predicted_total_engagement", "128万 - 152万"], ["engagement_uplift_range", "+18% ~ +26%"], ["peak_day", "D21"], ["decay_day", "D33"], ["confidence_score", "0.79"]]} />
                        <RowsCard title="关键解释" rows={[["响应人群", "高压通勤白领 / 成分党"], ["放大平台", "抖音先起量，小红书承接解释"], ["起量快但早衰", "方向 B"], ["续航更稳", "方向 A"], ["主要风险点", "功效承诺过强 / 价格战"]]} />
                        <RowsCard title="详细报告区" rows={[["扩散路径", "首波在抖音短视频完成种子扩散，D12 后由小红书解释型内容承接"], ["人群贡献", "高意向核心人群贡献第一波互动峰值，情绪传播型用户放大评论链"], ["生命周期", "方向 A 在 D21 达峰，D33 进入衰减，建议 D28 刷新素材"], ["方向建议", "主投方向 A，方向 B 作为前置吸睛素材，不宜承担长期转化"], ["风险提示", "需控制“立刻见效”话术，避免在竞品扰动期放大功效对比"]]} />
                      </div>
                    </WorkspaceShell>
                  ) : null}
                </div>
              </div>
            </ScrollArea>

            <div className="border-t border-border/20 px-[13px] py-[5px]">
              <div className="flex items-center justify-center gap-3 overflow-x-auto">
                {STEPS.map((step) => {
                  const active = selectedView === step.id;
                  const ready = unlocked.has(step.id);
                  return (
                    <button
                      key={step.id}
                      type="button"
                      disabled={!ready}
                      onClick={() => pickView(step.id)}
                      className={cn(
                        "flex flex-col items-center gap-1 border px-4 py-[2px] text-xs transition-all",
                        active
                          ? "border-foreground/80 bg-background text-foreground shadow-[3px_3px_0px_0px_hsl(var(--foreground)/0.35)]"
                          : ready
                            ? "border-border/30 text-muted-foreground hover:border-accent/40 hover:shadow-[2px_2px_0px_0px_hsl(var(--foreground)/0.22)]"
                            : "cursor-default border-border/20 bg-muted/20 text-muted-foreground/40",
                      )}
                    >
                      <span className="font-pixel text-lg leading-none">{step.no}</span>
                      <span className={cn("font-pixel text-[10px] leading-none", active ? "text-accent/80" : ready ? "text-emerald-600" : "text-muted-foreground/40")}>
                        {active ? (step.id === "checklist" ? "TASK" : step.id === "files" ? "FILES" : step.id === "setup" ? "SETUP" : step.id === "parsed" ? "PARSED" : step.id === "scope" ? "SCOPE" : step.id === "graph" ? "GRAPH" : step.id === "environment" ? "ENV" : step.id === "clusters" ? "CLUSTER" : step.id === "activation" ? "ACT" : step.id === "monitor" ? "RUN" : "REPORT") : ready ? "DONE" : "LOCK"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
