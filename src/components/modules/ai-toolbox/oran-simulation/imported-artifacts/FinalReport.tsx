import { CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";

const SummaryCard = ({
  title,
  icon: Icon,
  children,
  accent,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  accent?: string;
}) => (
  <div className="rounded-xl border border-border/20 bg-card/90 p-5">
    <h4 className="mb-3 flex items-center gap-2 text-sm font-normal text-foreground/80">
      <Icon className={`h-3.5 w-3.5 ${accent || "text-accent/80"}`} />
      {title}
    </h4>
    {children}
  </div>
);

const DetailSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="space-y-2 rounded-xl border border-border/20 bg-card/90 p-4 text-xs">
    <h4 className="text-sm font-normal text-foreground/80">{title}</h4>
    {children}
  </section>
);

const FinalReport = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 gap-4">
      <SummaryCard title="策略决策" icon={CheckCircle2}>
        <div className="mb-3 flex items-center gap-3">
          <span className="rounded-xl border border-accent/25 bg-accent/8 px-3 py-1.5 text-lg font-light text-accent/80">
            GO
          </span>
          <div>
            <p className="text-sm text-foreground/80">
              推荐推进「长期安全有效」方向
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground/60">
              置信度 78% · 建议 Day 1 启动
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            ["推荐方向", "长期安全有效", true],
            ["保留方向", "高压场景（延后 20 天）", false],
            ["下一步", "确认 KOL 名单 -> 内容生产", false],
            ["决策置信度", "78%", true],
          ].map(([label, value, isAccent], i) => (
            <div key={i} className="rounded-xl bg-muted/20 px-3 py-2">
              <span className="text-muted-foreground/60">{label as string}</span>
              <p
                className={`mt-0.5 ${
                  isAccent ? "text-accent/80" : "text-foreground/70"
                }`}
              >
                {value as string}
              </p>
            </div>
          ))}
        </div>
      </SummaryCard>

      <SummaryCard title="方向性指标" icon={TrendingUp}>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            ["预测总互动量", "128,000 - 156,000"],
            ["互动提升幅度", "+35% ~ +52%"],
            ["峰值天", "Day 12"],
            ["衰减点", "Day 28"],
            ["置信度", "78%"],
          ].map(([label, value], i) => (
            <div key={i} className="rounded-xl bg-muted/20 px-3 py-2">
              <span className="text-muted-foreground/60">{label}</span>
              <p className="mt-0.5 text-foreground/70">{value}</p>
            </div>
          ))}
        </div>
      </SummaryCard>

      <SummaryCard
        title="关键解释"
        icon={AlertTriangle}
        accent="text-amber-500/70"
      >
        <div className="space-y-2 text-xs">
          {[
            {
              q: "哪些人群会响应？",
              a: "情绪传播型用户最先响应（Day 2-5），高意向核心紧随（Day 3-8）。",
            },
            {
              q: "哪些平台先放大？",
              a: "抖音起量快（Day 3 起），小红书长尾效应更强（Day 15+）。",
            },
            {
              q: "哪个方向起量快但早衰？",
              a: "「高压场景」Day 8 达峰，但 Day 20 后快速衰减。",
            },
            {
              q: "哪个方向续航更稳？",
              a: "「长期安全有效」峰值较晚（Day 12）但衰减缓慢，Day 45 仍有 35% 热度。",
            },
            {
              q: "主要风险点？",
              a: "化学成分争议可能在 Day 10-15 被竞品放大，需备好应对内容。",
            },
          ].map((item, i) => (
            <div key={i} className="rounded-xl bg-muted/20 px-3 py-2.5">
              <p className="mb-0.5 font-medium text-accent/80">{item.q}</p>
              <p className="leading-relaxed text-foreground/60">{item.a}</p>
            </div>
          ))}
        </div>
      </SummaryCard>
    </div>

    <div className="space-y-4">
      <DetailSection title="扩散路径">
        <p className="text-foreground/70">
          种子投放（Day 1-3）-&gt; 算法推荐放大（Day 4-7）-&gt; 社交裂变（Day
          8-14）-&gt; 搜索回流（Day 15-30）-&gt; 长尾复访（Day 31-60）
        </p>
        <p className="text-muted-foreground/60">
          抖音贡献 62% 早期曝光，小红书贡献 55% 后期搜索回流
        </p>
      </DetailSection>

      <DetailSection title="人群贡献">
        <p className="text-foreground/70">
          情绪传播型用户贡献 38% 的分享量，是扩散核心驱动力。
        </p>
        <p className="text-foreground/70">
          高意向核心人群贡献 45% 的深度互动（评论、收藏、加购）。
        </p>
        <p className="text-foreground/70">
          专业判断型用户虽少但评论质量高，对搜索 SEO 有间接提升。
        </p>
      </DetailSection>

      <DetailSection title="生命周期">
        <p className="text-foreground/70">
          方向 A 生命周期：起量 Day 5 -&gt; 峰值 Day 12 -&gt; 拐点 Day 28
          -&gt; Day 45 仍有 35% 热度
        </p>
        <p className="text-foreground/70">
          方向 B 生命周期：起量 Day 3 -&gt; 峰值 Day 8 -&gt; 拐点 Day 18
          -&gt; Day 30 热度低于 15%
        </p>
        <p className="text-accent/80">
          建议：方向 A 为主力，方向 B 作为 Day 20 后的接力内容
        </p>
      </DetailSection>

      <DetailSection title="方向建议">
        <p className="font-medium text-accent/80">
          推荐策略：先 A 后 B，交叉投放
        </p>
        <p className="text-foreground/70">
          Day 1-20：主推「长期安全有效」，预算占比 65%
        </p>
        <p className="text-foreground/70">
          Day 15-60：引入「高压场景」，预算占比 35%
        </p>
        <p className="text-foreground/70">
          预计组合效果比单一方向提升 22%
        </p>
      </DetailSection>

      <DetailSection title="风险提示">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0 text-amber-500/60" />
          <p className="text-foreground/70">
            Day 10-15 存在竞品利用「化学成分」话题进行负面引导的风险
          </p>
        </div>
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0 text-amber-500/60" />
          <p className="text-foreground/70">
            小红书平台对「功效宣称」审核趋严，需确保内容合规
          </p>
        </div>
        <p className="text-accent/80">
          建议：提前准备 3-5 条成分科普备用内容，设置风险词监控
        </p>
      </DetailSection>
    </div>
  </div>
);

export default FinalReport;
