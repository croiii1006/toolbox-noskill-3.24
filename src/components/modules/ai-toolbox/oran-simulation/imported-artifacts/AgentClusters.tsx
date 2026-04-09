import { Users } from "lucide-react";

const clusters = [
  {
    name: "高意向核心人群",
    weight: 15,
    intent: "高",
    activity: "高",
    interaction: 0.35,
    share: 0.18,
    comment: 0.22,
    ignore: 0.25,
    platform: "抖音 60% / 小红书 40%",
    influence: 8.2,
  },
  {
    name: "泛兴趣扩圈人群",
    weight: 30,
    intent: "中",
    activity: "中高",
    interaction: 0.2,
    share: 0.12,
    comment: 0.15,
    ignore: 0.53,
    platform: "抖音 70% / 小红书 30%",
    influence: 5.5,
  },
  {
    name: "价格敏感观望人群",
    weight: 25,
    intent: "低",
    activity: "中",
    interaction: 0.1,
    share: 0.05,
    comment: 0.08,
    ignore: 0.77,
    platform: "抖音 50% / 小红书 50%",
    influence: 3.1,
  },
  {
    name: "情绪传播型用户",
    weight: 15,
    intent: "中",
    activity: "极高",
    interaction: 0.28,
    share: 0.32,
    comment: 0.25,
    ignore: 0.15,
    platform: "抖音 80% / 小红书 20%",
    influence: 9,
  },
  {
    name: "成分/专业判断型用户",
    weight: 15,
    intent: "高",
    activity: "低",
    interaction: 0.15,
    share: 0.08,
    comment: 0.35,
    ignore: 0.42,
    platform: "小红书 75% / 抖音 25%",
    influence: 7.8,
  },
];

const intentColor: Record<string, string> = {
  高: "bg-accent/60",
  中: "bg-accent/30",
  低: "bg-muted-foreground/30",
};

const activityColor: Record<string, string> = {
  极高: "bg-accent/70",
  高: "bg-accent/50",
  中高: "bg-accent/35",
  中: "bg-muted-foreground/30",
  低: "bg-muted-foreground/20",
};

const MiniBar = ({
  value,
  max = 1,
  color = "bg-accent/60",
}: {
  value: number;
  max?: number;
  color?: string;
}) => (
  <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted/30">
    <div
      className={`h-full rounded-full ${color} transition-all`}
      style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
    />
  </div>
);

const PlatformBar = ({ platform }: { platform: string }) => {
  const parts = platform.split(" / ");
  const values = parts.map((p) => {
    const match = p.match(/(\d+)%/);
    return {
      name: p.replace(/\s*\d+%/, "").trim(),
      pct: match ? parseInt(match[1], 10) : 50,
    };
  });

  return (
    <div className="mt-1.5 space-y-1">
      {values.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-10 shrink-0 text-[10px] text-muted-foreground/50">
            {v.name}
          </span>
          <div className="h-1.5 flex-1 rounded-full bg-muted/30">
            <div
              className={`h-full rounded-full ${
                i === 0 ? "bg-accent/50" : "bg-foreground/20"
              }`}
              style={{ width: `${v.pct}%` }}
            />
          </div>
          <span className="w-7 text-right text-[10px] text-muted-foreground/50">
            {v.pct}%
          </span>
        </div>
      ))}
    </div>
  );
};

const LevelDot = ({
  level,
  colorMap,
}: {
  level: string;
  colorMap: Record<string, string>;
}) => (
  <div className="mt-1 flex items-center gap-1.5">
    <div
      className={`h-2 w-2 rounded-full ${
        colorMap[level] || "bg-muted-foreground/20"
      }`}
    />
    <span className="text-foreground/70">{level}</span>
  </div>
);

const AgentClusters = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: "总 Agent 数", value: "12,000" },
        { label: "模拟轮次", value: "60" },
        { label: "种子用户", value: "800" },
      ].map((s, i) => (
        <div
          key={i}
          className="rounded-xl border border-border/20 bg-card/90 p-4 text-center"
        >
          <p className="text-lg font-light text-accent/80">{s.value}</p>
          <p className="mt-1 text-[10px] text-muted-foreground/60">{s.label}</p>
        </div>
      ))}
    </div>

    <div className="rounded-xl border border-border/20 bg-card/90 p-4">
      <p className="mb-3 text-xs text-muted-foreground/60">人群权重分布</p>
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
        {clusters.map((c, i) => (
          <div
            key={i}
            className="h-full rounded-full transition-all first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${c.weight}%`,
              backgroundColor: `hsl(28, 85%, ${48 + i * 8}%)`,
            }}
            title={`${c.name} ${c.weight}%`}
          />
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
        {clusters.map((c, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60"
          >
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: `hsl(28, 85%, ${48 + i * 8}%)` }}
            />
            {c.name} {c.weight}%
          </div>
        ))}
      </div>
    </div>

    {clusters.map((c, i) => (
      <div key={i} className="rounded-xl border border-border/20 bg-card/90 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="flex items-center gap-2 text-sm font-normal text-foreground/80">
            <Users className="h-3.5 w-3.5 text-accent/80" />
            {c.name}
          </h4>
          <span className="font-urbanist font-light text-lg text-accent/80">{c.weight}%</span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
          <div>
            <span className="text-muted-foreground/60">意向层级</span>
            <LevelDot level={c.intent} colorMap={intentColor} />
          </div>
          <div>
            <span className="text-muted-foreground/60">活跃度</span>
            <LevelDot level={c.activity} colorMap={activityColor} />
          </div>

          <div>
            <span className="text-muted-foreground/60">互动阈值</span>
            <div className="flex items-center gap-2">
              <span className="w-9 shrink-0 text-right tabular-nums text-foreground/70">
                {c.interaction}
              </span>
              <div className="flex-1">
                <MiniBar value={c.interaction} color="bg-accent/50" />
              </div>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground/60">分享概率</span>
            <div className="flex items-center gap-2">
              <span className="w-9 shrink-0 text-right tabular-nums text-foreground/70">
                {c.share}
              </span>
              <div className="flex-1">
                <MiniBar value={c.share} color="bg-accent/40" />
              </div>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground/60">评论概率</span>
            <div className="flex items-center gap-2">
              <span className="w-9 shrink-0 text-right tabular-nums text-foreground/70">
                {c.comment}
              </span>
              <div className="flex-1">
                <MiniBar value={c.comment} color="bg-accent/40" />
              </div>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground/60">忽略概率</span>
            <div className="flex items-center gap-2">
              <span className="w-9 shrink-0 text-right tabular-nums text-foreground/70">
                {c.ignore}
              </span>
              <div className="flex-1">
                <MiniBar value={c.ignore} color="bg-muted-foreground/30" />
              </div>
            </div>
          </div>

          <div>
            <span className="text-muted-foreground/60">影响力分</span>
            <div className="mt-1 flex items-center gap-2">
              <span className="w-9 shrink-0 text-right font-medium tabular-nums text-foreground/70">
                {c.influence}
              </span>
              <div className="flex-1">
                <MiniBar value={c.influence} max={10} color="bg-accent/60" />
              </div>
            </div>
          </div>

          <div>
            <span className="text-muted-foreground/60">平台亲和</span>
            <PlatformBar platform={c.platform} />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default AgentClusters;
