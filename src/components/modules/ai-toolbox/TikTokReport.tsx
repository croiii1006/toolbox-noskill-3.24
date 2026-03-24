import { useState, useEffect } from 'react';
import { TikTokReportComposer } from './TikTokReportComposer';
import { TikTokReportResults } from './TikTokReportResults';
import { useTikTokInspiration } from '@/contexts/TikTokInspirationContext';
import { useReplicatePrefill } from '@/contexts/ReplicatePrefillContext';
import { useCredits } from '@/contexts/CreditsContext';
import { InsufficientCreditsDrawer } from '@/components/modules/InsufficientCreditsDrawer';
import { statusConfig } from '@/types/history';
import { History, X, ArrowLeft, Loader2 } from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';

import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface TikTokReportProps {
  onNavigate?: (itemId: string) => void;
}

function LoadingPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-full flex items-center justify-center p-8 relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="absolute top-4 left-4 gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        返回
      </Button>
      <div className="text-center space-y-4 animate-fade-in">
        <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto" />
        <h2 className="text-lg font-medium text-foreground">报告生成中</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          正在为你收集匹配度最高的爆款TikTok视频...
        </p>
      </div>
    </div>
  );
}

export function TikTokReport({ onNavigate }: TikTokReportProps) {
  const [phase, setPhase] = useState<'compose' | 'loading' | 'results'>('compose');
  const [category, setCategory] = useState('');
  const [sellingPoints, setSellingPoints] = useState<string[]>([]);
  const { reportHistory, addReportHistory, updateReportHistoryStatus, deleteReportHistory } = useTikTokInspiration();
  const { setPrefill } = useReplicatePrefill();
  const { canAfford, shortfall, deduct, refund } = useCredits();
  const [creditsDrawerOpen, setCreditsDrawerOpen] = useState(false);
  const [creditsShortfall, setCreditsShortfall] = useState(0);

  const REPORT_COST = 200;
  const MAX_IN_PROGRESS = 3;
  const TIMEOUT_MS = 30 * 60 * 1000;

  const handleSubmit = (payload: { category: string; sellingPoints: string[] }) => {
    // Check in-progress task limit
    const inProgressCount = reportHistory.filter(h => h.status === 'in_progress').length;
    if (inProgressCount >= MAX_IN_PROGRESS) {
      toast.error('任务数量已达上限', { description: '最多同时运行 3 个任务，请等待完成后再提交' });
      return;
    }

    // Credit check
    if (!canAfford(REPORT_COST)) {
      setCreditsShortfall(shortfall(REPORT_COST));
      setCreditsDrawerOpen(true);
      return;
    }
    deduct(REPORT_COST, 'TikTok 爆款视频匹配');

    setCategory(payload.category);
    setSellingPoints(payload.sellingPoints);
    setPhase('loading');
    const historyId = addReportHistory({
      category: payload.category,
      sellingPoints: payload.sellingPoints,
      videoCount: 6,
      status: 'in_progress',
    });

    const completionTimer = setTimeout(() => {
      updateReportHistoryStatus(historyId, 'completed');
      setPhase('results');
    }, 5000);

    // 30-minute timeout
    setTimeout(() => {
      // Check if still in progress (via history)
      const current = reportHistory.find(h => h.id === historyId);
      if (current && current.status === 'in_progress') {
        clearTimeout(completionTimer);
        updateReportHistoryStatus(historyId, 'failed');
        refund(REPORT_COST, 'TikTok报告超时退款');
        toast.error('生成超时', { description: '报告生成超过30分钟未完成，积分已退还' });
      }
    }, TIMEOUT_MS);
  };

  const handleBack = () => {
    setCategory('');
    setSellingPoints([]);
    setPhase('compose');
  };

  const handleReplicate = (videoId: string, videoTitle?: string, viewCountText?: string, likeCountText?: string) => {
    setPrefill({
      tiktokLink: `https://www.tiktok.com/video/${videoId}`,
      sellingPoints,
      autoStart: false,
      inspirationVideo: {
        id: videoId,
        title: videoTitle || 'TikTok 视频',
        views: viewCountText || '',
        likes: likeCountText || '',
        coverGradient: 'from-rose-500/60 to-orange-400/60',
      },
    });
    onNavigate?.('replicate-video');
  };

  const handleRestoreHistory = (item: { category: string; sellingPoints: string[] }) => {
    setCategory(item.category);
    setSellingPoints(item.sellingPoints);
    setPhase('results');
  };

  if (phase === 'loading') {
    return <LoadingPage onBack={handleBack} />;
  }

  if (phase === 'results') {
    return (
      <TikTokReportResults
        category={category}
        sellingPoints={sellingPoints}
        onBack={handleBack}
        onReplicate={handleReplicate}
      />
    );
  }

  const historySheet = (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-muted/40">
          <History className="w-3.5 h-3.5" />
          <span>历史记录</span>
        </button>
      </SheetTrigger>
      <SheetContent className="w-80 sm:w-96">
        <SheetHeader>
          <SheetTitle className="text-base font-medium">历史记录</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          {reportHistory.map(item => (
            <button
              key={item.id}
              onClick={() => handleRestoreHistory(item)}
              className="w-full text-left p-3 rounded-xl border border-border/30 hover:border-border/60 hover:bg-muted/20 transition-all group relative"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{item.category}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${statusConfig[item.status || 'completed'].className}`}>
                    {statusConfig[item.status || 'completed'].label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {item.sellingPoints.map(p => (
                  <span key={p} className="text-[10px] bg-muted/40 text-muted-foreground px-1.5 py-0.5 rounded-full">{p}</span>
                ))}
              </div>
              <div className="text-[10px] text-muted-foreground/50 mt-1.5">{item.videoCount} 个视频</div>
              <button
                onClick={e => { e.stopPropagation(); deleteReportHistory(item.id); }}
                className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-muted/40 transition-all"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground/50" />
              </button>
            </button>
          ))}
          {reportHistory.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">暂无历史记录</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="relative min-h-full flex flex-col">
      <div className="absolute top-4 right-4 z-20">
        {historySheet}
      </div>
      <TikTokReportComposer onSubmit={handleSubmit} />
      <InsufficientCreditsDrawer
        open={creditsDrawerOpen}
        onOpenChange={setCreditsDrawerOpen}
        shortfall={creditsShortfall}
      />
    </div>
  );
}