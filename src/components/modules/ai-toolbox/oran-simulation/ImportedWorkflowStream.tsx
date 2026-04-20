import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { WorkflowStep, StreamMessage } from "./importedWorkflowCopy";
import {
  CheckSquare,
  ListChecks,
  ChevronRight,
  ArrowRight,
  Loader2,
  Settings2,
  Cpu,
  Target,
  Network,
  Box,
  Users,
  Zap,
  Play,
  BarChart3,
} from "lucide-react";
import { compareDirection, daysLabel, formatPlatforms, projectTitle } from "./importedWorkflowCopy";
import type { Locale } from "./lib/graphI18n";
import type { OranSimulationSetupState } from "./workflowTypes";

const stepIcons: Record<number, React.ElementType> = {
  1: Settings2,
  2: Cpu,
  3: Target,
  4: Network,
  5: Box,
  6: Users,
  7: Zap,
  8: Play,
  9: BarChart3,
};

interface Props {
  steps: WorkflowStep[];
  messages: StreamMessage[];
  currentStep: number;
  selectedStep: number;
  isComplete: boolean;
  onSelectStep: (step: number) => void;
  locale: Locale;
  setup: OranSimulationSetupState;
  showFollowUpActions: boolean;
  onContinueToGeneration: () => void;
}

const StepCard = ({
  step,
  isSelected,
  onClick,
}: {
  step: WorkflowStep;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const Icon = stepIcons[step.id] || Settings2;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 rounded-xl px-3 py-3 text-left transition-all ${
        isSelected
          ? "border border-accent/25 bg-accent/5"
          : "border border-border/20 bg-muted/10 hover:bg-muted/60"
      }`}
    >
      <div className="w-9 h-9 rounded-lg bg-muted/30 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-muted-foreground/60" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground/80">{step.title}</p>
        <p className="text-xs text-muted-foreground/60 mt-0.5 truncate">
          {step.status === "done"
            ? `已完成${step.id === 2 ? "，已提取三层结构化输入" : step.id === 4 ? "，已生成 24 节点" : step.id === 6 ? "，已生成 5 个群体" : ""}`
            : step.status === "running"
              ? "处理中..."
              : step.description}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-mono text-base text-muted-foreground/40">{String(step.id).padStart(2, "0")}</p>
        {step.status === "done" && (
          <p className="font-pixel text-[9px] text-accent/80 tracking-widest leading-tight">DONE</p>
        )}
        {step.status === "running" && (
          <Loader2 className="w-3 h-3 text-accent/80 animate-spin ml-auto" />
        )}
      </div>
    </button>
  );
};

const CheckmarkMessage = ({ content }: { content: string }) => (
  <div className="flex items-start gap-2.5 py-1 animate-fade-in-up">
    <CheckSquare className="w-3.5 h-3.5 text-accent/80 mt-0.5 flex-shrink-0" />
    <span className="text-sm text-foreground/70 leading-relaxed">{content}</span>
  </div>
);

const BulletMessage = ({ content }: { content: string }) => (
  <div className="flex items-start gap-2.5 py-1 animate-fade-in-up">
    <span className="text-muted-foreground/40 mt-0.5 flex-shrink-0 text-xs">•</span>
    <span className="text-sm text-foreground/70">{content}</span>
  </div>
);

const ActionRow = ({
  icon: Icon,
  label,
  sublabel,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className="w-full flex border border-border/20 items-center gap-3 py-3 hover:bg-muted/20 rounded-xl px-3 transition-colors animate-fade-in-up"
  >
    <Icon className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
    <span className="text-sm text-foreground/80">{label}</span>
    {sublabel && <span className="text-xs text-muted-foreground/60">{sublabel}</span>}
    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 ml-auto flex-shrink-0" />
  </button>
);

function formatStatusLine(content: string, stepDone: boolean, locale: Locale) {
  if (!stepDone) {
    return content;
  }

  const trimmed = content.trim();
  if (locale === "zh") {
    return trimmed.replace(/^正在/, "已完成").replace(/(\.\.\.|…)+$/u, "");
  }

  if (/^Running/i.test(trimmed)) {
    return trimmed.replace(/^Running/i, "Completed");
  }

  return `Completed ${trimmed}`.trim();
}

const SetupSummaryBlock = ({
  locale,
  setup,
}: {
  locale: Locale;
  setup: OranSimulationSetupState;
}) => (
  <div className="rounded-xl border border-border/20 bg-muted/20 px-4 py-3 flex items-center gap-4 flex-wrap text-sm animate-fade-in-up">
    <div className="flex items-center gap-2">
      <Settings2 className="w-3.5 h-3.5 text-muted-foreground/50" />
      <span className="text-xs text-foreground/70">{projectTitle(setup, locale)}</span>
    </div>
    <span className="inline-flex h-5 items-center rounded-full bg-foreground/5 border border-border/30 px-2 text-[10px] text-foreground/70">
      {daysLabel(setup.cycleDays, locale).replace(" ", "")}
    </span>
    <span className="inline-flex h-5 items-center rounded-full bg-foreground/5 border border-border/30 px-2 text-[10px] text-foreground/70">
      {formatPlatforms(setup.platforms, locale).replace("、", " · ")}
    </span>
    <span className="inline-flex h-5 items-center rounded-full bg-accent/8 border border-accent/25 px-2 text-[10px] text-accent/80">
      {locale === "zh" ? `${setup.compareDirections.filter((item) => item.trim()).length + 1} 个方向` : `${setup.compareDirections.filter((item) => item.trim()).length + 1} directions`}
    </span>
  </div>
);

export default function ImportedWorkflowStream({
  steps,
  messages,
  currentStep,
  selectedStep,
  isComplete,
  onSelectStep,
  locale,
  setup,
  showFollowUpActions,
  onContinueToGeneration,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const frameRef = useRef<number | null>(null);

  const updateAutoScrollState = () => {
    if (!scrollRef.current) return;

    const { scrollHeight, scrollTop, clientHeight } = scrollRef.current;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    shouldAutoScrollRef.current = distanceFromBottom < 80;
  };

  useEffect(() => {
    if (!shouldAutoScrollRef.current) {
      return;
    }

    if (frameRef.current) {
      window.cancelAnimationFrame(frameRef.current);
    }

    frameRef.current = window.requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({
        block: "end",
        behavior: "smooth",
      });
    });

    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [messages.length]);

  const hasSetupSummary = messages.some((m) => m.type === "setup-summary");
  const hasChecklist = messages.some((m) => m.type === "checklist");

  const streamMessages = messages.filter(
    (m) => !["setup-summary", "checklist", "workflow-group"].includes(m.type),
  );

  return (
    <div
      ref={scrollRef}
      onScroll={updateAutoScrollState}
      className="oran-sim-scrollbar-hidden flex-1 overflow-y-auto scroll-smooth px-6 py-6 pb-[60px] motion-reduce:scroll-auto"
    >
      <div className="max-w-3xl mx-auto space-y-3">
        {hasSetupSummary && <SetupSummaryBlock locale={locale} setup={setup} />}

        {hasChecklist && (
          <ActionRow
            icon={ListChecks}
            label="编写待办清单"
            sublabel={`${steps.filter((s) => s.status === "done").length}/${steps.length}`}
            onClick={() => onSelectStep(0)}
          />
        )}

        {hasChecklist && streamMessages.length > 0 && (
          <div className="flex justify-center">
            <div className="w-px h-5 border-l border-dashed border-border/40" />
          </div>
        )}

        {streamMessages.map((msg, i) => {
          const elements: ReactNode[] = [];

          if (msg.stepId && msg.type === "status") {
            const step = steps.find((s) => s.id === msg.stepId);
            const isFirstForStep = !streamMessages
              .slice(0, i)
              .some((m) => m.stepId === msg.stepId && m.type === "status");
            if (step && isFirstForStep) {
              if (i > 0) {
                elements.push(
                  <div key={`line-${step.id}`} className="flex justify-center">
                    <div className="w-px h-5 border-l border-dashed border-border/40" />
                  </div>,
                );
              }
              elements.push(
                <StepCard
                  key={`step-${step.id}`}
                  step={step}
                  isSelected={step.id === selectedStep}
                  onClick={() => onSelectStep(step.id)}
                />,
              );
            }
          }

          const stepDone = msg.stepId ? steps.find((s) => s.id === msg.stepId)?.status === "done" : false;

          if (msg.type === "confirmation" || msg.type === "complete") {
            elements.push(<CheckmarkMessage key={msg.id} content={msg.content} />);
          } else if (msg.type === "system") {
            elements.push(<BulletMessage key={msg.id} content={msg.content} />);
          } else if (msg.type === "status") {
            elements.push(
              <div key={msg.id} className="flex items-center gap-2 px-3 py-0.5 animate-fade-in-up">
                {stepDone ? (
                  <CheckSquare className="w-3 h-3 text-accent/50 flex-shrink-0" />
                ) : (
                  <Loader2 className="w-3 h-3 text-accent/60 animate-spin flex-shrink-0" />
                )}
                <span className="text-xs text-muted-foreground/60">
                  {formatStatusLine(msg.content, stepDone, locale)}
                </span>
              </div>,
            );
          } else if (msg.type === "warning") {
            elements.push(<BulletMessage key={msg.id} content={msg.content} />);
          }

          return elements;
        })}

        {showFollowUpActions ? (
          <>
            <div className="flex justify-center">
              <div className="h-5 w-px border-l border-dashed border-border/40" />
            </div>

            <section className="space-y-3 animate-fade-in-up">
              <div className="space-y-1 px-3">
                <h3 className="text-[14px] font-light tracking-tight text-foreground">
                  {locale === "zh" ? "接下来" : "Next"}
                </h3>
              </div>

              <button
                type="button"
                onClick={onContinueToGeneration}
                className="group flex min-h-[30px] w-full items-center justify-between rounded-[22px] border border-border/40 bg-background/90 px-5 py-3 text-left transition-all hover:border-foreground/25 hover:bg-muted/30"
              >
                <div className="space-y-1">
                  <div className="text-[13px] font-medium text-foreground/70">
                    {locale === "zh"
                      ? "根据已有报告，进入内容生成"
                      : "Use current reports to continue into content generation"}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-accent/80 transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
              </button>
            </section>
          </>
        ) : null}

        <div ref={bottomRef} aria-hidden="true" className="h-px w-full" />
      </div>
    </div>
  );
}
