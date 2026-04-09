import { ArrowRight } from "lucide-react";

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center py-1.5 border-b border-border/20 last:border-0">
    <span className="text-xs text-muted-foreground/60">{label}</span>
    <span className="text-xs text-foreground/70">{value}</span>
  </div>
);

const ActivationStrategy = () => (
  <div className="space-y-4">
    <div className="rounded-xl border border-border/20 p-5 bg-card/90">
      <h3 className="text-sm font-normal text-foreground/80 mb-4">初始激活策略</h3>
      <Field label="initial_content_direction" value="长期安全有效" />
      <Field label="seed_audience_clusters" value="高意向核心 + 情绪传播型" />
      <Field label="seed_size" value="800 人" />
      <Field label="initial_platform" value="抖音" />
      <Field label="first_wave_days" value="Day 1-7" />
      <Field label="expansion_trigger_threshold" value="互动率 > 3.5%" />
      <Field label="stop_loss_threshold" value="互动率 < 0.8% 连续 3 天" />
      <Field label="risk_watch_keywords" value="过敏、刺激、化学" />
    </div>

    <div className="rounded-xl border border-border/20 p-5 bg-card/90">
      <h3 className="text-sm font-normal text-foreground/80 mb-4">激活流程</h3>
      <div className="flex items-center justify-between">
        {[
          { phase: '种子投放', desc: 'Day 1-7', sub: '800 人 × 抖音' },
          { phase: '扩圈触发', desc: 'Day 8-14', sub: '互动率 > 3.5%' },
          { phase: '全量扩散', desc: 'Day 15-60', sub: '多平台 × 全人群' },
        ].map((p, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="rounded-xl bg-muted/20 border border-border/20 px-4 py-3 text-center min-w-[120px]">
              <p className="text-sm font-normal text-accent/80">{p.phase}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">{p.desc}</p>
              <p className="text-[10px] text-muted-foreground/60">{p.sub}</p>
            </div>
            {i < 2 && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default ActivationStrategy;
