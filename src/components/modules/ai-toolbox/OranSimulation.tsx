import { useCallback, useEffect, useMemo, useState } from 'react';
import { History, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMemory } from '@/contexts/MemoryContext';
import { useOranSimulationPrefill } from '@/contexts/OranSimulationPrefillContext';
import {
  MemorySelectionDialog,
  type MemorySelectItem,
} from '@/components/modules/memory/MemorySelectionDialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { InsightComposerPanel } from './InsightComposerPanel';
import './oran-simulation/oran-simulation.css';
import OranSimulationScene from './oran-simulation/OranSimulationScene';
import { type Locale } from './oran-simulation/lib/graphI18n';

interface OranSimulationProps {
  onNavigate: (itemId: string) => void;
}

type OranSimulationStep = 'home' | 'scene';

interface OranSimulationHistoryItem {
  id: string;
  date: string;
  promptValue: string;
  selectedMemoryIds: string[];
  step: OranSimulationStep;
}

const ORAN_SIM_HISTORY_STORAGE_KEY = 'oran-sim-history';

const HOME_COPY: Record<Locale, { subtitle: string }> = {
  zh: {
    subtitle: '\u8f93\u5165\u6216\u9009\u62e9\u9884\u6d4b\u95ee\u9898\u540e\uff0c\u5373\u53ef\u8fdb\u5165\u4eff\u771f\u63a8\u6f14\u754c\u9762\u3002',
  },
  en: {
    subtitle: 'Enter or select a prediction question to enter the simulation workspace.',
  },
};

const EXAMPLE_PROMPTS: Record<Locale, string[]> = {
  zh: [
    '\u5e2e\u6211\u9884\u6d4b\u672a\u676530\u5929\u5185\u8206\u60c5',
    '\u5e2e\u6211\u9884\u6d4b\u672a\u676530\u5929\u5728TikTok\u5e73\u53f0\u7684\u54c1\u724c\u58f0\u91cf',
  ],
  en: [
    'Help me predict public sentiment in the next 30 days',
    'Help me predict brand share of voice on TikTok in the next 30 days',
  ],
};

function loadOranSimulationHistory(): OranSimulationHistoryItem[] {
  try {
    const raw = localStorage.getItem(ORAN_SIM_HISTORY_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OranSimulationHistoryItem[]) : [];
  } catch {
    return [];
  }
}

function saveOranSimulationHistory(items: OranSimulationHistoryItem[]) {
  localStorage.setItem(ORAN_SIM_HISTORY_STORAGE_KEY, JSON.stringify(items));
}

export function OranSimulation(_: OranSimulationProps) {
  const [step, setStep] = useState<OranSimulationStep>('home');
  const [promptValue, setPromptValue] = useState('');
  const [selectedMemoryIds, setSelectedMemoryIds] = useState<string[]>([]);
  const [memoryDialogOpen, setMemoryDialogOpen] = useState(false);
  const [history, setHistory] = useState<OranSimulationHistoryItem[]>(loadOranSimulationHistory);
  const { i18n } = useTranslation();
  const { entries } = useMemory();
  const { consumePrefill } = useOranSimulationPrefill();

  const locale: Locale = useMemo(
    () => (i18n.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'),
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

  const selectedMemoryNames = useMemo(
    () =>
      selectedMemoryIds
        .map((id) => memoryItems.find((item) => item.id === id)?.name)
        .filter((name): name is string => Boolean(name)),
    [memoryItems, selectedMemoryIds],
  );

  const selectedMemorySummary = selectedMemoryNames.join('\u3001');
  const selectedMemorySummaryNeedsFade = selectedMemorySummary.length > 25;
  const canSubmit = selectedMemoryIds.length >= 2;

  useEffect(() => {
    const prefill = consumePrefill();
    if (!prefill) {
      return;
    }

    setSelectedMemoryIds(prefill.attachmentIds);
    setPromptValue(prefill.prompt || '');

    if (prefill.autoStart && prefill.attachmentIds.length >= 2) {
      setStep('scene');
    }
  }, [consumePrefill]);

  const toggleMemory = useCallback((id: string) => {
    setSelectedMemoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }, []);

  const appendHistoryItem = useCallback((nextStep: OranSimulationStep) => {
    const item: OranSimulationHistoryItem = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      promptValue,
      selectedMemoryIds,
      step: nextStep,
    };

    setHistory((prev) => {
      const updated = [item, ...prev].slice(0, 20);
      saveOranSimulationHistory(updated);
      return updated;
    });
  }, [promptValue, selectedMemoryIds]);

  const handleRestoreHistory = useCallback((item: OranSimulationHistoryItem) => {
    setPromptValue(item.promptValue);
    setSelectedMemoryIds(item.selectedMemoryIds);
    setStep(item.step);
  }, []);

  const handleDeleteHistory = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      saveOranSimulationHistory(updated);
      return updated;
    });
  }, []);

  const historySheet = (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground">
          <History className="h-3.5 w-3.5" />
          <span>{locale === 'zh' ? '\u5386\u53f2\u8bb0\u5f55' : 'History'}</span>
        </button>
      </SheetTrigger>
      <SheetContent className="w-80 sm:w-96">
        <SheetHeader>
          <SheetTitle className="text-base font-medium">
            {locale === 'zh' ? '\u5386\u53f2\u8bb0\u5f55' : 'History'}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 max-h-[calc(100vh-6rem)] space-y-3 overflow-y-auto">
          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => handleRestoreHistory(item)}
              className="group relative w-full rounded-xl border border-border/30 p-3 text-left transition-all hover:border-border/60 hover:bg-muted/20"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-foreground">
                  {item.promptValue.trim() ||
                    (locale === 'zh' ? '\u672a\u547d\u540d\u9884\u6d4b\u95ee\u9898' : 'Untitled prompt')}
                </span>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {new Date(item.date).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {item.selectedMemoryIds.length > 0
                  ? locale === 'zh'
                    ? `${item.selectedMemoryIds.length} \u4efd\u9644\u4ef6`
                    : `${item.selectedMemoryIds.length} attachments`
                  : locale === 'zh'
                    ? '\u65e0\u9644\u4ef6'
                    : 'No attachments'}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                <span className="rounded-full bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {item.step === 'scene'
                    ? locale === 'zh'
                      ? '\u5df2\u8fdb\u5165\u4eff\u771f'
                      : 'Scene'
                    : locale === 'zh'
                      ? '\u8349\u7a3f'
                      : 'Draft'}
                </span>
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
            <p className="py-8 text-center text-sm text-muted-foreground">
              {locale === 'zh' ? '\u6682\u65e0\u5386\u53f2\u8bb0\u5f55' : 'No history yet'}
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );

  if (step === 'scene') {
    return (
      <div className="relative h-[calc(100dvh-56px)] min-h-0 overflow-hidden bg-background">
        <OranSimulationScene
          locale={locale}
          onBack={() => setStep('home')}
          attachmentNames={selectedMemoryNames}
          promptValue={promptValue}
        />
      </div>
    );
  }

  return (
    <>
      <div className="oran-sim-home-page relative h-full min-h-0 overflow-auto bg-background">
        <div className="absolute right-4 top-4 z-20 md:right-8 md:top-6">{historySheet}</div>
        <div className="flex min-h-full flex-col items-center justify-start px-6 pb-6 pt-[50px] md:px-8 md:pb-8 md:pt-[168px]">
          <section className="w-full max-w-5xl">
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
              brandName=""
              onBrandNameChange={() => {}}
              category=""
              onCategoryChange={() => {}}
              competitors={[]}
              competitorInput=""
              onCompetitorInputChange={() => {}}
              onCompetitorKeyDown={() => {}}
              onCompetitorBlur={() => {}}
              onRemoveCompetitor={() => {}}
              selectedMemoryIds={selectedMemoryIds}
              selectedMemorySummary={selectedMemorySummary}
              selectedMemorySummaryNeedsFade={selectedMemorySummaryNeedsFade}
              promptValue={promptValue}
              onPromptValueChange={setPromptValue}
              effectiveBrandName=""
              onOpenMemoryDialog={() => setMemoryDialogOpen(true)}
              planningActionLabel={
                locale === 'zh'
                  ? '\u4e0a\u4f20\u81f3\u5c112\u4efd\u9644\u4ef6\u540e\uff0c\u8f93\u5165\u6216\u9009\u62e9\u9884\u6d4b\u95ee\u9898...'
                  : 'After uploading at least two attachments, enter or select a prediction question...'
              }
              emptyMemoryLabel={
                locale === 'zh'
                  ? '\u9009\u62e9\u81f3\u5c112\u4efd\u8bb0\u5fc6\u5e93\u9644\u4ef6'
                  : 'Select at least 2 memory attachments'
              }
              statusLabel=""
              memoryButtonLabel={
                selectedMemoryIds.length > 0
                  ? locale === 'zh'
                    ? `${selectedMemoryIds.length}/2 \u4efd\u9644\u4ef6`
                    : `${selectedMemoryIds.length}/2 attachments`
                  : locale === 'zh'
                    ? '\u8bb0\u5fc6\u5e93'
                    : 'Attachments'
              }
              memoryHelperText={
                locale === 'zh'
                  ? '\u8bf7\u540c\u65f6\u4e0a\u4f20\u54c1\u724c\u6d1e\u5bdf\u62a5\u544a\u548c\u7b56\u5212\u65b9\u6848'
                  : 'Please upload both the brand insight report and planning proposal'
              }
              canSubmit={canSubmit}
              onSubmit={() => {
                if (canSubmit) {
                  appendHistoryItem('scene');
                  setStep('scene');
                }
              }}
              submitAriaLabel={locale === 'zh' ? '\u8fdb\u5165\u4eff\u771f' : 'Open simulation'}
              submitLabel={locale === 'zh' ? '\u5f00\u59cb\u9884\u6d4b' : 'Start Prediction'}
            />
            <div className="mt-10 flex flex-wrap gap-3 px-2">
              {examplePrompts.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setPromptValue(example)}
                  className="rounded-full bg-muted/30 px-8 py-2 text-sm text-muted-foreground/80 transition-colors hover:bg-muted/80 hover:text-foreground"
                >
                  {example}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      <MemorySelectionDialog
        open={memoryDialogOpen}
        onOpenChange={setMemoryDialogOpen}
        items={memoryItems}
        selectedIds={selectedMemoryIds}
        onToggle={toggleMemory}
      />
    </>
  );
}
