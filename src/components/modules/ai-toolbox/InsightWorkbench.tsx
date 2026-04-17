import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileText,
  History,
  Loader2,
  Maximize2,
  X,
} from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useCredits } from '@/contexts/CreditsContext';
import { useMemory } from '@/contexts/MemoryContext';
import { useOranGenPrefill } from '@/contexts/OranGenPrefillContext';
import { useOranSimulationPrefill } from '@/contexts/OranSimulationPrefillContext';
import { cn } from '@/lib/utils';
import {
  MemorySelectionDialog,
  type MemorySelectItem,
} from '@/components/modules/memory/MemorySelectionDialog';
import { InsufficientCreditsDrawer } from '@/components/modules/InsufficientCreditsDrawer';
import { InsightComposerPanel } from './InsightComposerPanel';
import { ShowcaseCard, SHOWCASE_CARDS } from './app-plaza/ShowcaseCard';
import {
  buildMemoryMarkdownFromHtml,
  generateReportHTML,
} from './InsightWorkbenchReport';

type Step = 'input' | 'reading' | 'confirm' | 'generating' | 'report';
type ReportType = 'insight' | 'planning';
type PlanningInputSource = 'memory' | 'insight';
type PreviewMode = 'auto' | 'insight-history';

interface ExtractedInfo {
  brandName: string;
  category: string;
  sellingPoints: string[];
  targetMarket: string;
  analysisTarget: string;
  websiteType: string;
  businessDirection: string;
  marketingGoal: string;
  targetAudience: string;
  budgetLevel: string;
  primaryChannels: string;
}

const GENERATION_COST = 50;
const CASES_PER_PAGE = 16;
const DEBUG_STAY_ON_PROCESSING_PAGE = false;
const INSIGHT_HISTORY_STORAGE_KEY = 'oran-insight-history';

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  insight: '洞察报告',
  planning: '策划方案',
};

function buildEmbeddedPreviewHtml(html: string) {
  const htmlWithoutRevealScript = html.replace(
    /<script>\s*const sections = Array\.from\(document\.querySelectorAll\('\.report-section'\)\);[\s\S]*?<\/script>/,
    ''
  );

  return htmlWithoutRevealScript.includes('</head>')
    ? htmlWithoutRevealScript.replace(
        '</head>',
        `<style>
          .report-section {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
        </style></head>`
      )
    : htmlWithoutRevealScript;
}

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

interface InsightHistoryItem {
  id: string;
  date: string;
  step: 'input' | 'report';
  brandName: string;
  category: string;
  reportType: ReportType;
  planningInputSource: PlanningInputSource;
  competitors: string[];
  selectedMemoryIds: string[];
  extractedInfo: ExtractedInfo;
  persistedCompletedReportType: ReportType;
  persistedCompletedExtractedInfo: ExtractedInfo;
}

function loadInsightHistory(): InsightHistoryItem[] {
  try {
    const raw = localStorage.getItem(INSIGHT_HISTORY_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as InsightHistoryItem[]) : [];
  } catch {
    return [];
  }
}

function saveInsightHistory(items: InsightHistoryItem[]) {
  localStorage.setItem(INSIGHT_HISTORY_STORAGE_KEY, JSON.stringify(items));
}

function normalizeLooseToken(value: string) {
  return value.toLowerCase().replace(/[\s./\\_\->、，,]+/g, '');
}

function normalizeCategoryToken(value: string) {
  return normalizeLooseToken(value).replace(/kbeauty/g, 'kbeauty');
}

function matchesDrMelaxinPlanningScenario(params: {
  brandName: string;
  category: string;
  competitors: string[];
}) {
  const normalizedBrand = normalizeLooseToken(params.brandName || '');
  const normalizedCategory = normalizeCategoryToken(params.category || '');
  const normalizedCompetitors = normalizeLooseToken(params.competitors.join(' '));

  const isDrMelaxin =
    normalizedBrand === 'drmelaxin' || normalizedCompetitors.includes('drmelaxin');
  const isTargetCategory =
    normalizedCategory === normalizeCategoryToken('美妆个护>K-beauty>功效护肤') ||
    normalizedCategory === normalizeCategoryToken('美妆个护 > K-beauty > 功效护肤') ||
    normalizedCategory === normalizeCategoryToken('美妆个护-K-beauty-功效护肤');
  const hasMedicube = normalizedCompetitors.includes(normalizeLooseToken('Medicube'));
  const hasTarte =
    normalizedCompetitors.includes(normalizeLooseToken('Tarte Cosmetics')) ||
    normalizedCompetitors.includes(normalizeLooseToken('Tarte Cometics')) ||
    normalizedCompetitors.includes(normalizeLooseToken('Tarte'));

  return isDrMelaxin && isTargetCategory && hasMedicube && hasTarte;
}

function buildExtractedInfo(params: {
  brandName: string;
  category: string;
  competitors: string[];
  selectedMemoryCount: number;
  reportType: ReportType;
}): ExtractedInfo {
  const { brandName, category, competitors, selectedMemoryCount, reportType } = params;
  const leadCompetitor = competitors[0] || '头部竞品';
  const trimmedBrandName = brandName.trim();
  const trimmedCategory = category.trim();
  const analysisTarget = competitors.join('、');
  const websiteType = selectedMemoryCount > 0 ? '结构化输入 + 记忆库' : '结构化品牌输入';
  const businessDirection =
    reportType === 'planning' ? '营销策划 / 执行方案' : '市场洞察 / 竞品分析';

  if (
    reportType === 'planning' &&
    matchesDrMelaxinPlanningScenario({ brandName: trimmedBrandName, category: trimmedCategory, competitors })
  ) {
    return {
      brandName: trimmedBrandName,
      category: trimmedCategory,
      sellingPoints: [
        '功效护肤（问题→结果）',
        '可视化效果（对比、改善）',
        '细分赛道（淡斑 / 抗衰 / 眼部）',
      ],
      targetMarket: '目标市场待确认',
      analysisTarget,
      websiteType,
      businessDirection,
      marketingGoal: '放大内容声量、提升UGC、建立产品矩阵、从爆品→品牌化',
      targetAudience: '核心：25–44抗衰女性、增长：有色人种淡斑人群（关键）、本质：问题导向用户',
      budgetLevel: '百万美元级 / 千万人民币级、核心投在达人（≈90%）',
      primaryChannels:
        'TikTok、小红书',
    };
  }

  return {
    brandName: trimmedBrandName,
    category: trimmedCategory,
    sellingPoints: [
      `围绕 ${leadCompetitor} 做差异化判断`,
      selectedMemoryCount > 0 ? '已补充记忆库背景信息' : '基于结构化输入快速分析',
      reportType === 'planning' ? '适合继续延展为策划方案' : '适合继续延展为洞察结论',
    ],
    targetMarket: '目标市场待确认',
    analysisTarget,
    websiteType,
    businessDirection,
    marketingGoal:
      reportType === 'planning' ? '提升品牌声量并带动内容转化' : '',
    targetAudience:
      reportType === 'planning' ? `${trimmedCategory || '目标品类'}核心兴趣人群` : '',
    budgetLevel:
      reportType === 'planning' ? '中等预算（20万-50万）' : '',
    primaryChannels:
      reportType === 'planning' ? '小红书、抖音' : '',
  };
}

export function InsightWorkbench({ onNavigate }: { onNavigate?: (id: string) => void }) {
  const { deduct, canAfford, shortfall } = useCredits();
  const { entries, ensureEntry, setDrawerOpen } = useMemory();
  const { setPrefill: setOranGenPrefill } = useOranGenPrefill();
  const { setPrefill: setOranSimulationPrefill } = useOranSimulationPrefill();

  const [step, setStep] = useState<Step>('input');
  const [brandName, setBrandName] = useState('');
  const [category, setCategory] = useState('');
  const [reportType, setReportType] = useState<ReportType>('insight');
  const [planningInputSource, setPlanningInputSource] = useState<PlanningInputSource>('memory');
  const [reportTypeMenuOpen, setReportTypeMenuOpen] = useState(false);
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [competitorInput, setCompetitorInput] = useState('');
  const [selectedMemoryIds, setSelectedMemoryIds] = useState<string[]>([]);
  const [memoryDialogOpen, setMemoryDialogOpen] = useState(false);
  const [creditsDrawerOpen, setCreditsDrawerOpen] = useState(false);
  const [readingProgress, setReadingProgress] = useState<boolean[]>([]);
  const [generatingPhases, setGeneratingPhases] = useState<boolean[]>([]);
  const [casesPage, setCasesPage] = useState(0);
  const [extractedInfo, setExtractedInfo] = useState<ExtractedInfo>({
    brandName: '',
    category: '',
    sellingPoints: [],
    targetMarket: '',
    analysisTarget: '',
    websiteType: '',
    businessDirection: '',
    marketingGoal: '',
    targetAudience: '',
    budgetLevel: '',
    primaryChannels: '',
  });
  const [persistedCompletedReportType, setPersistedCompletedReportType] = useState<ReportType>('insight');
  const [persistedCompletedExtractedInfo, setPersistedCompletedExtractedInfo] = useState<ExtractedInfo>({
    brandName: '',
    category: '',
    sellingPoints: [],
    targetMarket: '',
    analysisTarget: '',
    websiteType: '',
    businessDirection: '',
    marketingGoal: '',
    targetAudience: '',
    budgetLevel: '',
    primaryChannels: '',
  });
  const [previewMode, setPreviewMode] = useState<PreviewMode>('auto');

  const competitorInputRef = useRef<HTMLInputElement>(null);
  const readingTextViewportRefs = useRef<Array<HTMLDivElement | null>>([]);
  const latestProcessingItemRef = useRef<HTMLDivElement | null>(null);
  const processingViewportRef = useRef<HTMLDivElement | null>(null);
  const splitLayoutAsideRef = useRef<HTMLElement | null>(null);
  const previousStepRef = useRef<Step>('input');
  const isRestoringHistoryRef = useRef(false);
  const [completedReadingDocCount, setCompletedReadingDocCount] = useState(0);
  const [visibleReadingDocCount, setVisibleReadingDocCount] = useState(1);
  const [history, setHistory] = useState<InsightHistoryItem[]>(loadInsightHistory);

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
  const isPlanningFromInsight = reportType === 'planning' && planningInputSource === 'insight';
  const effectiveBrandName =
    reportType === 'planning' && !isPlanningFromInsight
      ? selectedMemoryPrimaryName || brandName.trim()
      : brandName.trim();
  const canSubmit =
    reportType === 'planning'
      ? isPlanningFromInsight
        ? Boolean(effectiveBrandName)
        : selectedMemoryIds.length > 0 && Boolean(effectiveBrandName)
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
      if (isPlanningFromInsight) {
        return `基于当前洞察，为我生成 ${effectiveBrandName || '该品牌'} 的${reportTypeLabel}。`;
      }

      const memoryPrefix = selectedMemorySummary || '记忆库资料';
      return `基于 ${memoryPrefix}，为我生成 ${effectiveBrandName || '该品牌'} 的${reportTypeLabel}。`;
    }

    const competitorsText = competitors.length > 0 ? competitors.join('、') : '竞品线索';
    return `为我生成 ${effectiveBrandName || '该品牌'}、${category || '目标品类'}、${competitorsText} 的${reportTypeLabel}。`;
  }, [
    category,
    competitors,
    effectiveBrandName,
    isPlanningFromInsight,
    reportType,
    reportTypeLabel,
    selectedMemorySummary,
  ]);
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
    return step === 'input' ? false : order.indexOf(step) >= order.indexOf(target);
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

  const handleBack = useCallback((target: Step) => {
    if (target === 'input') {
      setPlanningInputSource('memory');
    }

    startTransition(() => setStep(target));
  }, []);

  const handleReportTypeChange = useCallback(
    (value: ReportType) => {
      if (value !== 'planning' || step === 'input') {
        setPlanningInputSource('memory');
      }

      setReportType(value);
    },
    [step]
  );

  const updateField = useCallback((field: keyof ExtractedInfo, value: string) => {
    setExtractedInfo((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSellingPointsChange = useCallback((value: string) => {
    const nextSellingPoints = value
      .split(/[、,，\n]/)
      .map((item) => item.trim())
      .filter(Boolean);

    setExtractedInfo((prev) => ({
      ...prev,
      sellingPoints: nextSellingPoints,
    }));
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
    setPlanningInputSource('memory');
    setPreviewMode('auto');
    setCompetitors([]);
    setCompetitorInput('');
    setSelectedMemoryIds([]);
    onNavigate?.('insight-workbench');
  }, [onNavigate]);

  const completedReadingSteps = readingProgress.filter(Boolean).length;
  const workflowStatus =
    step === 'report'
      ? 'completed'
      : step === 'generating'
        ? 'generating_report'
        : 'processing_context';
  const useSplitLayout = workflowStatus === 'completed' || (isPlanningFromInsight && step !== 'input');
  const shouldShowPreviousInsightHistory =
    isPlanningFromInsight &&
    persistedCompletedReportType === 'insight' &&
    Boolean(persistedCompletedExtractedInfo.brandName);
  const isShowingPreviousInsightPreview =
    previewMode === 'insight-history' && shouldShowPreviousInsightHistory;
  const activePreviewReportType = isShowingPreviousInsightPreview
    ? 'insight'
    : workflowStatus === 'completed'
      ? reportType
      : persistedCompletedReportType;
  const activePreviewExtractedInfo = isShowingPreviousInsightPreview
    ? persistedCompletedExtractedInfo
    : workflowStatus === 'completed'
      ? extractedInfo
      : persistedCompletedExtractedInfo;
  const previousInsightRequestText = shouldShowPreviousInsightHistory
    ? `为我生成 ${persistedCompletedExtractedInfo.brandName || '该品牌'}、${
        persistedCompletedExtractedInfo.category || '目标品类'
      }、${persistedCompletedExtractedInfo.analysisTarget || '竞品线索'} 的${REPORT_TYPE_LABELS.insight}。`
    : '';
  const previousInsightFilesLabel = `${selectedMemoryIds.length} file${selectedMemoryIds.length === 1 ? '' : 's'}`;
  const previousInsightSummaryItems = [
    { label: '品牌', value: persistedCompletedExtractedInfo.brandName || '待补充' },
    { label: '品类', value: persistedCompletedExtractedInfo.category || '待补充' },
    {
      label: '竞品',
      value: persistedCompletedExtractedInfo.analysisTarget || '待补充',
    },
    { label: '输出类型', value: REPORT_TYPE_LABELS.insight },
    { label: '记忆库', value: `${selectedMemoryIds.length} 份资料` },
  ];
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
  const planningDraftItems = [
    { label: '营销目标', value: extractedInfo.marketingGoal || '待确认' },
    { label: '目标人群', value: extractedInfo.targetAudience || '待确认' },
    {
      label: '核心卖点',
      value: extractedInfo.sellingPoints.length > 0 ? extractedInfo.sellingPoints.join('、') : '待确认',
    },
    { label: '预算量级', value: extractedInfo.budgetLevel || '待确认' },
    { label: '主攻渠道', value: extractedInfo.primaryChannels || '待确认' },
  ];
  const planningExtractionSteps = [
    '提取营销目标',
    '整理目标人群',
    '提炼核心卖点',
    '估算预算量级',
    '匹配主攻渠道',
  ];
  const canConfirmPlanning =
    extractedInfo.marketingGoal.trim().length > 0 &&
    extractedInfo.targetAudience.trim().length > 0 &&
    extractedInfo.sellingPoints.length > 0 &&
    extractedInfo.budgetLevel.trim().length > 0 &&
    extractedInfo.primaryChannels.trim().length > 0;
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
  const processingRequestLabel =
    reportType === 'planning'
      ? isPlanningFromInsight
        ? '当前洞察'
        : '参考资料'
      : selectedMemoryFiles.length > 0
        ? 'user'
        : '用户请求';
  const selectedMemoryFilesLabel = isPlanningFromInsight
    ? '1 report'
    : `${selectedMemoryFiles.length} file${selectedMemoryFiles.length === 1 ? '' : 's'}`;
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
    ? reportType === 'planning'
      ? '已完成策划信息提取...'
      : selectedMemoryFiles.length > 0
        ? '已完成参考资料读取...'
        : '已完成任务输入读取...'
    : reportType === 'planning'
      ? isPlanningFromInsight
        ? '正在根据洞察报告和记忆库提取策划信息...'
        : '正在根据记忆库提取策划信息...'
      : selectedMemoryFiles.length > 0
        ? '正在读取参考资料...'
        : '正在读取任务输入...';
  const brandInfoSectionTitle =
    reportType === 'planning'
      ? step === 'reading'
        ? '正在整理策划关键信息...'
        : '已完成策划关键信息提取...'
      : step === 'reading'
        ? '正在整理品牌信息...'
        : '已完成品牌信息整理...';
  const brandInfoTaskLabel =
    reportType === 'planning'
      ? step === 'reading'
        ? '正在根据洞察报告和记忆库提取策划方案所需信息'
        : '已完成营销目标、目标人群、预算与渠道信息提取'
      : step === 'reading'
        ? '正在提取品牌与产品信息'
        : '已完成品牌与产品信息提取';
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
  const showInsightFollowUpActions = workflowStatus === 'completed' && reportType === 'insight';
  const showPlanningFollowUpActions = workflowStatus === 'completed' && reportType === 'planning';
  const previousInsightPreviewHtml = useMemo(
    () =>
      shouldShowPreviousInsightHistory
        ? generateReportHTML(persistedCompletedExtractedInfo, 'insight')
        : '',
    [persistedCompletedExtractedInfo, shouldShowPreviousInsightHistory]
  );
  const currentReportPreviewHtml = useMemo(
    () => generateReportHTML(extractedInfo, reportType),
    [extractedInfo, reportType]
  );
  const activePreviewHtml =
    previewMode === 'insight-history' && previousInsightPreviewHtml
      ? previousInsightPreviewHtml
      : currentReportPreviewHtml;
  const activePreviewEmbeddedHtml = useMemo(
    () => buildEmbeddedPreviewHtml(activePreviewHtml),
    [activePreviewHtml]
  );
  const hasMultiplePreviewFiles = shouldShowPreviousInsightHistory && workflowStatus === 'completed';
  const previewToolbarItems = useMemo(
    () => [
      ...(hasMultiplePreviewFiles
        ? [
            {
              key: 'insight-history' as const,
              label: REPORT_TYPE_LABELS.insight,
            },
          ]
        : []),
      {
        key: (hasMultiplePreviewFiles ? 'auto' : activePreviewReportType === 'insight' ? 'insight-history' : 'auto') as
          | 'insight-history'
          | 'auto',
        label: hasMultiplePreviewFiles ? REPORT_TYPE_LABELS.planning : REPORT_TYPE_LABELS[activePreviewReportType],
      },
    ],
    [activePreviewReportType, hasMultiplePreviewFiles]
  );
  const activePreviewToolbarIndex = previewToolbarItems.findIndex((item) => item.key === previewMode);
  const resolvedActivePreviewToolbarIndex =
    activePreviewToolbarIndex >= 0 ? activePreviewToolbarIndex : previewToolbarItems.length - 1;

  const buildReportMemoryEntry = useCallback(
    (reportData: ExtractedInfo, targetReportType: ReportType, reportHtml?: string) => {
      const fileLabel = REPORT_TYPE_LABELS[targetReportType];
      const title = `${reportData.brandName || '未命名品牌'} ${fileLabel}`;

      return {
        title,
        content: buildMemoryMarkdownFromHtml(
          title,
          reportHtml ?? generateReportHTML(reportData, targetReportType)
        ),
        category: fileLabel,
        tags:
          targetReportType === 'planning'
            ? [reportData.category, reportData.primaryChannels, reportData.budgetLevel, fileLabel].filter(Boolean)
            : [reportData.category, reportData.analysisTarget, reportData.businessDirection, fileLabel].filter(Boolean),
      };
    },
    []
  );

  const saveReportMemoryEntry = useCallback(
    (
      reportData: ExtractedInfo,
      targetReportType: ReportType,
      options?: {
        reportHtml?: string;
        openDrawer?: boolean;
        showSavedToast?: boolean;
        showExistingToast?: boolean;
      }
    ) => {
      const payload = buildReportMemoryEntry(reportData, targetReportType, options?.reportHtml);
      const existing = entries.find(
        (item) =>
          item.title === payload.title &&
          item.content === payload.content &&
          item.category === payload.category
      );

      if (existing) {
        if (options?.openDrawer) {
          setDrawerOpen(true);
        }
        if (options?.showExistingToast) {
          toast.info('记忆库已有该内容');
        }
        return existing;
      }

      const entry = ensureEntry(payload);

      if (options?.openDrawer) {
        setDrawerOpen(true);
      }
      if (options?.showSavedToast) {
        toast.success('已保存到记忆库');
      }

      return entry;
    },
    [buildReportMemoryEntry, entries, ensureEntry, setDrawerOpen]
  );

  const handleGeneratePlanningFromInsight = useCallback(() => {
    const nextBrandName = brandName.trim() || extractedInfo.brandName;
    const nextCategory = category.trim() || extractedInfo.category;

    saveReportMemoryEntry(extractedInfo, 'insight');
    setPreviewMode('auto');
    setPersistedCompletedReportType('insight');
    setPersistedCompletedExtractedInfo(extractedInfo);
    setBrandName(nextBrandName);
    setCategory(nextCategory);
    setPlanningInputSource('insight');
    setReportType('planning');
    setExtractedInfo(
      buildExtractedInfo({
        brandName: nextBrandName,
        category: nextCategory,
        competitors,
        selectedMemoryCount: selectedMemoryIds.length,
        reportType: 'planning',
      })
    );
    startTransition(() => setStep('reading'));
  }, [
    brandName,
    category,
    competitors,
    extractedInfo,
    saveReportMemoryEntry,
    selectedMemoryIds.length,
  ]);

  const handleShowPreviousInsightPreview = useCallback(() => {
    if (!shouldShowPreviousInsightHistory) {
      return;
    }

    setPreviewMode('insight-history');
  }, [shouldShowPreviousInsightHistory]);

  const handleShowCurrentReportPreview = useCallback(() => {
    setPreviewMode('auto');
  }, []);

  const handlePreviewToolbarSelect = useCallback(
    (index: number) => {
      const target = previewToolbarItems[index];
      if (!target) {
        return;
      }

      if (target.key === 'insight-history') {
        handleShowPreviousInsightPreview();
        return;
      }

      handleShowCurrentReportPreview();
    },
    [handleShowCurrentReportPreview, handleShowPreviousInsightPreview, previewToolbarItems]
  );

  const previewToolbarControl = (
    <div className="inline-flex items-center gap-3 bg-background/88 py-1">
      {previewToolbarItems.map((item, index) => {
        const isActive = index === resolvedActivePreviewToolbarIndex;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => handlePreviewToolbarSelect(index)}
            className={cn(
              'inline-flex h-2.5 w-2.5 items-center justify-center rounded-full transition-colors',
              isActive
                ? 'bg-accent/80'
                : 'bg-muted-foreground/15 hover:bg-accent/40'
            )}
            aria-pressed={isActive}
            aria-label={`切换到${item.label}`}
            title={item.label}
          >
            <span className="sr-only">{item.label}</span>
          </button>
        );
      })}
    </div>
  );

  const handleOpenPreviewWindow = useCallback((html: string) => {
    const previewWindow = window.open('', '_blank');
    if (!previewWindow) {
      return;
    }

    previewWindow.document.write(html);
    previewWindow.document.close();
  }, []);

  const handleCopyPreviewHtml = useCallback(() => {
    navigator.clipboard.writeText(activePreviewHtml).then(
      () => {
        toast.success(`HTML ${REPORT_TYPE_LABELS[activePreviewReportType]}已复制到剪贴板`);
      },
      () => {
        toast.error('复制失败，请稍后重试');
      }
    );
  }, [activePreviewHtml, activePreviewReportType]);

  const handleExportPreviewHtml = useCallback(() => {
    const blob = new Blob([activePreviewHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const fileLabel = REPORT_TYPE_LABELS[activePreviewReportType];

    anchor.href = url;
    anchor.download = `${activePreviewExtractedInfo.brandName || '未命名品牌'}-${fileLabel}.html`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(`${fileLabel}已导出`);
  }, [activePreviewExtractedInfo.brandName, activePreviewHtml, activePreviewReportType]);

  const handleSavePreviewToMemory = useCallback(() => {
    saveReportMemoryEntry(activePreviewExtractedInfo, activePreviewReportType, {
      reportHtml: activePreviewHtml,
      openDrawer: true,
      showSavedToast: true,
      showExistingToast: true,
    });
  }, [
    activePreviewExtractedInfo,
    activePreviewHtml,
    activePreviewReportType,
    saveReportMemoryEntry,
  ]);

  const jumpToOranGenWithPrefill = useCallback(() => {
    const insightSource =
      reportType === 'insight'
        ? extractedInfo
        : persistedCompletedReportType === 'insight' && persistedCompletedExtractedInfo.brandName
          ? persistedCompletedExtractedInfo
          : null;

    const planningSource =
      reportType === 'planning'
        ? extractedInfo
        : persistedCompletedReportType === 'planning' && persistedCompletedExtractedInfo.brandName
          ? persistedCompletedExtractedInfo
          : null;

    const attachmentEntries = [];

    if (insightSource) {
      attachmentEntries.push(saveReportMemoryEntry(insightSource, 'insight'));
    }

    if (planningSource) {
      attachmentEntries.push(saveReportMemoryEntry(planningSource, 'planning'));
    }

    setOranGenPrefill({
      attachmentIds: attachmentEntries.map((entry) => entry.id),
      attachmentNames: attachmentEntries.map((entry) => entry.title),
      category:
        planningSource?.category ||
        insightSource?.category ||
        category.trim() ||
        persistedCompletedExtractedInfo.category ||
        undefined,
    });

    onNavigate?.('skills');
  }, [
    category,
    extractedInfo,
    onNavigate,
    persistedCompletedExtractedInfo,
    persistedCompletedReportType,
    reportType,
    saveReportMemoryEntry,
    setOranGenPrefill,
  ]);

  const handleJumpToOranGen = useCallback(() => {
    jumpToOranGenWithPrefill();
  }, [jumpToOranGenWithPrefill]);

  const handleJumpToPrediction = useCallback(() => {
    const insightSource =
      reportType === 'insight'
        ? extractedInfo
        : persistedCompletedReportType === 'insight' && persistedCompletedExtractedInfo.brandName
          ? persistedCompletedExtractedInfo
          : null;

    const planningSource =
      reportType === 'planning'
        ? extractedInfo
        : persistedCompletedReportType === 'planning' && persistedCompletedExtractedInfo.brandName
          ? persistedCompletedExtractedInfo
          : null;

    const attachmentEntries = [];

    if (insightSource) {
      attachmentEntries.push(saveReportMemoryEntry(insightSource, 'insight'));
    }

    if (planningSource) {
      attachmentEntries.push(saveReportMemoryEntry(planningSource, 'planning'));
    }

    const prompt =
      attachmentEntries.length >= 2
        ? '基于附件中的洞察报告与策划方案，预测后续传播表现与执行风险。'
        : planningSource
          ? '基于附件中的策划方案，预测后续传播表现与执行风险。'
          : '基于附件中的洞察报告，预测后续传播表现与执行风险。';

    setOranSimulationPrefill({
      attachmentIds: attachmentEntries.map((entry) => entry.id),
      attachmentNames: attachmentEntries.map((entry) => entry.title),
      prompt,
      autoStart: true,
      brandName:
        planningSource?.brandName ||
        insightSource?.brandName ||
        brandName.trim() ||
        persistedCompletedExtractedInfo.brandName ||
        extractedInfo.brandName ||
        '',
      category:
        planningSource?.category ||
        insightSource?.category ||
        category.trim() ||
        persistedCompletedExtractedInfo.category ||
        extractedInfo.category ||
        '',
    });
    onNavigate?.('oran-simulation');
  }, [
    brandName,
    category,
    extractedInfo,
    onNavigate,
    persistedCompletedExtractedInfo,
    persistedCompletedReportType,
    reportType,
    saveReportMemoryEntry,
    setOranSimulationPrefill,
  ]);

  const handleJumpToContentGeneration = useCallback(() => {
    jumpToOranGenWithPrefill();
  }, [jumpToOranGenWithPrefill]);

  const handleConfirmPlanningGenerate = useCallback(() => {
    if (!canConfirmPlanning) {
      return;
    }

    if (!canAfford(GENERATION_COST)) {
      setCreditsDrawerOpen(true);
      return;
    }

    deduct(GENERATION_COST, `${REPORT_TYPE_LABELS.planning}生成`);
    startTransition(() => setStep('generating'));
  }, [canAfford, canConfirmPlanning, deduct]);

  const createHistoryItem = useCallback((): InsightHistoryItem => ({
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    step: 'report',
    brandName: brandName.trim() || extractedInfo.brandName,
    category: category.trim() || extractedInfo.category,
    reportType,
    planningInputSource,
    competitors,
    selectedMemoryIds,
    extractedInfo,
    persistedCompletedReportType,
    persistedCompletedExtractedInfo,
  }), [
    brandName,
    category,
    competitors,
    extractedInfo,
    persistedCompletedExtractedInfo,
    persistedCompletedReportType,
    planningInputSource,
    reportType,
    selectedMemoryIds,
  ]);

  const appendHistoryItem = useCallback((item: InsightHistoryItem) => {
    setHistory((prev) => {
      const updated = [item, ...prev].slice(0, 20);
      saveInsightHistory(updated);
      return updated;
    });
  }, []);

  const handleRestoreHistory = useCallback((item: InsightHistoryItem) => {
    isRestoringHistoryRef.current = true;
    previousStepRef.current = item.step;
    setBrandName(item.brandName);
    setCategory(item.category);
    setReportType(item.reportType);
    setPlanningInputSource(item.planningInputSource);
    setCompetitors(item.competitors);
    setCompetitorInput('');
    setSelectedMemoryIds(item.selectedMemoryIds);
    setExtractedInfo(item.extractedInfo);
    setPersistedCompletedReportType(item.persistedCompletedReportType);
    setPersistedCompletedExtractedInfo(item.persistedCompletedExtractedInfo);
    setPreviewMode('auto');
    startTransition(() => setStep(item.step));
  }, []);

  const handleDeleteHistory = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      saveInsightHistory(updated);
      return updated;
    });
  }, []);

  useEffect(() => {
    if (previousStepRef.current !== 'report' && step === 'report') {
      if (isRestoringHistoryRef.current) {
        isRestoringHistoryRef.current = false;
        previousStepRef.current = step;
        return;
      }

      const shouldPreserveInsightHistory =
        isPlanningFromInsight &&
        reportType === 'planning' &&
        persistedCompletedReportType === 'insight' &&
        Boolean(persistedCompletedExtractedInfo.brandName);

      if (!shouldPreserveInsightHistory) {
        setPersistedCompletedReportType(reportType);
        setPersistedCompletedExtractedInfo(extractedInfo);
      }

      appendHistoryItem(createHistoryItem());
    }

    previousStepRef.current = step;
  }, [
    appendHistoryItem,
    createHistoryItem,
    extractedInfo,
    isPlanningFromInsight,
    persistedCompletedExtractedInfo.brandName,
    persistedCompletedReportType,
    reportType,
    step,
  ]);

  const historySheet = (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground">
          <History className="h-3.5 w-3.5" />
          <span>历史记录</span>
        </button>
      </SheetTrigger>
      <SheetContent className="w-80 sm:w-96">
        <SheetHeader>
          <SheetTitle className="text-base font-medium">历史记录</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(100vh-6rem)]">
          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => handleRestoreHistory(item)}
              className="group relative w-full rounded-xl border border-border/30 p-3 text-left transition-all hover:border-border/60 hover:bg-muted/20"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-foreground">
                  {item.brandName || '未命名品牌'} {REPORT_TYPE_LABELS[item.reportType]}
                </span>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {new Date(item.date).toLocaleString('zh-CN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {item.category || '未填写品类'}
                {item.competitors.length > 0 ? ` · ${item.competitors.join('、')}` : ''}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {(item.reportType === 'insight' ||
                  (item.persistedCompletedReportType === 'insight' &&
                    Boolean(item.persistedCompletedExtractedInfo.brandName))) && (
                  <span className="rounded-full bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    洞察
                  </span>
                )}
                {item.reportType === 'planning' && (
                  <span className="rounded-full bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    策划
                  </span>
                )}
              </div>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  handleDeleteHistory(item.id);
                }}
                className="absolute bottom-3 right-3 rounded-full p-1 opacity-0 transition-all group-hover:opacity-100 hover:bg-muted/40"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground/50" />
              </button>
            </button>
          ))}
          {history.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">暂无历史记录</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );

  useEffect(() => {
    if (step !== 'reading') {
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
      const fallbackTimer = window.setTimeout(() => {
        setCompletedReadingDocCount((prev) => Math.min(prev + 1, readingDocumentItems.length));
      }, 760);

      return () => {
        window.clearTimeout(fallbackTimer);
      };
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
      if (reportType === 'planning') {
        startTransition(() => setStep('confirm'));
        return;
      }

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
  }, [canAfford, deduct, docsReadFinished, reportType, reportTypeLabel, step]);

  useEffect(() => {
    if (workflowStatus === 'completed') {
      return;
    }

    const scrollContainer = useSplitLayout
      ? splitLayoutAsideRef.current
      : processingViewportRef.current;
    if (!scrollContainer) {
      return;
    }

    let frameA = 0;
    let frameB = 0;

    frameA = window.requestAnimationFrame(() => {
      frameB = window.requestAnimationFrame(() => {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth',
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
    useSplitLayout,
    visibleReadingDocCount,
    visibleGeneratingProgressItems.length,
    workflowStatus,
  ]);

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {step === 'input' ? (
        <div className="absolute right-4 top-4 z-20 md:right-8 md:top-6">{historySheet}</div>
      ) : null}
      <div
        ref={processingViewportRef}
        className={cn(
          'h-full min-h-0 flex-1',
          workflowStatus === 'completed' ? 'overflow-hidden overscroll-none' : 'overflow-y-auto'
        )}
      >
        {step === 'input' && (
          <div className="min-h-full flex flex-col items-center justify-start gap-20 px-6 pt-[100px] pb-6 md:px-8 md:pt-[180px] md:pb-8">
            <InsightComposerPanel
              title="ORAN HUB"
              subtitle="输入品牌、品类与竞品信息，我会帮你整理关键信息并生成对应结果。"
              reportType={reportType}
              reportTypeLabel={reportTypeLabel}
              reportTypeMenuOpen={reportTypeMenuOpen}
              onReportTypeMenuOpenChange={setReportTypeMenuOpen}
              onReportTypeChange={handleReportTypeChange}
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
              useSplitLayout
                ? 'h-[calc(100dvh-56px)] overflow-hidden overscroll-none px-5 py-4 md:px-8 md:py-5'
                : 'min-h-full px-6 pb-16 pt-10 md:px-10'
            )}
          >
            <div
              className={cn(
                'w-full',
                useSplitLayout ? 'flex h-full min-h-0 flex-col gap-4' : 'space-y-8'
              )}
            >
              {!useSplitLayout ? (
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
                            {reportType === 'planning' ? (
                              <div className="relative space-y-2.5 pl-6 before:absolute before:left-0 before:top-2 before:h-[calc(100%-14px)] before:w-px before:bg-border/35">
                                {planningExtractionSteps.map((item) => (
                                  <div key={item} className="relative flex items-center gap-2 text-[12px] text-muted-foreground/70">
                                    <span className="absolute -left-[19px] top-[8px] h-1.5 w-1.5 rounded-full bg-border/60" />
                                    {step === 'reading' ? (
                                      <Loader2 className="h-3 w-3 shrink-0 animate-spin text-muted-foreground/58" />
                                    ) : (
                                      <Check className="h-3 w-3 shrink-0 text-foreground/68" />
                                    )}
                                    <span>{item}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="relative space-y-2.5 pl-6 before:absolute before:left-0 before:top-2 before:h-[calc(100%-14px)] before:w-px before:bg-border/35">
                                {processingEntityItems.map((item) => (
                                  <div key={item.label} className="relative text-[12px] text-muted-foreground/70">
                                    <span className="absolute -left-[19px] top-[8px] h-1.5 w-1.5 rounded-full bg-border/60" />
                                    <span>{item.label}：</span>
                                    <span>{item.value}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </section>
                      )}

                      {step === 'confirm' && reportType === 'planning' && (
                        <section
                          ref={latestProcessingItemRef}
                          className="space-y-3.5 animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
                        >
                          <h2 className="text-[14px] font-normal text-foreground/70">
                            需要你确认以下策划信息
                          </h2>
                          <div className="space-y-4 rounded-[20px] border border-border/25 bg-card/82 p-5 shadow-sm">
                            <ConfirmField
                              label="营销目标"
                              value={extractedInfo.marketingGoal}
                              onChange={(value) => updateField('marketingGoal', value)}
                            />
                            <ConfirmField
                              label="目标人群"
                              value={extractedInfo.targetAudience}
                              onChange={(value) => updateField('targetAudience', value)}
                            />
                            <ConfirmField
                              label="核心卖点"
                              value={extractedInfo.sellingPoints.join('、')}
                              onChange={handleSellingPointsChange}
                            />
                            <ConfirmField
                              label="预算量级"
                              value={extractedInfo.budgetLevel}
                              onChange={(value) => updateField('budgetLevel', value)}
                            />
                            <ConfirmField
                              label="主攻渠道"
                              value={extractedInfo.primaryChannels}
                              onChange={(value) => updateField('primaryChannels', value)}
                            />

                            <div className="flex items-center justify-between rounded-[16px] bg-muted/35 px-4 py-3">
                              <div className="text-[12px] leading-6 text-muted-foreground">
                                确认后将继续生成{reportTypeLabel}，并输出最终 HTML 结果。
                              </div>
                              <button
                                type="button"
                                onClick={handleConfirmPlanningGenerate}
                                disabled={!canConfirmPlanning}
                                className="rounded-full bg-foreground px-4 py-2 text-[12px] text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
                              >
                                确认并生成
                              </button>
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
                  <aside
                    ref={splitLayoutAsideRef}
                    className="h-full min-h-0 overflow-y-auto overscroll-contain pr-2 pb-6 animate-in fade-in-0 slide-in-from-right-4 duration-500"
                  >
                    <div className="space-y-5">
                      <button
                        onClick={() => handleBack('input')}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/25 bg-card/70 text-muted-foreground transition-colors hover:text-foreground hover:border-border/40"
                        aria-label="返回"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>

                      {shouldShowPreviousInsightHistory && (
                        <>
                          <section className="space-y-1.5">
                            <div className="text-right text-xs text-muted-foreground">user</div>
                            <div className="text-right text-[10px] uppercase tracking-[0.16em] text-muted-foreground/55">
                              {previousInsightFilesLabel}
                            </div>
                            <div className="rounded-[26px] bg-muted/80 px-4 py-2 text-[13px] leading-5 text-foreground/78 ">
                              {previousInsightRequestText}
                            </div>
                          </section>

                          <section className="space-y-3">
                            <div className="space-y-1">
                              <h3 className="text-[14px] font-light tracking-tight text-foreground">
                                已完成参考资料读取...
                              </h3>
                              <p className="text-[12px] leading-6 text-muted-foreground">
                                洞察阶段的输入信息与参考文档已完成接入，过程记录已完整保留。
                              </p>
                            </div>
                            <div className="space-y-3">
                              {readingDocumentItems.map((doc) => (
                                <div
                                  key={`insight-history-${doc.id}`}
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

                          <section className="space-y-3">
                            <div className="space-y-1">
                              <h3 className="text-[14px] font-light tracking-tight text-foreground">
                                已完成品牌信息整理
                              </h3>
                              <p className="text-[12px] leading-6 text-muted-foreground">
                                洞察阶段的品牌、品类、竞品与参考资料已整理完毕。
                              </p>
                            </div>
                            <div className="space-y-2 pl-12">
                              <div className="flex items-center gap-2 text-[12px] text-foreground/76">
                                <Check className="h-3.5 w-3.5 shrink-0 text-foreground/72" />
                                <span>已完成品牌与产品信息提取</span>
                              </div>
                              <div className="relative space-y-2 pl-5 before:absolute before:left-0 before:top-2 before:h-[calc(100%-14px)] before:w-px before:bg-border/35">
                                {previousInsightSummaryItems.map((item) => (
                                  <div key={`insight-summary-${item.label}`} className="relative text-[12px] text-muted-foreground/72">
                                    <span className="absolute -left-[18px] top-[8px] h-1.5 w-1.5 rounded-full bg-border/60" />
                                    <span>{item.label}：</span>
                                    <span>{item.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </section>

                          <section className="space-y-3">
                            <div className="space-y-1">
                              <h3 className="text-[14px] font-light tracking-tight text-foreground">
                                已完成洞察报告生成
                              </h3>
                              <p className="text-[12px] leading-6 text-muted-foreground">
                                洞察阶段的生成步骤已完成，右侧当前保留这份已完成报告。
                              </p>
                            </div>
                            <div className="space-y-1.5 pl-12">
                              {GENERATING_PHASES.map((item) => (
                                <div
                                  key={`insight-generating-${item.label}`}
                                  className="flex items-center gap-2 text-[12px] text-foreground/76"
                                >
                                  <Check className="h-3.5 w-3.5 shrink-0 text-foreground/72" />
                                  <span>{item.label}</span>
                                </div>
                              ))}
                            </div>
                          </section>

                          <ReportPreviewCard
                            title={`已生成${persistedCompletedExtractedInfo.brandName || '该品牌'}的洞察报告`}
                            html={previousInsightPreviewHtml}
                            active={isShowingPreviousInsightPreview}
                            onSelect={handleShowPreviousInsightPreview}
                            onExpand={() => handleOpenPreviewWindow(previousInsightPreviewHtml)}
                          />
                        </>
                      )}

                      <section className="space-y-1.5">
                        <div className="text-right text-xs text-muted-foreground">user</div>
                        <div className="text-right text-[10px] uppercase tracking-[0.16em] text-muted-foreground/55">
                          {selectedMemoryFilesLabel}
                        </div>
                        <div className="rounded-[26px]  bg-muted/80 px-4 py-1.5 text-[13px] leading-7 text-foreground/78 ">
                          {streamRequestText}
                        </div>
                      </section>

                      {hasReachedStep('reading') && (
                      <section className="space-y-3">
                        <div className="space-y-1">
                          <h3 className="text-[14px] font-light tracking-tight text-foreground">
                            {reportType === 'planning' && !docsReadFinished && step === 'reading'
                              ? '正在读取策划所需资料...'
                              : reportType === 'planning'
                                ? '已完成策划资料读取'
                                : '已完成参考资料读取'}
                          </h3>
                          <p className="text-[12px] leading-6 text-muted-foreground">
                            {reportType === 'planning' && !docsReadFinished && step === 'reading'
                              ? '洞察报告与可用记忆库资料正在接入，左侧继续追加策划方案所需上下文。'
                              : reportType === 'planning'
                                ? '洞察报告与可用记忆库资料已接入，左侧保留完整提取过程记录。'
                                : '输入信息与参考文档已完成接入，左侧保留完整过程记录。'}
                          </p>
                          </div>
                          <div className="space-y-3">
                            {(step === 'reading' ? visibleReadingDocuments : readingDocumentItems).map((doc, index) => {
                              const status =
                                step === 'reading'
                                  ? index < completedReadingDocCount
                                    ? 'completed'
                                    : index === activeReadingDocIndex
                                      ? 'active'
                                      : 'pending'
                                  : 'completed';

                              return (
                              <div
                                key={doc.id}
                                className="flex items-start gap-3 rounded-[22px] border border-border/25 bg-card/82 px-4 py-4 shadow-sm"
                              >
                                <div className="mt-0.5 flex h-[18px] w-[18px] items-center justify-center">
                                  <FileText
                                    className={cn(
                                      'h-[18px] w-[18px]',
                                      status === 'active'
                                        ? 'animate-pulse text-foreground/78'
                                        : status === 'completed'
                                          ? 'text-muted-foreground/72'
                                          : 'text-muted-foreground/48'
                                    )}
                                  />
                                </div>
                                <div className="min-w-0 flex-1 space-y-1.5">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="truncate text-[13px] text-foreground/84">{doc.name}</div>
                                      <div className="mt-1 text-[11px] text-muted-foreground">.md / 记忆库文档</div>
                                    </div>
                                    <div className="rounded-full border border-border/25 bg-background/75 px-2.5 py-1 text-[11px] text-foreground/68">
                                      {status === 'active' ? '读取中' : status === 'completed' ? '已接入' : '等待中'}
                                    </div>
                                  </div>
                                  <div className="rounded-[18px] bg-muted/35 px-4 py-3 text-[12px] leading-7 text-foreground/42">
                                    {doc.text.slice(0, 120)}
                                    {doc.text.length > 120 ? '...' : ''}
                                  </div>
                                </div>
                              </div>
                              );
                            })}
                          </div>
                        </section>
                      )}

                      {(reportType !== 'planning' || docsReadFinished || step !== 'reading') && (
                        <section className="space-y-3">
                          <div className="space-y-1">
                            <h3 className="text-[14px] font-light tracking-tight text-foreground">
                              {reportType === 'planning' && step === 'reading'
                                ? '正在提取策划关键信息...'
                                : reportType === 'planning'
                                  ? '已完成策划关键信息提取'
                                  : '已完成品牌信息整理'}
                            </h3>
                            <p className="text-[12px] leading-6 text-muted-foreground">
                              {reportType === 'planning' && step === 'reading'
                                ? '正在根据洞察报告和记忆库提取营销目标、目标人群、预算量级与主攻渠道。'
                                : reportType === 'planning'
                                  ? '已根据洞察报告与记忆库整理出策划方案所需的核心输入信息。'
                                  : '品牌、品类、竞品与记忆库资料已整理完毕，供报告生成阶段引用。'}
                            </p>
                          </div>
                          <div className="space-y-2 pl-12">
                            <div className="flex items-center gap-2 text-[12px] text-foreground/76">
                              {reportType === 'planning' && step === 'reading' ? (
                                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground/72" />
                              ) : (
                                <Check className="h-3.5 w-3.5 shrink-0 text-foreground/72" />
                              )}
                              <span>
                                {reportType === 'planning'
                                  ? '已完成策划方案关键信息提取'
                                  : '已完成品牌与产品信息提取'}
                              </span>
                            </div>
                            {reportType === 'planning' && step === 'reading' ? (
                              <div className="relative space-y-2 pl-5 before:absolute before:left-0 before:top-2 before:h-[calc(100%-14px)] before:w-px before:bg-border/35">
                                {planningExtractionSteps.map((item) => (
                                  <div key={item} className="relative flex items-center gap-2 text-[12px] text-muted-foreground/72">
                                    <span className="absolute -left-[18px] top-[8px] h-1.5 w-1.5 rounded-full bg-border/60" />
                                    <Loader2 className="h-3 w-3 shrink-0 animate-spin text-muted-foreground/60" />
                                    <span>{item}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="relative space-y-2 pl-5 before:absolute before:left-0 before:top-2 before:h-[calc(100%-14px)] before:w-px before:bg-border/35">
                                {(reportType === 'planning' ? planningDraftItems : processingSummaryItems).map((item) => (
                                  <div key={item.label} className="relative text-[12px] text-muted-foreground/72">
                                    <span className="absolute -left-[18px] top-[8px] h-1.5 w-1.5 rounded-full bg-border/60" />
                                    <span>{item.label}：</span>
                                    <span>{item.value}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </section>
                      )}

                      {(hasReachedStep('confirm') || (reportType === 'planning' && step === 'confirm')) && reportType === 'planning' && (
                        <section className="space-y-3">
                          <div className="space-y-1">
                            <h3 className="text-[14px] font-light tracking-tight text-foreground">
                              {step === 'confirm' ? '等待确认策划信息...' : '已完成策划信息确认'}
                            </h3>
                            <p className="text-[12px] leading-6 text-foreground/60">
                              {step === 'confirm'
                                ? '请先确认营销目标、目标人群、核心卖点、预算量级与主攻渠道，再继续生成策划方案。'
                                : '用户已确认营销目标、目标人群、核心卖点、预算量级与主攻渠道。'}
                            </p>
                          </div>
                          <div className="space-y-1.5 pl-12">
                            {planningDraftItems.map((item) => (
                              <div key={item.label} className="flex items-start gap-2 text-[12px] text-foreground/50">
                                {step === 'confirm' ? (
                                  <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground/50" />
                                ) : (
                                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground/70" />
                                )}
                                <span>
                                  {item.label}：{item.value}
                                </span>
                              </div>
                            ))}
                          </div>

                          {step === 'confirm' && (
                            <div className="rounded-[20px] border border-border/25 bg-card/82 p-5 shadow-sm">
                              <div className="space-y-4">
                                <ConfirmField
                                  label="营销目标"
                                  value={extractedInfo.marketingGoal}
                                  onChange={(value) => updateField('marketingGoal', value)}
                                />
                                <ConfirmField
                                  label="目标人群"
                                  value={extractedInfo.targetAudience}
                                  onChange={(value) => updateField('targetAudience', value)}
                                />
                                <ConfirmField
                                  label="核心卖点"
                                  value={extractedInfo.sellingPoints.join('、')}
                                  onChange={handleSellingPointsChange}
                                />
                                <ConfirmField
                                  label="预算量级"
                                  value={extractedInfo.budgetLevel}
                                  onChange={(value) => updateField('budgetLevel', value)}
                                />
                                <ConfirmField
                                  label="主攻渠道"
                                  value={extractedInfo.primaryChannels}
                                  onChange={(value) => updateField('primaryChannels', value)}
                                />

                                <div className="flex items-center justify-between rounded-[16px] bg-muted/35 px-4 py-3">
                                  
                                  <button
                                    type="button"
                                    onClick={handleConfirmPlanningGenerate}
                                    disabled={!canConfirmPlanning}
                                    className="rounded-full bg-foreground px-4 py-2 text-[12px] text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
                                  >
                                    确认并生成策划报告
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </section>
                      )}

                      {hasReachedStep('generating') && (
                        <section className="space-y-3">
                          <div className="space-y-1">
                            <h3 className="text-[14px] font-light tracking-tight text-foreground">
                              {workflowStatus === 'generating_report'
                                ? `正在生成${reportTypeLabel}...`
                                : `已完成${reportTypeLabel}生成...`}
                            </h3>
                            <p className="text-[12px] leading-6 text-muted-foreground">
                              {workflowStatus === 'generating_report'
                                ? '策划方案生成中...'
                                : '生成步骤已完成，右侧展示最终 HTML 报告展板。'}
                            </p>
                          </div>
                          <div className="space-y-1.5 pl-12">
                            {generatingProgressItems.map((item) => (
                              <div key={item.label} className="flex items-center gap-2 text-[12px] text-foreground/76">
                                {workflowStatus === 'generating_report' && item.state !== 'completed' ? (
                                  item.state === 'active' ? (
                                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground/72" />
                                  ) : (
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/35" />
                                  )
                                ) : (
                                  <Check className="h-3.5 w-3.5 shrink-0 text-foreground/72" />
                                )}
                                <span>{item.label}</span>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      {workflowStatus === 'completed' && (
                        <ReportPreviewCard
                          title={`已生成${extractedInfo.brandName || '该品牌'}的${reportTypeLabel}`}
                          html={currentReportPreviewHtml}
                          active={!isShowingPreviousInsightPreview}
                          onSelect={handleShowCurrentReportPreview}
                          onExpand={() => handleOpenPreviewWindow(currentReportPreviewHtml)}
                        />
                      )}

                      {showInsightFollowUpActions && (
                        <section className="space-y-3 ">
                          <div className="space-y-1">
                            <h3 className="text-[14px] font-light tracking-tight text-foreground">
                              接下来
                            </h3>
                            
                          </div>

                          <div className="space-y-4 ">
                            <button
                              type="button"
                              onClick={handleGeneratePlanningFromInsight}
                              className="group flex min-h-[30px] w-full items-center justify-between rounded-[22px] border border-border/40 bg-background/90 px-5 py-1.5 text-left transition-all hover:border-foreground/25 hover:bg-muted/30"
                            >
                              <div className="space-y-1">
                                <div className="text-[13px] font-medium text-foreground/70">
                                  基于当前洞察报告，继续生成策划方案
                                </div>
                              </div>
                              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                            </button>

                            <button
                              type="button"
                              onClick={handleJumpToOranGen}
                              className="group flex min-h-[30px] w-full items-center justify-between rounded-[22px] border border-border/40 bg-background/90 px-5 py-1.5 text-left transition-all hover:border-foreground/25 hover:bg-muted/30"
                            >
                              <div className="space-y-1">
                                <div className="text-[13px] font-medium text-foreground/70">
                                  基于当前洞察报告，继续生成爆款内容
                                </div>
                              </div>
                              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                            </button>
                          </div>
                        </section>
                      )}

                      {showPlanningFollowUpActions && (
                        <section className="space-y-3 ">
                          <div className="space-y-1">
                            <h3 className="text-[14px] font-light tracking-tight text-foreground">
                              接下来
                            </h3>
                          </div>

                          <div className="space-y-4 ">
                            <button
                              type="button"
                              onClick={handleJumpToPrediction}
                              className="group flex min-h-[30px] w-full items-center justify-between rounded-[22px] border border-border/40 bg-background/90 px-5 py-1.5 text-left transition-all hover:border-foreground/25 hover:bg-muted/30"
                            >
                              <div className="space-y-1">
                                <div className="text-[13px] font-medium text-foreground/70">
                                  根据已有报告，进入预测
                                </div>
                              </div>
                              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                            </button>

                            <button
                              type="button"
                              onClick={handleJumpToContentGeneration}
                              className="group flex min-h-[30px] w-full items-center justify-between rounded-[22px] border border-border/40 bg-background/90 px-5 py-1.5 text-left transition-all hover:border-foreground/25 hover:bg-muted/30"
                            >
                              <div className="space-y-1">
                                <div className="text-[13px] font-medium text-foreground/70">
                                  根据已有报告，进入内容生成
                                </div>
                              </div>
                              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                            </button>
                          </div>
                        </section>
                      )}
                    </div>
                  </aside>

                  <section className="flex h-full min-h-0 flex-col gap-3 overscroll-none animate-in fade-in-0 slide-in-from-right-12 duration-700">
                    <div className="min-h-0 flex-1 transition-all duration-700 ease-out">
                      <div className="flex h-full min-h-0 flex-col rounded-[22px] border border-border/30 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                        <div className="flex items-center justify-between gap-3 border-b border-border/30 px-5 py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            {previewToolbarControl}
                            <div className="truncate text-[13px] font-medium text-foreground/72">
                              {previewMode === 'insight-history' && previousInsightPreviewHtml
                                ? `${REPORT_TYPE_LABELS.insight} · 历史版本`
                                : REPORT_TYPE_LABELS[activePreviewReportType]}
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={handleCopyPreviewHtml}
                              className="inline-flex h-8 items-center gap-1 rounded-full border border-border/45 bg-background/80 px-3 text-[12px] text-foreground/70 transition-colors hover:border-foreground/20 hover:bg-muted/40"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              <span>复制HTML</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleExportPreviewHtml}
                              className="inline-flex h-8 items-center gap-1 rounded-full border border-border/45 bg-background/80 px-3 text-[12px] text-foreground/70 transition-colors hover:border-foreground/20 hover:bg-muted/40"
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span>下载</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleSavePreviewToMemory}
                              className="inline-flex h-8 items-center gap-1 rounded-full border border-border/45 bg-background/80 px-3 text-[12px] text-foreground/70 transition-colors hover:border-foreground/20 hover:bg-muted/40"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              <span>存入记忆库</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenPreviewWindow(activePreviewHtml)}
                              className="inline-flex h-8 items-center gap-1 rounded-full border border-border/45 bg-background/80 px-3 text-[12px] text-foreground/70 transition-colors hover:border-foreground/20 hover:bg-muted/40"
                            >
                              <Maximize2 className="h-3.5 w-3.5" />
                              <span>新窗口</span>
                            </button>
                          </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-auto p-3">
                          <div className="h-full min-h-0 overflow-hidden rounded-[18px] border border-border/35 bg-white">
                            <iframe
                              key={`${previewMode}-${activePreviewReportType}-${activePreviewEmbeddedHtml.length}`}
                              srcDoc={activePreviewEmbeddedHtml}
                              title="完整HTML预览"
                              className="h-full min-h-[720px] w-full border-0 bg-white"
                              sandbox="allow-same-origin"
                            />
                          </div>
                        </div>
                      </div>
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

function ReportPreviewCard({
  title,
  html,
  active,
  onSelect,
  onExpand,
}: {
  title: string;
  html: string;
  active?: boolean;
  onSelect: () => void;
  onExpand: () => void;
}) {
  const previewScale = 0.34;
  const htmlWithoutRevealScript = html.replace(
    /<script>\s*const sections = Array\.from\(document\.querySelectorAll\('\.report-section'\)\);[\s\S]*?<\/script>/,
    ''
  );
  const embeddedHtml = htmlWithoutRevealScript.includes('</head>')
    ? htmlWithoutRevealScript.replace(
        '</head>',
        `<style>
          .report-section {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
          html,
          body {
            overflow: hidden !important;
          }
          body {
            pointer-events: none !important;
          }
        </style></head>`
      )
    : htmlWithoutRevealScript;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[20px] border p-4 transition-all',
        active
          ? 'border-orange-200/90 bg-white shadow-[0_18px_40px_rgba(234,88,12,0.08)]'
          : 'border-border/30 bg-white hover:border-orange-200/70 hover:bg-white'
      )}
    >
      <div className="relative space-y-3">
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            aria-pressed={active}
            onClick={onSelect}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect();
              }
            }}
            className="min-w-0 text-left outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-orange-200/80"
          >
            <div className="truncate text-[14px] font-medium text-foreground">{title}</div>
            <div className="mt-1 text-[12px] text-muted-foreground">
              卡片仅展示报告开头封面，右侧保留完整内嵌预览。
            </div>
          </button>

          <button
            type="button"
            onClick={onExpand}
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full  bg-background/80 px-3 text-[12px] text-foreground/70 transition-colors hover:border-foreground/20 hover:bg-muted/40"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            
          </button>
        </div>

        <div className="overflow-hidden rounded-[18px] border border-border/35 bg-white">
          <div className="relative h-[220px] w-full overflow-hidden bg-[#f6f4f1]">
            <iframe
              key={`${title}-${embeddedHtml.length}-${active ? 'active' : 'idle'}`}
              srcDoc={embeddedHtml}
              title={`${title}完整预览`}
              tabIndex={-1}
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 border-0 bg-white select-none"
              style={{
                width: `${100 / previewScale}%`,
                height: `${100 / previewScale}%`,
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left',
              }}
              sandbox="allow-same-origin"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white via-white/92 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}
