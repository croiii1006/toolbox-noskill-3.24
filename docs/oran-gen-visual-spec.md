# ORAN GEN 视觉设定文档

这份文档不讲业务流程，只讲 ORAN GEN 这页的视觉语言。目标是把这页的 UI 设定拆成可以复刻的设计规范，包括字体、图标、颜色、圆角、边框、阴影、间距、布局、状态和交互气质。

## 1. 页面气质

ORAN GEN 不是通用后台，也不是营销落地页。它的视觉定位更接近：

- 浅色底的 AI 工作台
- 高级、安静、克制
- 功能密度高，但视觉噪音低
- 左侧像执行流，右侧像操作台
- 有一点 pixel / terminal 感，但整体仍然现代

关键词：

- clean
- quiet
- premium
- structured
- AI workstation
- Chinese-first

## 2. 整体布局

来源文件：

- [SkillsModule.tsx](/d:/job/oranAI/toolbox-noskill-3.24/src/components/modules/skills/SkillsModule.tsx)
- [RightWorkspace.tsx](/d:/job/oranAI/toolbox-noskill-3.24/src/components/modules/skills/RightWorkspace.tsx)

整体是一个固定一屏的双栏工作台：

- 外层高度：`h-[calc(100vh-3.5rem)]`
- 页面底色：`bg-background`
- 左栏与右栏在工作态下各占 `1/2`
- 左右之间用极细分割线：`border-r border-border/20`

两种主要状态：

1. 空态首页
- 页面内容居中偏上
- 大标题在视觉中心
- 输入卡独立悬浮

2. 工作态
- 左侧是消息流 / 执行流 / agent 卡片
- 右侧是 detail workspace
- 右侧是固定操作区，不是普通详情抽屉

布局气质重点：

- 不做厚重背景块
- 不做高对比割裂
- 用轻边框和留白划分层级

## 3. 主题 Token

来源文件：

- [index.css](/d:/job/oranAI/toolbox-noskill-3.24/src/index.css)
- [tailwind.config.ts](/d:/job/oranAI/toolbox-noskill-3.24/tailwind.config.ts)

### 3.1 主色系

页面是浅色主题，核心 token 如下：

- `--background: 0 0% 100%`
- `--foreground: 0 0% 5%`
- `--card: 0 0% 100%`
- `--muted: 0 0% 96%`
- `--muted-foreground: 0 0% 45%`
- `--border: 0 0% 90%`
- `--accent: 15 90% 55%`

换算成视觉理解：

- 背景：接近纯白
- 主文字：接近黑
- 次级底色：非常浅的灰白
- 分割线：很轻的暖灰边
- 强调色：暖橘色，不偏红，不偏荧光

### 3.2 强调色用法

`accent` 是整页唯一明确的情绪色，主要用于：

- 状态提示
- 当前进行中的小图标
- 关键 CTA 的局部强调
- 进度、focus、记忆库等提示

用法很克制：

- 常用 `text-accent/80`
- 常用 `bg-accent/8`
- 常用 `border-accent/25`

不是大面积橙色铺底，而是“点亮式”提示。

### 3.3 阴影

页面使用的是非常轻的卡片阴影：

- `--shadow-card`
- `--shadow-card-hover`
- `shadow-sm`

视觉效果：

- 阴影存在，但不厚
- 更像纸面抬起一点点
- 主要靠边框和留白建立层级，不靠重阴影

## 4. 字体系统

来源文件：

- [index.css](/d:/job/oranAI/toolbox-noskill-3.24/src/index.css)
- [tailwind.config.ts](/d:/job/oranAI/toolbox-noskill-3.24/tailwind.config.ts)

### 4.1 字体族

项目里实际定义了四套：

- `sans`: `Inter`
- `display`: `Urbanist`
- `pixel`: `Pixelify Sans`
- `bitcount`: `Bitcount Single`

但 ORAN GEN 这页真正的主力是：

- 正文：`Inter`
- 大标题：接近 `Urbanist / Inter` 风格
- 像素标签/编号/状态：`Pixelify Sans`

### 4.2 字体分工

1. 大标题
- `text-4xl`
- `font-light`
- `tracking-[0.2em]`
- 全大写英文
- 例：`ORAN GEN`

2. 副标题
- `text-sm`
- `font-light`
- `tracking-[0.1em]`
- `text-muted-foreground`

3. 像素信息层
- `font-pixel`
- 常用于：
  - Agent 编号
  - DONE 状态
  - checklist 记号
  - 小型系统标签

4. 正文内容
- `text-sm`
- `text-foreground/70` 到 `text-foreground/80`
- 行距比较松，强调可读性

### 4.3 字距策略

这页对字距很敏感：

- 大标题大字距：`tracking-[0.2em]`
- 副标题中等字距：`tracking-[0.1em]`
- 像素小标签使用更离散的字符感

这让页面看起来更“系统化”，更像 AI 工具，而不是普通表单。

## 5. 图标系统

来源文件：

- [SkillsModule.tsx](/d:/job/oranAI/toolbox-noskill-3.24/src/components/modules/skills/SkillsModule.tsx)
- [RightWorkspace.tsx](/d:/job/oranAI/toolbox-noskill-3.24/src/components/modules/skills/RightWorkspace.tsx)
- [SetupSummary.tsx](/d:/job/oranAI/toolbox-noskill-3.24/src/components/modules/skills/SetupSummary.tsx)

图标是混合系统，不是只靠 `lucide-react`。

### 5.1 两类图标

1. 线性系统图标
- 来自 `lucide-react`
- 负责通用操作
- 例如：
  - `ArrowLeft`
  - `ChevronRight`
  - `History`
  - `Database`
  - `FileText`
  - `Search`

2. 像素 / 插画型资源图标
- 来自本地 assets
- 负责页面个性和 agent 身份
- 例如：
  - `pixel-search.svg`
  - `pixel-memory.svg`
  - `pixel-prompt.svg`
  - `pixel-video.svg`
  - `pixel-create.svg`
  - `expert-crawler.png`
  - `expert-designer.png`

### 5.2 图标使用原则

- 通用交互用 lucide
- 与 agent / system identity 相关的内容用像素图标
- 图标尺寸整体偏小
- 常用宽高：
  - `w-3.5 h-3.5`
  - `w-4 h-4`
  - `w-5 h-5`

图标不是强视觉主角，而是精确辅助信息识别。

## 6. 卡片语言

来源文件：

- [SkillsModule.tsx](/d:/job/oranAI/toolbox-noskill-3.24/src/components/modules/skills/SkillsModule.tsx)
- [SetupSummary.tsx](/d:/job/oranAI/toolbox-noskill-3.24/src/components/modules/skills/SetupSummary.tsx)
- [PromptEditorBlock.tsx](/d:/job/oranAI/toolbox-noskill-3.24/src/components/modules/skills/PromptEditorBlock.tsx)

这页几乎所有内容都通过“轻卡片”承载。

### 6.1 卡片基础配方

高频组合是：

- `rounded-xl` 或 `rounded-2xl`
- `border border-border/20` 到 `border-border/50`
- `bg-card/60`、`bg-card/90`、`bg-muted/20`
- `backdrop-blur-sm`
- `shadow-sm`

也就是：

- 轻边框
- 轻背景
- 轻阴影
- 大圆角

### 6.2 卡片不是面板墙

它不是典型 dashboard 的模块砖块，而是：

- 像消息流里的工作块
- 像执行过程中的阶段节点
- 像操作中的当前载体

所以卡片之间的关系是“流程上下文”，不是“统计面板网格”。

### 6.3 圆角

整页圆角偏大：

- 主输入卡：`rounded-2xl`
- setup summary：`rounded-xl`
- agent 卡 / prompt 卡 / 结果卡：`rounded-xl`
- 按钮：圆角要么 `rounded-xl`，要么 `rounded-full`

这种大圆角会让工作台更高级、更友好，也削弱工具页的压迫感。

## 7. 间距系统

### 7.1 页面层

空态首页：

- 上边距很大：`pt-[100px]`，桌面 `md:pt-[180px]`
- 标题与输入卡之间有明显呼吸感：`gap-20`

工作态：

- 顶栏很薄：`px-4 py-2`
- 左侧消息流容器：`px-6 py-6`
- 右侧工作区：`p-5`

### 7.2 卡片内部

卡片内部 spacing 一般比较节制：

- 头部：`px-4 py-3` 或 `p-5`
- 列表项：`py-3`
- 标签组：`gap-1.5` 到 `gap-3`

特点是：

- 不挤
- 也不过度松散
- 偏“产品化密度”

### 7.3 左右栏节奏

左栏是连续内容，所以：

- 纵向 `space-y-4`
- 依赖自然滚动

右栏是当前操作区，所以：

- 分区更明确
- 每块更完整
- 底部常有固定操作区域或阶段切换

## 8. 组件视觉细节

### 8.1 首页 Hero

来源：

- [SkillsModule.tsx](/d:/job/oranAI/toolbox-noskill-3.24/src/components/modules/skills/SkillsModule.tsx)

视觉特征：

- 白底
- 中央大标题 `ORAN GEN`
- 下面一行轻副标题
- 下方一个独立浮起的输入卡

这是“工具首页”，不是“宣传首页”。

### 8.2 ChatInputBar

来源：

- [ChatInputBar.tsx](/d:/job/oranAI/toolbox-noskill-3.24/src/components/modules/skills/ChatInputBar.tsx)

它定义了首页输入区的视觉基调：

- 左侧是上传商品图占位框
- 中间是品类选择和卖点 tag 输入
- 底部左侧是记忆库按钮
- 底部右侧是预计消耗和发送按钮

关键样式：

- 上传框：虚线边框、圆角、极浅灰
- tag：`rounded-full`，轻描边，小字号
- 记忆库按钮：
  - 未选中：浅边框灰字
  - 选中：橙色文字 + 浅橙背景
- 发送按钮：
  - 有效时：黑底白图标
  - 无效时：浅灰底灰图标

### 8.3 SetupSummary

来源：

- [SetupSummary.tsx](/d:/job/oranAI/toolbox-noskill-3.24/src/components/modules/skills/SetupSummary.tsx)

这是这页最有代表性的“设定摘要条”。

特点：

- 横向排列
- 内容用图标 + 小字 + tag chip 表达
- 非常像状态条 / context bar
- 不厚重，不像信息表

配方：

- `rounded-xl`
- `border border-border/20`
- `bg-muted/20`
- `px-4 py-3`
- `gap-4`
- `text-sm`

里面的小标签：

- `inline-flex`
- `h-5`
- `rounded-full`
- `bg-foreground/5`
- `border border-border/30`
- `px-2`
- `text-[10px]`

### 8.4 左侧消息流

来源：

- [SkillsModule.tsx](/d:/job/oranAI/toolbox-noskill-3.24/src/components/modules/skills/SkillsModule.tsx)

消息流并不是聊天气泡，而是“工作块流”。

它包含：

- setup summary
- flow group
- agent cluster card
- checklist
- 普通状态信息
- 完成提示

视觉上有几个特征：

- 所有块都很克制
- 边框统一
- hover 只做浅灰背景变化
- 连接关系使用虚线竖线：`border-dashed border-border/40`

这使得左栏像“执行轨道”，而不是消息聊天区。

### 8.5 Agent Card

来源：

- [SkillsModule.tsx](/d:/job/oranAI/toolbox-noskill-3.24/src/components/modules/skills/SkillsModule.tsx)

Agent 卡视觉核心：

- 左侧是像素/专家头像
- 中间是 agent 名称与任务描述
- 右侧是像素状态编号和 DONE

这部分是 ORAN GEN 最有辨识度的地方之一。

它混合了：

- 极简白底卡
- 像素感编号
- 微妙的 hover
- 很轻的系统感

### 8.6 Right Workspace

来源：

- [RightWorkspace.tsx](/d:/job/oranAI/toolbox-noskill-3.24/src/components/modules/skills/RightWorkspace.tsx)

右侧 workspace 不是单个组件，而是一套 detail shell。

它的视觉设定是：

- 固定右半屏
- 轻边框分隔
- 顶部是标题栏
- 中间是滚动内容区
- 底部或内部承载当前 agent 的具体工作结果

重点不是“信息展示”，而是“当前操作上下文”。

### 8.7 PromptEditorBlock

来源：

- [PromptEditorBlock.tsx](/d:/job/oranAI/toolbox-noskill-3.24/src/components/modules/skills/PromptEditorBlock.tsx)

Prompt 区定义了右侧操作区的质感：

- 外层卡片：`rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm p-5`
- 文本框：大尺寸、极简、轻边框、浅背景
- 顶部右侧有复制按钮
- 底部主操作是黑底按钮

它体现的是：

- 编辑区要稳
- 不能太花
- 主要注意力给文本内容

## 9. 按钮系统

### 9.1 主按钮

典型样式：

- `bg-foreground text-background`
- `hover:bg-foreground/90`
- `rounded-xl` 或 `rounded-full`

也就是黑底白字 / 黑底白图标。

### 9.2 次按钮

常见样式：

- 透明或极浅底
- 轻边框
- hover 变浅灰

典型 class 组合：

- `border border-border/40`
- `hover:border-border`
- `hover:bg-muted/40`

### 9.3 状态按钮

例如记忆库按钮：

- 默认：灰边灰字
- 激活：浅橙边 + 浅橙底 + 橙字

这类按钮不是强 CTA，更像状态切换器。

## 10. 边框与分割线

这页的层级很大程度靠边框，而不是靠背景块。

高频边框透明度：

- `border-border/10`
- `border-border/20`
- `border-border/30`
- `border-border/50`

规律：

- 页面结构分隔：`/10` 或 `/20`
- 卡片轮廓：`/20` 到 `/30`
- 更明确的输入卡：`/40` 到 `/50`

所以这页的“高级感”来自边框的精细透明度控制。

## 11. 动效语言

### 11.1 页面动效

来源：

- [tailwind.config.ts](/d:/job/oranAI/toolbox-noskill-3.24/tailwind.config.ts)

核心动画：

- `fade-in`
- `slide-in-left`

时长都很短：

- `0.2s`
- `0.3s`

### 11.2 动效原则

- 只做轻微进入
- 不做大位移
- 不做明显弹跳
- 不做强烈缩放

这让页面保持“工具级稳定感”。

## 12. 文本颜色层级

这页几乎不使用纯色文字层级切换，而是大量使用透明度：

- 主标题：`text-foreground`
- 一级正文：`text-foreground/80`
- 二级正文：`text-foreground/70`
- 次要说明：`text-muted-foreground`
- 更弱信息：`text-muted-foreground/60`
- 极弱辅助：`text-muted-foreground/40`

这比硬切黑/灰更高级，也更柔和。

## 13. 页面最核心的复刻要点

如果后面要在别的页面里 1:1 复刻 ORAN GEN 的视觉，不是照搬某个组件，而是要同时满足这几条：

1. 白底浅灰工作台，而不是重深色。
2. 主信息靠留白和轻边框组织，而不是靠大面积色块。
3. 字体必须是 Inter / Urbanist + Pixelify Sans 的双系统。
4. 强调色必须是克制的暖橙，只做点亮，不做大铺色。
5. 左侧要像执行流，右侧要像当前操作台。
6. 卡片必须是大圆角、轻边框、轻阴影。
7. 像素图标和线性图标要混用，形成“AI 系统 + agent 身份”的独特感。
8. 所有 hover、选中、进入动效都要轻，不要戏剧化。

## 14. 直接对应的核心代码

如果后面你要继续做视觉复刻，优先看这些文件：

- [SkillsModule.tsx](/d:/job/oranAI/toolbox-noskill-3.24/src/components/modules/skills/SkillsModule.tsx)
- [RightWorkspace.tsx](/d:/job/oranAI/toolbox-noskill-3.24/src/components/modules/skills/RightWorkspace.tsx)
- [SetupSummary.tsx](/d:/job/oranAI/toolbox-noskill-3.24/src/components/modules/skills/SetupSummary.tsx)
- [ChatInputBar.tsx](/d:/job/oranAI/toolbox-noskill-3.24/src/components/modules/skills/ChatInputBar.tsx)
- [PromptEditorBlock.tsx](/d:/job/oranAI/toolbox-noskill-3.24/src/components/modules/skills/PromptEditorBlock.tsx)
- [index.css](/d:/job/oranAI/toolbox-noskill-3.24/src/index.css)
- [tailwind.config.ts](/d:/job/oranAI/toolbox-noskill-3.24/tailwind.config.ts)

## 15. 一句话总结

ORAN GEN 的视觉不是“某个组件好看”，而是一整套克制的浅色 AI 工作台语言：

- 大留白
- 轻边框
- 暖橙强调
- 像素标签
- 左流右台
- 功能密度高但非常安静

这才是它最该被复刻的部分。
