

## Plan: Merge Brand Health (洞察) and Campaign Planner (策划) into One Page with Tab-Switched Cases

### Overview
Combine the "市场洞察" (Brand Health / Market Insights) and "策划方案" (Campaign Planner) tools into a single unified page. The input composer area will use **Tabs** to switch between the two tool modes, and the showcase cases section at the bottom will also use tabs to switch between market cases and campaign cases.

### Changes

#### 1. Create new combined component `src/components/modules/ai-toolbox/InsightAndPlanning.tsx`
- A wrapper component with two top-level tabs: **"市场洞察"** and **"策划方案"**
- Each tab renders its respective existing component (`BrandHealth` / `CampaignPlanner`)
- When either tool is in its "input/compose" phase, show a shared **case tabs section** at the bottom with two sub-tabs: "洞察案例" and "策划案例", each rendering their respective `ShowcaseCard` grids with pagination
- When a tool transitions to loading/report view, the cases section hides (existing behavior)

#### 2. Update sidebar config in `DynamicSidebar.tsx`
- Remove the separate `brand-health` and `campaign-planner` sidebar entries
- Add a single combined entry (e.g., id: `insight-planning`, label: "洞察与策划" or similar)

#### 3. Update `AIToolboxModule.tsx` routing
- Remove separate `brand-health` and `campaign-planner` cases
- Add `insight-planning` case that renders the new `InsightAndPlanning` component

#### 4. Update i18n files
- Add new translation key for the combined sidebar item in both `en.json` and `zh.json`

### Technical Approach
- Use the existing `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` components from `@/components/ui/tabs`
- The top tabs switch between the full `BrandHealth` and `CampaignPlanner` components (preserving all their logic: history, credits, loading, reports)
- Extract the case card sections from `MarketInsightComposer` and `CampaignPlannerComposer` into a shared tabbed cases area rendered below the active composer, OR keep cases inline in each composer and only use top-level tabs to switch tools

**Recommended simpler approach**: Keep `BrandHealth` and `CampaignPlanner` as-is internally. The new wrapper just uses `Tabs` at the top level to switch between them. For the "案例用tab切换" requirement, add a second set of tabs below the composer area that shows both market and campaign cases regardless of which tool tab is active.

