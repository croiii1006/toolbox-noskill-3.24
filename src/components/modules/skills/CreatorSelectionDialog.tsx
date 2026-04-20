import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, SlidersHorizontal, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { CreatorGender, CreatorLibraryItem } from './creatorLibrary';

type TerritoryFilter = 'all' | 'cn' | 'overseas';
type GenderFilter = 'all' | CreatorGender;

const CHINA_REGION_SET = new Set(['CN', 'CHINA', '中国', '中国大陆']);

function getCreatorTerritory(item: CreatorLibraryItem): Exclude<TerritoryFilter, 'all'> {
  const region = item.region.trim().toUpperCase();
  return CHINA_REGION_SET.has(region) ? 'cn' : 'overseas';
}

function getFilterLabel(territory: TerritoryFilter, gender: GenderFilter) {
  const parts: string[] = [];

  if (territory === 'cn') parts.push('中国');
  if (territory === 'overseas') parts.push('海外');
  if (gender === 'male') parts.push('男');
  if (gender === 'female') parts.push('女');

  return parts.length > 0 ? parts.join(' · ') : '全部达人';
}

interface CreatorSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CreatorLibraryItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  className?: string;
}

export function CreatorSelectionDialog({
  open,
  onOpenChange,
  items,
  selectedIds,
  onToggle,
  className,
}: CreatorSelectionDialogProps) {
  const [territoryFilter, setTerritoryFilter] = useState<TerritoryFilter>('all');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchTerritory =
        territoryFilter === 'all' || getCreatorTerritory(item) === territoryFilter;
      const matchGender = genderFilter === 'all' || item.gender === genderFilter;
      return matchTerritory && matchGender;
    });
  }, [genderFilter, items, territoryFilter]);

  const filterLabel = getFilterLabel(territoryFilter, genderFilter);
  const hasActiveFilter = territoryFilter !== 'all' || genderFilter !== 'all';

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    container.scrollTop = 0;
    setShowTopFade(false);

    const frame = requestAnimationFrame(() => {
      const { scrollHeight, clientHeight } = container;
      setShowBottomFade(scrollHeight > clientHeight + 4);
    });

    return () => cancelAnimationFrame(frame);
  }, [filteredItems.length, open]);

  const chipClassName = (active: boolean) =>
    cn(
      'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
      active
        ? 'border-foreground/20 bg-foreground text-background'
        : 'border-border/60 bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground',
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex h-[576px] max-h-[calc(100vh-24px)] max-w-[calc(100vw-24px)] flex-col rounded-[20px] border-border/60 px-4 pb-4 pt-6 shadow-2xl sm:max-w-[42rem] sm:px-6 sm:pb-5',
          className,
        )}
      >
        <DialogHeader className="shrink-0 pr-8">
          <DialogTitle className="flex items-center gap-1.5 text-base font-medium text-foreground">
            <Users className="h-3.5 w-3.5" />
            选择达人
          </DialogTitle>
        </DialogHeader>

        <div className="-mt-1 shrink-0">
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border/60 bg-background px-2.5 text-[11px] text-foreground transition-colors hover:border-foreground/20 hover:bg-muted/40"
              >
                <SlidersHorizontal className="h-3 w-3 text-muted-foreground" />
                <span>{filterLabel}</span>
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                  {filteredItems.length}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </PopoverTrigger>

            <PopoverContent
              align="start"
              className="w-[224px] rounded-[18px] border-border/60 bg-background/95 p-3 shadow-[0_16px_32px_rgba(15,23,42,0.12)] backdrop-blur-xl"
            >
              <div className="space-y-3">
                <div>
                  <div className="mb-1.5 text-[10px] font-medium tracking-[0.08em] text-muted-foreground">
                    区域
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTerritoryFilter('all')}
                      className={chipClassName(territoryFilter === 'all')}
                    >
                      全部
                    </button>
                    <button
                      type="button"
                      onClick={() => setTerritoryFilter('cn')}
                      className={chipClassName(territoryFilter === 'cn')}
                    >
                      中国
                    </button>
                    <button
                      type="button"
                      onClick={() => setTerritoryFilter('overseas')}
                      className={chipClassName(territoryFilter === 'overseas')}
                    >
                      海外
                    </button>
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 text-[10px] font-medium tracking-[0.08em] text-muted-foreground">
                    性别
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setGenderFilter('all')}
                      className={chipClassName(genderFilter === 'all')}
                    >
                      全部
                    </button>
                    <button
                      type="button"
                      onClick={() => setGenderFilter('male')}
                      className={chipClassName(genderFilter === 'male')}
                    >
                      男
                    </button>
                    <button
                      type="button"
                      onClick={() => setGenderFilter('female')}
                      className={chipClassName(genderFilter === 'female')}
                    >
                      女
                    </button>
                  </div>
                </div>

                {hasActiveFilter ? (
                  <div className="border-t border-border/50 pt-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setTerritoryFilter('all');
                        setGenderFilter('all');
                      }}
                      className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      重置筛选
                    </button>
                  </div>
                ) : null}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="relative mt-2 min-h-0 flex-1">
          <div
            ref={scrollRef}
            onScroll={() => {
              const container = scrollRef.current;
              if (!container) return;
              const { scrollTop, scrollHeight, clientHeight } = container;
              setShowTopFade(scrollTop > 4);
              setShowBottomFade(scrollTop + clientHeight < scrollHeight - 4);
            }}
            className="h-full overflow-y-auto pl-1.5 pr-2.5 py-1.5 scrollbar-ghost"
          >
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 pb-4 sm:grid-cols-3">
                {filteredItems.map((item) => {
                  const selected = selectedIds.includes(item.id);
                  const genderLabel = item.gender === 'female' ? '女性' : '男性';

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onToggle(item.id)}
                      className={cn(
                        'group relative flex min-h-[144px] w-full flex-col items-center overflow-hidden rounded-[18px] border bg-background px-3 py-4 text-center transition-all duration-200',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20',
                        selected
                          ? 'border-foreground/35 bg-foreground/[0.03] '
                          : 'border-border/30 hover:z-10 hover:-translate-y-0.5 hover:border-foreground/10 hover:bg-muted/[0.35] hover:shadow-[0_16px_34px_rgba(15,23,42,0.06)]',
                      )}
                    >
                      {selected ? (
                        <div className="absolute right-2.5 top-2.5 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background shadow-sm">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </div>
                      ) : null}

                      <div className="relative z-10 h-[58px] w-[58px] overflow-hidden rounded-full bg-muted transition-all duration-200 group-hover:scale-[1.04] group-hover:opacity-15 group-focus-visible:scale-[1.04] group-focus-visible:opacity-15">
                        <img src={item.avatarUrl} alt={item.name} className="h-full w-full object-cover" />
                      </div>

                      <div className="relative z-10 mt-2.5 min-w-0 transition-opacity duration-200 group-hover:opacity-10 group-focus-visible:opacity-10">
                        <div className="truncate text-[13px] font-light tracking-[-0.01em] text-foreground sm:text-sm">
                          {item.name}
                        </div>
                        <div className="mt-0.5 truncate text-[11px] font-light text-muted-foreground/70 sm:text-xs">
                          {item.handle}
                        </div>
                      </div>

                      <div className="pointer-events-none absolute inset-1.5 z-10 rounded-[15px] bg-white/78 p-3 text-left opacity-0 shadow-[0_16px_32px_rgba(255,255,255,0.28)] backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                        <div className="flex h-full flex-col justify-between">
                          <div className="space-y-1">
                            <div className="text-[10px] font-medium tracking-[0.08em] text-foreground/45">
                              CREATOR INFO
                            </div>
                            <div className="text-[13px] font-semibold text-foreground">{item.followers} 粉丝</div>
                            <div className="text-[11px] text-muted-foreground">均播 {item.avgViews}</div>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
                              <span className="rounded-full bg-background/80 px-2 py-0.5">{item.region}</span>
                              <span className="rounded-full bg-background/80 px-2 py-0.5">{genderLabel}</span>
                            </div>
                            <div className="truncate text-[11px] text-foreground/75">{item.niche}</div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-[192px] items-center justify-center rounded-[18px] border border-dashed border-border/60 bg-muted/[0.18] px-5 text-center">
                <div>
                  <div className="text-xs font-medium text-foreground">没有符合条件的达人</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    试试切回“全部达人”或重置筛选
                  </div>
                </div>
              </div>
            )}
          </div>

          {showTopFade ? (
            <div className="pointer-events-none absolute left-1.5 right-5 top-0 z-20 h-5 rounded-t-[14px] bg-gradient-to-b from-background via-background/70 to-background/0" />
          ) : null}
          {showBottomFade ? (
            <div className="pointer-events-none absolute bottom-0 left-1.5 right-5 z-20 h-10 rounded-b-[14px] bg-gradient-to-b from-background/0 via-background/78 to-background" />
          ) : null}
        </div>

        <div className="relative z-30 flex shrink-0 items-center justify-between gap-3 bg-background pt-1">
          <p className="text-[11px] text-muted-foreground/70 sm:text-xs">
            已选 {selectedIds.length} 位达人，将作为对标参考人物
          </p>
          <Button
            onClick={() => onOpenChange(false)}
            size="sm"
            className="h-8 rounded-full bg-foreground px-3.5 text-[11px] font-medium text-background hover:bg-foreground/90 sm:h-9 sm:px-4 sm:text-xs"
          >
            确认 ({selectedIds.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
