import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMemory } from '@/contexts/MemoryContext';
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

export function OranSimulation(_: OranSimulationProps) {
  const [step, setStep] = useState<OranSimulationStep>('home');
  const [selectedMemoryIds, setSelectedMemoryIds] = useState<string[]>([]);
  const [memoryDialogOpen, setMemoryDialogOpen] = useState(false);
  const { i18n } = useTranslation();
  const { entries } = useMemory();

  const locale: Locale = useMemo(
    () => (i18n.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'),
    [i18n.language],
  );
  const copy = HOME_COPY[locale];

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
  const canSubmit = selectedMemoryIds.length > 0;

  const toggleMemory = useCallback((id: string) => {
    setSelectedMemoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }, []);

  if (step === 'scene') {
    return (
      <div className="h-full min-h-0 overflow-hidden bg-background">
        <OranSimulationScene locale={locale} onBack={() => setStep('home')} />
      </div>
    );
  }

  return (
    <>
      <div className="oran-sim-home-page h-full min-h-0 overflow-auto bg-background">
        <div className="flex min-h-full flex-col items-center justify-start px-6 pb-6 pt-[100px] md:px-8 md:pb-8 md:pt-[180px]">
          <section className="mt-10 w-full max-w-5xl">
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
              effectiveBrandName=""
              onOpenMemoryDialog={() => setMemoryDialogOpen(true)}
              planningActionLabel={
                locale === 'zh'
                  ? '提示词：输入或选择预测问题...'
                  : 'Prompt: enter or select a prediction question...'
              }
              emptyMemoryLabel={locale === 'zh' ? '选择预测问题' : 'Select a prediction question'}
              canSubmit={canSubmit}
              onSubmit={() => {
                if (canSubmit) {
                  setStep('scene');
                }
              }}
              submitAriaLabel={locale === 'zh' ? '进入仿真' : 'Open simulation'}
            />
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
