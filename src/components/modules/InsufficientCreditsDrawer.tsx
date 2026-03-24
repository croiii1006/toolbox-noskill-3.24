import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay, DialogPortal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface InsufficientCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortfall: number;
}

export function InsufficientCreditsDrawer({ open, onOpenChange, shortfall }: InsufficientCreditsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-white/40 backdrop-blur-sm" />
        <DialogContent className="max-w-sm rounded-2xl bg-background/70 backdrop-blur-xl border-border/50 shadow-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              算力储量不足
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <p className="text-sm text-muted-foreground font-light ml-[31px]">
              算力储量不足 (缺口: <span className="font-semibold text-foreground tabular-nums">{shortfall}</span> credit)
            </p>

            <Button
              className="w-full justify-center rounded-xl"
              asChild>
              
              <a href="https://www.oran.cn/" target="_blank" rel="noopener noreferrer">
                快捷充值
              </a>
            </Button>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>);

}