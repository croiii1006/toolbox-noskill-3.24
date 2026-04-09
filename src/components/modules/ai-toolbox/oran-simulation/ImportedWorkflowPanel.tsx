import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Database, FileText } from "lucide-react";
import Checklist from "./imported-artifacts/Checklist";
import ParsedInputs from "./imported-artifacts/ParsedInputs";
import SimScope from "./imported-artifacts/SimScope";
import KnowledgeGraph from "./imported-artifacts/KnowledgeGraph";
import EnvironmentModel from "./imported-artifacts/EnvironmentModel";
import AgentClusters from "./imported-artifacts/AgentClusters";
import ActivationStrategy from "./imported-artifacts/ActivationStrategy";
import SimMonitor from "./imported-artifacts/SimMonitor";
import FinalReport from "./imported-artifacts/FinalReport";
import type { Locale } from "./lib/graphI18n";
import type { OranSimulationSetupState } from "./workflowTypes";
import { useMemory } from "@/contexts/MemoryContext";
import { Button } from "@/components/ui/button";
import { buildMemoryMarkdownFromHtml } from "../InsightWorkbenchReport";
import {
  compareDirection,
  daysLabel,
  formatPlatforms,
  memoryDocumentName,
  primaryDirection,
  projectTitle,
} from "./importedWorkflowCopy";
import { toast } from "sonner";

interface ImportedWorkflowPanelProps {
  step: number;
  completedSteps: number[];
  locale: Locale;
  setup: OranSimulationSetupState;
  attachmentNames: string[];
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function predictionReportTitle(setup: OranSimulationSetupState, locale: Locale) {
  const baseName = setup.brandName || setup.projectName || (locale === "zh" ? "未命名品牌" : "Untitled Brand");
  return locale === "zh" ? `${baseName} 预测报告` : `${baseName} Prediction Report`;
}

export function buildPredictionReportHtml(setup: OranSimulationSetupState, locale: Locale) {
  const title = predictionReportTitle(setup, locale);
  const summaryDirection =
    primaryDirection(setup, locale) || (locale === "zh" ? "长期安全有效" : "Long-term safe and effective");
  const compare = compareDirection(setup, locale) || (locale === "zh" ? "高压场景" : "High-pressure scenario");
  const cycle = daysLabel(setup.cycleDays, locale);
  const platforms = formatPlatforms(setup.platforms, locale);
  const question =
    setup.simulationQuestion || (locale === "zh" ? "围绕当前营销方案生成群体智能扩散预测。" : "Generate a diffusion forecast for the current marketing plan.");

  return `<!DOCTYPE html>
<html lang="${locale === "zh" ? "zh-CN" : "en"}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #ffffff;
        --card: #ffffff;
        --line: #e8ebf2;
        --text: #14213d;
        --muted: #6b7280;
        --accent: #f97316;
        --accent-soft: rgba(249, 115, 22, 0.08);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 32px;
        background: var(--bg);
        color: var(--text);
        font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
      }
      .report {
        max-width: 980px;
        margin: 0 auto;
        border: 1px solid var(--line);
        border-radius: 28px;
        overflow: hidden;
        background: var(--card);
        box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
      }
      .hero {
        padding: 30px 34px 22px;
        border-bottom: 1px solid var(--line);
      }
      .eyebrow {
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--accent);
      }
      h1 {
        margin: 12px 0 10px;
        font-size: 34px;
        line-height: 1.16;
      }
      .question {
        margin: 0;
        color: var(--muted);
        line-height: 1.7;
        font-size: 15px;
      }
      .meta, .stats {
        display: grid;
        gap: 12px;
      }
      .meta {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        margin-top: 18px;
      }
      .stats {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        padding: 24px 34px 0;
      }
      .card {
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 14px 16px;
        background: #fff;
      }
      .card-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--muted);
      }
      .card-value {
        margin-top: 8px;
        font-size: 18px;
        line-height: 1.4;
      }
      .section {
        padding: 24px 34px 0;
      }
      .section:last-child {
        padding-bottom: 34px;
      }
      .section h2 {
        margin: 0 0 12px;
        font-size: 16px;
      }
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .summary-item {
        border-radius: 18px;
        padding: 14px 16px;
        background: var(--accent-soft);
        border: 1px solid rgba(249, 115, 22, 0.12);
      }
      .summary-item strong {
        display: block;
        margin-bottom: 8px;
        font-size: 13px;
      }
      .summary-item p,
      .section p,
      .section li {
        margin: 0;
        line-height: 1.8;
        color: #314158;
        font-size: 14px;
      }
      ul {
        margin: 0;
        padding-left: 18px;
      }
      .risk {
        color: #c2410c;
      }
    </style>
  </head>
  <body>
    <article class="report">
      <header class="hero">
        <div class="eyebrow">ORAN SIM REPORT</div>
        <h1>${escapeHtml(title)}</h1>
        <p class="question">${escapeHtml(question)}</p>
        <div class="meta">
          <div class="card">
            <div class="card-label">${locale === "zh" ? "品牌 / 品类" : "Brand / Category"}</div>
            <div class="card-value">${escapeHtml(setup.brandName || "-")} / ${escapeHtml(setup.category || "-")}</div>
          </div>
          <div class="card">
            <div class="card-label">${locale === "zh" ? "模拟周期 / 平台" : "Cycle / Platforms"}</div>
            <div class="card-value">${escapeHtml(cycle)} / ${escapeHtml(platforms)}</div>
          </div>
        </div>
      </header>

      <section class="stats">
        <div class="card">
          <div class="card-label">${locale === "zh" ? "推荐方向" : "Recommended Direction"}</div>
          <div class="card-value">${escapeHtml(summaryDirection)}</div>
        </div>
        <div class="card">
          <div class="card-label">${locale === "zh" ? "保留方向" : "Backup Direction"}</div>
          <div class="card-value">${escapeHtml(compare)}</div>
        </div>
        <div class="card">
          <div class="card-label">${locale === "zh" ? "互动提升" : "Engagement Lift"}</div>
          <div class="card-value">+35% ~ +52%</div>
        </div>
        <div class="card">
          <div class="card-label">${locale === "zh" ? "置信度" : "Confidence"}</div>
          <div class="card-value">78%</div>
        </div>
      </section>

      <section class="section">
        <h2>${locale === "zh" ? "关键结论" : "Key Takeaways"}</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <strong>${locale === "zh" ? "扩散路径" : "Diffusion Path"}</strong>
            <p>${locale === "zh" ? "种子投放 Day 1-3，算法放大 Day 4-7，社交裂变 Day 8-14，搜索回流 Day 15-30，长尾复访 Day 31-60。" : "Seed activation on Day 1-3, algorithmic amplification on Day 4-7, social spread on Day 8-14, search return on Day 15-30, and long-tail revisit on Day 31-60."}</p>
          </div>
          <div class="summary-item">
            <strong>${locale === "zh" ? "人群贡献" : "Audience Contribution"}</strong>
            <p>${locale === "zh" ? "情绪传播型用户贡献 38% 分享量，高意向核心人群贡献 45% 深度互动，专业判断型用户提供高质量评论沉淀。" : "Emotion-driven users contribute 38% of shares, high-intent users drive 45% of deep engagement, and expert users improve the quality of comments and search recall."}</p>
          </div>
          <div class="summary-item">
            <strong>${locale === "zh" ? "生命周期" : "Lifecycle"}</strong>
            <p>${locale === "zh" ? `主方向 ${summaryDirection} 在 Day 12 达峰，Day 45 仍保留 35% 热度；对比方向 ${compare} 起量更快，但 Day 20 后衰减明显。` : `${summaryDirection} peaks around Day 12 and still keeps 35% heat by Day 45, while ${compare} ramps faster but decays significantly after Day 20.`}</p>
          </div>
          <div class="summary-item">
            <strong>${locale === "zh" ? "方向建议" : "Direction Recommendation"}</strong>
            <p>${locale === "zh" ? `建议以前 ${summaryDirection}、后 ${compare} 的节奏交叉投放，主方向预算占比 65%，后续补量方向占比 35%。` : `Use a staggered plan with ${summaryDirection} first and ${compare} later, allocating 65% of budget to the primary direction and 35% to the follow-up direction.`}</p>
          </div>
        </div>
      </section>

      <section class="section">
        <h2>${locale === "zh" ? "执行建议" : "Execution Notes"}</h2>
        <ul>
          <li>${locale === "zh" ? "Day 1 即可启动首波内容与种子用户投放，确保主方向快速起量。" : "Launch the first content wave and seed-user activation on Day 1 to accelerate the primary direction."}</li>
          <li>${locale === "zh" ? "Day 10-15 重点观察竞品噪声与负面词趋势，准备备用内容池。" : "Monitor competitor noise and negative keyword trends closely around Day 10-15 and prepare backup content."}</li>
          <li>${locale === "zh" ? "Day 15 后逐步引入对比方向，承接搜索回流与内容续航。" : "Gradually introduce the backup direction after Day 15 to catch search return and extend content lifespan."}</li>
        </ul>
      </section>

      <section class="section">
        <h2>${locale === "zh" ? "风险提示" : "Risk Alerts"}</h2>
        <ul class="risk">
          <li>${locale === "zh" ? "Day 10-15 存在竞品利用“化学成分”话题进行负面引导的风险。" : "There is a risk that competitors may amplify negative narratives around chemical ingredients on Day 10-15."}</li>
          <li>${locale === "zh" ? "小红书对功效宣称审核趋严，需确保内容合规。" : "Xiaohongshu is tightening review on efficacy claims, so compliance checks are required."}</li>
        </ul>
      </section>
    </article>
  </body>
</html>`;
}

function getAttachmentDisplayName(
  index: number,
  name: string,
  setup: OranSimulationSetupState,
  locale: Locale,
) {
  if (index === 0) {
    return memoryDocumentName("insight", setup.brandName, name, locale);
  }

  if (index === 1) {
    return memoryDocumentName("planning", setup.brandName, name, locale);
  }

  return name;
}

function SetupSummary({
  locale,
  setup,
  attachmentNames,
  onPreview,
}: {
  locale: Locale;
  setup: OranSimulationSetupState;
  attachmentNames: string[];
  onPreview: (name: string) => void;
}) {
  const fields = [
    { label: locale === "zh" ? "项目名称" : "Project", value: projectTitle(setup, locale) },
    { label: locale === "zh" ? "品牌名称" : "Brand", value: setup.brandName || "-" },
    { label: locale === "zh" ? "模拟周期" : "Cycle", value: daysLabel(setup.cycleDays, locale) },
    { label: locale === "zh" ? "目标平台" : "Platforms", value: formatPlatforms(setup.platforms, locale) },
    { label: locale === "zh" ? "主方向" : "Primary", value: primaryDirection(setup, locale) },
    { label: locale === "zh" ? "对比方向" : "Compare", value: compareDirection(setup, locale) },
    {
      label: locale === "zh" ? "竞品扰动" : "Competitor Noise",
      value: setup.competitorDisturbance
        ? locale === "zh"
          ? "已启用"
          : "Enabled"
        : locale === "zh"
          ? "已关闭"
          : "Disabled",
    },
    {
      label: locale === "zh" ? "风险反馈" : "Risk Feedback",
      value: setup.riskFeedback
        ? locale === "zh"
          ? "已启用"
          : "Enabled"
        : locale === "zh"
          ? "已关闭"
          : "Disabled",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/20 bg-card/90 p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-normal text-foreground/80">
          <CheckCircle2 className="h-3.5 w-3.5 text-accent/80" /> Setup 摘要
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {fields.map((field) => (
            <div key={field.label} className="rounded-xl bg-muted/20 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
                {field.label}
              </p>
              <p className="mt-1 text-sm text-foreground/80">{field.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border/20 bg-card/90 p-5">
        <h3 className="mb-3 text-sm font-normal text-foreground/80">上传文件</h3>
        <div className="space-y-2">
          {attachmentNames.map((file, index) => (
            <button
              key={`${file}-${index}`}
              type="button"
              onClick={() => onPreview(file)}
              className="flex w-full items-center gap-2 rounded-xl bg-muted/20 px-3 py-2.5 text-left transition-colors hover:bg-accent/10"
            >
              <FileText className="h-3.5 w-3.5 text-accent/80" />
              <span className="text-sm text-foreground/70">
                {getAttachmentDisplayName(index, file, setup, locale)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function HtmlPreview({
  name,
  html,
  onBack,
}: {
  name: string;
  html: string;
  onBack: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-border/20 bg-card/90">
      <div className="flex items-center gap-3 border-b border-border/20 px-5 py-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground/65 transition-colors hover:text-foreground/80"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{name}</span>
        </button>
      </div>
      <div className="min-h-0 flex-1">
        <iframe title={name} srcDoc={html} className="h-full w-full border-0 bg-white" />
      </div>
    </div>
  );
}

function ReportWorkspace({
  locale,
  setup,
  onSaveToMemory,
}: {
  locale: Locale;
  setup: OranSimulationSetupState;
  onSaveToMemory: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-border/20 bg-card/90 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground/60">
            {locale === "zh" ? "Prediction Artifact" : "Prediction Artifact"}
          </p>
          <h3 className="mt-1 text-sm text-foreground/80">
            {predictionReportTitle(setup, locale)}
          </h3>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 rounded-lg text-xs"
          onClick={onSaveToMemory}
        >
          <Database className="mr-1.5 h-3.5 w-3.5" />
          {locale === "zh" ? "存入记忆库" : "Save to Memory"}
        </Button>
      </div>

      <FinalReport />
    </div>
  );
}

export default function ImportedWorkflowPanel({
  step,
  completedSteps,
  locale,
  setup,
  attachmentNames,
}: ImportedWorkflowPanelProps) {
  const { entries, ensureEntry, setDrawerOpen } = useMemory();
  const [previewName, setPreviewName] = useState<string | null>(null);

  useEffect(() => {
    setPreviewName(null);
  }, [step]);

  const attachmentHtmlMap = useMemo(() => {
    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const extractEmbeddedHtml = (value?: string) => {
      if (!value) {
        return null;
      }

      const match = value.match(/```html\s*([\s\S]*?)```/i);
      return match?.[1]?.trim() || null;
    };

    const buildHtml = (
      name: string,
      entry?: {
        title: string;
        content: string;
        category?: string;
        tags?: string[];
        createdAt?: string;
        updatedAt?: string;
      },
    ) => `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(name)}</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f6f7fb;
        --card: #ffffff;
        --line: #e7e8ef;
        --text: #1f2937;
        --muted: #6b7280;
        --accent: #ed8936;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 32px;
        background: #ffffff;
        color: var(--text);
        font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
      }
      .card {
        max-width: 920px;
        margin: 0 auto;
        background: var(--card);
        border: 1px solid var(--line);
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
      }
      .hero {
        padding: 28px 32px 18px;
        border-bottom: 1px solid var(--line);
        background: linear-gradient(135deg, rgba(237, 137, 54, 0.12), rgba(255,255,255,0.9));
      }
      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: var(--accent);
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      h1 {
        margin: 14px 0 10px;
        font-size: 30px;
        line-height: 1.2;
      }
      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 14px;
      }
      .chip {
        padding: 8px 12px;
        border: 1px solid var(--line);
        border-radius: 999px;
        font-size: 12px;
        color: var(--muted);
        background: rgba(255,255,255,0.85);
      }
      .content {
        padding: 28px 32px 32px;
      }
      .section-title {
        margin: 0 0 14px;
        font-size: 13px;
        color: var(--muted);
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .prose {
        font-size: 16px;
        line-height: 1.9;
        white-space: pre-wrap;
      }
      .empty {
        padding: 18px;
        border: 1px dashed var(--line);
        border-radius: 18px;
        color: var(--muted);
        background: #fafafb;
      }
    </style>
  </head>
  <body>
    <article class="card">
      <header class="hero">
        <div class="eyebrow">ORAN SIM FILE</div>
        <h1>${escapeHtml(entry?.title || name)}</h1>
        <div class="meta">
          <span class="chip">分类：${escapeHtml(entry?.category || "未分类")}</span>
          <span class="chip">标签：${escapeHtml(entry?.tags?.join(" / ") || "无")}</span>
          <span class="chip">创建：${escapeHtml(entry?.createdAt || "-")}</span>
          <span class="chip">更新：${escapeHtml(entry?.updatedAt || "-")}</span>
        </div>
      </header>
      <section class="content">
        <h2 class="section-title">Document Content</h2>
        ${
          entry?.content
            ? `<div class="prose">${escapeHtml(entry.content)}</div>`
            : `<div class="empty">暂无对应内容，当前仅展示文件名预览。</div>`
        }
      </section>
    </article>
  </body>
</html>`;

    return attachmentNames.reduce<Record<string, string>>((acc, name, index) => {
      const entry = entries.find((item) => item.title === name);
      const embeddedHtml = extractEmbeddedHtml(entry?.content);
      acc[name] =
        embeddedHtml || buildHtml(getAttachmentDisplayName(index, name, setup, locale), entry);
      return acc;
    }, {});
  }, [attachmentNames, entries, locale, setup]);

  const previewDisplayName = useMemo(() => {
    if (!previewName) {
      return "";
    }

    const index = attachmentNames.indexOf(previewName);
    if (index === -1) {
      return previewName;
    }

    return getAttachmentDisplayName(index, previewName, setup, locale);
  }, [attachmentNames, locale, previewName, setup]);

  const persistPredictionReport = () => {
    const title = predictionReportTitle(setup, locale);
    const html = buildPredictionReportHtml(setup, locale);

    return ensureEntry({
      title,
      content: buildMemoryMarkdownFromHtml(title, html),
      category: locale === "zh" ? "预测报告" : "Prediction Report",
      tags: [
        setup.brandName,
        setup.category,
        primaryDirection(setup, locale),
        locale === "zh" ? "ORAN SIM" : "ORAN SIM",
      ].filter(Boolean),
    });
    setDrawerOpen(true);
    toast.success(locale === "zh" ? "预测报告已保存到记忆库" : "Prediction report saved to memory");
  };

  const handleSavePredictionReport = () => {
    persistPredictionReport();
    setDrawerOpen(true);
    toast.success(
      locale === "zh"
        ? "预测报告已保存到记忆库"
        : "Prediction report saved to memory",
    );
  };

  if (previewName) {
    return (
      <HtmlPreview
        name={previewDisplayName}
        html={attachmentHtmlMap[previewName] || ""}
        onBack={() => setPreviewName(null)}
      />
    );
  }

  switch (step) {
    case 0:
      return <Checklist completedSteps={completedSteps} />;
    case 1:
      return (
        <SetupSummary
          locale={locale}
          setup={setup}
          attachmentNames={attachmentNames}
          onPreview={setPreviewName}
        />
      );
    case 2:
      return <ParsedInputs />;
    case 3:
      return <SimScope />;
    case 4:
      return <KnowledgeGraph />;
    case 5:
      return <EnvironmentModel />;
    case 6:
      return <AgentClusters />;
    case 7:
      return <ActivationStrategy />;
    case 8:
      return <SimMonitor />;
    case 9:
      return (
        <ReportWorkspace
          locale={locale}
          setup={setup}
          onSaveToMemory={handleSavePredictionReport}
        />
      );
    default:
      return (
        <SetupSummary
          locale={locale}
          setup={setup}
          attachmentNames={attachmentNames}
          onPreview={setPreviewName}
        />
      );
  }
}
