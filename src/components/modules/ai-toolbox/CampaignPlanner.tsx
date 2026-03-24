import { useState } from 'react';
import { Loader2, History, X, ArrowLeft } from 'lucide-react';
import { CampaignPlannerComposer, type CampaignPayload } from './CampaignPlannerComposer';
import { CampaignPlannerReport } from './CampaignPlannerReport';
import { type HistoryStatus, statusConfig } from '@/types/history';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import { useCredits } from '@/contexts/CreditsContext';
import { InsufficientCreditsDrawer } from '@/components/modules/InsufficientCreditsDrawer';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const REPORT_COST = 200;
const MAX_IN_PROGRESS = 3;
const TIMEOUT_MS = 30 * 60 * 1000;

interface HistoryItem {
  id: string;
  payload: CampaignPayload;
  date: string;
  status: HistoryStatus;
}

const STORAGE_KEY = 'campaign-planner-history';

function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveHistory(items: HistoryItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function CampaignPlanner() {
  const [view, setView] = useState<'input' | 'loading' | 'report'>('input');
  const [payload, setPayload] = useState<CampaignPayload | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory);
  const [initialData, setInitialData] = useState<CampaignPayload | undefined>();
  const [composerKey, setComposerKey] = useState(0);
  const [creditsDrawerOpen, setCreditsDrawerOpen] = useState(false);
  const [creditsShortfall, setCreditsShortfall] = useState(0);
  const { deduct, canAfford, shortfall, refund } = useCredits();

  const handleSubmit = (data: CampaignPayload) => {
    // Check in-progress task limit
    const inProgressCount = history.filter(h => h.status === 'in_progress').length;
    if (inProgressCount >= MAX_IN_PROGRESS) {
      toast.error('任务数量已达上限', { description: '最多同时运行 3 个任务，请等待完成后再提交' });
      return;
    }

    if (!canAfford(REPORT_COST)) {
      setCreditsShortfall(shortfall(REPORT_COST));
      setCreditsDrawerOpen(true);
      return;
    }
    deduct(REPORT_COST, '策划方案');

    setPayload(data);
    const newItem: HistoryItem = { id: crypto.randomUUID(), payload: data, date: new Date().toISOString(), status: 'in_progress' };
    const updated = [newItem, ...history].slice(0, 20);
    setHistory(updated);
    saveHistory(updated);
    setView('loading');

    const completionTimer = setTimeout(() => {
      const completed = updated.map(h => h.id === newItem.id ? { ...h, status: 'completed' as HistoryStatus } : h);
      setHistory(completed);
      saveHistory(completed);
      setView('report');
    }, 2000);

    // 30-minute timeout
    setTimeout(() => {
      setHistory(prev => {
        const item = prev.find(h => h.id === newItem.id);
        if (item && item.status === 'in_progress') {
          clearTimeout(completionTimer);
          refund(REPORT_COST, '策划方案超时退款');
          toast.error('生成超时', { description: '方案生成超过30分钟未完成，积分已退还' });
          const failed = prev.map(h => h.id === newItem.id ? { ...h, status: 'failed' as HistoryStatus } : h);
          saveHistory(failed);
          return failed;
        }
        return prev;
      });
    }, TIMEOUT_MS);
  };

  const handleRestore = (item: HistoryItem) => {
    setPayload(item.payload);
    setView('report');
  };

  const handleDeleteHistory = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    saveHistory(updated);
  };

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
          {history.map(item => (
            <button
              key={item.id}
              onClick={() => handleRestore(item)}
              className="w-full text-left p-3 rounded-xl border border-border/30 hover:border-border/60 hover:bg-muted/20 transition-all group relative"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{item.payload.brandName} 策划方案</span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${statusConfig[item.status || 'completed'].className}`}>
                    {statusConfig[item.status || 'completed'].label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(item.date).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground truncate">{item.payload.goal}{item.payload.budget ? ` · ${item.payload.budget}` : ''}</p>
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {item.payload.audience.slice(0, 3).map(a => (
                  <span key={a} className="text-[10px] bg-muted/40 text-muted-foreground px-1.5 py-0.5 rounded-full">{a}</span>
                ))}
                {item.payload.sellingPoints.slice(0, 2).map(s => (
                  <span key={s} className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full">{s}</span>
                ))}
              </div>
              <button
                onClick={e => { e.stopPropagation(); handleDeleteHistory(item.id); }}
                className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-muted/40 transition-all"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground/50" />
              </button>
            </button>
          ))}
          {history.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">暂无历史记录</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );

  if (view === 'loading' && payload) {
    return (
      <div className="min-h-full flex items-center justify-center p-8 relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setView('input'); }}
          className="absolute top-4 left-4 gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </Button>
        <div className="absolute top-4 right-4 z-20">
          {historySheet}
        </div>
        <div className="text-center space-y-4 animate-fade-in">
          <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto" />
          <h2 className="text-lg font-medium text-foreground">方案生成中</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            正在为 <span className="text-foreground font-medium">{payload.brandName}</span> 生成{payload.goal}策划方案...
          </p>
        </div>
      </div>
    );
  }

  if (view === 'report' && payload) {
    return <CampaignPlannerReport payload={payload} onBack={() => { setPayload(null); setInitialData(undefined); setComposerKey(k => k + 1); setView('input'); }} />;
  }

  return (
    <div className="relative h-full">
      <div className="absolute top-4 right-4 z-20">
        {historySheet}
      </div>
      <CampaignPlannerComposer key={composerKey} onSubmit={handleSubmit} initialData={initialData} />
      <InsufficientCreditsDrawer open={creditsDrawerOpen} onOpenChange={setCreditsDrawerOpen} shortfall={creditsShortfall} />
    </div>
  );
}
