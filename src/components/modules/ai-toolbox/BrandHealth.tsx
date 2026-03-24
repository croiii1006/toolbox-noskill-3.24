import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Download, FileText, AlertTriangle, TrendingUp, Users, Target, Shield, Zap, ChevronRight, ExternalLink, Database, History, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCredits } from '@/contexts/CreditsContext';
import { InsufficientCreditsDrawer } from '@/components/modules/InsufficientCreditsDrawer';
import { useMemory } from '@/contexts/MemoryContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MarketInsightComposer, type HistoryEntry } from './MarketInsightComposer';
import { statusConfig, type HistoryStatus } from '@/types/history';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
  ZAxis,
} from 'recharts';

// Mock data for charts
const industryTrendData = [
  { week: 'W1', heat: 65 },
  { week: 'W2', heat: 72 },
  { week: 'W3', heat: 68 },
  { week: 'W4', heat: 85 },
  { week: 'W5', heat: 78 },
  { week: 'W6', heat: 92 },
  { week: 'W7', heat: 88 },
  { week: 'W8', heat: 95 },
];

const radarData = [
  { subject: '内容质量', myBrand: 85, competitor: 70, fullMark: 100 },
  { subject: 'SEO表现', myBrand: 72, competitor: 85, fullMark: 100 },
  { subject: '价格竞争力', myBrand: 78, competitor: 65, fullMark: 100 },
  { subject: '品牌声量', myBrand: 65, competitor: 80, fullMark: 100 },
  { subject: '用户互动', myBrand: 90, competitor: 75, fullMark: 100 },
];

const demographicsData = [
  { age: '18-24', percentage: 35 },
  { age: '25-30', percentage: 42 },
  { age: '31-40', percentage: 18 },
  { age: '41-50', percentage: 4 },
  { age: '50+', percentage: 1 },
];

const demandMatrixData = [
  { x: 75, y: 85, z: 200, name: '产品质量', quadrant: 1 },
  { x: 45, y: 80, z: 150, name: '价格敏感', quadrant: 2 },
  { x: 80, y: 35, z: 180, name: '物流速度', quadrant: 4 },
  { x: 30, y: 40, z: 120, name: '售后服务', quadrant: 3 },
  { x: 65, y: 60, z: 160, name: '品牌信任', quadrant: 1 },
];

const seoKeywordsData = [
  { keyword: '美妆护肤', ranking: 2, traffic: 12500 },
  { keyword: '平价彩妆', ranking: 5, traffic: 8200 },
  { keyword: '学生党好物', ranking: 3, traffic: 9800 },
  { keyword: '口红推荐', ranking: 8, traffic: 5600 },
];

const contentAuditData = [
  { id: 1, title: '夏日清爽妆容教程', type: 'Video', interactions: 25600, risk: 'low', date: '2024-01-15' },
  { id: 2, title: '新品唇釉试色', type: 'Video', interactions: 18900, risk: 'low', date: '2024-01-14' },
  { id: 3, title: '敏感肌护肤分享', type: 'Image', interactions: 12300, risk: 'medium', date: '2024-01-13' },
  { id: 4, title: '促销活动预告', type: 'Image', interactions: 8700, risk: 'high', date: '2024-01-12' },
];

const riskData = [
  { item: 'SEO关键词覆盖不足', level: 'high', signal: '主要关键词排名下降15位', advice: '增加长尾关键词内容布局' },
  { item: '内容更新频率低', level: 'medium', signal: '周均发布量低于竞品40%', advice: '提升至每日1-2条优质内容' },
  { item: '用户互动率下滑', level: 'medium', signal: '评论回复率仅23%', advice: '建立24小时内回复机制' },
];

const actionPlanData = [
  { period: '第1-2周', seo: '关键词优化，提升TOP10占比', social: '日更1条短视频', operation: '搭建私域流量池' },
  { period: '第3-4周', seo: '竞品关键词狙击', social: '达人合作3-5位', operation: '会员体系上线' },
  { period: '第5-8周', seo: '品牌词霸屏策略', social: '直播带货测试', operation: '复购激励计划' },
];

interface BrandHealthProps {
  onNavigate?: (itemId: string) => void;
}

export function BrandHealth({ onNavigate }: BrandHealthProps) {
  const { i18n } = useTranslation();
  const { addEntry, setDrawerOpen } = useMemory();
  const { canAfford, shortfall: getShortfall, deduct, refund } = useCredits();
  const [creditsDrawerOpen, setCreditsDrawerOpen] = useState(false);
  const [creditsShortfall, setCreditsShortfall] = useState(0);
  const REPORT_COST = 200;
  const isZh = i18n.language === 'zh';
  
  const [view, setView] = useState<'input' | 'loading' | 'report'>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    brandName: '',
    category: '',
    competitors: [] as string[],
  });
  const [historyLoadData, setHistoryLoadData] = useState<HistoryEntry | null>(null);
  const [historyKey, setHistoryKey] = useState(0);

  const HISTORY_KEY = 'market-insight-history';

  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [
        { id: '1', brandName: 'AOS', category: '美妆个护 > 彩妆 > 口红', competitors: ['花西子', 'ColorKey'], date: '2024-01-15', status: 'completed' as HistoryStatus },
        { id: '2', brandName: 'SHEIN', category: '服饰鞋包 > 女装 > 连衣裙', competitors: ['ZARA', 'H&M', 'Uniqlo'], date: '2024-01-10', status: 'completed' as HistoryStatus },
      ];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  const deleteHistory = useCallback((id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id));
  }, []);

  const loadHistory = (entry: HistoryEntry) => {
    setFormData({ brandName: entry.brandName, category: entry.category, competitors: entry.competitors });
    setHistoryLoadData(entry);
    setHistoryKey((k) => k + 1);
    setView('report');
  };

  const MAX_IN_PROGRESS = 3;
  const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

  const handleGenerate = (payload: { brandName: string; category: string; competitors: string[] }) => {
    // Check in-progress task limit
    const inProgressCount = history.filter(h => h.status === 'in_progress').length;
    if (inProgressCount >= MAX_IN_PROGRESS) {
      toast.error('任务数量已达上限', { description: '最多同时运行 3 个任务，请等待完成后再提交' });
      return;
    }

    // Credit check
    if (!canAfford(REPORT_COST)) {
      setCreditsShortfall(getShortfall(REPORT_COST));
      setCreditsDrawerOpen(true);
      return;
    }
    deduct(REPORT_COST, '市场洞察报告');

    setFormData(payload);
    setIsLoading(true);
    setView('loading');
    const newId = crypto.randomUUID();
    const newEntry: HistoryEntry = {
      id: newId,
      brandName: payload.brandName,
      category: payload.category,
      competitors: payload.competitors,
      date: new Date().toISOString().slice(0, 10),
      status: 'in_progress',
    };
    setHistory(prev => [newEntry, ...prev].slice(0, 20));

    // Simulate completion
    const completionTimer = setTimeout(() => {
      setIsLoading(false);
      setView('report');
      setHistory(prev => prev.map(h => h.id === newId ? { ...h, status: 'completed' as HistoryStatus } : h));
    }, 1500);

    // 30-minute timeout: mark failed & refund
    const timeoutTimer = setTimeout(() => {
      setHistory(prev => {
        const item = prev.find(h => h.id === newId);
        if (item && item.status === 'in_progress') {
          clearTimeout(completionTimer);
          refund(REPORT_COST, '市场洞察报告超时退款');
          toast.error('生成超时', { description: '报告生成超过30分钟未完成，积分已退还' });
          return prev.map(h => h.id === newId ? { ...h, status: 'failed' as HistoryStatus } : h);
        }
        return prev;
      });
    }, TIMEOUT_MS);

    return () => { clearTimeout(completionTimer); clearTimeout(timeoutTimer); };
  };

  const handleBack = () => {
    setFormData({ brandName: '', category: '', competitors: [] });
    setHistoryLoadData(null);
    setHistoryKey((k) => k + 1);
    setView('input');
  };

  const handleCopyToMemory = () => {
    const md = `# ${formData.brandName} 品牌健康度报告

> 生成时间：2024年1月16日

## 执行摘要

| 指标 | 得分 |
|------|------|
| SEO可见度 | **72** |
| 社交互动 | **85** |
| 竞争指数 | **68** |

### 关键发现
- 行业热度持续上升，近8周增长 **46%**，市场机会窗口期
- 内容更新频率落后竞品，建议提升发布节奏
- SEO关键词覆盖存在差距，需重点优化TOP10关键词

## 风险红线

| 风险项 | 等级 | 信号 | 建议 |
|--------|------|------|------|
| SEO关键词覆盖不足 | 🔴 高 | 主要关键词排名下降15位 | 增加长尾关键词内容布局 |
| 内容更新频率低 | 🟡 中 | 周均发布量低于竞品40% | 提升至每日1-2条优质内容 |
| 用户互动率下滑 | 🟡 中 | 评论回复率仅23% | 建立24小时内回复机制 |

## 消费者画像

- **核心人群**：25-30岁（42%）、18-24岁（35%）
- **需求重点**：产品质量（重要性85%）、价格敏感（重要性80%）

## SEO关键词表现

| 关键词 | 排名 | 预估流量 |
|--------|------|----------|
| 美妆护肤 | #2 | 12,500 |
| 平价彩妆 | #5 | 8,200 |
| 学生党好物 | #3 | 9,800 |
| 口红推荐 | #8 | 5,600 |

## 竞品对比（雷达图）

| 维度 | 我的品牌 | 竞品均值 |
|------|----------|----------|
| 内容质量 | 85 | 70 |
| SEO表现 | 72 | 85 |
| 价格竞争力 | 78 | 65 |
| 品牌声量 | 65 | 80 |
| 用户互动 | 90 | 75 |

## 行动计划

| 阶段 | SEO | 社媒 | 运营 |
|------|-----|------|------|
| 第1-2周 | 关键词优化，提升TOP10占比 | 日更1条短视频 | 搭建私域流量池 |
| 第3-4周 | 竞品关键词狙击 | 达人合作3-5位 | 会员体系上线 |
| 第5-8周 | 品牌词霸屏策略 | 直播带货测试 | 复购激励计划 |
`;

    const added = addEntry({
      title: `${formData.brandName} 品牌健康度报告`,
      content: md,
      category: 'brand',
      tags: ['市场洞察', '品牌分析', formData.brandName],
    });
    if (added) setDrawerOpen(true);
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
          {history.map((entry) => {
            const st = statusConfig[entry.status || 'completed'];
            return (
            <button
              key={entry.id}
              onClick={() => loadHistory(entry)}
              className="w-full text-left p-3 rounded-xl border border-border/30 hover:border-border/60 hover:bg-muted/20 transition-all group relative"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{entry.brandName} 洞察报告</span>
                <div className="flex items-center gap-1.5">
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border', st.className)}>{st.label}</span>
                  <span className="text-[10px] text-muted-foreground">{entry.date}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground truncate">{entry.category}</p>
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {entry.competitors.map((c) => (
                  <span key={c} className="text-[10px] bg-muted/40 text-muted-foreground px-1.5 py-0.5 rounded-full">
                    {c}
                  </span>
                ))}
              </div>
              <button
                onClick={e => { e.stopPropagation(); deleteHistory(entry.id); }}
                className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-muted/40 transition-all"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground/50" />
              </button>
            </button>
            );
          })}
          {history.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">暂无历史记录</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );

  // Loading View - reuse CampaignPlanner style
  if (view === 'loading') {
    return (
      <>
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
          <div className="text-center space-y-4 animate-fade-in">
            <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto" />
            <h2 className="text-lg font-medium text-foreground">报告生成中</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              正在为 <span className="text-foreground font-medium">{formData.brandName}</span> 生成洞察报告...
            </p>
          </div>
        </div>
        <InsufficientCreditsDrawer open={creditsDrawerOpen} onOpenChange={setCreditsDrawerOpen} shortfall={creditsShortfall} />
      </>
    );
  }

  // Input Form View - Chat Composer
  if (view === 'input') {
    return (
      <>
        <div className="relative h-full">
          <div className="absolute top-4 right-4 z-20">
            {historySheet}
          </div>
          <MarketInsightComposer
            key={historyKey}
            onSubmit={handleGenerate}
            disabled={isLoading}
            initialData={historyLoadData ? { brandName: historyLoadData.brandName, category: historyLoadData.category, competitors: historyLoadData.competitors } : undefined}
          />
        </div>
        <InsufficientCreditsDrawer open={creditsDrawerOpen} onOpenChange={setCreditsDrawerOpen} shortfall={creditsShortfall} />
      </>
    );
  }

  // Report Dashboard View
  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <div className="min-h-full bg-muted/30 p-4 md:p-6">
        <div className="mx-auto max-w-7xl animate-fade-in">
          {/* Top Bar */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <Button variant="ghost" onClick={handleBack} className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              {isZh ? '返回重新生成' : 'Back to Regenerate'}
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleCopyToMemory}>
                <Database className="h-4 w-4" />
                {isZh ? '复制到记忆库' : 'Copy to Memory'}
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => {
                const printArea = document.getElementById('brand-health-report');
                if (!printArea) return;
                const win = window.open('', '_blank');
                if (!win) return;
                win.document.write(`<!DOCTYPE html><html><head><title>${formData.brandName} 品牌健康度报告</title><style>body{font-family:system-ui,-apple-system,sans-serif;padding:40px;color:#333}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}h1,h2,h3{margin-top:24px}.print-card{border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:16px}@media print{body{padding:20px}}</style></head><body>${printArea.innerHTML}</body></html>`);
                win.document.close();
                setTimeout(() => { win.print(); }, 500);
              }}>
                <FileText className="h-4 w-4" />
                {isZh ? '导出 PDF' : 'Export PDF'}
              </Button>
            </div>
          </div>

          {/* Report Title */}
          <div className="mb-6" id="brand-health-report">
            <h1 className="text-2xl font-bold text-foreground">
              {formData.brandName} {isZh ? '品牌健康度报告' : 'Brand Health Report'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isZh ? '生成时间：2024年1月16日' : 'Generated: January 16, 2024'}
            </p>
          </div>

          {/* Section 0: Summary & Risks */}
          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            {/* Executive Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-orange-500" />
                  {isZh ? '执行摘要' : 'Executive Summary'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                    <span>{isZh ? '行业热度持续上升，近8周增长46%，市场机会窗口期' : 'Industry heat rising continuously, 46% growth in 8 weeks'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                    <span>{isZh ? '内容更新频率落后竞品，建议提升发布节奏' : 'Content update frequency lags competitors, suggest increasing pace'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                    <span>{isZh ? 'SEO关键词覆盖存在差距，需重点优化TOP10关键词' : 'SEO keyword coverage gaps exist, focus on TOP10 optimization'}</span>
                  </li>
                </ul>
                <div className="grid grid-cols-3 gap-3 border-t pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-500">72</div>
                    <div className="text-xs text-muted-foreground">{isZh ? 'SEO可见度' : 'SEO Visibility'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">85</div>
                    <div className="text-xs text-muted-foreground">{isZh ? '社交互动' : 'Social Interaction'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">68</div>
                    <div className="text-xs text-muted-foreground">{isZh ? '竞争指数' : 'Competition Index'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Redlines */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  {isZh ? '风险红线' : 'Risk Redlines'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {riskData.map((risk, idx) => (
                    <div key={idx} className="rounded-lg border bg-muted/30 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium">{risk.item}</span>
                        <Badge variant={risk.level === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                          {risk.level === 'high' ? (isZh ? '高风险' : 'High') : (isZh ? '中风险' : 'Medium')}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{risk.signal}</p>
                      <p className="mt-1 text-xs text-orange-600">→ {risk.advice}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section 1: Market Insights */}
          <div className="mb-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              {isZh ? '市场洞察' : 'Market Insights'}
            </h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Industry Heat Trend */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{isZh ? '行业热度趋势' : 'Industry Heat Trend'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={industryTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="heat" 
                        stroke="#f97316" 
                        strokeWidth={2}
                        dot={{ fill: '#f97316', strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Competitor Radar */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{isZh ? '竞品雷达图' : 'Competitor Radar'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Radar name={isZh ? '我的品牌' : 'My Brand'} dataKey="myBrand" stroke="#f97316" fill="#f97316" fillOpacity={0.3} />
                      <Radar name={isZh ? '竞品均值' : 'Competitor Avg'} dataKey="competitor" stroke="#6b7280" fill="#6b7280" fillOpacity={0.2} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Section 2: Consumer Insights */}
          <div className="mb-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Users className="h-5 w-5 text-orange-500" />
              {isZh ? '消费者洞察' : 'Consumer Insights'}
            </h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Demographics */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{isZh ? '年龄分布' : 'Demographics'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={demographicsData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" tick={{ fontSize: 12 }} unit="%" />
                      <YAxis dataKey="age" type="category" tick={{ fontSize: 12 }} width={50} />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Bar dataKey="percentage" fill="#f97316" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Demand Matrix */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{isZh ? '需求矩阵' : 'Demand Matrix'}</CardTitle>
                  <CardDescription className="text-xs">
                    {isZh ? 'X轴: 满足度 | Y轴: 重要性' : 'X: Satisfaction | Y: Importance'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" dataKey="x" domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <YAxis type="number" dataKey="y" domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <ZAxis type="number" dataKey="z" range={[60, 200]} />
                      <Tooltip 
                        formatter={(value, name) => [value, name === 'x' ? (isZh ? '满足度' : 'Satisfaction') : (isZh ? '重要性' : 'Importance')]}
                        labelFormatter={(_, payload) => payload?.[0]?.payload?.name || ''}
                      />
                      <Scatter data={demandMatrixData}>
                        {demandMatrixData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.quadrant === 1 ? '#22c55e' : entry.quadrant === 2 ? '#f97316' : entry.quadrant === 3 ? '#6b7280' : '#3b82f6'} 
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Section 3: Brand Health */}
          <div className="mb-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Target className="h-5 w-5 text-orange-500" />
              {isZh ? '品牌健康' : 'Brand Health'}
            </h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* SEO Dashboard */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{isZh ? 'SEO 仪表盘' : 'SEO Dashboard'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-orange-50 p-3 text-center dark:bg-orange-950/30">
                      <div className="text-xl font-bold text-orange-600">12</div>
                      <div className="text-xs text-muted-foreground">{isZh ? 'TOP 1-3 关键词' : 'TOP 1-3 Keywords'}</div>
                    </div>
                    <div className="rounded-lg bg-blue-50 p-3 text-center dark:bg-blue-950/30">
                      <div className="text-xl font-bold text-blue-600">36.1K</div>
                      <div className="text-xs text-muted-foreground">{isZh ? '流量价值' : 'Traffic Value'}</div>
                    </div>
                    <div className="rounded-lg bg-green-50 p-3 text-center dark:bg-green-950/30">
                      <div className="text-xl font-bold text-green-600">+18%</div>
                      <div className="text-xs text-muted-foreground">{isZh ? '周环比增长' : 'WoW Growth'}</div>
                    </div>
                    <div className="rounded-lg bg-purple-50 p-3 text-center dark:bg-purple-950/30">
                      <div className="text-xl font-bold text-purple-600">89</div>
                      <div className="text-xs text-muted-foreground">{isZh ? '关键词总数' : 'Total Keywords'}</div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={seoKeywordsData}>
                      <XAxis dataKey="keyword" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="traffic" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Content Audit */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{isZh ? '内容审计' : 'Content Audit'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {contentAuditData.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-lg border bg-muted/20 p-2.5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium">{item.title}</span>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {item.type}
                            </Badge>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {item.interactions.toLocaleString()} {isZh ? '互动' : 'interactions'}
                          </div>
                        </div>
                        <Badge 
                          variant={item.risk === 'high' ? 'destructive' : item.risk === 'medium' ? 'secondary' : 'outline'}
                          className="ml-2 shrink-0 text-xs"
                        >
                          {item.risk === 'high' ? (isZh ? '高风险' : 'High') : item.risk === 'medium' ? (isZh ? '中风险' : 'Med') : (isZh ? '低风险' : 'Low')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Section 4: Strategy */}
          <div className="mb-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Shield className="h-5 w-5 text-orange-500" />
              {isZh ? '策略建议' : 'Strategy Recommendations'}
            </h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* SWOT Analysis */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{isZh ? 'SWOT 分析' : 'SWOT Analysis'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-green-50 p-3 dark:bg-green-950/30">
                      <div className="mb-2 text-sm font-semibold text-green-700 dark:text-green-400">
                        {isZh ? '优势 Strengths' : 'Strengths'}
                      </div>
                      <ul className="space-y-1 text-xs text-green-600 dark:text-green-300">
                        <li>• {isZh ? '用户互动率高' : 'High user engagement'}</li>
                        <li>• {isZh ? '内容质量优秀' : 'Excellent content quality'}</li>
                      </ul>
                    </div>
                    <div className="rounded-lg bg-red-50 p-3 dark:bg-red-950/30">
                      <div className="mb-2 text-sm font-semibold text-red-700 dark:text-red-400">
                        {isZh ? '劣势 Weaknesses' : 'Weaknesses'}
                      </div>
                      <ul className="space-y-1 text-xs text-red-600 dark:text-red-300">
                        <li>• {isZh ? 'SEO覆盖不足' : 'Insufficient SEO coverage'}</li>
                        <li>• {isZh ? '更新频率偏低' : 'Low update frequency'}</li>
                      </ul>
                    </div>
                    <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-950/30">
                      <div className="mb-2 text-sm font-semibold text-orange-700 dark:text-orange-400">
                        {isZh ? '机会 Opportunities' : 'Opportunities'}
                      </div>
                      <ul className="space-y-1 text-xs text-orange-600 dark:text-orange-300">
                        <li>• {isZh ? '行业热度上升' : 'Rising industry heat'}</li>
                        <li>• {isZh ? '年轻用户增长' : 'Young user growth'}</li>
                      </ul>
                    </div>
                    <div className="rounded-lg bg-yellow-50 p-3 dark:bg-yellow-950/30">
                      <div className="mb-2 text-sm font-semibold text-yellow-700 dark:text-yellow-400">
                        {isZh ? '威胁 Threats' : 'Threats'}
                      </div>
                      <ul className="space-y-1 text-xs text-yellow-600 dark:text-yellow-300">
                        <li>• {isZh ? '竞品SEO强势' : 'Strong competitor SEO'}</li>
                        <li>• {isZh ? '市场竞争加剧' : 'Intensifying competition'}</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Plan */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{isZh ? '行动计划' : 'Action Plan'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b">
                          <th className="pb-2 text-left font-medium text-muted-foreground">{isZh ? '周期' : 'Period'}</th>
                          <th className="pb-2 text-left font-medium text-muted-foreground">SEO</th>
                          <th className="pb-2 text-left font-medium text-muted-foreground">{isZh ? '社交' : 'Social'}</th>
                          <th className="pb-2 text-left font-medium text-muted-foreground">{isZh ? '运营' : 'Ops'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {actionPlanData.map((row, idx) => (
                          <tr key={idx} className="border-b last:border-0">
                            <td className="py-2 font-medium text-orange-600">{row.period}</td>
                            <td className="py-2 text-muted-foreground">{row.seo}</td>
                            <td className="py-2 text-muted-foreground">{row.social}</td>
                            <td className="py-2 text-muted-foreground">{row.operation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer: Data Sources */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{isZh ? '数据来源与可追溯性' : 'Data Sources & Traceability'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  <span>TikTok Analytics API</span>
                </div>
                <div className="flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  <span>Google Search Console</span>
                </div>
                <div className="flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  <span>SEMrush Data Export</span>
                </div>
                <div className="flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  <span>Internal CRM Data</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground/70">
                {isZh ? '数据更新时间：2024年1月16日 08:00 UTC | 数据保留期：90天' : 'Data updated: Jan 16, 2024 08:00 UTC | Retention: 90 days'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  );
}