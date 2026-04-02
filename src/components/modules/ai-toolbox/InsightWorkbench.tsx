import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Plus,
  X,
} from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCredits } from '@/contexts/CreditsContext';
import { useMemory } from '@/contexts/MemoryContext';
import { cn } from '@/lib/utils';
import {
  MemorySelectionDialog,
  type MemorySelectItem,
} from '@/components/modules/memory/MemorySelectionDialog';
import { InsufficientCreditsDrawer } from '@/components/modules/InsufficientCreditsDrawer';
import { InsightComposerPanel } from './InsightComposerPanel';
import { ShowcaseCard, SHOWCASE_CARDS } from './app-plaza/ShowcaseCard';
import { InsightWorkbenchReport } from './InsightWorkbenchReport';

type Step = 'input' | 'reading' | 'confirm' | 'generating' | 'report';
type ReportType = 'insight' | 'planning';

interface ExtractedInfo {
  brandName: string;
  category: string;
  sellingPoints: string[];
  targetMarket: string;
  analysisTarget: string;
  websiteType: string;
  businessDirection: string;
}

const GENERATION_COST = 50;
const CASES_PER_PAGE = 16;
const DEBUG_STAY_ON_PROCESSING_PAGE = false;

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  insight: '洞察报告',
  planning: '策划方案',
};

const READING_STEPS = [
  { label: '品牌信息校验中', delay: 700 },
  { label: '竞品关系整理中', delay: 1500 },
  { label: '洞察上下文补全中', delay: 2400 },
];

const GENERATING_PHASES = [
  { label: '生成内容结构', delay: 1000 },
  { label: '提炼竞品差异点', delay: 2200 },
  { label: '整理市场机会判断', delay: 3600 },
  { label: '补充策略建议', delay: 5000 },
  { label: '合成 HTML 结果', delay: 6600 },
];

function buildExtractedInfo(params: {
  brandName: string;
  category: string;
  competitors: string[];
  selectedMemoryCount: number;
  reportType: ReportType;
}): ExtractedInfo {
  const { brandName, category, competitors, selectedMemoryCount, reportType } = params;
  const leadCompetitor = competitors[0] || '头部竞品';

  return {
    brandName: brandName.trim(),
    category: category.trim(),
    sellingPoints: [
      `围绕 ${leadCompetitor} 做差异化判断`,
      selectedMemoryCount > 0 ? '已补充记忆库背景信息' : '基于结构化输入快速分析',
      reportType === 'planning' ? '适合继续延展为策划方案' : '适合继续延展为洞察结论',
    ],
    targetMarket: '目标市场待确认',
    analysisTarget: competitors.join('、'),
    websiteType: selectedMemoryCount > 0 ? '结构化输入 + 记忆库' : '结构化品牌输入',
    businessDirection:
      reportType === 'planning' ? '营销策划 / 执行方案' : '市场洞察 / 竞品分析',
  };
}

export function InsightWorkbench({ onNavigate }: { onNavigate?: (id: string) => void }) {
  const { deduct, canAfford, shortfall } = useCredits();
  const { entries } = useMemory();

  const [step, setStep] = useState<Step>('input');
  const [brandName, setBrandName] = useState('');
  const [category, setCategory] = useState('');
  const [reportType, setReportType] = useState<ReportType>('insight');
  const [reportTypeMenuOpen, setReportTypeMenuOpen] = useState(false);
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [competitorInput, setCompetitorInput] = useState('');
  const [selectedMemoryIds, setSelectedMemoryIds] = useState<string[]>([]);
  const [memoryDialogOpen, setMemoryDialogOpen] = useState(false);
  const [creditsDrawerOpen, setCreditsDrawerOpen] = useState(false);
  const [readingProgress, setReadingProgress] = useState<boolean[]>([]);
  const [generatingPhases, setGeneratingPhases] = useState<boolean[]>([]);
  const [newTag, setNewTag] = useState('');
  const [casesPage, setCasesPage] = useState(0);
  const [extractedInfo, setExtractedInfo] = useState<ExtractedInfo>({
    brandName: '',
    category: '',
    sellingPoints: [],
    targetMarket: '',
    analysisTarget: '',
    websiteType: '',
    businessDirection: '',
  });

  const competitorInputRef = useRef<HTMLInputElement>(null);
  const readingTextViewportRefs = useRef<Array<HTMLDivElement | null>>([]);
  const processingViewportRef = useRef<HTMLDivElement | null>(null);
  const latestProcessingItemRef = useRef<HTMLDivElement | null>(null);
  const [completedReadingDocCount, setCompletedReadingDocCount] = useState(0);
  const [visibleReadingDocCount, setVisibleReadingDocCount] = useState(1);

  const memoryItems: MemorySelectItem[] = useMemo(
    () =>
      entries.map((entry) => ({
        id: entry.id,
        name: entry.title,
        desc: entry.content.slice(0, 60),
        tag: entry.category,
        charCount: entry.content.length,
      })),
    [entries]
  );

  const selectedMemoryNames = useMemo(
    () =>
      selectedMemoryIds
        .map((id) => memoryItems.find((item) => item.id === id)?.name)
        .filter((name): name is string => Boolean(name)),
    [memoryItems, selectedMemoryIds]
  );
  const selectedMemoryPrimaryName = selectedMemoryNames[0] ?? '';
  const selectedMemorySummary = selectedMemoryNames.join('、');
  const selectedMemorySummaryNeedsFade = selectedMemorySummary.length > 25;
  const effectiveBrandName =
    reportType === 'planning' ? selectedMemoryPrimaryName || brandName.trim() : brandName.trim();
  const canSubmit =
    reportType === 'planning'
      ? selectedMemoryIds.length > 0 && Boolean(effectiveBrandName)
      : brandName.trim() && category.trim() && competitors.length > 0;
  const activeCases = useMemo(
    () =>
      SHOWCASE_CARDS.filter((card) =>
        reportType === 'planning' ? card.category === 'campaign' : card.category === 'market'
      ),
    [reportType]
  );
  const totalPages = Math.max(1, Math.ceil(activeCases.length / CASES_PER_PAGE));
  const pagedCases = activeCases.slice(
    casesPage * CASES_PER_PAGE,
    (casesPage + 1) * CASES_PER_PAGE
  );
  const reportTypeLabel = REPORT_TYPE_LABELS[reportType];
  const selectedMemoryFiles = useMemo(
    () =>
      selectedMemoryIds
        .map((id) => memoryItems.find((item) => item.id === id))
        .filter((item): item is MemorySelectItem => Boolean(item)),
    [memoryItems, selectedMemoryIds]
  );
  const streamRequestText = useMemo(() => {
    if (reportType === 'planning') {
      const memoryPrefix = selectedMemorySummary || '记忆库资料';
      return `基于 ${memoryPrefix}，为我生成 ${effectiveBrandName || '该品牌'} 的${reportTypeLabel}。`;
    }

    const competitorsText = competitors.length > 0 ? competitors.join('、') : '竞品线索';
    return `为我生成 ${effectiveBrandName || '该品牌'}、${category || '目标品类'}、${competitorsText} 的${reportTypeLabel}。`;
  }, [category, competitors, effectiveBrandName, reportType, reportTypeLabel, selectedMemorySummary]);
  const readingDocumentItems = useMemo(() => {
    if (selectedMemoryFiles.length === 0) {
      return [
        {
          id: 'request-source',
          name: reportType === 'planning' ? '参考资料' : '任务输入',
          text: streamRequestText,
        },
      ];
    }

    return selectedMemoryFiles.map((item) => {
      const fullContent =
        entries.find((entry) => entry.id === item.id)?.content || item.desc || item.name;
      const normalized = fullContent.replace(/\s+/g, ' ').trim();

      return {
        id: item.id,
        name: item.name,
        text: normalized.length > 1200 ? normalized.slice(0, 1200) : normalized,
      };
    });
  }, [entries, reportType, selectedMemoryFiles, streamRequestText]);
  const hasReachedStep = (target: Exclude<Step, 'input'>) => {
    const order: Array<Exclude<Step, 'input'>> = ['reading', 'confirm', 'generating', 'report'];
    return order.indexOf(step) >= order.indexOf(target);
  };

  useEffect(() => {
    setCasesPage(0);
  }, [reportType]);

  useEffect(() => {
    if (step !== 'reading') {
      return;
    }

    setReadingProgress(new Array(READING_STEPS.length).fill(false));
  }, [step]);

  useEffect(() => {
    if (step !== 'generating') {
      return;
    }

    setGeneratingPhases(new Array(GENERATING_PHASES.length).fill(false));

    const timers = GENERATING_PHASES.map((item, index) =>
      window.setTimeout(() => {
        setGeneratingPhases((prev) => {
          const next = [...prev];
          next[index] = true;
          return next;
        });
      }, item.delay)
    );

    const doneTimer = window.setTimeout(() => {
      if (DEBUG_STAY_ON_PROCESSING_PAGE) {
        return;
      }

      startTransition(() => setStep('report'));
    }, 8200);

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(doneTimer);
    };
  }, [step]);

  const handleSubmit = useCallback(() => {
    if (!canSubmit) {
      return;
    }

    setExtractedInfo(
      buildExtractedInfo({
        brandName: effectiveBrandName,
        category,
        competitors,
        selectedMemoryCount: selectedMemoryIds.length,
        reportType,
      })
    );
    startTransition(() => setStep('reading'));
  }, [canSubmit, category, competitors, effectiveBrandName, reportType, selectedMemoryIds.length]);

  const handleConfirmGenerate = useCallback(() => {
    if (!canAfford(GENERATION_COST)) {
      setCreditsDrawerOpen(true);
      return;
    }

    deduct(GENERATION_COST, `${reportTypeLabel}生成`);
    startTransition(() => setStep('generating'));
  }, [canAfford, deduct, reportTypeLabel]);

  const handleBack = useCallback((target: Step) => {
    startTransition(() => setStep(target));
  }, []);

  const addCompetitor = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed || competitors.includes(trimmed)) {
        setCompetitorInput('');
        return;
      }

      setCompetitors((prev) => [...prev, trimmed]);
      setCompetitorInput('');
    },
    [competitors]
  );

  const removeCompetitor = useCallback((name: string) => {
    setCompetitors((prev) => prev.filter((item) => item !== name));
  }, []);

  const addSellingPoint = useCallback(() => {
    const trimmed = newTag.trim();
    if (!trimmed || extractedInfo.sellingPoints.includes(trimmed)) {
      setNewTag('');
      return;
    }

    setExtractedInfo((prev) => ({
      ...prev,
      sellingPoints: [...prev.sellingPoints, trimmed],
    }));
    setNewTag('');
  }, [extractedInfo.sellingPoints, newTag]);

  const removeSellingPoint = useCallback((index: number) => {
    setExtractedInfo((prev) => ({
      ...prev,
      sellingPoints: prev.sellingPoints.filter((_, currentIndex) => currentIndex !== index),
    }));
  }, []);

  const updateField = useCallback((field: keyof ExtractedInfo, value: string) => {
    setExtractedInfo((prev) => ({ ...prev, [field]: value }));
  }, []);

  const toggleMemory = useCallback((id: string) => {
    setSelectedMemoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const handleCompetitorKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Enter') {
        return;
      }

      event.preventDefault();

      if (competitorInput.trim()) {
        addCompetitor(competitorInput);
        return;
      }

      handleSubmit();
    },
    [addCompetitor, competitorInput, handleSubmit]
  );

  const resetWorkbench = useCallback(() => {
    setStep('input');
    setBrandName('');
    setCategory('');
    setReportType('insight');
    setCompetitors([]);
    setCompetitorInput('');
    setSelectedMemoryIds([]);
    setNewTag('');
    onNavigate?.('insight-workbench');
  }, [onNavigate]);

  const completedReadingSteps = readingProgress.filter(Boolean).length;
  const insightReadingStageTitle =
    step === 'reading' && completedReadingSteps < 2
      ? '正在读取品牌信息'
      : '正在整合品牌输入、竞品线索与参考资料';
  const insightReadingSubtitle =
    step === 'reading'
      ? `正在为 ${effectiveBrandName || '该品牌'} 建立统一的洞察分析上下文`
      : `已完成 ${effectiveBrandName || '该品牌'} 的前置资料整理，正在进入洞察生成阶段`;
  const insightReadingStageDetails = [
    {
      label: '品牌输入',
      value: effectiveBrandName || '等待品牌信息',
    },
    {
      label: '竞品线索',
      value: competitors.length > 0 ? competitors.join('、') : '等待竞品线索',
    },
    {
      label: '参考资料',
      value: selectedMemoryIds.length > 0 ? `已接入 ${selectedMemoryIds.length} 份记忆库资料` : '等待参考资料接入',
    },
  ];
  const visibleInsightReadingStageDetails =
    step === 'reading'
      ? insightReadingStageDetails.slice(
          0,
          Math.min(insightReadingStageDetails.length, 1 + completedReadingSteps)
        )
      : insightReadingStageDetails;
  const insightProgressItems = [
    { label: '读取任务输入', state: 'done' as const },
    {
      label: '识别品牌与品类',
      state: step !== 'reading' || readingProgress[0] ? ('done' as const) : ('active' as const),
    },
    {
      label: '扫描记忆库文本',
      state:
        step !== 'reading'
          ? ('done' as const)
          : readingProgress[1]
            ? ('done' as const)
            : readingProgress[0]
              ? ('active' as const)
              : ('pending' as const),
    },
    {
      label: '等待生成洞察框架',
      state:
        step !== 'reading'
          ? ('done' as const)
          : readingProgress[1]
            ? ('active' as const)
            : ('pending' as const),
    },
  ];
  const visibleInsightProgressItems =
    step === 'reading'
      ? insightProgressItems.slice(0, Math.min(insightProgressItems.length, 2 + completedReadingSteps))
      : insightProgressItems;
  const insightReadingDocs =
    selectedMemoryFiles.length > 0
      ? selectedMemoryFiles.slice(0, 4).map((item, index) => {
          const status =
            step !== 'reading'
              ? 'connected'
              : index < completedReadingSteps
                ? 'connected'
                : index === Math.min(completedReadingSteps, selectedMemoryFiles.length - 1)
                  ? 'reading'
                  : 'pending';

          const previewSource = item.desc || '正在接入文档文本内容...';
          const previewText = `${previewSource} ${previewSource}`.trim().slice(0, 140);

          return {
            id: item.id,
            name: item.name,
            fileType: '.md / 记忆库文档',
            status,
            previewText,
          };
        })
      : [
          {
            id: 'memory-placeholder',
            name: '暂未接入记忆库文档',
            fileType: '.md / 记忆库文档',
            status: 'pending',
            previewText: '正在等待文档接入，接入后会在这里呈现扫描中的文本读取效果。',
          },
        ];
  const workflowStatus =
    step === 'report'
      ? 'completed'
      : step === 'generating'
        ? 'generating_report'
        : 'processing_context';
  const processingTitle =
    workflowStatus === 'generating_report'
      ? `正在生成${reportTypeLabel}`
      : completedReadingSteps === 0
        ? '正在读取任务输入'
        : '正在整理任务输入与参考资料';
  const processingSubtitle =
    workflowStatus === 'generating_report'
      ? `系统正在整理结构并输出 ${reportTypeLabel}，完成后会自动切换到结果页。`
      : `系统正在整合${effectiveBrandName || '当前品牌'}、竞品线索与参考资料，准备进入报告生成阶段。`;
  const processingSummaryItems = [
    { label: '品牌', value: effectiveBrandName || '待补充' },
    { label: '品类', value: category || '待补充' },
    {
      label: '竞品',
      value: competitors.length > 0 ? competitors.join('、') : '待补充',
    },
    { label: '输出类型', value: reportTypeLabel },
    { label: '记忆库', value: `${selectedMemoryIds.length} 份资料` },
  ];
  const progressMemoryLabel =
    selectedMemoryIds.length > 0 ? '已接入记忆库资料' : '无需接入记忆库资料';
  const contextProgressLabel = reportType === 'planning' ? '正在整理策划上下文' : '正在整理洞察上下文';
  const processingProgressItems = [
    {
      label: '已读取任务输入',
      state:
        workflowStatus === 'processing_context' && completedReadingSteps === 0
          ? ('active' as const)
          : ('completed' as const),
    },
    {
      label: progressMemoryLabel,
      state:
        workflowStatus === 'generating_report' || workflowStatus === 'completed'
          ? ('completed' as const)
          : completedReadingSteps >= 1
            ? ('completed' as const)
            : ('pending' as const),
    },
    {
      label: contextProgressLabel,
      state:
        workflowStatus === 'generating_report' || workflowStatus === 'completed'
          ? ('completed' as const)
          : completedReadingSteps >= 1
            ? ('active' as const)
            : ('pending' as const),
    },
    {
      label: '等待生成 HTML 报告',
      state:
        workflowStatus === 'generating_report'
          ? ('active' as const)
          : workflowStatus === 'completed'
            ? ('completed' as const)
            : ('pending' as const),
      },
    ];
  const completedGeneratingPhases = generatingPhases.filter(Boolean).length;
  const activeGeneratingIndex = Math.min(completedGeneratingPhases, GENERATING_PHASES.length - 1);
  const generatingProgressItems = GENERATING_PHASES.map((phase, index) => {
    if (workflowStatus === 'completed') {
      return { label: phase.label, state: 'completed' as const };
    }

    if (workflowStatus !== 'generating_report') {
      return { label: phase.label, state: 'pending' as const };
    }

    if (generatingPhases[index]) {
      return { label: phase.label, state: 'completed' as const };
    }

    return {
      label: phase.label,
      state: index === activeGeneratingIndex ? ('active' as const) : ('pending' as const),
    };
  });
  const completedStreamTitle = effectiveBrandName
    ? `已生成 ${effectiveBrandName} 的${reportTypeLabel}`
    : `${reportTypeLabel}已生成`;
  const processingRequestLabel =
    reportType === 'planning'
      ? '参考资料'
      : selectedMemoryFiles.length > 0
        ? 'user'
        : '用户请求';
  const selectedMemoryFilesLabel = `${selectedMemoryFiles.length} file${
    selectedMemoryFiles.length === 1 ? '' : 's'
  }`;
  const processingEntityItems = [
    { label: '品牌名', value: effectiveBrandName || '待补充' },
    { label: '品类', value: category || '待补充' },
    {
      label: '竞品',
      value: competitors.length > 0 ? competitors.join('、') : '待补充',
    },
  ];
  const docsReadFinished = completedReadingDocCount >= readingDocumentItems.length;
  const activeReadingDocIndex =
    step === 'reading' && completedReadingDocCount < visibleReadingDocCount
      ? completedReadingDocCount
      : -1;
  const visibleReadingDocuments =
    step === 'reading'
      ? readingDocumentItems.slice(0, Math.min(visibleReadingDocCount, readingDocumentItems.length))
      : readingDocumentItems;
  const showBrandInfoSection = step !== 'reading' || docsReadFinished;
  const showGeneratingSection = workflowStatus === 'generating_report' || workflowStatus === 'completed';
  const readingSectionTitle = docsReadFinished
    ? selectedMemoryFiles.length > 0
      ? '已完成参考资料读取...'
      : '已完成任务输入读取...'
    : selectedMemoryFiles.length > 0
      ? '正在读取参考资料...'
      : '正在读取任务输入...';
  const brandInfoSectionTitle =
    step === 'reading' ? '正在整理品牌信息...' : '已完成品牌信息整理...';
  const brandInfoTaskLabel =
    step === 'reading' ? '正在提取品牌与产品信息' : '已完成品牌与产品信息提取';
  const generatingSectionTitle =
    workflowStatus === 'generating_report'
      ? `正在为您生成${reportTypeLabel}...`
      : `已完成${reportTypeLabel}生成...`;
  const visibleGeneratingProgressItems =
    workflowStatus === 'completed'
      ? generatingProgressItems
      : workflowStatus === 'generating_report'
        ? generatingProgressItems.slice(0, Math.min(completedGeneratingPhases + 1, GENERATING_PHASES.length))
        : [];

  useEffect(() => {
    if (step !== 'reading') {
      setCompletedReadingDocCount(0);
      setVisibleReadingDocCount(1);
      return;
    }

    setCompletedReadingDocCount(0);
    setVisibleReadingDocCount(Math.min(1, readingDocumentItems.length));
  }, [readingDocumentItems.length, step]);

  useEffect(() => {
    if (step !== 'reading' || activeReadingDocIndex < 0) {
      return;
    }

    const viewport = readingTextViewportRefs.current[activeReadingDocIndex];
    if (!viewport) {
      return;
    }

    let frameId = 0;
    viewport.scrollTop = 0;

    const tick = () => {
      const maxScroll = viewport.scrollHeight - viewport.clientHeight;

      if (maxScroll <= 0) {
        setCompletedReadingDocCount((prev) => Math.min(prev + 1, readingDocumentItems.length));
        return;
      }

      if (viewport.scrollTop >= maxScroll) {
        setCompletedReadingDocCount((prev) => Math.min(prev + 1, readingDocumentItems.length));
        return;
      }

      viewport.scrollTop = Math.min(maxScroll, viewport.scrollTop + 7.0);
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [activeReadingDocIndex, readingDocumentItems.length, step]);

  useEffect(() => {
    if (
      step !== 'reading' ||
      completedReadingDocCount < visibleReadingDocCount ||
      visibleReadingDocCount >= readingDocumentItems.length
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      setVisibleReadingDocCount((prev) => Math.min(prev + 1, readingDocumentItems.length));
    }, 360);

    return () => window.clearTimeout(timer);
  }, [completedReadingDocCount, readingDocumentItems.length, step, visibleReadingDocCount]);

  useEffect(() => {
    if (step !== 'reading' || !docsReadFinished) {
      return;
    }

    setReadingProgress((prev) => {
      const next = [...prev];
      next[0] = true;
      return next;
    });

    const timers = READING_STEPS.slice(1).map((item, index) =>
      window.setTimeout(() => {
        setReadingProgress((prev) => {
          const next = [...prev];
          next[index + 1] = true;
          return next;
        });
      }, item.delay - READING_STEPS[0].delay)
    );

    const doneTimer = window.setTimeout(() => {
      if (!canAfford(GENERATION_COST)) {
        setCreditsDrawerOpen(true);
        return;
      }

      deduct(GENERATION_COST, `${reportTypeLabel}生成`);
      startTransition(() => setStep('generating'));
    }, 2600);

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(doneTimer);
    };
  }, [canAfford, deduct, docsReadFinished, reportTypeLabel, step]);

  useEffect(() => {
    if (workflowStatus === 'completed') {
      return;
    }

    const latestItem = latestProcessingItemRef.current;
    if (!latestItem) {
      return;
    }

    let frameA = 0;
    let frameB = 0;

    frameA = window.requestAnimationFrame(() => {
      frameB = window.requestAnimationFrame(() => {
        latestItem.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      });
    });

    return () => {
      window.cancelAnimationFrame(frameA);
      window.cancelAnimationFrame(frameB);
    };
  }, [
    activeReadingDocIndex,
    completedGeneratingPhases,
    completedReadingDocCount,
    docsReadFinished,
    step,
    visibleReadingDocCount,
    visibleGeneratingProgressItems.length,
    workflowStatus,
  ]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        ref={workflowStatus !== 'completed' ? processingViewportRef : undefined}
        className={cn(
          'h-full min-h-0 flex-1',
          workflowStatus === 'completed' ? 'overflow-hidden overscroll-none' : 'overflow-y-auto'
        )}
      >
        {step === 'input' && (
          <div className="min-h-full flex flex-col items-center justify-start gap-20 px-6 pt-[100px] pb-6 md:px-8 md:pt-[180px] md:pb-8">
            <InsightComposerPanel
              title="ORAN INSIGHT"
              subtitle="输入品牌、品类与竞品信息，我会帮你整理关键信息并生成对应结果。"
              reportType={reportType}
              reportTypeLabel={reportTypeLabel}
              reportTypeMenuOpen={reportTypeMenuOpen}
              onReportTypeMenuOpenChange={setReportTypeMenuOpen}
              onReportTypeChange={setReportType}
              brandName={brandName}
              onBrandNameChange={setBrandName}
              category={category}
              onCategoryChange={setCategory}
              competitors={competitors}
              competitorInput={competitorInput}
              onCompetitorInputChange={setCompetitorInput}
              onCompetitorKeyDown={handleCompetitorKeyDown}
              onCompetitorBlur={() => {
                if (competitorInput.trim()) {
                  addCompetitor(competitorInput);
                }
              }}
              onRemoveCompetitor={removeCompetitor}
              competitorInputRef={competitorInputRef}
              selectedMemoryIds={selectedMemoryIds}
              selectedMemorySummary={selectedMemorySummary}
              selectedMemorySummaryNeedsFade={selectedMemorySummaryNeedsFade}
              effectiveBrandName={effectiveBrandName}
              onOpenMemoryDialog={() => setMemoryDialogOpen(true)}
              canSubmit={canSubmit}
              onSubmit={handleSubmit}
            />

            {activeCases.length > 0 && (
              <div className="w-full max-w-5xl">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                  {pagedCases.map((card, index) => (
                    <ShowcaseCard
                      key={`${reportType}-${casesPage}-${index}`}
                      card={card}
                      onClick={() => {
                        if (card.reportUrl) {
                          window.open(card.reportUrl, '_blank');
                        }
                      }}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-5">
                    <button
                      onClick={() => setCasesPage((prev) => Math.max(0, prev - 1))}
                      disabled={casesPage === 0}
                      className="p-1.5 rounded-md border border-border/40 text-muted-foreground hover:text-foreground hover:border-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {casesPage + 1} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCasesPage((prev) => Math.min(totalPages - 1, prev + 1))}
                      disabled={casesPage === totalPages - 1}
                      className="p-1.5 rounded-md border border-border/40 text-muted-foreground hover:text-foreground hover:border-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step !== 'input' && (
          <div
            className={cn(
              workflowStatus === 'completed'
                ? 'h-[calc(100dvh-56px)] overflow-hidden overscroll-none px-5 py-4 md:px-8 md:py-5'
                : 'min-h-full px-6 pb-16 pt-10 md:px-10'
            )}
          >
            <div
              className={cn(
                'w-full',
                workflowStatus === 'completed' ? 'flex h-full min-h-0 flex-col gap-4' : 'space-y-8'
              )}
            >
              {workflowStatus !== 'completed' ? (
                <div className="relative mx-auto min-h-[calc(100dvh-160px)] w-full max-w-[1180px] pb-16">
                  <button
                    onClick={() => handleBack('input')}
                    className="absolute left-0 top-2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/20 bg-card/50 text-muted-foreground transition-colors hover:border-border/35 hover:text-foreground"
                    aria-label="返回"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>

                  <div className="ml-auto w-full max-w-[500px] max-h-[50px]  space-y-2 pr-2">
                    <div className="text-right text-[12px] text-muted-foreground/80">
                      {processingRequestLabel}
                    </div>
                    <div className="text-right text-[10px] uppercase tracking-[0.16em] text-muted-foreground/55">
                      {selectedMemoryFilesLabel}
                    </div>
                    <div className="rounded-[20px] bg-muted/80 px-5 py-2 text-[12px] leading-6 text-foreground/55">
                      {streamRequestText}
                    </div>
                  </div>

                  <div className="max-w-[540px] pl-3 pt-24 text-[12px] text-muted-foreground md:ml-[18%]">
                    <div className="space-y-6">
                      <section className="space-y-3.5">
                        <h2 className="text-[14px] font-normal text-foreground/70">
                          {readingSectionTitle}
                        </h2>
                        <div className="space-y-2">
                          {visibleReadingDocuments.map((doc, index) => {
                            const status =
                              index < completedReadingDocCount
                                ? 'completed'
                                : index === activeReadingDocIndex
                                  ? 'active'
                                  : 'pending';

                            return (
                              <div
                                key={doc.id}
                                ref={status === 'active' ? latestProcessingItemRef : undefined}
                                className="flex items-start gap-4 leading-7 text-muted-foreground/98"
                              >
                                <div className="mt-0.5 flex h-[18px] w-[18px] items-center justify-center">
                                  <FileText
                                    className={cn(
                                      'h-[18px] w-[18px] transition-colors',
                                      status === 'active'
                                        ? 'animate-pulse text-foreground/78'
                                        : status === 'completed'
                                          ? 'text-muted-foreground/72'
                                          : 'text-muted-foreground/48'
                                    )}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  {selectedMemoryFiles.length > 1 && (
                                    <div className="text-[11px] text-muted-foreground/68">{doc.name}</div>
                                  )}
                                  <div className="reading-text-shell relative w-[520px] max-w-[520px] bg-muted/50 px-5 pb-2 pt-1.5 rounded-[10px]">
                                    <div
                                      ref={(node) => {
                                        readingTextViewportRefs.current[index] = node;
                                      }}
                                      className="reading-text-viewport relative h-[50px] overflow-hidden"
                                    >
                                      <div className="whitespace-pre-wrap break-words text-[12px] leading-4 text-foreground/30">
                                        {doc.text}
                                      </div>
                                    </div>
                                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent via-background/18 to-background/92" />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>

                      {showBrandInfoSection && (
                        <section className="space-y-3.5 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                          <h2 className="text-[14px] font-normal text-foreground/70">{brandInfoSectionTitle}</h2>
                          <div className="space-y-2.5 pl-14">
                            <div className="flex items-center gap-2 text-[12px] text-muted-foreground/72">
                              {step === 'reading' ? (
                                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground/70" />
                              ) : (
                                <Check className="h-3.5 w-3.5 shrink-0 text-foreground/72" />
                              )}
                              <span>{brandInfoTaskLabel}</span>
                            </div>
                            <div className="relative space-y-2.5 pl-6 before:absolute before:left-0 before:top-2 before:h-[calc(100%-14px)] before:w-px before:bg-border/35">
                              {processingEntityItems.map((item) => (
                                <div key={item.label} className="relative text-[12px] text-muted-foreground/70">
                                  <span className="absolute -left-[19px] top-[8px] h-1.5 w-1.5 rounded-full bg-border/60" />
                                  <span>{item.label}：</span>
                                  <span>{item.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </section>
                      )}

                      {showGeneratingSection && (
                        <section
                          ref={
                            workflowStatus !== 'generating_report' ? latestProcessingItemRef : undefined
                          }
                          className="space-y-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
                        >
                          <h2 className="text-[14px] font-normal text-foreground/70">
                            {generatingSectionTitle}
                          </h2>
                          <div className="space-y-1 pl-14">
                            {visibleGeneratingProgressItems.map((item) => (
                              <div
                                key={item.label}
                                ref={item.state === 'active' ? latestProcessingItemRef : undefined}
                                className={cn(
                                  'flex items-center gap-2 text-[12px] leading-7 transition-colors',
                                  item.state === 'completed'
                                    ? 'text-muted-foreground/72'
                                    : item.state === 'active'
                                      ? 'text-foreground/78'
                                      : 'text-muted-foreground/52'
                                )}
                              >
                                {item.state === 'completed' ? (
                                  <Check className="h-3.5 w-3.5 shrink-0 text-foreground/72" />
                                ) : item.state === 'active' ? (
                                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground/72" />
                                ) : (
                                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/35" />
                                )}
                                <span>{item.label}</span>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid min-h-0 flex-1 gap-6 overflow-hidden overscroll-none xl:grid-cols-[340px_minmax(0,1fr)] xl:items-stretch">
                  <aside className="h-full min-h-0 overflow-y-auto overscroll-contain pr-2 pb-6 animate-in fade-in-0 slide-in-from-right-4 duration-500">
                    <div className="space-y-5">
                      <button
                        onClick={() => handleBack('input')}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/25 bg-card/70 text-muted-foreground transition-colors hover:text-foreground hover:border-border/40"
                        aria-label="返回"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>

                      <section className="space-y-2.5">
                        <div className="text-right text-xs text-muted-foreground">user</div>
                        <div className="text-right text-[10px] uppercase tracking-[0.16em] text-muted-foreground/55">
                          {selectedMemoryFilesLabel}
                        </div>
                        <div className="rounded-[26px] border border-border/40 bg-muted/35 px-4 py-3 text-[13px] leading-7 text-foreground/78 shadow-sm">
                          {streamRequestText}
                        </div>
                      </section>

                      {hasReachedStep('reading') && (
                        <section className="space-y-3">
                          <div className="space-y-1">
                            <h3 className="text-[17px] font-light tracking-tight text-foreground">
                              已完成参考资料读取...
                            </h3>
                            <p className="text-[12px] leading-6 text-muted-foreground">
                              输入信息与参考文档已完成接入，左侧保留完整过程记录。
                            </p>
                          </div>
                          <div className="space-y-3">
                            {readingDocumentItems.map((doc) => (
                              <div
                                key={doc.id}
                                className="flex items-start gap-3 rounded-[22px] border border-border/25 bg-card/82 px-4 py-4 shadow-sm"
                              >
                                <div className="mt-0.5 flex h-[18px] w-[18px] items-center justify-center">
                                  <FileText className="h-[18px] w-[18px] text-muted-foreground/72" />
                                </div>
                                <div className="min-w-0 flex-1 space-y-1.5">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="truncate text-[13px] text-foreground/84">{doc.name}</div>
                                      <div className="mt-1 text-[11px] text-muted-foreground">.md / 记忆库文档</div>
                                    </div>
                                    <div className="rounded-full border border-border/25 bg-background/75 px-2.5 py-1 text-[11px] text-foreground/68">
                                      已接入
                                    </div>
                                  </div>
                                  <div className="rounded-[18px] bg-muted/35 px-4 py-3 text-[12px] leading-7 text-foreground/42">
                                    {doc.text.slice(0, 120)}
                                    {doc.text.length > 120 ? '...' : ''}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      <section className="space-y-3">
                        <div className="space-y-1">
                          <h3 className="text-[17px] font-light tracking-tight text-foreground">
                            已完成品牌信息整理...
                          </h3>
                          <p className="text-[12px] leading-6 text-muted-foreground">
                            品牌、品类、竞品与记忆库资料已整理完毕，供报告生成阶段引用。
                          </p>
                        </div>
                        <div className="space-y-2 pl-12">
                          <div className="flex items-center gap-2 text-[12px] text-foreground/76">
                            <Check className="h-3.5 w-3.5 shrink-0 text-foreground/72" />
                            <span>已完成品牌与产品信息提取</span>
                          </div>
                          <div className="relative space-y-2 pl-5 before:absolute before:left-0 before:top-2 before:h-[calc(100%-14px)] before:w-px before:bg-border/35">
                            {processingSummaryItems.map((item) => (
                              <div key={item.label} className="relative text-[12px] text-muted-foreground/72">
                                <span className="absolute -left-[18px] top-[8px] h-1.5 w-1.5 rounded-full bg-border/60" />
                                <span>{item.label}：</span>
                                <span>{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </section>

                      {hasReachedStep('generating') && (
                        <section className="space-y-3">
                          <div className="space-y-1">
                            <h3 className="text-[17px] font-light tracking-tight text-foreground">
                              已完成{reportTypeLabel}生成...
                            </h3>
                            <p className="text-[12px] leading-6 text-muted-foreground">
                              生成步骤已完成，右侧展示最终 HTML 报告展板。
                            </p>
                          </div>
                          <div className="space-y-1.5 pl-12">
                            {generatingProgressItems.map((item) => (
                              <div key={item.label} className="flex items-center gap-2 text-[12px] text-foreground/76">
                                <Check className="h-3.5 w-3.5 shrink-0 text-foreground/72" />
                                <span>{item.label}</span>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      <section className="space-y-1.5 rounded-[24px] border border-border/25 bg-card/82 p-4 shadow-sm">
                        <h3 className="text-[18px] font-light tracking-tight text-foreground">
                          {completedStreamTitle}
                        </h3>
                        <p className="text-[13px] leading-6 text-muted-foreground">
                          完整流程已保留在左侧，右侧可继续预览、复制 HTML 与导出报告。
                        </p>
                      </section>
                    </div>
                  </aside>

                  <section className="flex h-full min-h-0 flex-col gap-3 overflow-hidden overscroll-none animate-in fade-in-0 slide-in-from-right-12 duration-700">
                    <div className="min-h-0 flex-1 transition-all duration-700 ease-out">
                      <InsightWorkbenchReport
                        extractedInfo={extractedInfo}
                        embedded
                        showEmbeddedToolbar
                        showEmbeddedBackButton={false}
                        onBack={() => handleBack('input')}
                        onRestart={resetWorkbench}
                      />
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      <MemorySelectionDialog
        open={memoryDialogOpen}
        onOpenChange={setMemoryDialogOpen}
        items={memoryItems}
        selectedIds={selectedMemoryIds}
        onToggle={toggleMemory}
      />

      <InsufficientCreditsDrawer
        open={creditsDrawerOpen}
        onOpenChange={setCreditsDrawerOpen}
        shortfall={shortfall(GENERATION_COST)}
      />
    </div>
  );
}

function ConfirmField({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <Badge
          variant="outline"
          className="text-[10px] h-4 px-1.5 text-muted-foreground font-normal border-border/50"
        >
          系统识别
        </Badge>
      </div>
      <Input
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full h-9 px-3 rounded-lg border border-border/50 bg-background text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
      />
    </div>
  );
}
