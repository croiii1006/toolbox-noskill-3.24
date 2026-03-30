import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link2, Database, ArrowLeft, ArrowRight, Check, Loader2, ChevronLeft, ChevronRight, X, Plus, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useCredits } from '@/contexts/CreditsContext';
import { useMemory } from '@/contexts/MemoryContext';
import { MemorySelectionDialog, type MemorySelectItem } from '@/components/modules/memory/MemorySelectionDialog';
import { InsufficientCreditsDrawer } from '@/components/modules/InsufficientCreditsDrawer';
import { ShowcaseCard, SHOWCASE_CARDS } from './app-plaza/ShowcaseCard';
import { InsightWorkbenchReport } from './InsightWorkbenchReport';

type Step = 'input' | 'reading' | 'confirm' | 'generating' | 'report';

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

const READING_SOURCES = [
  { label: '网页内容解析', delay: 800 },
  { label: '品牌信息提取', delay: 1400 },
  { label: '市场数据关联', delay: 2200 },
];

const GENERATING_PHASES = [
  { label: '信息读取完成', delay: 0 },
  { label: '关键信息已确认', delay: 0 },
  { label: '正在生成报告结构', delay: 1500 },
  { label: '正在整理洞察内容', delay: 3500 },
  { label: '正在输出 HTML 页面', delay: 6000 },
];

export function InsightWorkbench({ onNavigate }: { onNavigate?: (id: string) => void }) {
  const { t } = useTranslation();
  const { deduct, canAfford, shortfall } = useCredits();
  const { entries } = useMemory();

  const [step, setStep] = useState<Step>('input');
  const [url, setUrl] = useState('');
  const [selectedMemoryIds, setSelectedMemoryIds] = useState<string[]>([]);
  const [memoryDialogOpen, setMemoryDialogOpen] = useState(false);
  const [creditsDrawerOpen, setCreditsDrawerOpen] = useState(false);

  // Reading state
  const [readingSources, setReadingSources] = useState<boolean[]>([]);

  // Confirm state
  const [extractedInfo, setExtractedInfo] = useState<ExtractedInfo>({
    brandName: '',
    category: '',
    sellingPoints: [],
    targetMarket: '',
    analysisTarget: '',
    websiteType: '',
    businessDirection: '',
  });
  const [newTag, setNewTag] = useState('');

  // Generating state
  const [generatingPhases, setGeneratingPhases] = useState<boolean[]>([]);

  // Case tabs
  const [casesTab, setCasesTab] = useState('insight');
  const [casesPage, setCasesPage] = useState(0);

  const hasInput = url.trim().length > 0 || selectedMemoryIds.length > 0;

  const memoryItems: MemorySelectItem[] = useMemo(() =>
    entries.map(e => ({
      id: e.id,
      name: e.title,
      desc: e.content.slice(0, 60),
      tag: e.category,
      charCount: e.content.length,
    })),
    [entries]
  );

  const insightCases = SHOWCASE_CARDS.filter(c => c.category === 'market');
  const planningCases = SHOWCASE_CARDS.filter(c => c.category === 'campaign');
  const activeCases = casesTab === 'insight' ? insightCases : planningCases;
  const casesPerPage = 3;
  const totalCasePages = Math.max(1, Math.ceil(activeCases.length / casesPerPage));
  const visibleCases = activeCases.slice(casesPage * casesPerPage, (casesPage + 1) * casesPerPage);

  // Step 1 → 2
  const handleSubmit = useCallback(() => {
    if (!hasInput) return;
    setStep('reading');
    setReadingSources(new Array(READING_SOURCES.length).fill(false));

    READING_SOURCES.forEach((src, i) => {
      setTimeout(() => {
        setReadingSources(prev => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, src.delay);
    });

    // After all reading completes → step 3
    setTimeout(() => {
      const domain = url.trim() ? new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '') : '记忆库来源';
      setExtractedInfo({
        brandName: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
        category: '消费品 / 美妆个护',
        sellingPoints: ['天然成分', '高性价比', '年轻化定位'],
        targetMarket: '中国大陆 · 18-35岁女性',
        analysisTarget: url.trim() || '记忆库内容',
        websiteType: '品牌官网',
        businessDirection: 'DTC 电商',
      });
      setStep('confirm');
    }, 3000);
  }, [hasInput, url]);

  // Step 3 → 4
  const handleConfirmGenerate = useCallback(() => {
    if (!canAfford(GENERATION_COST)) {
      setCreditsDrawerOpen(true);
      return;
    }
    deduct(GENERATION_COST, '洞察报告生成');
    setStep('generating');
    setGeneratingPhases([true, true, false, false, false]);

    GENERATING_PHASES.forEach((phase, i) => {
      if (i < 2) return; // first two already done
      setTimeout(() => {
        setGeneratingPhases(prev => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, phase.delay);
    });

    setTimeout(() => {
      setStep('report');
    }, 8000);
  }, [canAfford, deduct]);

  const handleBack = useCallback((toStep: Step) => {
    setStep(toStep);
  }, []);

  const addSellingPoint = useCallback(() => {
    if (newTag.trim()) {
      setExtractedInfo(prev => ({ ...prev, sellingPoints: [...prev.sellingPoints, newTag.trim()] }));
      setNewTag('');
    }
  }, [newTag]);

  const removeSellingPoint = useCallback((index: number) => {
    setExtractedInfo(prev => ({
      ...prev,
      sellingPoints: prev.sellingPoints.filter((_, i) => i !== index),
    }));
  }, []);

  const updateField = useCallback((field: keyof ExtractedInfo, value: string) => {
    setExtractedInfo(prev => ({ ...prev, [field]: value }));
  }, []);

  // Step indicator
  const steps = [
    { key: 'input', label: '输入' },
    { key: 'reading', label: '读取' },
    { key: 'confirm', label: '确认' },
    { key: 'generating', label: '生成' },
    { key: 'report', label: '报告' },
  ];
  const currentStepIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="h-full flex flex-col">
      {/* Step indicator - minimal */}
      <div className="flex items-center justify-center gap-2 py-4 px-6 border-b border-border/30">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
              i < currentStepIndex ? 'text-foreground' :
              i === currentStepIndex ? 'text-foreground' :
              'text-muted-foreground/50'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border transition-colors ${
                i < currentStepIndex ? 'bg-foreground text-background border-foreground' :
                i === currentStepIndex ? 'border-foreground text-foreground' :
                'border-border text-muted-foreground/50'
              }`}>
                {i < currentStepIndex ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              {s.label}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 h-px ${i < currentStepIndex ? 'bg-foreground' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {/* STEP 1: Input */}
        {step === 'input' && (
          <div className="max-w-2xl mx-auto px-6 pt-20 pb-12">
            <div className="text-center mb-12">
              <h1 className="text-xl font-semibold text-foreground mb-2">洞察工作台</h1>
              <p className="text-sm text-muted-foreground">输入网站链接或选择记忆库，快速生成结构化洞察报告</p>
            </div>

            {/* URL input */}
            <div className="space-y-3">
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="输入网站链接，开始解析..."
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                />
              </div>

              {/* Memory + Submit row */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setMemoryDialogOpen(true)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Database className="w-3.5 h-3.5" />
                  记忆库
                  {selectedMemoryIds.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{selectedMemoryIds.length}</Badge>
                  )}
                </button>

                <Button
                  onClick={handleSubmit}
                  disabled={!hasInput}
                  size="sm"
                  className="rounded-lg px-6"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  开始解析
                </Button>
              </div>
            </div>

            {/* Case tabs */}
            <div className="mt-16">
              <Tabs value={casesTab} onValueChange={v => { setCasesTab(v); setCasesPage(0); }}>
                <div className="flex items-center justify-between mb-4">
                  <TabsList className="bg-transparent p-0 h-auto gap-4">
                    <TabsTrigger value="insight" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground text-muted-foreground data-[state=active]:text-foreground text-xs">
                      洞察案例
                    </TabsTrigger>
                    <TabsTrigger value="planning" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground text-muted-foreground data-[state=active]:text-foreground text-xs">
                      策划案例
                    </TabsTrigger>
                  </TabsList>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" disabled={casesPage === 0} onClick={() => setCasesPage(p => p - 1)}>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" disabled={casesPage >= totalCasePages - 1} onClick={() => setCasesPage(p => p + 1)}>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <TabsContent value="insight" className="mt-0">
                  <div className="grid grid-cols-3 gap-3">
                    {visibleCases.map(card => (
                      <ShowcaseCard key={card.title} card={card} onClick={() => {}} variant="default" />
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="planning" className="mt-0">
                  <div className="grid grid-cols-3 gap-3">
                    {visibleCases.map(card => (
                      <ShowcaseCard key={card.title} card={card} onClick={() => {}} variant="default" />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}

        {/* STEP 2: Reading */}
        {step === 'reading' && (
          <div className="max-w-lg mx-auto px-6 pt-28 pb-12">
            <div className="text-center mb-10">
              <h2 className="text-lg font-medium text-foreground mb-1">正在读取信息</h2>
              <p className="text-xs text-muted-foreground">
                系统正在解析 {url.trim() ? url : '记忆库内容'}
              </p>
            </div>

            <div className="space-y-4">
              {READING_SOURCES.map((src, i) => (
                <div key={src.label} className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 flex items-center justify-center">
                    {readingSources[i] ? (
                      <Check className="w-4 h-4 text-foreground" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                    )}
                  </div>
                  <span className={readingSources[i] ? 'text-foreground' : 'text-muted-foreground'}>
                    {src.label}
                  </span>
                </div>
              ))}
            </div>

            {url.trim() && (
              <div className="mt-8 p-3 rounded-lg bg-muted/50 border border-border/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Link2 className="w-3.5 h-3.5" />
                  {url}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Confirm */}
        {step === 'confirm' && (
          <div className="max-w-2xl mx-auto px-6 pt-12 pb-12">
            <div className="mb-8">
              <h2 className="text-lg font-medium text-foreground mb-1">确认关键信息</h2>
              <p className="text-xs text-muted-foreground">以下信息由系统自动识别，请确认或修改后生成报告</p>
            </div>

            <Card className="border-border/30 shadow-sm p-6 space-y-5">
              {/* Brand name */}
              <ConfirmField
                label="品牌名 / 项目名"
                value={extractedInfo.brandName}
                onChange={v => updateField('brandName', v)}
              />
              <ConfirmField
                label="所属品类"
                value={extractedInfo.category}
                onChange={v => updateField('category', v)}
              />
              <ConfirmField
                label="目标市场"
                value={extractedInfo.targetMarket}
                onChange={v => updateField('targetMarket', v)}
              />
              <ConfirmField
                label="分析对象"
                value={extractedInfo.analysisTarget}
                onChange={v => updateField('analysisTarget', v)}
              />
              <ConfirmField
                label="网站类型"
                value={extractedInfo.websiteType}
                onChange={v => updateField('websiteType', v)}
              />
              <ConfirmField
                label="业务方向"
                value={extractedInfo.businessDirection}
                onChange={v => updateField('businessDirection', v)}
              />

              {/* Selling points - tags */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">核心卖点</span>
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-muted-foreground font-normal border-border/50">系统识别</Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {extractedInfo.sellingPoints.map((tag, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted text-xs text-foreground border border-border/30">
                      {tag}
                      <button onClick={() => removeSellingPoint(i)} className="text-muted-foreground hover:text-foreground">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <div className="inline-flex items-center gap-1">
                    <input
                      value={newTag}
                      onChange={e => setNewTag(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addSellingPoint()}
                      placeholder="添加..."
                      className="w-16 text-xs bg-transparent border-none outline-none placeholder:text-muted-foreground/50"
                    />
                    <button onClick={addSellingPoint} className="text-muted-foreground hover:text-foreground">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-between mt-8">
              <button
                onClick={() => handleBack('input')}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                返回重新输入
              </button>
              <Button onClick={handleConfirmGenerate} className="rounded-lg px-6" size="sm">
                确认并生成报告
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Generating */}
        {step === 'generating' && (
          <div className="max-w-lg mx-auto px-6 pt-28 pb-12">
            <div className="text-center mb-10">
              <h2 className="text-lg font-medium text-foreground mb-1">正在生成报告</h2>
              <p className="text-xs text-muted-foreground">预计需要几秒钟，请稍候</p>
            </div>

            <div className="space-y-4">
              {GENERATING_PHASES.map((phase, i) => (
                <div key={phase.label} className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 flex items-center justify-center">
                    {generatingPhases[i] ? (
                      <Check className="w-4 h-4 text-foreground" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                    )}
                  </div>
                  <span className={generatingPhases[i] ? 'text-foreground' : 'text-muted-foreground'}>
                    {phase.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: Report */}
        {step === 'report' && (
          <InsightWorkbenchReport
            extractedInfo={extractedInfo}
            onBack={() => handleBack('confirm')}
            onRestart={() => {
              setStep('input');
              setUrl('');
              setSelectedMemoryIds([]);
            }}
          />
        )}
      </div>

      {/* Memory dialog */}
      <MemorySelectionDialog
        open={memoryDialogOpen}
        onOpenChange={setMemoryDialogOpen}
        items={memoryItems}
        selectedIds={selectedMemoryIds}
        onToggle={id => setSelectedMemoryIds(prev =>
          prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )}
      />

      {/* Credits drawer */}
      <InsufficientCreditsDrawer
        open={creditsDrawerOpen}
        onOpenChange={setCreditsDrawerOpen}
        needed={shortfall(GENERATION_COST)}
      />
    </div>
  );
}

function ConfirmField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-muted-foreground font-normal border-border/50">系统识别</Badge>
      </div>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full h-9 px-3 rounded-lg border border-border/50 bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
      />
    </div>
  );
}
