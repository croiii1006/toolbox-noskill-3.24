import type { KeyboardEvent, RefObject } from 'react';
import { ArrowUp, Check, Database, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CategoryCascader, CATEGORY_TREE } from '@/components/modules/skills/CategoryCascader';
import { cn } from '@/lib/utils';

export type ComposerReportType = 'insight' | 'planning';

const REPORT_TYPE_OPTIONS: Array<{ value: ComposerReportType; label: string }> = [
  { value: 'insight', label: '洞察报告' },
  { value: 'planning', label: '策划方案' },
];

interface InsightComposerPanelProps {
  title: string;
  subtitle: string;
  titleClassName?: string;
  contentMode?: 'default' | 'memoryPrompt';
  reportType: ComposerReportType;
  reportTypeLabel: string;
  reportTypeMenuOpen: boolean;
  onReportTypeMenuOpenChange: (open: boolean) => void;
  onReportTypeChange: (value: ComposerReportType) => void;
  brandName: string;
  onBrandNameChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  competitors: string[];
  competitorInput: string;
  onCompetitorInputChange: (value: string) => void;
  onCompetitorKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onCompetitorBlur: () => void;
  onRemoveCompetitor: (name: string) => void;
  competitorInputRef?: RefObject<HTMLInputElement | null>;
  selectedMemoryIds: string[];
  selectedMemorySummary: string;
  selectedMemorySummaryNeedsFade: boolean;
  effectiveBrandName: string;
  onOpenMemoryDialog: () => void;
  canSubmit: boolean;
  onSubmit: () => void;
  statusLabel?: string;
  memoryButtonLabel?: string;
  memoryHelperText?: string;
  estimatedCost?: number;
  brandPlaceholder?: string;
  categoryPlaceholder?: string;
  competitorPlaceholder?: string;
  addCompetitorPlaceholder?: string;
  emptyMemoryLabel?: string;
  planningPrefixLabel?: string;
  planningActionLabel?: string;
  promptValue?: string;
  onPromptValueChange?: (value: string) => void;
  submitLabel?: string;
  submitAriaLabel?: string;
}

export function InsightComposerPanel({
  title,
  subtitle,
  titleClassName,
  contentMode = 'default',
  reportType,
  reportTypeLabel,
  reportTypeMenuOpen,
  onReportTypeMenuOpenChange,
  onReportTypeChange,
  brandName,
  onBrandNameChange,
  category,
  onCategoryChange,
  competitors,
  competitorInput,
  onCompetitorInputChange,
  onCompetitorKeyDown,
  onCompetitorBlur,
  onRemoveCompetitor,
  competitorInputRef,
  selectedMemoryIds,
  selectedMemorySummary,
  selectedMemorySummaryNeedsFade,
  effectiveBrandName,
  onOpenMemoryDialog,
  canSubmit,
  onSubmit,
  statusLabel = '联网搜索中',
  memoryButtonLabel,
  memoryHelperText,
  estimatedCost = 50,
  brandPlaceholder = '品牌名称',
  categoryPlaceholder = '选择品类',
  competitorPlaceholder = '输入竞品，回车添加',
  addCompetitorPlaceholder = '添加竞品...',
  emptyMemoryLabel = '从记忆库选择',
  planningPrefixLabel = '基于',
  planningActionLabel = '为我生成',
  submitAriaLabel = '提交',
  promptValue = '',
  onPromptValueChange = () => {},
  submitLabel,
}: InsightComposerPanelProps) {
  const resolvedMemoryButtonLabel =
    memoryButtonLabel ?? (selectedMemoryIds.length > 0 ? `${selectedMemoryIds.length} 个记忆库` : '记忆库');

  return (
    <div className="w-full max-w-5xl animate-fade-in py-0">
      <div className="mb-10 text-center">
        <h1 className={cn('text-4xl font-light tracking-[0.2em] text-foreground mb-2', titleClassName)}>{title}</h1>
        <p className="mt-4  text-sm text-muted-foreground font-light tracking-[0.1em]">{subtitle}</p>
      </div>

      <div className="relative rounded-2xl border border-border/30 bg-card/80 backdrop-blur-sm shadow-sm transition-shadow hover:shadow-md">
        <div className="p-5">
          <div className="flex items-center flex-wrap gap-y-2 text-sm text-foreground/70 leading-relaxed">
            {contentMode === 'memoryPrompt' ? (
              <textarea
                value={promptValue}
                onChange={(event) => onPromptValueChange(event.target.value)}
                placeholder={planningActionLabel}
                rows={3}
                className="oran-sim-prompt min-h-[20px] w-full resize-none appearance-none rounded-2xl border-0 bg-muted/20 px-2 py-1 text-sm leading-relaxed text-foreground/72 shadow-none outline-none transition-colors placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                    event.preventDefault();
                    onSubmit();
                  }
                }}
              />
            ) : reportType === 'planning' ? (
              <>
                <span className="whitespace-nowrap">{planningPrefixLabel}</span>

                <button
                  type="button"
                  onClick={onOpenMemoryDialog}
                  className={cn(
                    'mx-1.5 inline-flex h-7 max-w-[25ch] items-center rounded-full border border-border/40 bg-muted/20 px-3 text-xs transition-colors hover:bg-muted/28',
                    selectedMemoryIds.length > 0
                      ? 'text-foreground/72'
                      : 'text-muted-foreground hover:text-foreground/72'
                  )}
                >
                  {selectedMemoryIds.length > 0 ? (
                    <span
                      className={cn(
                        'block overflow-hidden whitespace-nowrap',
                        selectedMemorySummaryNeedsFade &&
                          'max-w-[25ch] [mask-image:linear-gradient(to_right,black_78%,transparent)] [-webkit-mask-image:linear-gradient(to_right,black_78%,transparent)]'
                      )}
                      title={selectedMemorySummary}
                    >
                      {selectedMemorySummary}
                    </span>
                  ) : (
                    emptyMemoryLabel
                  )}
                </button>

                <span className="whitespace-nowrap">，{planningActionLabel}</span>

                <span
                  className={cn(
                    'mx-1.5 inline-flex h-7 items-center rounded-lg border border-border/30 bg-muted/20 px-2.5 text-sm text-foreground transition-colors',
                    !effectiveBrandName && 'text-muted-foreground/50'
                  )}
                >
                  {effectiveBrandName || brandPlaceholder}
                </span>

                <div className="mx-1.5 inline-flex items-center whitespace-nowrap">
                  <span className="text-sm leading-none">的</span>
                  <ReportTypeSelect
                    value={reportType}
                    label={reportTypeLabel}
                    open={reportTypeMenuOpen}
                    onOpenChange={onReportTypeMenuOpenChange}
                    onChange={onReportTypeChange}
                  />
                </div>
              </>
            ) : (
              <>
                <span className="whitespace-nowrap">{planningActionLabel}</span>

                <input
                  value={brandName}
                  onChange={(event) => onBrandNameChange(event.target.value)}
                  placeholder={brandPlaceholder}
                  className={cn(
                    'mx-1.5 px-2.5 h-7 bg-muted/20 border border-border/30 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring/20 transition-colors',
                    'w-[110px]'
                  )}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      onSubmit();
                    }
                  }}
                />

                <span className="whitespace-nowrap">，</span>

                <CategoryCascader
                  data={CATEGORY_TREE}
                  value={category}
                  onChange={onCategoryChange}
                  placeholder={categoryPlaceholder}
                  className="h-7 rounded-lg px-2.5 text-sm mx-1"
                />

                <span className="whitespace-nowrap">，</span>

                <div className="inline-flex items-center gap-1 flex-wrap mx-1.5">
                  {competitors.map((competitor) => (
                    <span
                      key={competitor}
                      className="inline-flex items-center gap-1 h-6 rounded-full bg-muted/40 border border-border/20 px-2 text-xs text-foreground/80"
                    >
                      {competitor}
                      <button
                        type="button"
                        onClick={() => onRemoveCompetitor(competitor)}
                        className="hover:text-foreground transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  <input
                    ref={competitorInputRef}
                    value={competitorInput}
                    onChange={(event) => onCompetitorInputChange(event.target.value)}
                    onKeyDown={onCompetitorKeyDown}
                    onBlur={onCompetitorBlur}
                    placeholder={competitors.length === 0 ? competitorPlaceholder : addCompetitorPlaceholder}
                    className="h-6 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none w-[120px]"
                  />
                </div>

                <div className="mx-1.5 inline-flex items-center whitespace-nowrap">
                  <span className="text-sm leading-none">的</span>
                  <ReportTypeSelect
                    value={reportType}
                    label={reportTypeLabel}
                    open={reportTypeMenuOpen}
                    onOpenChange={onReportTypeMenuOpenChange}
                    onChange={onReportTypeChange}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-border/20">
          <div className="flex items-center gap-2 text-[11px]">
            {statusLabel ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/8 text-accent/80">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent/60 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent/80" />
                </span>
                <span className="text-[11px] font-medium">{statusLabel}</span>
              </div>
            ) : null}

            <button
              type="button"
              onClick={onOpenMemoryDialog}
              className={cn(
                'h-8 rounded-full border flex items-center justify-center gap-1.5 px-3 transition-all duration-300 ease-out',
                selectedMemoryIds.length > 0
                  ? 'border-orange-400/60 bg-orange-400/10 text-accent/80'
                  : 'border-border/40 text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              <Database className="w-4 h-4" />
              <span className="text-[11px] font-medium whitespace-nowrap">{resolvedMemoryButtonLabel}</span>
            </button>
            {memoryHelperText ? (
              <span className="text-[11px] font-medium text-accent/80">
                {memoryHelperText}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground/70 tabular-nums">
              预计消耗：约 <span className="text-foreground/80 font-medium">{estimatedCost}</span> credit
            </span>
            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit}
              aria-label={submitAriaLabel}
              className={cn(
                'flex items-center justify-center gap-2 transition-all',
                submitLabel ? 'h-10 min-w-[120px] rounded-full px-4' : 'w-9 h-9 rounded-full',
                submitLabel
                  ? canSubmit
                    ? 'border border-orange-200/80 bg-orange-10 text-foreground/60 hover:bg-orange-100'
                    : 'border border-black-300/70 text-foreground/50 cursor-default'
                  : canSubmit
                    ? 'bg-foreground text-background hover:bg-foreground/90'
                    : 'bg-muted/60 text-muted-foreground/40 cursor-default'
              )}
            >
              <ArrowUp className={cn('w-4 h-4', submitLabel && 'text-orange-500')} />
              {submitLabel ? <span className="whitespace-nowrap text-sm font-medium">{submitLabel}</span> : null}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportTypeSelect({
  value,
  label,
  open,
  onOpenChange,
  onChange,
}: {
  value: ComposerReportType;
  label: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (value: ComposerReportType) => void;
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="ml-1.5 inline-flex h-6 min-w-0 items-center justify-center rounded-full border-0 bg-transparent px-4 text-sm font-normal whitespace-nowrap text-current shadow-none transition-colors hover:bg-[#fff3e8] hover:text-[hsl(var(--accent))] focus:outline-none data-[state=open]:bg-[#fff3e8] data-[state=open]:text-[hsl(var(--accent))]"
          aria-label="选择报告类型"
        >
          <span className="inline-flex items-center leading-none">{label}</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 10 6"
            className={cn(
              'ml-2 h-[8px] w-[10px] shrink-0 fill-none stroke-current stroke-[1.3] transition-transform duration-150',
              open && 'rotate-180'
            )}
          >
            <path d="M1 1.5L5 5.5L9 1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="w-auto min-w-[140px] rounded-[18px] border border-white/70 bg-white/72 p-1.5 text-foreground shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur-xl"
      >
        {REPORT_TYPE_OPTIONS.map((option) => {
          const selected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                'flex min-h-[30px] w-full items-center justify-between rounded-[14px] px-4 py-2.5 text-left text-sm font-light text-foreground/72 transition-colors duration-150 focus:outline-none',
                selected
                  ? 'cursor-default'
                  : 'hover:bg-black/[0.035] focus:bg-transparent focus-visible:bg-black/[0.035]'
              )}
            >
              <span>{option.label}</span>
              <span className="flex h-3.5 w-3.5 items-center justify-center">
                {selected ? <Check className="h-3 w-3 text-[hsl(var(--accent))]" strokeWidth={2.2} /> : null}
              </span>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
