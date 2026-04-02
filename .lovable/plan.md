

## Plan: Merge Insight & Campaign into a 5-Step Workbench

### Overview
Replace the separate `BrandHealth` and `CampaignPlanner` modules with a single **InsightWorkbench** component. This component implements a linear 5-step task flow: **Input → Reading → Confirm → Generating → Report**. The visual style strictly follows the existing project aesthetic (white/light gray, minimal, large whitespace, subtle borders/shadows).

### Step-by-Step UI Design

**Step 1 — Input (极简输入)**
- Centered layout, large whitespace, single focused input area
- Primary input: URL text field with placeholder "输入网站链接，开始解析"
- Secondary: "记忆库" button (existing `MemorySelectionDialog`) — subtle, not competing with URL input
- Bottom: disabled send button (becomes active when URL or memory selected)
- Below composer: tab-switched case cards ("洞察案例" / "策划案例") reusing existing `ShowcaseCard` data with pagination

**Step 2 — Reading (读取信息)**
- Replaces the input area; shows source being read (URL or memory items)
- Lightweight status: small pulsing dot + "正在读取 xxx.com" text
- List of sources with check/spinner icons as they complete
- No heavy loading animation — just quiet, professional status indicators
- Disable all interaction to prevent duplicate submissions

**Step 3 — Confirm (确认关键信息)**
- Card-based confirmation UI showing extracted fields:
  - 品牌名/项目名, 所属品类, 核心卖点 (tags), 目标市场, 主要分析对象, 网站类型, 业务方向
- Each field is editable (inline inputs/tag inputs matching existing styles)
- "系统识别" badge on each field to show AI extraction
- Primary CTA: "确认并生成报告" button
- Secondary: "返回重新输入" link

**Step 4 — Generating (生成中)**
- Phased progress list with checkmarks/spinner:
  - ✓ 信息读取完成
  - ✓ 关键信息已确认
  - ◌ 正在生成报告结构
  - ◌ 正在整理洞察内容
  - ◌ 正在输出 HTML 页面
- Minimal, list-based progress — no progress bars or heavy animations
- Quiet, professional tone

**Step 5 — Report (输出报告)**
- Split layout: left panel shows step summary / action buttons, right panel shows HTML report preview in an iframe or rendered HTML
- Action buttons: 预览报告, 复制内容, 导出 HTML, 重新生成, 返回修改关键信息
- Report has "delivery" feel — card with shadow, clear header, structured content
- Reuses mock report data similar to existing `BrandHealth` report and `CampaignPlannerReport`

### File Changes

#### 1. New: `src/components/modules/ai-toolbox/InsightWorkbench.tsx`
Main component managing 5-step state machine (`input | reading | confirm | generating | report`). Contains:
- Step 1: URL input + memory selector + case tabs
- Step 2: Reading status display
- Step 3: Editable confirmation card fields
- Step 4: Phase progress list
- Step 5: Report preview with action toolbar
- All steps use existing UI primitives (`Input`, `Button`, `Card`, `Badge`, tags from composer patterns)
- Credits integration via `useCredits`
- History support via localStorage

#### 2. New: `src/components/modules/ai-toolbox/InsightWorkbenchReport.tsx`
Report display component for Step 5. Renders a structured HTML report preview with:
- Executive summary, brand analysis, market insights sections
- Export HTML, copy, print functionality
- Reuses charting patterns from existing `BrandHealth` report

#### 3. Modify: `src/components/modules/ai-toolbox/AIToolboxModule.tsx`
- Remove `brand-health` and `campaign-planner` cases
- Add `insight-workbench` case rendering `<InsightWorkbench />`

#### 4. Modify: `src/components/layout/DynamicSidebar.tsx`
- Replace separate `brand-health` and `campaign-planner` entries with single entry: `{ id: 'insight-workbench', labelKey: 'sidebar.insightWorkbench', icon: <TrendingUp /> }`

#### 5. Modify: `src/i18n/locales/en.json` and `zh.json`
- Add `sidebar.insightWorkbench` key ("Insight Workbench" / "ORAN INSIGHT")
- Remove old `sidebar.marketInsights` and `sidebar.planningScheme` if no longer referenced

#### 6. Keep existing files
- `BrandHealth.tsx`, `CampaignPlanner.tsx`, `MarketInsightComposer.tsx`, `CampaignPlannerComposer.tsx` — keep for now (not referenced once sidebar routes are updated), can be cleaned up later

### Key Interaction Rules
- Input empty → send button disabled (muted style)
- Input filled → send button highlighted (foreground/accent)
- Reading state → all inputs disabled, no duplicate submit
- Confirm page → all fields editable, "返回" goes to Step 1
- Generate complete → can return to confirm and re-generate
- Credits check before entering Step 4
- Simulated timers for reading (3s) and generating (8s) with mock data

### Visual Principles (strictly followed)
- White/light gray backgrounds, no dark themes
- Existing border-border/30, rounded-2xl, shadow-sm patterns
- Existing font sizes, spacing, accent color usage
- Large whitespace, centered layouts for input steps
- No new color palette, no heavy gradients, no tech-heavy aesthetics

