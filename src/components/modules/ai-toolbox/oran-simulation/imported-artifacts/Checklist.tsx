const items = [
  '创建模拟任务',
  '解析输入材料',
  '确定模拟方向',
  '构建语义图谱',
  '搭建仿真环境',
  '生成 Agent 群体与行为参数',
  '设定初始激活策略',
  '并行运行模拟',
  '输出预测报告',
];

const Checklist = ({ completedSteps }: { completedSteps: number[] }) => (
  <div className="space-y-2">
    <p className="text-sm text-muted-foreground/60 mb-4">待办清单</p>
    {items.map((item, i) => {
      const done = completedSteps.includes(i + 1);
      return (
        <div key={i} className="flex items-center gap-3 py-2.5">
          <span className="font-pixel text-xs text-muted-foreground/40 mt-0.5 flex-shrink-0">
            [{done ? '✓' : 'x'}]
          </span>
          <span className={`text-sm ${done ? 'text-muted-foreground/50 line-through' : 'text-foreground/70'}`}>
            {item}
          </span>
        </div>
      );
    })}
  </div>
);

export default Checklist;
