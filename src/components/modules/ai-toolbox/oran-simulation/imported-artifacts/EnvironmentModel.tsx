import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center py-1.5 border-b border-border/20 last:border-0">
    <span className="text-xs text-muted-foreground/60 font-mono">{label}</span>
    <span className="text-xs text-foreground/70">{value}</span>
  </div>
);

const EnvironmentModel = () => (
  <div className="space-y-4">
    <Tabs defaultValue="platform" className="w-full">
      <TabsList className="bg-muted/20 border border-border/20 w-full justify-start">
        <TabsTrigger value="platform" className="text-xs">平台环境</TabsTrigger>
        <TabsTrigger value="time" className="text-xs">时间环境</TabsTrigger>
        <TabsTrigger value="decay" className="text-xs">内容衰减</TabsTrigger>
        <TabsTrigger value="external" className="text-xs">外部扰动</TabsTrigger>
      </TabsList>

      <TabsContent value="platform">
        <div className="space-y-3">
          {[
            { name: '抖音', mode: '算法推荐 + 社交裂变', weight: '0.65', amp: '2.4x', hours: '12:00-14:00, 19:00-23:00' },
            { name: '小红书', mode: '搜索 + 信息流', weight: '0.35', amp: '1.8x', hours: '10:00-12:00, 20:00-22:00' },
          ].map((p, i) => (
            <div key={i} className="rounded-xl border border-border/20 p-4 bg-card/90">
              <h4 className="text-sm font-normal text-accent/80 mb-3">{p.name}</h4>
              <Field label="流量模式" value={p.mode} />
              <Field label="baseline_exposure_weight" value={p.weight} />
              <Field label="interaction_amplification_factor" value={p.amp} />
              <Field label="active_hours" value={p.hours} />
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="time">
        <div className="rounded-xl border border-border/20 p-4 bg-card/90">
          <Field label="time_slice" value="1 天 / 轮" />
          <Field label="total_rounds" value="60" />
          <Field label="warmup_period" value="3 天" />
          <Field label="evaluation_window" value="Day 7 / 14 / 30 / 60" />
        </div>
      </TabsContent>

      <TabsContent value="decay">
        <div className="rounded-xl border border-border/20 p-4 bg-card/90">
          <Field label="content_decay_baseline" value="0.85 / 天" />
          <Field label="saturation_threshold" value="曝光 > 50,000 触发加速衰减" />
          <Field label="viral_boost_factor" value="互动率 > 5% 时衰减减缓 30%" />
          <Field label="refresh_trigger" value="衰减至 baseline 20% 时建议刷新" />
        </div>
      </TabsContent>

      <TabsContent value="external">
        <div className="rounded-xl border border-border/20 p-4 bg-card/90">
          <Field label="competitor_noise_level" value="中等 (0.3)" />
          <Field label="competitor_events" value="清扬 Day 15 新品发布模拟" />
          <Field label="risk_shock_enabled" value="是" />
          <Field label="risk_keywords" value="化学成分、头皮过敏、致癌" />
          <Field label="risk_impact_multiplier" value="0.6x 曝光压制" />
        </div>
      </TabsContent>
    </Tabs>
  </div>
);

export default EnvironmentModel;
