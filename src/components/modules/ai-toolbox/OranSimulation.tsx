import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMemory } from '@/contexts/MemoryContext';
import { useOranSimulationPrefill } from '@/contexts/OranSimulationPrefillContext';
import {
  MemorySelectionDialog,
  type MemorySelectItem,
} from '@/components/modules/memory/MemorySelectionDialog';
import { InsightComposerPanel } from './InsightComposerPanel';
import './oran-simulation/oran-simulation.css';
import OranSimulationScene from './oran-simulation/OranSimulationScene';
import { type Locale } from './oran-simulation/lib/graphI18n';

interface OranSimulationProps {
  onNavigate: (itemId: string) => void;
}

type OranSimulationStep = 'home' | 'scene';

const HOME_COPY: Record<Locale, { subtitle: string }> = {
  zh: {
    subtitle: '输入或选择预测问题后，即可进入仿真推演界面。',
  },
  en: {
    subtitle: 'Enter or select a prediction question to enter the simulation workspace.',
  },
};

const EXAMPLE_PROMPTS: Record<Locale, string[]> = {
  zh: ['帮我预测未来30天内舆情', '帮我预测未来30天在TikTok平台的品牌声量'],
  en: [
    'Help me predict public sentiment in the next 30 days',
    'Help me predict brand share of voice on TikTok in the next 30 days',
  ],
};

export function OranSimulation(_: OranSimulationProps) {
  const [step, setStep] = useState<OranSimulationStep>('home');
  const [promptValue, setPromptValue] = useState('');
  const [selectedMemoryIds, setSelectedMemoryIds] = useState<string[]>([]);
  const [memoryDialogOpen, setMemoryDialogOpen] = useState(false);
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

  const selectedMemorySummary = selectedMemoryNames.join('、');
  const selectedMemorySummaryNeedsFade = selectedMemorySummary.length > 25;
  const canSubmit = promptValue.trim().length > 0 || selectedMemoryIds.length > 0;

  useEffect(() => {
    const prefill = consumePrefill();
    if (!prefill) {
      return;
    }

    setSelectedMemoryIds(prefill.attachmentIds);
    setPromptValue(prefill.prompt || '');

    if (prefill.autoStart) {
      setStep('scene');
    }
  }, [consumePrefill]);

  const toggleMemory = useCallback((id: string) => {
    setSelectedMemoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }, []);

  if (step === 'scene') {
    return (
      <div className="h-full min-h-0 overflow-hidden bg-background">
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
      <div className="oran-sim-home-page h-full min-h-0 overflow-auto bg-background">
        <div className="flex min-h-full flex-col items-center justify-start px-6 pb-6 pt-[100px] md:px-8 md:pb-8 md:pt-[170px]">
          <section className=" w-full max-w-5xl">
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
                  ? '上传附件后，输入或选择预测问题...'
                  : 'After uploading attachments, enter or select a prediction question...'
              }
              emptyMemoryLabel={locale === 'zh' ? '选择预测问题' : 'Select a prediction question'}
              canSubmit={canSubmit}
              onSubmit={() => {
                if (canSubmit) {
                  setStep('scene');
                }
              }}
              submitAriaLabel={locale === 'zh' ? '进入仿真' : 'Open simulation'}
              submitLabel={locale === 'zh' ? '开始预测' : 'Start Prediction'}
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
