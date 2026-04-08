import { useCallback, useEffect, useMemo, useState } from "react";
import { History, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMemory } from "@/contexts/MemoryContext";
import { useOranSimulationPrefill } from "@/contexts/OranSimulationPrefillContext";
import {
  MemorySelectionDialog,
  type MemorySelectItem,
} from "@/components/modules/memory/MemorySelectionDialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { InsightComposerPanel } from "./InsightComposerPanel";
import "./oran-simulation/oran-simulation.css";
import OranSimulationScene from "./oran-simulation/OranSimulationScene";
import { type Locale } from "./oran-simulation/lib/graphI18n";
import type {
  OranSimulationSceneSnapshot,
  OranSimulationSetupState,
} from "./oran-simulation/workflowTypes";

interface OranSimulationProps {
  onNavigate: (itemId: string) => void;
}

type OranSimulationStep = "home" | "scene";
type AttachmentPickerTarget = "insight" | "planning" | "supplemental" | null;

interface OranSimulationHistoryItem {
  id: string;
  date: string;
  step: OranSimulationStep;
  title: string;
  setup: OranSimulationSetupState;
  sceneSnapshot: OranSimulationSceneSnapshot;
}

const ORAN_SIM_HISTORY_STORAGE_KEY = "oran-sim-history";

const HOME_COPY: Record<Locale, { subtitle: string }> = {
  zh: {
    subtitle: "输入或选择预测问题后，即可进入仿真推演界面。",
  },
  en: {
    subtitle: "Enter or select a prediction question to enter the simulation workspace.",
  },
};

const EXAMPLE_PROMPTS: Record<Locale, string[]> = {
  zh: [
    "帮我预测未来30天内舆情走势",
    "帮我预测未来30天在TikTok平台的品牌声量",
  ],
  en: [
    "Help me predict public sentiment in the next 30 days",
    "Help me predict brand share of voice on TikTok in the next 30 days",
  ],
};

const DEFAULT_SCENE_SNAPSHOT: OranSimulationSceneSnapshot = {
  progress: 0,
  selectedView: "checklist",
  runTab: "diffusion",
  selectedNodeId: null,
};

const DEFAULT_SETUP: OranSimulationSetupState = {
  projectName: "海飞丝 60 天品牌营销预测",
  brandName: "海飞丝",
  category: "个护美发 > 去屑洗护",
  simulationQuestion: "",
  insightMemoryId: null,
  planningMemoryId: null,
  supplementalMemoryIds: [],
  cycleDays: 60,
  platforms: ["douyin", "xiaohongshu"],
  mainDirection: "",
  compareDirections: ["方向 B：高压场景头皮稳定在线"],
  competitorDisturbance: true,
  riskFeedback: true,
};

function buildHistoryTitle(setup: OranSimulationSetupState) {
  return `${setup.brandName || "品牌"} · ${setup.mainDirection || setup.simulationQuestion || "营销预测"}`;
}

function saveOranSimulationHistory(items: OranSimulationHistoryItem[]) {
  localStorage.setItem(ORAN_SIM_HISTORY_STORAGE_KEY, JSON.stringify(items));
}

function dedupeIds(ids: Array<string | null | undefined>) {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

function loadOranSimulationHistory(): OranSimulationHistoryItem[] {
  try {
    const raw = localStorage.getItem(ORAN_SIM_HISTORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as Array<
      | OranSimulationHistoryItem
      | {
          id: string;
          date: string;
          step: OranSimulationStep;
          promptValue?: string;
          selectedMemoryIds?: string[];
        }
    >;

    return parsed.map((item) => {
      if ("setup" in item && item.setup) {
        const next = item as OranSimulationHistoryItem;
        return {
          ...next,
          title: next.title || buildHistoryTitle(next.setup),
          sceneSnapshot: next.sceneSnapshot || DEFAULT_SCENE_SNAPSHOT,
        };
      }

      const legacy = item as {
        id: string;
        date: string;
        step: OranSimulationStep;
        promptValue?: string;
        selectedMemoryIds?: string[];
      };

      const [insightMemoryId = null, planningMemoryId = null, ...supplementalMemoryIds] =
        legacy.selectedMemoryIds ?? [];

      const simulationQuestion = legacy.promptValue || DEFAULT_SETUP.simulationQuestion;
      const setup: OranSimulationSetupState = {
        ...DEFAULT_SETUP,
        simulationQuestion,
        mainDirection: simulationQuestion,
        insightMemoryId,
        planningMemoryId,
        supplementalMemoryIds,
      };

      return {
        id: legacy.id,
        date: legacy.date,
        step: legacy.step ?? "home",
        title: buildHistoryTitle(setup),
        setup,
        sceneSnapshot: DEFAULT_SCENE_SNAPSHOT,
      };
    });
  } catch {
    return [];
  }
}

function inferAttachmentSlots(attachmentIds: string[], memoryItems: MemorySelectItem[]) {
  let insightMemoryId: string | null = null;
  let planningMemoryId: string | null = null;
  const supplementalMemoryIds: string[] = [];

  attachmentIds.forEach((id) => {
    const item = memoryItems.find((entry) => entry.id === id);
    const joined = `${item?.tag ?? ""} ${item?.name ?? ""}`;
    if (!insightMemoryId && /洞察/.test(joined)) {
      insightMemoryId = id;
      return;
    }
    if (!planningMemoryId && /策划/.test(joined)) {
      planningMemoryId = id;
      return;
    }
    supplementalMemoryIds.push(id);
  });

  attachmentIds.forEach((id) => {
    if (!insightMemoryId) {
      insightMemoryId = id;
      return;
    }
    if (!planningMemoryId && id !== insightMemoryId) {
      planningMemoryId = id;
    }
  });

  return {
    insightMemoryId,
    planningMemoryId,
    supplementalMemoryIds: supplementalMemoryIds.filter(
      (id) => id !== insightMemoryId && id !== planningMemoryId,
    ),
  };
}

function HistorySheet({
  locale,
  history,
  onRestore,
  onDelete,
}: {
  locale: Locale;
  history: OranSimulationHistoryItem[];
  onRestore: (item: OranSimulationHistoryItem) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
          <History className="h-3.5 w-3.5" />
          <span>{locale === "zh" ? "历史记录" : "History"}</span>
        </button>
      </SheetTrigger>
      <SheetContent className="w-80 sm:w-96">
        <SheetHeader>
          <SheetTitle className="text-base font-medium text-foreground">
            {locale === "zh" ? "历史记录" : "History"}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 max-h-[calc(100vh-6rem)] space-y-3 overflow-y-auto">
          {history.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {locale === "zh" ? "暂无历史记录" : "No history yet"}
            </p>
          ) : null}

          {history.map((item) => {
            const attachmentCount = dedupeIds([
              item.setup.insightMemoryId,
              item.setup.planningMemoryId,
              ...item.setup.supplementalMemoryIds,
            ]).length;

            return (
              <button
                key={item.id}
                onClick={() => onRestore(item)}
                className="group relative w-full rounded-2xl border border-border/60 bg-card p-4 text-left transition-all hover:border-accent/30 hover:shadow-sm"
              >
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium text-foreground">{item.title}</span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {new Date(item.date).toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">{item.setup.category}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full border border-accent/25 bg-accent/8 px-2 py-0.5 text-[10px] text-accent/80">
                    {item.setup.cycleDays}
                    {locale === "zh" ? " 天" : " days"}
                  </span>
                  <span className="rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                    {attachmentCount}
                    {locale === "zh" ? " 份附件" : " attachments"}
                  </span>
                  <span className="rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                    {item.step === "scene"
                      ? item.sceneSnapshot.progress >= 9
                        ? locale === "zh"
                          ? "已完成"
                          : "Completed"
                        : locale === "zh"
                          ? "进行中"
                          : "Running"
                      : locale === "zh"
                        ? "草稿"
                        : "Draft"}
                  </span>
                </div>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(item.id);
                  }}
                  className="absolute bottom-3 right-3 rounded-full p-1 opacity-0 transition-all group-hover:opacity-100 hover:bg-muted/60"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function OranSimulation(_: OranSimulationProps) {
  const [step, setStep] = useState<OranSimulationStep>("home");
  const [setup, setSetup] = useState<OranSimulationSetupState>(DEFAULT_SETUP);
  const [history, setHistory] = useState<OranSimulationHistoryItem[]>(loadOranSimulationHistory);
  const [sceneSnapshot, setSceneSnapshot] =
    useState<OranSimulationSceneSnapshot>(DEFAULT_SCENE_SNAPSHOT);
  const [memoryDialogOpen, setMemoryDialogOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<AttachmentPickerTarget>(null);
  const { i18n } = useTranslation();
  const { entries } = useMemory();
  const { consumePrefill } = useOranSimulationPrefill();

  const locale: Locale = useMemo(
    () => (i18n.language.toLowerCase().startsWith("zh") ? "zh" : "en"),
    [i18n.language],
  );
  const copy = HOME_COPY[locale];
  const examplePrompts = EXAMPLE_PROMPTS[locale];

  const memoryItems: MemorySelectItem[] = useMemo(
    () =>
      entries.map((entry) => ({
        id: entry.id,
        name: entry.title,
        desc: entry.content.slice(0, 60),
        tag: entry.category,
        charCount: entry.content.length,
      })),
    [entries],
  );

  useEffect(() => {
    const prefill = consumePrefill();
    if (!prefill) return;

    const inferred = inferAttachmentSlots(prefill.attachmentIds, memoryItems);
    setSetup((prev) => ({
      ...prev,
      insightMemoryId: inferred.insightMemoryId,
      planningMemoryId: inferred.planningMemoryId,
      supplementalMemoryIds: inferred.supplementalMemoryIds,
      brandName: prefill.brandName || prev.brandName,
      category: prefill.category || prev.category,
      simulationQuestion: prefill.prompt || prev.simulationQuestion,
      mainDirection: prefill.prompt || prev.mainDirection,
    }));

    if (prefill.autoStart && inferred.insightMemoryId && inferred.planningMemoryId) {
      setStep("scene");
      setSceneSnapshot(DEFAULT_SCENE_SNAPSHOT);
    }
  }, [consumePrefill, memoryItems]);

  const insightMemoryName = useMemo(
    () => memoryItems.find((item) => item.id === setup.insightMemoryId)?.name ?? "",
    [memoryItems, setup.insightMemoryId],
  );
  const planningMemoryName = useMemo(
    () => memoryItems.find((item) => item.id === setup.planningMemoryId)?.name ?? "",
    [memoryItems, setup.planningMemoryId],
  );
  const supplementalMemoryNames = useMemo(
    () =>
      setup.supplementalMemoryIds
        .map((id) => memoryItems.find((item) => item.id === id)?.name)
        .filter((name): name is string => Boolean(name)),
    [memoryItems, setup.supplementalMemoryIds],
  );

  const selectedMemoryIds = useMemo(
    () => dedupeIds([setup.insightMemoryId, setup.planningMemoryId, ...setup.supplementalMemoryIds]),
    [setup.insightMemoryId, setup.planningMemoryId, setup.supplementalMemoryIds],
  );
  const selectedMemorySummary = useMemo(
    () => [insightMemoryName, planningMemoryName, ...supplementalMemoryNames].filter(Boolean).join("、"),
    [insightMemoryName, planningMemoryName, supplementalMemoryNames],
  );
  const selectedMemorySummaryNeedsFade = selectedMemorySummary.length > 25;
  const canSubmit = Boolean(
    setup.insightMemoryId && setup.planningMemoryId && setup.simulationQuestion.trim(),
  );

  const activePickerSelectedIds = useMemo(() => {
    if (pickerTarget === "insight") return setup.insightMemoryId ? [setup.insightMemoryId] : [];
    if (pickerTarget === "planning") return setup.planningMemoryId ? [setup.planningMemoryId] : [];
    if (pickerTarget === "supplemental") return setup.supplementalMemoryIds;
    return selectedMemoryIds;
  }, [
    pickerTarget,
    selectedMemoryIds,
    setup.insightMemoryId,
    setup.planningMemoryId,
    setup.supplementalMemoryIds,
  ]);

  const persistHistory = useCallback((items: OranSimulationHistoryItem[]) => {
    setHistory(items);
    saveOranSimulationHistory(items);
  }, []);

  const activeHistoryId = useMemo(
    () => history.find((item) => item.title === buildHistoryTitle(setup) && item.step === step)?.id ?? null,
    [history, setup, step],
  );

  const handleToggleMemory = useCallback(
    (id: string) => {
      if (!pickerTarget) {
        const current = dedupeIds([
          setup.insightMemoryId,
          setup.planningMemoryId,
          ...setup.supplementalMemoryIds,
        ]);
        const next = current.includes(id)
          ? current.filter((item) => item !== id)
          : [...current, id];
        const [insightMemoryId = null, planningMemoryId = null, ...supplementalMemoryIds] =
          next;
        setSetup((prev) => ({
          ...prev,
          insightMemoryId,
          planningMemoryId,
          supplementalMemoryIds,
        }));
        return;
      }

      if (pickerTarget === "insight") {
        setSetup((prev) => ({
          ...prev,
          insightMemoryId: prev.insightMemoryId === id ? null : id,
          planningMemoryId:
            prev.planningMemoryId === id ? null : prev.planningMemoryId,
          supplementalMemoryIds: prev.supplementalMemoryIds.filter((item) => item !== id),
        }));
        return;
      }

      if (pickerTarget === "planning") {
        setSetup((prev) => ({
          ...prev,
          planningMemoryId: prev.planningMemoryId === id ? null : id,
          insightMemoryId: prev.insightMemoryId === id ? null : prev.insightMemoryId,
          supplementalMemoryIds: prev.supplementalMemoryIds.filter((item) => item !== id),
        }));
        return;
      }

      if (pickerTarget === "supplemental") {
        setSetup((prev) => {
          const exists = prev.supplementalMemoryIds.includes(id);
          return {
            ...prev,
            supplementalMemoryIds: exists
              ? prev.supplementalMemoryIds.filter((item) => item !== id)
              : [...prev.supplementalMemoryIds, id].filter(
                  (item) => item !== prev.insightMemoryId && item !== prev.planningMemoryId,
                ),
          };
        });
      }
    },
    [pickerTarget, setup.insightMemoryId, setup.planningMemoryId, setup.supplementalMemoryIds],
  );

  const handleStartSimulation = useCallback(() => {
    if (!canSubmit) return;

    const normalizedSetup: OranSimulationSetupState = {
      ...setup,
      mainDirection: setup.mainDirection.trim() || setup.simulationQuestion.trim(),
    };

    const item: OranSimulationHistoryItem = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      step: "scene",
      title: buildHistoryTitle(normalizedSetup),
      setup: normalizedSetup,
      sceneSnapshot: DEFAULT_SCENE_SNAPSHOT,
    };

    persistHistory([item, ...history].slice(0, 20));
    setSetup(normalizedSetup);
    setSceneSnapshot(DEFAULT_SCENE_SNAPSHOT);
    setStep("scene");
  }, [canSubmit, history, persistHistory, setup]);

  const handleRestoreHistory = useCallback((item: OranSimulationHistoryItem) => {
    setSetup(item.setup);
    setSceneSnapshot(item.sceneSnapshot);
    setStep(item.step);
  }, []);

  const handleDeleteHistory = useCallback(
    (id: string) => {
      persistHistory(history.filter((item) => item.id !== id));
    },
    [history, persistHistory],
  );

  const handleSceneSnapshotChange = useCallback(
    (next: OranSimulationSceneSnapshot) => {
      setSceneSnapshot(next);
      persistHistory(
        history.map((item) =>
          item.id === activeHistoryId
            ? { ...item, step: "scene", setup, sceneSnapshot: next }
            : item,
        ),
      );
    },
    [activeHistoryId, history, persistHistory, setup],
  );

  if (step === "scene") {
    return (
      <div className="relative h-[calc(100dvh-56px)] min-h-0 overflow-hidden bg-[#090a0c]">
        <OranSimulationScene
          locale={locale}
          setup={setup}
          sceneSnapshot={sceneSnapshot}
          attachmentNames={[insightMemoryName, planningMemoryName, ...supplementalMemoryNames].filter(
            Boolean,
          )}
          onBack={() => setStep("home")}
          onSnapshotChange={handleSceneSnapshotChange}
        />
      </div>
    );
  }

  return (
    <>
      <div className="oran-sim-home-page relative h-[calc(100dvh-56px)] min-h-0 overflow-auto bg-background">
        <div className="absolute right-5 top-5 z-20">
          <HistorySheet
            locale={locale}
            history={history}
            onRestore={handleRestoreHistory}
            onDelete={handleDeleteHistory}
          />
        </div>

        <div className="flex min-h-full flex-col items-center justify-start px-6 pb-6 pt-[100px] md:px-8 md:pb-8 md:pt-[170px]">
          <InsightComposerPanel
            title="ORAN SIM"
            subtitle={copy.subtitle}
            titleClassName="oran-sim-home-title"
            contentMode="memoryPrompt"
            reportType="planning"
            reportTypeLabel=""
            reportTypeMenuOpen={false}
            onReportTypeMenuOpenChange={() => {}}
            onReportTypeChange={() => {}}
            brandName={setup.brandName}
            onBrandNameChange={(value) =>
              setSetup((prev) => ({ ...prev, brandName: value }))
            }
            category={setup.category}
            onCategoryChange={(value) =>
              setSetup((prev) => ({ ...prev, category: value }))
            }
            competitors={[]}
            competitorInput=""
            onCompetitorInputChange={() => {}}
            onCompetitorKeyDown={() => {}}
            onCompetitorBlur={() => {}}
            onRemoveCompetitor={() => {}}
            selectedMemoryIds={selectedMemoryIds}
            selectedMemorySummary={selectedMemorySummary}
            selectedMemorySummaryNeedsFade={selectedMemorySummaryNeedsFade}
            promptValue={setup.simulationQuestion}
            onPromptValueChange={(value) =>
              setSetup((prev) => ({
                ...prev,
                simulationQuestion: value,
                mainDirection: value || prev.mainDirection,
              }))
            }
            effectiveBrandName={setup.brandName}
            onOpenMemoryDialog={() => {
              setPickerTarget(null);
              setMemoryDialogOpen(true);
            }}
            planningActionLabel={
              locale === "zh"
                ? "上传至少2份附件后，输入或选择预测问题..."
                : "After uploading at least 2 attachments, enter or select a prediction question..."
            }
            emptyMemoryLabel={
              locale === "zh" ? "选择至少2份记忆库附件" : "Select at least 2 memory attachments"
            }
            statusLabel=""
            memoryButtonLabel={
              selectedMemoryIds.length > 0
                ? locale === "zh"
                  ? `${selectedMemoryIds.length}/2 份附件`
                  : `${selectedMemoryIds.length}/2 attachments`
                : locale === "zh"
                  ? "记忆库"
                  : "Attachments"
            }
            memoryHelperText={
              locale === "zh"
                ? "请同时上传品牌洞察报告和策划方案"
                : "Please upload both the brand insight report and planning proposal"
            }
            canSubmit={canSubmit}
            onSubmit={handleStartSimulation}
            submitAriaLabel={locale === "zh" ? "进入仿真" : "Open simulation"}
            submitLabel={locale === "zh" ? "开始预测" : "Start Prediction"}
          />

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {examplePrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() =>
                  setSetup((prev) => ({
                    ...prev,
                    simulationQuestion: prompt,
                    mainDirection: prompt,
                  }))
                }
                className="rounded-full border border-border/40 bg-card/60 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-accent/30 hover:bg-accent/6 hover:text-foreground"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      <MemorySelectionDialog
        open={memoryDialogOpen}
        onOpenChange={(open) => {
          setMemoryDialogOpen(open);
          if (!open) setPickerTarget(null);
        }}
        items={memoryItems}
        selectedIds={activePickerSelectedIds}
        onToggle={handleToggleMemory}
      />
    </>
  );
}
