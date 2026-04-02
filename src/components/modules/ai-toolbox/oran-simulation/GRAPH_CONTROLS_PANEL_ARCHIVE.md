# Graph Controls Panel Archive

This document temporarily archives the ORAN SIM left-side "graph controls" panel that was removed from the scene layout on April 2, 2026.

Original component:
- `src/components/modules/ai-toolbox/oran-simulation/components/GraphControls.tsx`

Original scene mount point:
- `src/components/modules/ai-toolbox/oran-simulation/OranSimulationScene.tsx`

Visible panel content:
- Eyebrow: `ORAN 控制台`
- Title: `图谱筛选器`
- Description: `搜索实体、切换视图，并筛出本次模拟推演所使用的知识切片。`
- Section: `搜索节点`
- Search placeholder: `搜索 HeadEase、TikTok、T1...`
- Section: `视图模式`
- Options: `全局视图` `来源视图` `用户视图` `平台视图` `风险视图` `结果路径视图`
- Section: `节点类型`
- Actions: `SHOW/HIDE` `重置`
- Types: `来源` `品牌` `产品` `用户` `平台` `卖点` `机制` `风险` `结果`
- Footer: `阅读提示` with expand/collapse toggle

Behavior snapshot:
- Supports node search with deferred query matching.
- Supports graph view switching.
- Supports node type filtering and reset.
- Supports reading hint expand/collapse.

Restore note:
- To bring this panel back, remount `GraphControls` inside `OranSimulationScene.tsx` and restore the previous two-column layout.
