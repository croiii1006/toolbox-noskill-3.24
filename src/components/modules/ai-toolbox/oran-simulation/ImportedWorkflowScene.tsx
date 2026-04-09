import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import ImportedWorkflowPanel, {
  buildPredictionReportHtml,
  predictionReportTitle,
} from "./ImportedWorkflowPanel";
import ImportedWorkflowStream from "./ImportedWorkflowStream";
import {
  createWorkflowSteps,
  generateWorkflowMessages,
  type WorkflowStep,
} from "./importedWorkflowCopy";
import type { Locale } from "./lib/graphI18n";
import type {
  OranSimulationSceneSnapshot,
  OranSimulationSetupState,
} from "./workflowTypes";
import { useMemory } from "@/contexts/MemoryContext";
import { useOranGenPrefill } from "@/contexts/OranGenPrefillContext";
import { buildMemoryMarkdownFromHtml } from "../InsightWorkbenchReport";

interface ImportedWorkflowSceneProps {
  locale: Locale;
  setup: OranSimulationSetupState;
  sceneSnapshot: OranSimulationSceneSnapshot;
  attachmentNames: string[];
  onNavigate: (itemId: string) => void;
  onBack: () => void;
  onSnapshotChange: (next: OranSimulationSceneSnapshot) => void;
}

interface StreamMessage {
  id: string;
  type:
    | "setup-summary"
    | "checklist"
    | "workflow-group"
    | "system"
    | "status"
    | "confirmation"
    | "complete"
    | "warning";
  content: string;
  timestamp: string;
  stepId?: number;
}

function createTimestamp() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
}

function applyStepState(
  baseSteps: WorkflowStep[],
  currentStep: number,
  isComplete: boolean,
): WorkflowStep[] {
  return baseSteps.map((step) => ({
    ...step,
    status: isComplete
      ? "done"
      : step.id < currentStep
        ? "done"
        : step.id === currentStep && currentStep > 0
          ? "running"
          : "pending",
  }));
}

export default function ImportedWorkflowScene({
  locale,
  setup,
  sceneSnapshot,
  attachmentNames,
  onNavigate,
  onBack,
  onSnapshotChange,
}: ImportedWorkflowSceneProps) {
  const { entries, ensureEntry } = useMemory();
  const { setPrefill: setOranGenPrefill } = useOranGenPrefill();
  const templates = useMemo(
    () => generateWorkflowMessages(setup, attachmentNames, locale),
    [attachmentNames, locale, setup],
  );

  const initialProgress = Math.min(Math.max(sceneSnapshot.progress || 0, 0), 9);
  const initialSelectedStep = Number.parseInt(sceneSnapshot.selectedNodeId || "", 10);
  const hydratedMessages = templates
    .filter((template) => template.stage <= initialProgress)
    .map((template, index) => ({
      id: `${template.stage}-${index}`,
      type: template.type,
      content: template.content,
      timestamp: createTimestamp(),
      stepId: template.stepId,
    }));

  const [currentStep, setCurrentStep] = useState(initialProgress);
  const [selectedStep, setSelectedStep] = useState(
    Number.isFinite(initialSelectedStep) ? initialSelectedStep : Math.max(initialProgress, 1),
  );
  const [isComplete, setIsComplete] = useState(initialProgress >= 9);
  const [steps, setSteps] = useState<WorkflowStep[]>(
    applyStepState(createWorkflowSteps(), initialProgress, initialProgress >= 9),
  );
  const [messages, setMessages] = useState<StreamMessage[]>(hydratedMessages);
  const nextIndexRef = useRef(
    templates.findIndex((template) => template.stage > initialProgress) === -1
      ? templates.length
      : templates.findIndex((template) => template.stage > initialProgress),
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSnapshotKeyRef = useRef(
    JSON.stringify({
      progress: sceneSnapshot.progress,
      selectedView: sceneSnapshot.selectedView,
      runTab: sceneSnapshot.runTab,
      selectedNodeId: sceneSnapshot.selectedNodeId,
    }),
  );

  useEffect(() => {
    if (isComplete) {
      return;
    }

    if (nextIndexRef.current >= templates.length) {
      setIsComplete(true);
      setSteps((prev) => prev.map((step) => ({ ...step, status: "done" })));
      return;
    }

    const pushNext = () => {
      const nextTemplate = templates[nextIndexRef.current];
      if (!nextTemplate) {
        setIsComplete(true);
        setSteps((prev) => prev.map((step) => ({ ...step, status: "done" })));
        return;
      }

      const nextMessage: StreamMessage = {
        id: `${nextTemplate.stage}-${nextIndexRef.current}`,
        type: nextTemplate.type,
        content: nextTemplate.content,
        timestamp: createTimestamp(),
        stepId: nextTemplate.stepId,
      };

      setMessages((prev) => [...prev, nextMessage]);

      if (nextTemplate.stepId) {
        setCurrentStep(nextTemplate.stepId);
        setSelectedStep(nextTemplate.stepId);
        setSteps((prev) =>
          prev.map((step) => ({
            ...step,
            status:
              step.id < nextTemplate.stepId
                ? "done"
                : step.id === nextTemplate.stepId
                  ? nextTemplate.type === "system"
                    ? "done"
                    : "running"
                  : "pending",
          })),
        );
      }

      nextIndexRef.current += 1;
      const delay =
        nextTemplate.type === "confirmation"
          ? 1100
          : nextTemplate.type === "status"
            ? 650
            : 420;
      timerRef.current = setTimeout(pushNext, delay);
    };

    timerRef.current = setTimeout(pushNext, 500);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isComplete, templates]);

  useEffect(() => {
    const nextSnapshot = {
      progress: isComplete ? 9 : currentStep,
      selectedView: isComplete ? "report" : "checklist",
      runTab: "diffusion",
      selectedNodeId: String(selectedStep),
    };
    const nextKey = JSON.stringify(nextSnapshot);

    if (lastSnapshotKeyRef.current === nextKey) {
      return;
    }

    lastSnapshotKeyRef.current = nextKey;
    onSnapshotChange(nextSnapshot);
  }, [currentStep, isComplete, onSnapshotChange, selectedStep]);

  const currentStepData = steps.find((step) => step.id === selectedStep);
  const completedSteps = steps
    .filter((step) => step.status === "done")
    .map((step) => step.id);

  const handleContinueToGeneration = useCallback(() => {
    const title = predictionReportTitle(setup, locale);
    const predictionEntry = ensureEntry({
      title,
      content: buildMemoryMarkdownFromHtml(title, buildPredictionReportHtml(setup, locale)),
      category: locale === "zh" ? "预测报告" : "Prediction Report",
      tags: [setup.brandName, setup.category, "ORAN SIM"].filter(Boolean),
    });

    const attachmentEntries = [
      entries.find((entry) => entry.id === setup.insightMemoryId),
      entries.find((entry) => entry.id === setup.planningMemoryId),
      predictionEntry,
    ].flatMap((entry) => (entry ? [entry] : []));

    setOranGenPrefill({
      attachmentIds: attachmentEntries.map((entry) => entry.id),
      attachmentNames: attachmentEntries.map((entry) => entry.title),
      category: setup.category || undefined,
    });

    onNavigate("skills");
  }, [
    locale,
    entries,
    ensureEntry,
    onNavigate,
    setOranGenPrefill,
    setup,
  ]);

  return (
    <div className="flex h-full bg-background text-foreground">
      <div className="flex h-full min-h-0 w-1/2 flex-col border-r border-border/20">
        <div className="flex flex-shrink-0 items-center gap-2 border-b border-border/20 px-5 py-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground/65 transition-colors hover:text-foreground/80"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="text-xs">{locale === "zh" ? "返回" : "Back"}</span>
          </button>
        </div>

        <ImportedWorkflowStream
          steps={steps}
          messages={messages}
          currentStep={currentStep}
          isComplete={isComplete}
          selectedStep={selectedStep}
          onSelectStep={setSelectedStep}
          locale={locale}
          setup={setup}
          showFollowUpActions={completedSteps.includes(9) && selectedStep === 9}
          onContinueToGeneration={handleContinueToGeneration}
        />
      </div>

      <div className="flex h-full min-h-0 w-1/2 flex-col overflow-hidden">
        <div className="flex flex-shrink-0 items-center border-b border-border/20 px-5 py-3">
          <span className="text-sm text-foreground/80">
            {selectedStep === 0
              ? locale === "zh"
                ? "编写待办清单"
                : "Task Checklist"
              : currentStepData?.title || ""}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <ImportedWorkflowPanel
            step={selectedStep}
            completedSteps={completedSteps}
            locale={locale}
            setup={setup}
            attachmentNames={attachmentNames}
          />
        </div>

        <div className="flex flex-shrink-0 border-t border-border/20">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => setSelectedStep(step.id)}
              className={`flex-1 border-r border-border/20 py-2.5 text-center transition-colors last:border-r-0 ${
                step.id === selectedStep ? "bg-card" : "bg-muted/20 hover:bg-muted/35"
              }`}
            >
              <p
                className={`font-mono text-sm ${
                  step.id === selectedStep ? "text-foreground/80" : "text-muted-foreground/60"
                }`}
              >
                {String(step.id).padStart(2, "0")}
              </p>
              {step.status === "done" ? (
                <p className="mt-0.5 text-[8px] tracking-[0.2em] text-accent/80">DONE</p>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
