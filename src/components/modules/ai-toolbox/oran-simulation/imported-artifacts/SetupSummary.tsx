import { FileText, CheckCircle2 } from "lucide-react";

const fields = [
  { label: '项目名称', value: '海飞丝 · 春季营销模拟预测' },
  { label: '品牌名称', value: '海飞丝 (Head & Shoulders)' },
  { label: '模拟周期', value: '60 天' },
  { label: '目标平台', value: '抖音、小红书' },
  { label: '主方向', value: '长期安全有效' },
  { label: '对比方向', value: '高压场景头皮稳定在线' },
  { label: '竞品扰动', value: '已启用' },
  { label: '风险反馈', value: '已启用' },
];

const files = [
  '海飞丝_品牌洞察报告_2024Q4.pdf',
  '海飞丝_春季营销策划方案.pdf',
];

const SetupSummary = () => (
  <div className="space-y-4">
    <div className="rounded-xl border border-border/20 p-5 bg-card/90">
      <h3 className="text-sm font-normal text-foreground/80 mb-4 flex items-center gap-2">
        <CheckCircle2 className="w-3.5 h-3.5 text-accent/80" /> Setup 摘要
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {fields.map((f, i) => (
          <div key={i} className="rounded-xl bg-muted/20 px-3 py-2.5">
            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">{f.label}</p>
            <p className="text-sm text-foreground/80 mt-1">{f.value}</p>
          </div>
        ))}
      </div>
    </div>
    <div className="rounded-xl border border-border/20 p-5 bg-card/90">
      <h3 className="text-sm font-normal text-foreground/80 mb-3">上传文件</h3>
      <div className="space-y-2">
        {files.map((f, i) => (
          <div key={i} className="flex items-center gap-2 rounded-xl bg-muted/20 px-3 py-2.5">
            <FileText className="w-3.5 h-3.5 text-accent/80" />
            <span className="text-sm text-foreground/70">{f}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default SetupSummary;
