import { Target } from "lucide-react";

const fields = [
  { label: '本次模拟问题', value: '哪种去屑卖点方向在抖音/小红书的传播效率与转化更优？' },
  { label: '主方向', value: '长期安全有效 — 强调持续去屑能力与温和配方' },
  { label: '对比方向 A', value: '高压场景头皮稳定在线 — 运动、加班、换季场景切入' },
  { label: '重点平台', value: '抖音（短视频种草）、小红书（图文测评）' },
  { label: '重点人群', value: '18-30 岁有去屑需求的城市白领和大学生' },
  { label: '目标行为', value: '观看 → 互动 → 搜索 → 加购' },
  { label: '周期范围', value: '60 天（W1-W8+）' },
  { label: '关注指标', value: '曝光量、互动率、搜索提升率、内容生命周期、方向对比差异' },
];

const SimScope = () => (
  <div className="space-y-4">
    <div className="rounded-xl border border-border/20 p-5 bg-card/90">
      <h3 className="text-sm font-normal text-foreground/80 mb-4 flex items-center gap-2">
        <Target className="w-3.5 h-3.5 text-accent/80" /> 模拟范围摘要
      </h3>
      <div className="space-y-3">
        {fields.map((f, i) => (
          <div key={i} className="rounded-xl bg-muted/20 px-4 py-3">
            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">{f.label}</p>
            <p className="text-sm text-foreground/70 leading-relaxed">{f.value}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default SimScope;
