import { useCallback, useRef } from 'react';
import { ArrowLeft, Copy, Download, RefreshCw, Eye, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useMemory } from '@/contexts/MemoryContext';

interface ExtractedInfo {
  brandName: string;
  category: string;
  sellingPoints: string[];
  targetMarket: string;
  analysisTarget: string;
  websiteType: string;
  businessDirection: string;
}

interface Props {
  extractedInfo: ExtractedInfo;
  onBack: () => void;
  onRestart: () => void;
}

function generateReportHTML(info: ExtractedInfo): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${info.brandName} - 品牌洞察报告</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; background: #fff; line-height: 1.6; }
    .container { max-width: 800px; margin: 0 auto; padding: 48px 32px; }
    h1 { font-size: 28px; font-weight: 600; margin-bottom: 8px; }
    h2 { font-size: 18px; font-weight: 600; margin: 32px 0 16px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
    h3 { font-size: 15px; font-weight: 600; margin: 20px 0 8px; }
    p { font-size: 14px; color: #444; margin-bottom: 12px; }
    .subtitle { font-size: 14px; color: #888; margin-bottom: 32px; }
    .meta { display: flex; gap: 24px; margin-bottom: 32px; flex-wrap: wrap; }
    .meta-item { font-size: 13px; color: #666; }
    .meta-item strong { color: #1a1a1a; }
    .tag { display: inline-block; padding: 2px 10px; background: #f5f5f5; border-radius: 4px; font-size: 12px; margin-right: 6px; margin-bottom: 4px; }
    .card { border: 1px solid #eee; border-radius: 8px; padding: 20px; margin-bottom: 16px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .metric { text-align: center; padding: 16px; background: #fafafa; border-radius: 8px; }
    .metric-value { font-size: 24px; font-weight: 700; color: #1a1a1a; }
    .metric-label { font-size: 12px; color: #888; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
    th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #f0f0f0; }
    th { font-weight: 600; color: #666; font-size: 12px; text-transform: uppercase; }
    .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #eee; font-size: 12px; color: #aaa; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${info.brandName} 品牌洞察报告</h1>
    <p class="subtitle">基于 ${info.analysisTarget} 的自动化分析 · ${new Date().toLocaleDateString('zh-CN')}</p>

    <div class="meta">
      <div class="meta-item"><strong>品类：</strong>${info.category}</div>
      <div class="meta-item"><strong>目标市场：</strong>${info.targetMarket}</div>
      <div class="meta-item"><strong>网站类型：</strong>${info.websiteType}</div>
      <div class="meta-item"><strong>业务方向：</strong>${info.businessDirection}</div>
    </div>

    <h2>一、执行摘要</h2>
    <div class="card">
      <p>${info.brandName} 是一家定位于 ${info.category} 领域的品牌，主要面向 ${info.targetMarket} 市场。通过对其${info.websiteType}的深度解析，我们识别出以下核心竞争力与市场机会。</p>
      <div class="grid" style="margin-top: 16px;">
        <div class="metric"><div class="metric-value">78</div><div class="metric-label">品牌健康指数</div></div>
        <div class="metric"><div class="metric-value">62%</div><div class="metric-label">市场认知度</div></div>
        <div class="metric"><div class="metric-value">4.2</div><div class="metric-label">消费者满意度</div></div>
        <div class="metric"><div class="metric-value">A-</div><div class="metric-label">SEO 评级</div></div>
      </div>
    </div>

    <h2>二、核心卖点分析</h2>
    <p>系统识别到以下核心卖点：</p>
    <div style="margin: 8px 0 16px;">${info.sellingPoints.map(sp => `<span class="tag">${sp}</span>`).join('')}</div>
    <div class="card">
      <h3>卖点竞争力评估</h3>
      <table>
        <thead><tr><th>卖点</th><th>市场差异度</th><th>消费者感知度</th><th>建议优先级</th></tr></thead>
        <tbody>
          ${info.sellingPoints.map((sp, i) => `<tr><td>${sp}</td><td>${['高', '中', '高'][i % 3]}</td><td>${['强', '中', '弱'][i % 3]}</td><td>${['P0', 'P1', 'P0'][i % 3]}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>

    <h2>三、市场竞争格局</h2>
    <div class="card">
      <p>${info.category} 市场正处于快速增长阶段，主要竞争者集中在中高端价位段。${info.brandName} 在 ${info.sellingPoints[0] || '产品创新'} 方面具有明显优势，但在品牌知名度方面仍有提升空间。</p>
      <h3>竞品对比矩阵</h3>
      <table>
        <thead><tr><th>维度</th><th>${info.brandName}</th><th>竞品 A</th><th>竞品 B</th></tr></thead>
        <tbody>
          <tr><td>产品力</td><td>★★★★☆</td><td>★★★★★</td><td>★★★☆☆</td></tr>
          <tr><td>品牌力</td><td>★★★☆☆</td><td>★★★★★</td><td>★★★★☆</td></tr>
          <tr><td>渠道力</td><td>★★★★☆</td><td>★★★☆☆</td><td>★★★★☆</td></tr>
          <tr><td>价格竞争力</td><td>★★★★★</td><td>★★★☆☆</td><td>★★★★☆</td></tr>
        </tbody>
      </table>
    </div>

    <h2>四、消费者洞察</h2>
    <div class="card">
      <p>目标消费者画像：${info.targetMarket}，偏好线上购物，关注产品品质与口碑评价。核心购买动机集中在 ${info.sellingPoints.slice(0, 2).join('、')} 等方面。</p>
    </div>

    <h2>五、策略建议</h2>
    <div class="card">
      <h3>短期行动计划（1-3个月）</h3>
      <p>1. 强化 ${info.sellingPoints[0] || '核心卖点'} 的内容营销，提升消费者认知<br/>
      2. 优化${info.websiteType}的 SEO 结构与用户体验<br/>
      3. 建立社交媒体矩阵，重点布局小红书与抖音</p>
      <h3>中期规划（3-6个月）</h3>
      <p>1. 拓展 ${info.businessDirection} 渠道覆盖<br/>
      2. 启动 KOL/KOC 合作计划<br/>
      3. 建立消费者数据中台</p>
    </div>

    <div class="footer">
      本报告由洞察工作台自动生成 · ${new Date().toLocaleDateString('zh-CN')} · 仅供参考
    </div>
  </div>
</body>
</html>`;
}

export function InsightWorkbenchReport({ extractedInfo, onBack, onRestart }: Props) {
  const reportRef = useRef<HTMLDivElement>(null);
  const { addEntry, setDrawerOpen } = useMemory();
  const reportHTML = generateReportHTML(extractedInfo);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(reportHTML).then(() => {
      toast.success('HTML 报告已复制到剪贴板');
    });
  }, [reportHTML]);

  const handleExport = useCallback(() => {
    const blob = new Blob([reportHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${extractedInfo.brandName}-洞察报告.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('报告已导出');
  }, [reportHTML, extractedInfo.brandName]);

  const handlePreview = useCallback(() => {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(reportHTML);
      win.document.close();
    }
  }, [reportHTML]);

  const handleCopyToMemory = useCallback(() => {
    addEntry({
      title: `${extractedInfo.brandName} 洞察报告`,
      content: `品牌：${extractedInfo.brandName}\n品类：${extractedInfo.category}\n目标市场：${extractedInfo.targetMarket}\n卖点：${extractedInfo.sellingPoints.join('、')}\n业务方向：${extractedInfo.businessDirection}`,
      category: '洞察报告',
      tags: [extractedInfo.category, extractedInfo.businessDirection],
    });
    setDrawerOpen(true);
    toast.success('已保存到记忆库');
  }, [extractedInfo, addEntry, setDrawerOpen]);

  return (
    <div className="h-full flex flex-col">
      {/* Action bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            返回修改
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs h-8 rounded-lg" onClick={handlePreview}>
            <Eye className="w-3.5 h-3.5 mr-1" />
            预览
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-8 rounded-lg" onClick={handleCopy}>
            <Copy className="w-3.5 h-3.5 mr-1" />
            复制 HTML
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-8 rounded-lg" onClick={handleExport}>
            <Download className="w-3.5 h-3.5 mr-1" />
            导出
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-8 rounded-lg" onClick={handleCopyToMemory}>
            <FileText className="w-3.5 h-3.5 mr-1" />
            存入记忆库
          </Button>
          <Button variant="ghost" size="sm" className="text-xs h-8 rounded-lg" onClick={onRestart}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            重新生成
          </Button>
        </div>
      </div>

      {/* Report preview */}
      <div className="flex-1 overflow-y-auto bg-muted/30 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-border/30 shadow-md overflow-hidden">
            <div ref={reportRef}>
              <iframe
                srcDoc={reportHTML}
                title="报告预览"
                className="w-full border-0"
                style={{ minHeight: '800px', height: '100%' }}
                sandbox="allow-same-origin"
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
