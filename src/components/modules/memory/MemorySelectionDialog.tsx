import { useMemo } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface MemorySelectItem {
  id: string;
  name: string;
  desc: string;
  tag: string;
  charCount: number;
}

interface MemorySelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: MemorySelectItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  maxChars?: number;
  className?: string;
}

const MEMORY_SELECTION_CHAR_LIMIT = 1000000;

export function MemorySelectionDialog({
  open,
  onOpenChange,
  items,
  selectedIds,
  onToggle,
  maxChars = MEMORY_SELECTION_CHAR_LIMIT,
  className,
}: MemorySelectionDialogProps) {
  const totalChars = useMemo(
    () =>
      items
        .filter((item) => selectedIds.includes(item.id))
        .reduce((sum, item) => sum + item.charCount, 0),
    [items, selectedIds],
  );

  const isOverLimit = totalChars > maxChars;
  const nearLimit = totalChars > maxChars * 0.8;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("rounded-2xl sm:max-w-md", className)}>
        <DialogHeader>
          <DialogTitle className="text-base font-medium">选择记忆库</DialogTitle>
        </DialogHeader>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span
              className={cn(
                "text-muted-foreground",
                isOverLimit && "font-medium text-destructive",
              )}
            >
              已选 {totalChars.toLocaleString()} / {maxChars.toLocaleString()} 字符
            </span>
            {isOverLimit ? (
              <span className="flex items-center gap-1 font-medium text-destructive">
                <AlertTriangle className="h-3 w-3" />
                超出上限
              </span>
            ) : null}
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-muted/50">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                isOverLimit
                  ? "bg-destructive"
                  : nearLimit
                    ? "bg-amber-500"
                    : "bg-foreground/60",
              )}
              style={{ width: `${Math.min(100, (totalChars / maxChars) * 100)}%` }}
            />
          </div>
        </div>

        <div className="mt-2 max-h-[50vh] space-y-1.5 overflow-y-auto scrollbar-thin">
          {items.map((item) => {
            const selected = selectedIds.includes(item.id);

            return (
              <button
                key={item.id}
                onClick={() => onToggle(item.id)}
                className={cn(
                  "w-full rounded-xl border px-4 py-3 text-left text-sm transition-all",
                  selected
                    ? "border-foreground/20 bg-foreground/[0.03]"
                    : "border-border/30 hover:border-border/60",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full border transition-all",
                        selected ? "border-foreground bg-foreground" : "border-border",
                      )}
                    >
                      {selected ? (
                        <Check className="h-3 w-3 text-background" />
                      ) : null}
                    </div>
                    <span className="font-medium text-foreground">{item.name}</span>
                  </div>

                  <span className="text-[10px] text-muted-foreground/50">
                    {item.charCount}字
                  </span>
                </div>

                <p className="ml-[30px] mt-1 text-xs text-muted-foreground">
                  {item.desc}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between">
          {isOverLimit ? (
            <p className="text-[11px] text-destructive">
              请减少选择，当前超出 {(totalChars - maxChars).toLocaleString()} 字符
            </p>
          ) : (
            <div />
          )}

          <div className="ml-auto">
            <Button
              onClick={() => onOpenChange(false)}
              size="sm"
              disabled={isOverLimit}
              className="h-8 rounded-lg bg-foreground px-5 text-xs text-background hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              确认 ({selectedIds.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
