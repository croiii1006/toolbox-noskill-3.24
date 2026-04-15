# ORANGEN 页面复刻说明（Lovable 可直接复制）

请复刻一个与 ORANGEN 高度一致的页面视觉和交互气质。

这不是通用后台，不是营销官网，不是深色 cyberpunk dashboard。  
这是一个浅色、高级、克制、安静的 AI 工作台页面。

请直接按下面这份说明生成页面，不需要读取任何代码仓库文件。

==================================================
1. 页面定位
==================================================

把这个页面理解成：

- 一个高端 AI 创作工作台
- 一个左侧 workflow、右侧 workspace 的双栏产品
- 一个浅色、极简、结构感很强的专业工具页面

关键词：

- premium AI workstation
- light theme
- minimal
- structured
- quiet
- Chinese-first

页面气质要求：

- 干净
- 克制
- 留白充足
- 信息密度高但不拥挤
- 有一点 pixel / system identity
- 但整体仍然现代

==================================================
2. 整体布局
==================================================

页面为固定一屏的双栏工作台：

- 左侧：执行流 / 消息流 / agent workflow
- 右侧：当前步骤的详细工作区

布局要求：

- 左右约 `50 / 50`
- 中间一条极浅分割线
- 整页固定一屏
- 左右两栏内部各自滚动
- 外层页面不要整体上下滚动

布局配方建议：

```tsx
<div className="h-[calc(100vh-3.5rem)] flex flex-col bg-background">
  <div className="flex-1 flex overflow-hidden">
    <div className="w-1/2 min-h-0 border-r border-border/20">...</div>
    <div className="w-1/2 min-h-0 overflow-hidden">...</div>
  </div>
</div>
```

==================================================
3. 背景与颜色系统
==================================================

页面必须是浅色系统。

颜色气质：

- 主背景接近纯白
- 卡片背景也是白色或极浅灰白
- 文本接近黑，但不要死黑
- 强调色只使用暖橙色

推荐 token 语义：

- 背景：`bg-background`
- 主文字：`text-foreground`
- 次级文字：`text-muted-foreground`
- 辅助背景：`bg-muted/20`
- 分割线：`border-border/20`
- 强调色：`text-accent/80`

关键规则：

- 页面 90% 是黑白灰
- 页面 10% 是暖橙强调
- 不要大面积整块彩色
- 不要荧光色

建议直接使用这些配方：

- 页面背景：`bg-background`
- 卡片背景：`bg-card/90`、`bg-card/60`、`bg-muted/20`
- 卡片边框：`border border-border/20` 或 `border border-border/30`
- 强调色文字：`text-accent/80`
- 强调色浅背景：`bg-accent/8`
- 强调色浅边框：`border-accent/25`

==================================================
4. 字体系统
==================================================

请使用三层字体语言：

1. 大标题字体：现代无衬线、轻字重、大字距
2. 正文字体：现代无衬线、干净、稳定、可读
3. 小型状态字体：pixel / system 风格

风格建议：

- 主标题使用轻字重英文大标题
- 副标题使用更轻的灰色文字
- 编号、DONE、微型标签使用像素字体

推荐配方：

主标题：

```tsx
className="text-4xl font-light tracking-[0.2em] text-foreground"
```

副标题：

```tsx
className="mt-3 text-sm font-light tracking-[0.1em] text-muted-foreground"
```

像素状态文字：

```tsx
className="font-pixel text-xs text-muted-foreground/60"
```

正文：

```tsx
className="text-sm text-foreground/70 leading-relaxed"
```

重要原则：

- 页面整体字体气质要轻
- 不要粗黑标题
- 不要厚重大字

==================================================
5. 圆角、边框、阴影
==================================================

这是页面高级感的关键来源之一。

风格要求：

- 圆角偏大
- 边框极浅
- 阴影极轻

推荐配方：

主卡片：

```tsx
className="rounded-xl border border-border/20 bg-card/90 shadow-sm"
```

大输入卡：

```tsx
className="rounded-2xl border border-border/50 bg-card/90 backdrop-blur-sm shadow-sm"
```

极浅卡片：

```tsx
className="rounded-xl border border-border/20 bg-muted/20"
```

不要使用：

- 粗黑边框
- 深重阴影
- 大面积毛玻璃
- 重玻璃感悬浮块

==================================================
6. 间距系统
==================================================

页面必须有呼吸感。

空态首页建议：

- 顶部留白大
- 标题和输入卡之间要有明显间隔

推荐首页容器配方：

```tsx
className="relative min-h-full flex flex-col items-center justify-start gap-20 px-6 pt-[100px] pb-6 md:px-8 md:pt-[180px] md:pb-8"
```

工作态建议：

- 顶栏：`px-4 py-2`
- 左侧消息流：`px-6 py-6`
- 右侧工作区：`p-5`
- 卡片之间：`space-y-4`

卡片内部建议：

- `px-4 py-3`
- `p-5`
- 标签之间：`gap-1.5` 到 `gap-3`

==================================================
7. 图标系统
==================================================

请混用两类图标：

1. 线性图标
- 用于通用操作
- 如返回、历史、文件、数据库、箭头、搜索、关闭

2. 轻微 pixel / agent identity 图标
- 用于 agent、系统身份、编号、工作流提示

图标使用原则：

- 尺寸整体偏小
- 大多使用灰色或暖橙
- 图标不抢主视觉

常用配方：

```tsx
className="w-3.5 h-3.5 text-muted-foreground/50"
className="w-4 h-4 text-accent/80"
className="w-5 h-5 text-muted-foreground"
```

==================================================
8. 首页空态
==================================================

首页不是普通表单页，而是一个极简 hero + 工作输入卡。

结构：

- 中央偏上：大标题 `ORANGEN`
- 下方一行副标题
- 再下方一个大输入卡

标题视觉：

```tsx
<h1 className="mb-2 text-4xl font-light tracking-[0.2em] text-foreground">
  ORANGEN
</h1>
<p className="mt-3 text-sm font-light tracking-[0.1em] text-muted-foreground">
  上传商品图开始对话，或直接输入问题
</p>
```

输入卡外壳：

```tsx
className="mx-auto max-w-2xl rounded-2xl border border-border/50 bg-card/90 backdrop-blur-sm shadow-sm"
```

==================================================
9. Setup Summary 顶部摘要条
==================================================

这是页面进入工作态后最能体现 UI 语言的元素之一。

它不是一张大表格卡，而是一条横向 context bar。

它应当看起来像：

- 当前任务上下文摘要
- 很轻
- 很短
- 很克制

推荐视觉配方：

```tsx
className="rounded-xl border border-border/20 bg-muted/20 px-4 py-3 flex items-center gap-4 flex-wrap text-sm"
```

摘要条内部元素建议：

- 文件缩略图或文件信息
- 品类路径
- 卖点 tag
- 记忆库状态

内部图标配方：

```tsx
className="w-3.5 h-3.5 text-muted-foreground/50"
```

内部小文字配方：

```tsx
className="text-xs text-foreground/70"
```

内部 tag 配方：

```tsx
className="inline-flex h-5 items-center rounded-full bg-foreground/5 border border-border/30 px-2 text-[10px] text-foreground/70"
```

==================================================
10. 左侧 workflow 流
==================================================

左侧不是聊天气泡区，而是 workflow execution stream。

左侧内容包括：

- setup summary
- 待办清单
- 步骤组
- agent cluster
- agent card
- 状态消息
- 完成消息

左栏气质要求：

- 更像执行轨道
- 更像 AI 系统在逐步工作
- 不像即时聊天

推荐左栏内容区配方：

```tsx
className="px-6 py-6 pb-[60px]"
```

推荐消息列表节奏：

```tsx
className="max-w-3xl mx-auto space-y-4"
```

==================================================
11. workflow 卡片与连接线
==================================================

workflow step card 要有系统感和路径感。

每个步骤项建议：

- 白底或极浅灰底
- hover 时轻微灰底变化
- 选中项用浅橙边框或浅橙背景

推荐 step 行配方：

```tsx
className="flex items-start gap-3 rounded-xl px-3 py-3 text-left transition-all hover:bg-muted/20"
```

选中态建议：

```tsx
className="border border-accent/25 bg-accent/5"
```

连接线建议：

```tsx
className="w-px h-5 border-l border-dashed border-border/40"
```

==================================================
12. Agent 卡片
==================================================

Agent 卡片是页面辨识度最高的组件之一。

组成：

- 左边：头像或 agent 图标
- 中间：agent 名称 + 当前说明
- 右边：编号 + DONE 状态

视觉要求：

- 不能花
- 不能厚重
- 不能像 dashboard 统计卡

建议卡片外壳：

```tsx
className="rounded-xl border border-border/30 bg-background overflow-hidden"
```

列表 hover：

```tsx
className="hover:bg-muted/20 transition-colors"
```

DONE / 编号建议：

- 使用像素字体
- 颜色偏灰或偏成功色
- 不要做夸张荧光

==================================================
13. 右侧 Workspace
==================================================

右侧是 detail workspace，不是弹窗。

要求：

- 固定在右半屏
- 顶部是标题栏
- 内容区内部滚动
- 当前 agent 或当前步骤的产物在这里展示

右侧整体气质：

- 专注
- 稳定
- 结构清晰

推荐右侧外壳：

```tsx
className="w-1/2 min-h-0 overflow-hidden"
```

右侧内部结构：

```tsx
className="flex flex-col h-full"
```

顶部栏建议：

```tsx
className="px-5 py-3 border-b border-border/20"
```

==================================================
14. Prompt 编辑区
==================================================

Prompt 编辑区要像一个真正的工作卡，而不是普通 textarea。

结构：

- 顶部：标题 + 字数统计 + 复制按钮
- 中部：大文本框
- 底部：主 CTA

推荐容器配方：

```tsx
className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 space-y-4"
```

标题：

```tsx
className="text-sm font-normal text-foreground"
```

字数统计：

```tsx
className="text-[11px] font-light text-muted-foreground"
```

文本框：

```tsx
className="min-h-[350px] rounded-xl border-border/40 bg-background text-sm font-mono leading-relaxed resize-none"
```

主按钮：

```tsx
className="flex-1 rounded-xl h-10 bg-foreground text-background hover:bg-foreground/90 font-medium"
```

==================================================
15. 按钮系统
==================================================

按钮分三类：

1. 主按钮
- 黑底白字
- 用于确认生成、发送、下一步

推荐配方：

```tsx
className="bg-foreground text-background hover:bg-foreground/90"
```

2. 次按钮
- 白底或透明底
- 浅边框
- hover 轻微变灰

推荐配方：

```tsx
className="border border-border/40 text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/40"
```

3. 状态按钮
- 如记忆库按钮
- 默认灰边灰字
- 激活时浅橙底 + 橙字

默认态：

```tsx
className="border-border/40 text-muted-foreground"
```

激活态：

```tsx
className="border-orange-400/60 bg-orange-400/10 text-accent/80"
```

禁用态原则：

- 安静
- 低对比
- 不出现红色禁止图标

==================================================
16. 文本层级
==================================================

文本层级主要通过透明度表达，而不是通过很多颜色。

推荐层级：

- 主标题：`text-foreground`
- 一级正文：`text-foreground/80`
- 二级正文：`text-foreground/70`
- 辅助说明：`text-muted-foreground`
- 更弱辅助：`text-muted-foreground/60`
- 极弱信息：`text-muted-foreground/40`

这非常重要。  
如果文字全部都是纯黑，页面会变笨重。

==================================================
17. 动效原则
==================================================

动效要极轻。

允许：

- fade in
- 轻微 slide in
- hover 时轻微背景变化
- loading spinner / skeleton

不允许：

- 大位移
- 弹跳
- 强缩放
- 华丽光效

页面是工具，不是展示海报。

==================================================
18. hover / selected 风格
==================================================

交互反馈必须克制。

hover 推荐：

```tsx
className="hover:bg-muted/20 transition-colors"
```

selected 推荐：

```tsx
className="border-accent/25 bg-accent/5 text-foreground"
```

不要：

- 粗蓝框
- 厚阴影
- 荧光高亮

==================================================
19. 最终视觉总结
==================================================

请把这个页面理解为：

一个浅色、安静、高级、极简的 AI 双栏工作台。

它最关键的视觉特征不是某个单一组件，而是这些一起成立：

- 白底 + 浅灰边框
- 大圆角
- 暖橙色点亮
- 现代无衬线 + 少量像素字体
- 左 workflow，右 workspace
- 轻阴影
- 轻动效
- 文字层级主要靠透明度

==================================================
20. 给 Lovable 的硬性要求
==================================================

请严格执行以下规则：

- 使用浅色主题，不要深色主题
- 不要做成 dashboard
- 不要做成官网
- 左右双栏必须成立
- 左边必须像流程流
- 右边必须像工作区
- 所有边框都要浅
- 所有卡片都要大圆角
- 所有强调色都以暖橙为主
- 整体必须干净、专业、安静

一句话标准：

它看起来应该像一个高端 AI 创作工作台，而不是普通管理后台。
