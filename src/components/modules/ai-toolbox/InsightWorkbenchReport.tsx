import { useCallback, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, Copy, Download, Eye, FileText, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useMemory } from '@/contexts/MemoryContext';
import { cn } from '@/lib/utils';

interface ExtractedInfo {
  brandName: string;
  category: string;
  sellingPoints: string[];
  targetMarket: string;
  analysisTarget: string;
  websiteType: string;
  businessDirection: string;
  marketingGoal: string;
  targetAudience: string;
  budgetLevel: string;
  primaryChannels: string;
}

export type InsightReportType = 'insight' | 'planning';

interface Props {
  extractedInfo: ExtractedInfo;
  reportType?: InsightReportType;
  onBack: () => void;
  onRestart: () => void;
  embedded?: boolean;
  showEmbeddedToolbar?: boolean;
  showEmbeddedBackButton?: boolean;
  embeddedToolbarPrefix?: ReactNode;
}

const REPORT_META = {
  insight: {
    label: '洞察报告',
    summaryTitle: '执行摘要',
    summaryText: '围绕品牌现状、竞品格局与机会方向，输出一份可直接用于决策讨论的洞察结论。',
    metrics: [
      { value: '78', label: '品牌势能' },
      { value: '62%', label: '市场认知度' },
      { value: '4.2', label: '用户兴趣值' },
      { value: 'A-', label: '综合评级' },
    ],
    sectionTwoTitle: '核心卖点拆解',
    sectionTwoText: '系统识别到以下关键卖点，可作为后续传播与内容生产的核心抓手。',
    sectionThreeTitle: '竞争格局判断',
    sectionThreeText: '结合品类趋势与竞品线索，当前市场仍存在可被放大的差异化机会。',
    sectionFourTitle: '用户机会洞察',
    sectionFourText: '目标用户更关注真实功效、专业表达与短链路转化，适合继续承接到策划与内容生产阶段。',
    sectionFiveTitle: '下一步建议',
    sectionFiveText:
      '建议将当前洞察沉淀为策划方案，进一步明确传播主题、渠道优先级、内容节奏与爆款切题方向。',
    memoryCategory: '洞察报告',
  },
  planning: {
    label: '策划方案',
    summaryTitle: '方案摘要',
    summaryText: '基于已识别的洞察结论，进一步整理可执行的传播策略、阶段目标与内容方向。',
    metrics: [
      { value: '8周', label: '建议周期' },
      { value: '3段', label: '推进阶段' },
      { value: '4+', label: '内容方向' },
      { value: 'P0', label: '优先级' },
    ],
    sectionTwoTitle: '核心主题与卖点',
    sectionTwoText: '以下卖点可被收敛为主传播主题，并映射到不同平台内容表达。',
    sectionThreeTitle: '执行路径建议',
    sectionThreeText: '建议按预热、爆发、沉淀三段推进，并在节点上做差异化内容编排。',
    sectionFourTitle: '内容与渠道方向',
    sectionFourText: '优先围绕高感知卖点展开短视频、种草笔记与达人协同，形成稳定内容供给。',
    sectionFiveTitle: '交付建议',
    sectionFiveText:
      '可继续衔接 ORANGEN 做爆款内容生成，将本方案拆解成具体选题、脚本与素材生产任务。',
    memoryCategory: '策划方案',
  },
} as const;

function escapeHtml(value: string) {
  return value
    .split('&').join('&amp;')
    .split('<').join('&lt;')
    .split('>').join('&gt;')
    .split('"').join('&quot;')
    .split("'").join('&#39;');
}

// eslint-disable-next-line react-refresh/only-export-components
export function buildMemoryMarkdownFromHtml(title: string, html: string) {
  return `# ${title}\n\n\`\`\`html\n${html}\n\`\`\``;
}

// eslint-disable-next-line react-refresh/only-export-components
export function generateReportHTML(info: ExtractedInfo, reportType: InsightReportType): string {
  const meta = REPORT_META[reportType];
  const safeBrandName = escapeHtml(info.brandName || '未命名品牌');
  const safeCategory = escapeHtml(info.category || '待补充品类');
  const safeTargetMarket = escapeHtml(info.targetMarket || '待确认目标市场');
  const safeWebsiteType = escapeHtml(info.websiteType || '结构化品牌输入');
  const safeBusinessDirection = escapeHtml(info.businessDirection || '待补充方向');
  const safeAnalysisTarget = escapeHtml(info.analysisTarget || '品牌上下文');
  const safeMarketingGoal = escapeHtml(info.marketingGoal || '待确认营销目标');
  const safeTargetAudience = escapeHtml(info.targetAudience || '待确认目标人群');
  const safeBudgetLevel = escapeHtml(info.budgetLevel || '待确认预算量级');
  const safePrimaryChannels = escapeHtml(info.primaryChannels || '待确认主攻渠道');
  const safeSellingPoints = info.sellingPoints.length > 0 ? info.sellingPoints : ['待补充核心卖点'];
  const safeTags = safeSellingPoints
    .map((item) => `<span class="tag">${escapeHtml(item)}</span>`)
    .join('');
  const tableRows = safeSellingPoints
    .map(
      (item, index) => `
        <tr>
          <td>${escapeHtml(item)}</td>
          <td>${['高', '中', '高'][index % 3]}</td>
          <td>${['强', '中', '强'][index % 3]}</td>
          <td>${['P0', 'P1', 'P0'][index % 3]}</td>
        </tr>
      `
    )
    .join('');
  const metricCards = meta.metrics
    .map(
      (item) => `
        <div class="metric">
          <div class="metric-value">${item.value}</div>
          <div class="metric-label">${item.label}</div>
        </div>
      `
    )
    .join('');
  const metaItemsHtml =
    reportType === 'planning'
      ? `
      <div class="meta-item"><strong>营销目标</strong>${safeMarketingGoal}</div>
      <div class="meta-item"><strong>目标人群</strong>${safeTargetAudience}</div>
      <div class="meta-item"><strong>预算量级</strong>${safeBudgetLevel}</div>
      <div class="meta-item"><strong>主攻渠道</strong>${safePrimaryChannels}</div>
    `
      : `
      <div class="meta-item"><strong>品类</strong>${safeCategory}</div>
      <div class="meta-item"><strong>目标市场</strong>${safeTargetMarket}</div>
      <div class="meta-item"><strong>输入类型</strong>${safeWebsiteType}</div>
      <div class="meta-item"><strong>业务方向</strong>${safeBusinessDirection}</div>
    `;
  const sectionFourDetail =
    reportType === 'planning'
      ? `当前策划建议以 <strong>${safeTargetAudience}</strong> 为主目标人群，预算建议为 <strong>${safeBudgetLevel}</strong>，优先布局 <strong>${safePrimaryChannels}</strong>。`
      : `目标市场暂以 <strong>${safeTargetMarket}</strong> 作为核心受众范围，执行时可结合渠道数据再细分人群。`;
  const sectionFiveDetail =
    reportType === 'planning'
      ? '建议下一步继续拆解为选题、脚本、达人协作与具体素材生产任务。'
      : '建议输出时同步保留品牌、品类、卖点与业务方向，方便后续进入 ORAN 系列工作流继续处理。';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeBrandName} - ${meta.label}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    html::-webkit-scrollbar {
      display: none;
      width: 0;
      height: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f6f4f1;
      color: #1f1f1f;
      line-height: 1.65;
      padding: 32px;
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    body::-webkit-scrollbar {
      display: none;
      width: 0;
      height: 0;
    }
    .container {
      max-width: 920px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 18px 60px rgba(15, 23, 42, 0.08);
    }
    .hero {
      padding: 40px 40px 28px;
      background: linear-gradient(135deg, #fff8f1 0%, #ffffff 58%, #f5f5f4 100%);
      border-bottom: 1px solid #ece7df;
    }
    .eyebrow {
      display: inline-flex;
      padding: 6px 12px;
      border-radius: 999px;
      background: rgba(249, 115, 22, 0.1);
      color: #c2410c;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.08em;
    }
    h1 {
      margin-top: 18px;
      font-size: 32px;
      line-height: 1.2;
      letter-spacing: -0.03em;
    }
    .subtitle {
      margin-top: 10px;
      color: #6b7280;
      font-size: 14px;
    }
    .meta {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
      padding: 28px 40px 0;
    }
    .meta-item {
      padding: 16px 18px;
      border-radius: 18px;
      background: #faf8f6;
      border: 1px solid #efe9e1;
      font-size: 13px;
      color: #6b7280;
    }
    .meta-item strong {
      display: block;
      color: #111827;
      font-size: 12px;
      margin-bottom: 4px;
    }
    .content {
      padding: 8px 40px 40px;
    }
    h2 {
      margin-top: 28px;
      margin-bottom: 14px;
      font-size: 18px;
      letter-spacing: -0.02em;
    }
    h3 {
      margin-top: 18px;
      margin-bottom: 10px;
      font-size: 15px;
    }
    p {
      font-size: 14px;
      color: #4b5563;
      margin-bottom: 12px;
    }
    .card {
      padding: 22px;
      border-radius: 20px;
      border: 1px solid #eee7df;
      background: #fffdfa;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
      margin-top: 18px;
    }
    .metric {
      border-radius: 18px;
      padding: 18px;
      background: #ffffff;
      border: 1px solid #f0e7dc;
      text-align: center;
    }
    .metric-value {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
    }
    .metric-label {
      margin-top: 6px;
      font-size: 12px;
      color: #6b7280;
    }
    .tag {
      display: inline-block;
      margin-right: 8px;
      margin-bottom: 8px;
      padding: 6px 10px;
      border-radius: 999px;
      background: #f5f5f4;
      color: #374151;
      font-size: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      font-size: 13px;
    }
    th, td {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid #f1ece5;
    }
    th {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .footer {
      margin-top: 36px;
      padding-top: 20px;
      border-top: 1px solid #ece7df;
      color: #9ca3af;
      font-size: 12px;
      text-align: center;
    }
    @media (max-width: 720px) {
      body { padding: 16px; }
      .hero, .content, .meta { padding-left: 20px; padding-right: 20px; }
      .meta, .grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="hero">
      <div class="eyebrow">${meta.label}</div>
      <h1>${safeBrandName}${meta.label}</h1>
      <p class="subtitle">基于 ${safeAnalysisTarget} 的自动生成结果 · ${new Date().toLocaleDateString('zh-CN')}</p>
    </div>

    <div class="meta">
      ${metaItemsHtml}
    </div>

    <div class="content">
      <h2>一、${meta.summaryTitle}</h2>
      <div class="card">
        <p>${safeBrandName} 当前处于 ${safeCategory} 场景下的重点分析路径中。${meta.summaryText}</p>
        <div class="grid">${metricCards}</div>
      </div>

      <h2>二、${meta.sectionTwoTitle}</h2>
      <p>${meta.sectionTwoText}</p>
      <div style="margin: 8px 0 12px;">${safeTags}</div>
      <div class="card">
        <h3>优先级建议</h3>
        <table>
          <thead>
            <tr>
              <th>要点</th>
              <th>市场差异</th>
              <th>用户感知</th>
              <th>优先级</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>

      <h2>三、${meta.sectionThreeTitle}</h2>
      <div class="card">
        <p>${meta.sectionThreeText}</p>
        <p>建议优先围绕 <strong>${escapeHtml(safeSellingPoints[0])}</strong> 做主表达，再用竞品线索补足差异化与说服力。</p>
      </div>

      <h2>四、${meta.sectionFourTitle}</h2>
      <div class="card">
        <p>${meta.sectionFourText}</p>
        <p>${sectionFourDetail}</p>
      </div>

      <h2>五、${meta.sectionFiveTitle}</h2>
      <div class="card">
        <p>${meta.sectionFiveText}</p>
        <p>${sectionFiveDetail}</p>
      </div>

      <div class="footer">
        本${meta.label}由 ORAN INSIGHT 自动生成 · ${new Date().toLocaleDateString('zh-CN')} · 仅供内部讨论参考
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function InsightWorkbenchReport({
  extractedInfo,
  reportType = 'insight',
  onBack,
  onRestart,
  embedded = false,
  showEmbeddedToolbar = true,
  showEmbeddedBackButton = true,
  embeddedToolbarPrefix,
}: Props) {
  const reportRef = useRef<HTMLDivElement>(null);
  const { addEntry, setDrawerOpen } = useMemory();
  const meta = REPORT_META[reportType];
  const reportHTML = useMemo(() => generateReportHTML(extractedInfo, reportType), [extractedInfo, reportType]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(reportHTML).then(() => {
      toast.success(`HTML ${meta.label}已复制到剪贴板`);
    });
  }, [meta.label, reportHTML]);

  const handleExport = useCallback(() => {
    const blob = new Blob([reportHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${extractedInfo.brandName || '未命名品牌'}-${meta.label}.html`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(`${meta.label}已导出`);
  }, [extractedInfo.brandName, meta.label, reportHTML]);

  const handlePreview = useCallback(() => {
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(reportHTML);
      previewWindow.document.close();
    }
  }, [reportHTML]);

  const handleCopyToMemory = useCallback(() => {
    const memoryLines =
      reportType === 'planning'
        ? [
            `品牌：${extractedInfo.brandName}`,
            `品类：${extractedInfo.category}`,
            `营销目标：${extractedInfo.marketingGoal}`,
            `目标人群：${extractedInfo.targetAudience}`,
            `核心卖点：${extractedInfo.sellingPoints.join('、')}`,
            `预算量级：${extractedInfo.budgetLevel}`,
            `主攻渠道：${extractedInfo.primaryChannels}`,
          ]
        : [
            `品牌：${extractedInfo.brandName}`,
            `品类：${extractedInfo.category}`,
            `目标市场：${extractedInfo.targetMarket}`,
            `卖点：${extractedInfo.sellingPoints.join('、')}`,
            `业务方向：${extractedInfo.businessDirection}`,
          ];

    addEntry({
      title: `${extractedInfo.brandName || '未命名品牌'} ${meta.label}`,
      content: buildMemoryMarkdownFromHtml(
        `${extractedInfo.brandName || '未命名品牌'} ${meta.label}`,
        reportHTML,
      ),
      category: meta.memoryCategory,
      tags:
        reportType === 'planning'
          ? [extractedInfo.category, extractedInfo.primaryChannels, extractedInfo.budgetLevel].filter(Boolean)
          : [extractedInfo.category, extractedInfo.businessDirection].filter(Boolean),
    });
    setDrawerOpen(true);
    toast.success(`已保存到记忆库`);
  }, [addEntry, extractedInfo, meta.label, meta.memoryCategory, reportHTML, reportType, setDrawerOpen]);

  const actionBar = (
    <div
      className={cn(
        embedded ? 'flex flex-wrap items-center gap-2' : 'flex items-center gap-2',
        '[&>button:last-child]:hidden'
      )}
    >
      <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" onClick={handlePreview}>
        <Eye className="mr-1 h-3.5 w-3.5" />
        预览
      </Button>
      <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" onClick={handleCopy}>
        <Copy className="mr-1 h-3.5 w-3.5" />
        复制 HTML
      </Button>
      <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" onClick={handleExport}>
        <Download className="mr-1 h-3.5 w-3.5" />
        导出
      </Button>
      <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" onClick={handleCopyToMemory}>
        <FileText className="mr-1 h-3.5 w-3.5" />
        存入记忆库
      </Button>
      <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs" onClick={onRestart}>
        <RefreshCw className="mr-1 h-3.5 w-3.5" />
        重新生成
      </Button>
    </div>
  );

  if (embedded) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-4">
        {showEmbeddedToolbar && (
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {embeddedToolbarPrefix ? (
              embeddedToolbarPrefix
            ) : showEmbeddedBackButton ? (
              <button
                onClick={onBack}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                返回确认信息
              </button>
            ) : (
              <div />
            )}
            {actionBar}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-hidden">
          <div ref={reportRef} className="h-full">
            <iframe
              srcDoc={reportHTML}
              title={`${meta.label}预览`}
              className="h-full w-full border-0 bg-transparent"
              style={{ minHeight: '100%', height: '100%' }}
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border/30 px-6 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            返回修改
          </button>
        </div>
        <div className="flex items-center gap-2">{actionBar}</div>
      </div>

      <div className="flex-1 overflow-y-auto bg-muted/30 p-6">
        <div className="mx-auto max-w-4xl">
          <Card className="overflow-hidden border-border/30 shadow-md">
            <div ref={reportRef}>
              <iframe
                srcDoc={reportHTML}
                title={`${meta.label}预览`}
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
