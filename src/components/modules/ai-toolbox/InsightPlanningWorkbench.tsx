import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ArrowUp, Loader2, Database, Check, X, ChevronDown } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useCredits } from '@/contexts/CreditsContext';
import { InsufficientCreditsDrawer } from '@/components/modules/InsufficientCreditsDrawer';
import { useMemory } from '@/contexts/MemoryContext';
import { MemorySelectionDialog } from '@/components/modules/memory/MemorySelectionDialog';
import { CategoryCascader, CATEGORY_TREE } from '@/components/modules/skills/CategoryCascader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

/* ─── Types ─── */
type WorkMode = 'insight' | 'campaign';

interface ChatMessage {
  id: string;
  role: 'system' | 'user';
  content: string;
  type?: 'text' | 'options' | 'tags' | 'category' | 'summary';
  options?: string[];
  field?: string;
}

/* ─── Step definitions per mode ─── */
interface StepDef {
  field: string;
  question: string;
  type: 'text' | 'options' | 'tags' | 'category';
  options?: string[];
}

const INSIGHT_STEPS: StepDef[] = [
  { field: 'brandName', question: '请输入要分析的品牌名称', type: 'text' },
  { field: 'category', question: '选择该品牌所属的品类', type: 'category' },
  { field: 'competitors', question: '输入主要竞品品牌（回车添加，输入完毕后点击发送）', type: 'tags' },
];

const CAMPAIGN_STEPS: StepDef[] = [
  { field: 'brandName', question: '请输入品牌名称', type: 'text' },
  { field: 'goal', question: '选择本次营销目标', type: 'options', options: ['品牌升级', '销量增长', '新品发布', '节点营销', '用户拉新'] },
  { field: 'audience', question: '描述目标人群（如：18-25岁大学生、熬夜党，回车添加）', type: 'tags' },
  { field: 'sellingPoints', question: '输入核心卖点（如：温和不刺激、医生推荐，回车添加）', type: 'tags' },
  { field: 'budget', question: '选择预算量级', type: 'options', options: ['S级全域战役', 'A级核心爆破', 'B级日常种草'] },
];

const REPORT_COST = 200;

/* ─── Main Component ─── */
interface InsightPlanningWorkbenchProps {
  onNavigate: (itemId: string) => void;
}

export function InsightPlanningWorkbench({ onNavigate }: InsightPlanningWorkbenchProps) {
  const { t } = useTranslation();
  const { canAfford, shortfall: getShortfall, deduct } = useCredits();
  const { entries, addEntry, setDrawerOpen } = useMemory();
  const [creditsDrawerOpen, setCreditsDrawerOpen] = useState(false);
  const [creditsShortfall, setCreditsShortfall] = useState(0);

  const [mode, setMode] = useState<WorkMode>('insight');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [phase, setPhase] = useState<'chat' | 'generating' | 'report'>('chat');
  const [collectedData, setCollectedData] = useState<Record<string, any>>({});

  // Input states
  const [textInput, setTextInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState('');
  const [categoryValue, setCategoryValue] = useState('');

  // Memory
  const [selectedMemoryIds, setSelectedMemoryIds] = useState<string[]>([]);
  const [memoryDialogOpen, setMemoryDialogOpen] = useState(false);
  const memoryItems = useMemo(() => entries.map((e) => ({
    id: e.id, name: e.title, desc: e.content.slice(0, 60), tag: e.category, charCount: e.content.length
  })), [entries]);

  // Report
  const [reportHtml, setReportHtml] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const steps = mode === 'insight' ? INSIGHT_STEPS : CAMPAIGN_STEPS;

  // Initialize first message on mode change
  useEffect(() => {
    resetFlow();
  }, [mode]);

  const resetFlow = useCallback(() => {
    const s = mode === 'insight' ? INSIGHT_STEPS : CAMPAIGN_STEPS;
    setMessages([{
      id: crypto.randomUUID(),
      role: 'system',
      content: s[0].question,
      type: s[0].type,
      options: s[0].options,
      field: s[0].field,
    }]);
    setCurrentStep(0);
    setPhase('chat');
    setCollectedData({});
    setTextInput('');
    setTagInput('');
    setTags([]);
    setSelectedOption('');
    setCategoryValue('');
    setReportHtml('');
  }, [mode]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, phase]);

  // Focus input
  useEffect(() => {
    if (phase === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [currentStep, phase]);

  const advanceStep = useCallback((answer: string, rawValue: any) => {
    const step = steps[currentStep];
    const newData = { ...collectedData, [step.field]: rawValue };
    setCollectedData(newData);

    // Add user answer message
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: answer,
    };

    const nextStep = currentStep + 1;

    if (nextStep < steps.length) {
      // Add next system question
      const nextS = steps[nextStep];
      const sysMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'system',
        content: nextS.question,
        type: nextS.type,
        options: nextS.options,
        field: nextS.field,
      };
      setMessages((prev) => [...prev, userMsg, sysMsg]);
      setCurrentStep(nextStep);
      setTextInput('');
      setTagInput('');
      setTags([]);
      setSelectedOption('');
      setCategoryValue('');
    } else {
      // All steps done — show summary and generate
      const summaryMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'system',
        content: '信息收集完毕，正在为您生成报告...',
        type: 'summary',
      };
      setMessages((prev) => [...prev, userMsg, summaryMsg]);
      handleGenerate(newData);
    }
  }, [currentStep, steps, collectedData]);

  const handleGenerate = useCallback((data: Record<string, any>) => {
    if (!canAfford(REPORT_COST)) {
      setCreditsShortfall(getShortfall(REPORT_COST));
      setCreditsDrawerOpen(true);
      return;
    }
    deduct(REPORT_COST, mode === 'insight' ? '市场洞察报告' : '策划方案');
    setPhase('generating');

    // Simulate generation
    setTimeout(() => {
      setPhase('report');
      if (mode === 'insight') {
        setReportHtml(generateInsightReport(data));
      } else {
        setReportHtml(generateCampaignReport(data));
      }
      // Add completion message
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: 'system',
        content: '报告已生成完毕！您可以在右侧查看完整报告。',
      }]);
    }, 2500);
  }, [canAfford, getShortfall, deduct, mode]);

  const handleTextSubmit = useCallback(() => {
    if (!textInput.trim()) return;
    advanceStep(textInput.trim(), textInput.trim());
  }, [textInput, advanceStep]);

  const handleOptionSelect = useCallback((opt: string) => {
    setSelectedOption(opt);
    advanceStep(opt, opt);
  }, [advanceStep]);

  const handleCategorySelect = useCallback((val: string) => {
    setCategoryValue(val);
    advanceStep(val, val);
  }, [advanceStep]);

  const handleTagsSubmit = useCallback(() => {
    if (tags.length === 0 && tagInput.trim()) {
      const newTags = [tagInput.trim()];
      setTags([]);
      setTagInput('');
      advanceStep(newTags.join('、'), newTags);
      return;
    }
    if (tags.length === 0) return;
    const finalTags = tagInput.trim() ? [...tags, tagInput.trim()] : [...tags];
    setTags([]);
    setTagInput('');
    advanceStep(finalTags.join('、'), finalTags);
  }, [tags, tagInput, advanceStep]);

  const handleTagAdd = useCallback(() => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags((prev) => [...prev, tagInput.trim()]);
    }
    setTagInput('');
  }, [tagInput, tags]);

  const handleTagRemove = useCallback((t: string) => {
    setTags((prev) => prev.filter((x) => x !== t));
  }, []);

  const currentStepDef = currentStep < steps.length ? steps[currentStep] : null;

  const handleModeChange = (val: string) => {
    setMode(val as WorkMode);
  };

  const handleCopyToMemory = useCallback(() => {
    const title = mode === 'insight'
      ? `${collectedData.brandName || ''} 品牌洞察报告`
      : `${collectedData.brandName || ''} 营销策划方案`;
    const added = addEntry({
      title,
      content: reportHtml.replace(/<[^>]*>/g, ''),
      category: mode === 'insight' ? 'brand' : 'campaign',
      tags: [mode === 'insight' ? '市场洞察' : '策划方案', collectedData.brandName || ''],
    });
    if (added) setDrawerOpen(true);
  }, [mode, collectedData, reportHtml, addEntry, setDrawerOpen]);

  // Chat-only view (before report is generated)
  if (phase !== 'report') {
    return (
      <div className="h-full flex flex-col animate-fade-in">
        {/* Top mode tabs */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/20">
          <Tabs value={mode} onValueChange={handleModeChange}>
            <TabsList>
              <TabsTrigger value="insight">{t('sidebar.marketInsights')}</TabsTrigger>
              <TabsTrigger value="campaign">{t('sidebar.planningScheme')}</TabsTrigger>
            </TabsList>
          </Tabs>
          <button
            onClick={() => setMemoryDialogOpen(true)}
            className={cn(
              'h-8 rounded-full border flex items-center justify-center gap-1.5 px-3 transition-all duration-300 ease-out',
              selectedMemoryIds.length > 0
                ? 'border-accent/60 bg-accent/10 text-accent'
                : 'border-border/40 text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <Database className="w-4 h-4" />
            <span className="text-[11px] font-medium whitespace-nowrap">
              {selectedMemoryIds.length > 0 ? `${selectedMemoryIds.length} 个记忆库` : '记忆库'}
            </span>
          </button>
        </div>

        {/* Messages area */}
        <ScrollArea className="flex-1 px-6 py-6">
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Welcome */}
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-normal tracking-tight text-foreground/80">
                {mode === 'insight' ? '市场洞察报告' : '策划方案'}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {mode === 'insight' ? '通过对话引导，快速生成品牌洞察报告' : '通过对话引导，一键生成营销策划方案'}
              </p>
            </div>

            {/* Chat messages */}
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}

            {/* Generating indicator */}
            {phase === 'generating' && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Loader2 className="w-4 h-4 text-accent animate-spin" />
                </div>
                <div className="bg-muted/40 rounded-2xl rounded-tl-md px-4 py-3 text-sm text-foreground/70">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent/60 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-accent/80" />
                    </span>
                    正在联网搜索并生成报告...
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input area */}
        {phase === 'chat' && currentStepDef && (
          <div className="border-t border-border/20 px-6 py-4">
            <div className="max-w-2xl mx-auto">
              <StepInput
                step={currentStepDef}
                textInput={textInput}
                setTextInput={setTextInput}
                tagInput={tagInput}
                setTagInput={setTagInput}
                tags={tags}
                onTagAdd={handleTagAdd}
                onTagRemove={handleTagRemove}
                onTextSubmit={handleTextSubmit}
                onOptionSelect={handleOptionSelect}
                onCategorySelect={handleCategorySelect}
                onTagsSubmit={handleTagsSubmit}
                categoryValue={categoryValue}
                inputRef={inputRef}
              />
            </div>
          </div>
        )}

        <MemorySelectionDialog
          open={memoryDialogOpen}
          onOpenChange={setMemoryDialogOpen}
          items={memoryItems}
          selectedIds={selectedMemoryIds}
          onToggle={(id) => setSelectedMemoryIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])}
        />
        <InsufficientCreditsDrawer open={creditsDrawerOpen} onOpenChange={setCreditsDrawerOpen} shortfall={creditsShortfall} />
      </div>
    );
  }

  // Report phase: split panel
  return (
    <div className="h-full flex animate-fade-in">
      {/* Left: Chat history */}
      <div className="w-[380px] flex-shrink-0 border-r border-border/20 flex flex-col bg-background">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
          <Tabs value={mode} onValueChange={handleModeChange}>
            <TabsList className="h-8">
              <TabsTrigger value="insight" className="text-xs px-2 py-1">{t('sidebar.marketInsights')}</TabsTrigger>
              <TabsTrigger value="campaign" className="text-xs px-2 py-1">{t('sidebar.planningScheme')}</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="ghost" size="sm" onClick={resetFlow} className="text-xs text-muted-foreground">
            新任务
          </Button>
        </div>
        <ScrollArea className="flex-1 px-4 py-4">
          <div className="space-y-3">
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} compact />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Right: Report */}
      <div className="flex-1 flex flex-col bg-muted/20">
        <div className="flex items-center justify-between px-6 py-3 border-b border-border/20">
          <h2 className="text-sm font-medium text-foreground">
            {collectedData.brandName} {mode === 'insight' ? '品牌洞察报告' : '营销策划方案'}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={handleCopyToMemory}>
              <Database className="w-3.5 h-3.5" />
              复制到记忆库
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => {
              const win = window.open('', '_blank');
              if (!win) return;
              win.document.write(`<!DOCTYPE html><html><head><title>报告</title><style>body{font-family:system-ui,-apple-system,sans-serif;padding:40px;color:#333;max-width:900px;margin:0 auto}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}h1,h2,h3{margin-top:24px}@media print{body{padding:20px}}</style></head><body>${reportHtml}</body></html>`);
              win.document.close();
              setTimeout(() => win.print(), 500);
            }}>
              导出 PDF
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-6 md:p-8">
            <div
              className="prose prose-sm max-w-none text-foreground/80"
              dangerouslySetInnerHTML={{ __html: reportHtml }}
            />
          </div>
        </ScrollArea>
      </div>

      <MemorySelectionDialog
        open={memoryDialogOpen}
        onOpenChange={setMemoryDialogOpen}
        items={memoryItems}
        selectedIds={selectedMemoryIds}
        onToggle={(id) => setSelectedMemoryIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])}
      />
      <InsufficientCreditsDrawer open={creditsDrawerOpen} onOpenChange={setCreditsDrawerOpen} shortfall={creditsShortfall} />
    </div>
  );
}

/* ─── Chat Bubble ─── */
function ChatBubble({ message, compact }: { message: ChatMessage; compact?: boolean }) {
  if (message.role === 'system') {
    return (
      <div className={cn('flex items-start gap-3', compact && 'gap-2')}>
        <div className={cn(
          'rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0',
          compact ? 'w-6 h-6' : 'w-8 h-8'
        )}>
          <span className={cn('text-accent font-semibold', compact ? 'text-[10px]' : 'text-xs')}>AI</span>
        </div>
        <div className={cn(
          'bg-muted/40 rounded-2xl rounded-tl-md px-4 py-2.5 text-foreground/70 max-w-[85%]',
          compact ? 'text-xs px-3 py-2' : 'text-sm'
        )}>
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-start gap-3 justify-end', compact && 'gap-2')}>
      <div className={cn(
        'bg-foreground text-background rounded-2xl rounded-tr-md px-4 py-2.5 max-w-[85%]',
        compact ? 'text-xs px-3 py-2' : 'text-sm'
      )}>
        {message.content}
      </div>
    </div>
  );
}

/* ─── Step Input ─── */
function StepInput({
  step,
  textInput, setTextInput,
  tagInput, setTagInput,
  tags, onTagAdd, onTagRemove,
  onTextSubmit, onOptionSelect, onCategorySelect, onTagsSubmit,
  categoryValue, inputRef,
}: {
  step: { field: string; question: string; type: string; options?: string[] };
  textInput: string;
  setTextInput: (v: string) => void;
  tagInput: string;
  setTagInput: (v: string) => void;
  tags: string[];
  onTagAdd: () => void;
  onTagRemove: (t: string) => void;
  onTextSubmit: () => void;
  onOptionSelect: (opt: string) => void;
  onCategorySelect: (val: string) => void;
  onTagsSubmit: () => void;
  categoryValue: string;
  inputRef: React.RefObject<HTMLInputElement>;
}) {
  if (step.type === 'options' && step.options) {
    return (
      <div className="flex flex-wrap gap-2">
        {step.options.map((opt) => (
          <button
            key={opt}
            onClick={() => onOptionSelect(opt)}
            className="px-4 py-2 rounded-full border border-border/40 text-sm text-foreground/70 hover:border-accent/40 hover:bg-accent/5 hover:text-accent transition-all"
          >
            {opt}
          </button>
        ))}
      </div>
    );
  }

  if (step.type === 'category') {
    return (
      <div className="flex items-center gap-3">
        <CategoryCascader
          data={CATEGORY_TREE}
          value={categoryValue}
          onChange={(val) => onCategorySelect(val)}
          placeholder="点击选择品类"
          className="h-10 rounded-xl px-4 text-sm flex-1 border border-border/40"
        />
      </div>
    );
  }

  if (step.type === 'tags') {
    return (
      <div className="space-y-3">
        {/* Tag display */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 h-7 rounded-full bg-accent/10 border border-accent/20 px-2.5 text-xs text-accent font-medium">
                {t}
                <button onClick={() => onTagRemove(t)} className="hover:text-accent/70 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        {/* Input row */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (tagInput.trim()) onTagAdd();
                }
              }}
              placeholder="输入后回车添加，完成后点击发送"
              className="w-full h-10 px-4 rounded-xl border border-border/40 bg-background text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring/20"
            />
          </div>
          <button
            onClick={onTagsSubmit}
            disabled={tags.length === 0 && !tagInput.trim()}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0',
              (tags.length > 0 || tagInput.trim())
                ? 'bg-foreground text-background hover:bg-foreground/90'
                : 'bg-muted/60 text-muted-foreground/40 cursor-not-allowed'
            )}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Default: text input
  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        value={textInput}
        onChange={(e) => setTextInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onTextSubmit();
          }
        }}
        placeholder="输入内容后回车发送"
        className="flex-1 h-10 px-4 rounded-xl border border-border/40 bg-background text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring/20"
      />
      <button
        onClick={onTextSubmit}
        disabled={!textInput.trim()}
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0',
          textInput.trim()
            ? 'bg-foreground text-background hover:bg-foreground/90'
            : 'bg-muted/60 text-muted-foreground/40 cursor-not-allowed'
        )}
      >
        <ArrowUp className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ─── Mock Report Generators ─── */
function generateInsightReport(data: Record<string, any>): string {
  const brand = data.brandName || '品牌';
  const category = data.category || '品类';
  const competitors = (data.competitors || []).join('、') || '暂无';

  return `
    <h1 style="font-size:1.5rem;font-weight:600;margin-bottom:0.5rem">${brand} 品牌洞察报告</h1>
    <p style="color:#888;font-size:0.85rem;margin-bottom:2rem">品类：${category} ｜ 竞品：${competitors} ｜ 生成时间：${new Date().toLocaleDateString('zh-CN')}</p>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:2rem">
      <div style="background:#f9f9f9;border-radius:12px;padding:1.25rem;text-align:center">
        <div style="font-size:2rem;font-weight:700;color:#e8590c">72</div>
        <div style="font-size:0.8rem;color:#888">SEO 可见度</div>
      </div>
      <div style="background:#f9f9f9;border-radius:12px;padding:1.25rem;text-align:center">
        <div style="font-size:2rem;font-weight:700;color:#e8590c">85</div>
        <div style="font-size:0.8rem;color:#888">社交互动</div>
      </div>
      <div style="background:#f9f9f9;border-radius:12px;padding:1.25rem;text-align:center">
        <div style="font-size:2rem;font-weight:700;color:#e8590c">68</div>
        <div style="font-size:0.8rem;color:#888">竞争指数</div>
      </div>
    </div>

    <h2 style="font-size:1.1rem;font-weight:600;margin-top:1.5rem;margin-bottom:0.75rem;border-bottom:1px solid #eee;padding-bottom:0.5rem">📊 执行摘要</h2>
    <ul style="list-style:disc;padding-left:1.25rem;color:#555;line-height:1.8">
      <li>行业热度持续上升，近8周增长 <strong>46%</strong>，市场机会窗口期</li>
      <li>内容更新频率落后竞品，建议提升发布节奏</li>
      <li>SEO关键词覆盖存在差距，需重点优化TOP10关键词</li>
      <li>${brand} 在用户互动维度表现优异（得分90），但品牌声量偏低（65）</li>
    </ul>

    <h2 style="font-size:1.1rem;font-weight:600;margin-top:1.5rem;margin-bottom:0.75rem;border-bottom:1px solid #eee;padding-bottom:0.5rem">⚠️ 风险红线</h2>
    <table style="width:100%;border-collapse:collapse;font-size:0.85rem">
      <thead><tr style="background:#f5f5f5"><th style="padding:8px 12px;text-align:left;border:1px solid #eee">风险项</th><th style="padding:8px 12px;text-align:left;border:1px solid #eee">等级</th><th style="padding:8px 12px;text-align:left;border:1px solid #eee">信号</th><th style="padding:8px 12px;text-align:left;border:1px solid #eee">建议</th></tr></thead>
      <tbody>
        <tr><td style="padding:8px 12px;border:1px solid #eee">SEO关键词覆盖不足</td><td style="padding:8px 12px;border:1px solid #eee;color:#dc2626">🔴 高</td><td style="padding:8px 12px;border:1px solid #eee">主要关键词排名下降15位</td><td style="padding:8px 12px;border:1px solid #eee">增加长尾关键词内容布局</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #eee">内容更新频率低</td><td style="padding:8px 12px;border:1px solid #eee;color:#f59e0b">🟡 中</td><td style="padding:8px 12px;border:1px solid #eee">周均发布量低于竞品40%</td><td style="padding:8px 12px;border:1px solid #eee">提升至每日1-2条优质内容</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #eee">用户互动率下滑</td><td style="padding:8px 12px;border:1px solid #eee;color:#f59e0b">🟡 中</td><td style="padding:8px 12px;border:1px solid #eee">评论回复率仅23%</td><td style="padding:8px 12px;border:1px solid #eee">建立24小时内回复机制</td></tr>
      </tbody>
    </table>

    <h2 style="font-size:1.1rem;font-weight:600;margin-top:1.5rem;margin-bottom:0.75rem;border-bottom:1px solid #eee;padding-bottom:0.5rem">👥 消费者画像</h2>
    <ul style="list-style:disc;padding-left:1.25rem;color:#555;line-height:1.8">
      <li><strong>核心人群</strong>：25-30岁（42%）、18-24岁（35%）</li>
      <li><strong>需求重点</strong>：产品质量（重要性85%）、价格敏感（重要性80%）</li>
      <li><strong>消费场景</strong>：日常自用（58%）、送礼（24%）、尝鲜体验（18%）</li>
    </ul>

    <h2 style="font-size:1.1rem;font-weight:600;margin-top:1.5rem;margin-bottom:0.75rem;border-bottom:1px solid #eee;padding-bottom:0.5rem">🔍 SEO 关键词表现</h2>
    <table style="width:100%;border-collapse:collapse;font-size:0.85rem">
      <thead><tr style="background:#f5f5f5"><th style="padding:8px 12px;text-align:left;border:1px solid #eee">关键词</th><th style="padding:8px 12px;text-align:left;border:1px solid #eee">排名</th><th style="padding:8px 12px;text-align:left;border:1px solid #eee">预估流量</th></tr></thead>
      <tbody>
        <tr><td style="padding:8px 12px;border:1px solid #eee">美妆护肤</td><td style="padding:8px 12px;border:1px solid #eee">#2</td><td style="padding:8px 12px;border:1px solid #eee">12,500</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #eee">平价彩妆</td><td style="padding:8px 12px;border:1px solid #eee">#5</td><td style="padding:8px 12px;border:1px solid #eee">8,200</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #eee">学生党好物</td><td style="padding:8px 12px;border:1px solid #eee">#3</td><td style="padding:8px 12px;border:1px solid #eee">9,800</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #eee">口红推荐</td><td style="padding:8px 12px;border:1px solid #eee">#8</td><td style="padding:8px 12px;border:1px solid #eee">5,600</td></tr>
      </tbody>
    </table>

    <h2 style="font-size:1.1rem;font-weight:600;margin-top:1.5rem;margin-bottom:0.75rem;border-bottom:1px solid #eee;padding-bottom:0.5rem">📋 行动计划</h2>
    <table style="width:100%;border-collapse:collapse;font-size:0.85rem">
      <thead><tr style="background:#f5f5f5"><th style="padding:8px 12px;text-align:left;border:1px solid #eee">阶段</th><th style="padding:8px 12px;text-align:left;border:1px solid #eee">SEO</th><th style="padding:8px 12px;text-align:left;border:1px solid #eee">社媒</th><th style="padding:8px 12px;text-align:left;border:1px solid #eee">运营</th></tr></thead>
      <tbody>
        <tr><td style="padding:8px 12px;border:1px solid #eee">第1-2周</td><td style="padding:8px 12px;border:1px solid #eee">关键词优化，提升TOP10占比</td><td style="padding:8px 12px;border:1px solid #eee">日更1条短视频</td><td style="padding:8px 12px;border:1px solid #eee">搭建私域流量池</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #eee">第3-4周</td><td style="padding:8px 12px;border:1px solid #eee">竞品关键词狙击</td><td style="padding:8px 12px;border:1px solid #eee">达人合作3-5位</td><td style="padding:8px 12px;border:1px solid #eee">会员体系上线</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #eee">第5-8周</td><td style="padding:8px 12px;border:1px solid #eee">品牌词霸屏策略</td><td style="padding:8px 12px;border:1px solid #eee">直播带货测试</td><td style="padding:8px 12px;border:1px solid #eee">复购激励计划</td></tr>
      </tbody>
    </table>
  `;
}

function generateCampaignReport(data: Record<string, any>): string {
  const brand = data.brandName || '品牌';
  const goal = data.goal || '营销目标';
  const audience = (data.audience || []).join('、') || '目标人群';
  const sellingPoints = (data.sellingPoints || []).join('、') || '核心卖点';
  const budget = data.budget || '待定';

  return `
    <h1 style="font-size:1.5rem;font-weight:600;margin-bottom:0.5rem">${brand} ${goal}策划方案</h1>
    <p style="color:#888;font-size:0.85rem;margin-bottom:2rem">目标人群：${audience} ｜ 预算量级：${budget} ｜ 生成时间：${new Date().toLocaleDateString('zh-CN')}</p>

    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:2rem">
      <div style="background:#f9f9f9;border-radius:12px;padding:1.25rem;text-align:center">
        <div style="font-size:1.5rem;font-weight:700;color:#e8590c">3.2亿</div>
        <div style="font-size:0.8rem;color:#888">预估曝光</div>
      </div>
      <div style="background:#f9f9f9;border-radius:12px;padding:1.25rem;text-align:center">
        <div style="font-size:1.5rem;font-weight:700;color:#e8590c">850万</div>
        <div style="font-size:0.8rem;color:#888">预估互动</div>
      </div>
      <div style="background:#f9f9f9;border-radius:12px;padding:1.25rem;text-align:center">
        <div style="font-size:1.5rem;font-weight:700;color:#e8590c">12.5%</div>
        <div style="font-size:0.8rem;color:#888">预估CTR</div>
      </div>
      <div style="background:#f9f9f9;border-radius:12px;padding:1.25rem;text-align:center">
        <div style="font-size:1.5rem;font-weight:700;color:#e8590c">¥2.8</div>
        <div style="font-size:0.8rem;color:#888">预估CPE</div>
      </div>
    </div>

    <h2 style="font-size:1.1rem;font-weight:600;margin-top:1.5rem;margin-bottom:0.75rem;border-bottom:1px solid #eee;padding-bottom:0.5rem">🎯 策略概述</h2>
    <p style="color:#555;line-height:1.8">围绕 <strong>${goal}</strong> 目标，针对 <strong>${audience}</strong> 群体，以 <strong>${sellingPoints}</strong> 为核心卖点，制定全域营销策划方案。采用 <strong>${budget}</strong> 预算策略，通过「内容种草 + 达人矩阵 + 精准投放」三位一体的打法实现目标。</p>

    <h2 style="font-size:1.1rem;font-weight:600;margin-top:1.5rem;margin-bottom:0.75rem;border-bottom:1px solid #eee;padding-bottom:0.5rem">📊 渠道预算分配</h2>
    <table style="width:100%;border-collapse:collapse;font-size:0.85rem">
      <thead><tr style="background:#f5f5f5"><th style="padding:8px 12px;text-align:left;border:1px solid #eee">渠道</th><th style="padding:8px 12px;text-align:left;border:1px solid #eee">占比</th><th style="padding:8px 12px;text-align:left;border:1px solid #eee">策略</th><th style="padding:8px 12px;text-align:left;border:1px solid #eee">预估效果</th></tr></thead>
      <tbody>
        <tr><td style="padding:8px 12px;border:1px solid #eee">抖音</td><td style="padding:8px 12px;border:1px solid #eee">45%</td><td style="padding:8px 12px;border:1px solid #eee">短视频种草 + 直播带货</td><td style="padding:8px 12px;border:1px solid #eee">曝光1.5亿</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #eee">小红书</td><td style="padding:8px 12px;border:1px solid #eee">30%</td><td style="padding:8px 12px;border:1px solid #eee">图文笔记 + KOC矩阵</td><td style="padding:8px 12px;border:1px solid #eee">互动500万</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #eee">信息流广告</td><td style="padding:8px 12px;border:1px solid #eee">15%</td><td style="padding:8px 12px;border:1px solid #eee">精准定向投放</td><td style="padding:8px 12px;border:1px solid #eee">CTR 8%</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #eee">私域运营</td><td style="padding:8px 12px;border:1px solid #eee">10%</td><td style="padding:8px 12px;border:1px solid #eee">社群 + 小程序</td><td style="padding:8px 12px;border:1px solid #eee">复购率30%</td></tr>
      </tbody>
    </table>

    <h2 style="font-size:1.1rem;font-weight:600;margin-top:1.5rem;margin-bottom:0.75rem;border-bottom:1px solid #eee;padding-bottom:0.5rem">📅 执行排期</h2>
    <table style="width:100%;border-collapse:collapse;font-size:0.85rem">
      <thead><tr style="background:#f5f5f5"><th style="padding:8px 12px;text-align:left;border:1px solid #eee">阶段</th><th style="padding:8px 12px;text-align:left;border:1px solid #eee">时间</th><th style="padding:8px 12px;text-align:left;border:1px solid #eee">重点任务</th><th style="padding:8px 12px;text-align:left;border:1px solid #eee">KPI</th></tr></thead>
      <tbody>
        <tr><td style="padding:8px 12px;border:1px solid #eee">预热期</td><td style="padding:8px 12px;border:1px solid #eee">第1-2周</td><td style="padding:8px 12px;border:1px solid #eee">达人筛选、内容储备、话题预埋</td><td style="padding:8px 12px;border:1px solid #eee">完成30条内容储备</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #eee">爆发期</td><td style="padding:8px 12px;border:1px solid #eee">第3-4周</td><td style="padding:8px 12px;border:1px solid #eee">集中投放、直播引爆、话题冲榜</td><td style="padding:8px 12px;border:1px solid #eee">话题阅读量破亿</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #eee">持续期</td><td style="padding:8px 12px;border:1px solid #eee">第5-8周</td><td style="padding:8px 12px;border:1px solid #eee">长尾种草、UGC激励、私域沉淀</td><td style="padding:8px 12px;border:1px solid #eee">新增私域用户5万</td></tr>
      </tbody>
    </table>

    <h2 style="font-size:1.1rem;font-weight:600;margin-top:1.5rem;margin-bottom:0.75rem;border-bottom:1px solid #eee;padding-bottom:0.5rem">⚠️ 风险评估</h2>
    <table style="width:100%;border-collapse:collapse;font-size:0.85rem">
      <thead><tr style="background:#f5f5f5"><th style="padding:8px 12px;text-align:left;border:1px solid #eee">风险</th><th style="padding:8px 12px;text-align:left;border:1px solid #eee">等级</th><th style="padding:8px 12px;text-align:left;border:1px solid #eee">应对方案</th></tr></thead>
      <tbody>
        <tr><td style="padding:8px 12px;border:1px solid #eee">达人内容不可控</td><td style="padding:8px 12px;border:1px solid #eee;color:#f59e0b">🟡 中</td><td style="padding:8px 12px;border:1px solid #eee">建立内容审核机制，提供标准化Brief</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #eee">竞品同期营销挤压</td><td style="padding:8px 12px;border:1px solid #eee;color:#dc2626">🔴 高</td><td style="padding:8px 12px;border:1px solid #eee">差异化定位，错峰投放策略</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #eee">ROI低于预期</td><td style="padding:8px 12px;border:1px solid #eee;color:#f59e0b">🟡 中</td><td style="padding:8px 12px;border:1px solid #eee">设置预算止损线，及时优化投放</td></tr>
      </tbody>
    </table>
  `;
}
