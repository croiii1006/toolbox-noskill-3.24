import { Check, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { CreatorLibraryItem } from './creatorLibrary';

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex max-h-[min(86vh,760px)] max-w-[calc(100vw-24px)] flex-col rounded-[26px] border-border/60 px-5 pb-5 pt-7 shadow-2xl sm:max-w-xl sm:px-7 sm:pb-6',
          className,
        )}
      >
        <DialogHeader className="shrink-0 pr-10">
          <DialogTitle className="flex items-center gap-2 text-lg font-medium text-foreground">
            <Users className="h-4 w-4" />
            选择达人
          </DialogTitle>
        </DialogHeader>

        <p className="-mt-1 shrink-0 text-xs text-muted-foreground sm:text-sm">
          已选 {selectedIds.length} 位达人，将作为对标参考人物
        </p>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto px-2 py-2 scrollbar-ghost">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {items.map((item) => {
              const selected = selectedIds.includes(item.id);
              const genderLabel = item.gender === 'female' ? '女性' : '男性';

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onToggle(item.id)}
                  className={cn(
                    'group relative flex min-h-[176px] w-full flex-col items-center overflow-hidden rounded-[22px] border bg-background px-4 py-5 text-center transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20',
                    selected
                      ? 'border-foreground/35 bg-foreground/[0.03] shadow-[inset_0_0_0_1px_rgba(17,17,17,0.18),0_16px_38px_rgba(15,23,42,0.08)]'
                      : 'border-border/60 hover:z-10 hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-muted/[0.35] hover:shadow-[0_16px_34px_rgba(15,23,42,0.06)]',
                  )}
                >
                  {selected ? (
                    <div className="absolute right-3 top-3 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background shadow-sm">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </div>
                  ) : null}

                  <div className="relative z-10 h-14 w-14 overflow-hidden rounded-full bg-muted transition-all duration-200 group-hover:scale-[1.04] group-hover:opacity-15 group-focus-visible:scale-[1.04] group-focus-visible:opacity-15">
                    <img src={item.avatarUrl} alt={item.name} className="h-full w-full object-cover" />
                  </div>

                  <div className="relative z-10 mt-3 min-w-0 transition-opacity duration-200 group-hover:opacity-10 group-focus-visible:opacity-10">
                    <div className="truncate text-[15px] font-semibold tracking-[-0.01em] text-foreground sm:text-base">
                      {item.name}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground/90 sm:text-sm">
                      {item.handle}
                    </div>
                  </div>

                  <div className="pointer-events-none absolute inset-2 z-10 rounded-[18px] bg-white/78 p-4 text-left opacity-0 shadow-[0_20px_40px_rgba(255,255,255,0.3)] backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                    <div className="flex h-full flex-col justify-between">
                      <div className="space-y-1">
                        <div className="text-[11px] font-medium tracking-[0.08em] text-foreground/45">
                          CREATOR INFO
                        </div>
                        <div className="text-sm font-semibold text-foreground">{item.followers} 粉丝</div>
                        <div className="text-xs text-muted-foreground">均播 {item.avgViews}</div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                          <span className="rounded-full bg-background/80 px-2.5 py-1">{item.region}</span>
                          <span className="rounded-full bg-background/80 px-2.5 py-1">{genderLabel}</span>
                        </div>
                        <div className="truncate text-xs text-foreground/75">{item.niche}</div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex shrink-0 items-center justify-end border-t border-border/50 bg-background pt-4">
          <Button
            onClick={() => onOpenChange(false)}
            size="sm"
            className="h-9 rounded-full bg-foreground px-4 text-xs font-medium text-background hover:bg-foreground/90 sm:h-10 sm:px-5 sm:text-sm"
          >
            确认 ({selectedIds.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
