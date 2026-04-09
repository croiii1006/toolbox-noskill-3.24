import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, Legend } from "recharts";

const exposureData = Array.from({ length: 60 }, (_, i) => ({
  day: i + 1,
  exposure: Math.round(2000 + 8000 * Math.sin((i / 60) * Math.PI) * (1 + Math.random() * 0.3)),
  engagement: Math.round(200 + 1200 * Math.sin((i / 60) * Math.PI) * (1 + Math.random() * 0.4)),
}));

const segmentData = [
  { segment: '高意向核心', exposure: 45000, engagement: 12800, completion: 28, interaction: 15.2 },
  { segment: '泛兴趣扩圈', exposure: 120000, engagement: 18000, completion: 15, interaction: 8.5 },
  { segment: '价格敏感', exposure: 85000, engagement: 5100, completion: 6, interaction: 3.2 },
  { segment: '情绪传播', exposure: 68000, engagement: 22000, completion: 32, interaction: 18.1 },
  { segment: '专业判断', exposure: 32000, engagement: 8500, completion: 26, interaction: 12.4 },
];

const lifecycleData = Array.from({ length: 60 }, (_, i) => ({
  day: i + 1,
  directionA: Math.round(100 * Math.exp(-0.03 * i) * Math.sin((i / 15) * Math.PI + 0.5) * (i < 5 ? i / 5 : 1) + 50),
  directionB: Math.round(80 * Math.exp(-0.05 * i) * Math.sin((i / 12) * Math.PI + 0.3) * (i < 3 ? i / 3 : 1) + 40),
}));

const colors = {
  orange: 'hsl(28, 85%, 58%)',
  orangeLight: 'hsl(28, 70%, 72%)',
  blue: 'hsl(200, 50%, 55%)',
};

const tooltipStyle = { background: '#fefefe', border: '1px solid hsl(0,0%,92%)', borderRadius: 12, fontSize: 12 };

const SimMonitor = () => (
  <Tabs defaultValue="spread" className="w-full">
    <TabsList className="bg-muted/20 border border-border/20 w-full justify-start">
      <TabsTrigger value="spread" className="text-xs">扩散过程</TabsTrigger>
      <TabsTrigger value="segment" className="text-xs">人群分层反馈</TabsTrigger>
      <TabsTrigger value="lifecycle" className="text-xs">生命周期曲线</TabsTrigger>
      <TabsTrigger value="compare" className="text-xs">多方向对比</TabsTrigger>
    </TabsList>

    <TabsContent value="spread">
      <div className="rounded-xl border border-border/20 p-4 bg-card/90">
        <h4 className="text-sm font-normal text-foreground/80 mb-4">日曝光 & 互动趋势</h4>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={exposureData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,93%)" />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(0,0%,60%)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(0,0%,60%)' }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="exposure" stroke={colors.orange} fill={colors.orange} fillOpacity={0.08} name="曝光" />
            <Area type="monotone" dataKey="engagement" stroke={colors.blue} fill={colors.blue} fillOpacity={0.08} name="互动" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </TabsContent>

    <TabsContent value="segment">
      <div className="rounded-xl border border-border/20 p-4 bg-card/90">
        <h4 className="text-sm font-normal text-foreground/80 mb-4">人群分层互动率</h4>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={segmentData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,93%)" />
            <XAxis dataKey="segment" tick={{ fontSize: 10, fill: 'hsl(0,0%,60%)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(0,0%,60%)' }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="interaction" fill={colors.orange} name="互动率 %" radius={[6, 6, 0, 0]} fillOpacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground/60 border-b border-border/20">
                <th className="text-left py-2 px-2">人群</th>
                <th className="text-right py-2 px-2">曝光</th>
                <th className="text-right py-2 px-2">互动</th>
                <th className="text-right py-2 px-2">完成率</th>
              </tr>
            </thead>
            <tbody>
              {segmentData.map((s, i) => (
                <tr key={i} className="border-b border-border/20">
                  <td className="py-2 px-2 text-foreground/70">{s.segment}</td>
                  <td className="py-2 px-2 text-right text-foreground/70">{s.exposure.toLocaleString()}</td>
                  <td className="py-2 px-2 text-right text-foreground/70">{s.engagement.toLocaleString()}</td>
                  <td className="py-2 px-2 text-right text-accent/80">{s.completion}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </TabsContent>

    <TabsContent value="lifecycle">
      <div className="rounded-xl border border-border/20 p-4 bg-card/90">
        <h4 className="text-sm font-normal text-foreground/80 mb-4">内容生命周期曲线 — 方向 A</h4>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={lifecycleData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,93%)" />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(0,0%,60%)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(0,0%,60%)' }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="directionA" stroke={colors.orange} strokeWidth={2} dot={false} name="方向A" />
          </LineChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { label: '峰值天', value: 'Day 12' },
            { label: '拐点天', value: 'Day 28' },
            { label: '衰减率', value: '3.2% / 天' },
            { label: '建议刷新', value: 'Day 25' },
          ].map((m, i) => (
            <div key={i} className="rounded-xl bg-muted/20 px-3 py-2 text-center">
              <p className="text-[10px] text-muted-foreground/60">{m.label}</p>
              <p className="text-sm font-light text-accent/80">{m.value}</p>
            </div>
          ))}
        </div>
      </div>
    </TabsContent>

    <TabsContent value="compare">
      <div className="rounded-xl border border-border/20 p-4 bg-card/90">
        <h4 className="text-sm font-normal text-foreground/80 mb-4">方向 A / B 对比</h4>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={lifecycleData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,93%)" />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(0,0%,60%)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(0,0%,60%)' }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="directionA" stroke={colors.orange} strokeWidth={2} dot={false} name="长期安全有效" />
            <Line type="monotone" dataKey="directionB" stroke={colors.blue} strokeWidth={2} dot={false} name="高压场景稳定" />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 rounded-xl bg-muted/20 p-4 text-xs text-foreground/70 leading-relaxed space-y-1">
          <p><span className="text-accent/80 font-medium">推荐投放顺序：</span>先主推「长期安全有效」(Day 1-30)，再接「高压场景」(Day 20-60)</p>
          <p><span className="text-accent/80 font-medium">预算分配建议：</span>方向 A : 方向 B = 6 : 4</p>
        </div>
      </div>
    </TabsContent>
  </Tabs>
);

export default SimMonitor;
