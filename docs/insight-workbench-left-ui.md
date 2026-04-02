# Insight Workbench Left UI

## Scope

This document records the current left-column UI for `InsightWorkbench` in both:

- processing state
- completed/report state

File:

- `src/components/modules/ai-toolbox/InsightWorkbench.tsx`

## Core Rule

The completed state's left column should preserve the same narrative order as the processing page.

The order is:

1. user request bubble
2. memory/reference reading
3. brand/context organization
4. report generation progress
5. final completion note

The completed page should feel like the processing page has been compressed and frozen, not rebuilt as a different dashboard.

## Processing State Left Layout

### 1. Request Bubble

- top right aligned
- small label above bubble
- rounded bubble

### 2. Reading Section

Title examples:

- `正在读取参考资料...`
- `正在读取任务输入...`

Structure:

- file icon on the left
- file name above when there are multiple memory files
- gray reading text box on the right
- current file icon uses pulse state
- completed file icon returns to default static state

Behavior:

- documents are read one by one
- next document appears only after the previous one finishes
- all documents must finish before the next section appears

### 3. Brand Organization Section

Title examples:

- `正在整理品牌信息...`
- `已完成品牌信息整理...`

Structure:

- one status row
- brand/category/competitor details listed underneath

### 4. Generation Section

Title examples:

- `正在为您生成洞察报告...`
- `已完成洞察报告生成...`

Structure:

- task list with small icons
- active item is the current step
- completed items switch to check state

## Completed State Left Layout

The completed state should keep the same order as the processing state, but in a denser form.

### 1. Request Bubble

- keep the same user bubble at the top

### 2. Completed Reading Section

- title: `已完成参考资料读取...`
- compact document cards
- each card contains:
  - file icon
  - file name
  - `.md / 记忆库文档`
  - `已接入` pill
  - short gray preview box

### 3. Completed Brand Organization Section

- title: `已完成品牌信息整理...`
- one completed status line
- summary fields rendered as a compact vertical list

### 4. Completed Generation Section

- title: `已完成洞察报告生成...`
- compact completed step list

### 5. Final Completion Note

- one lightweight completion block at the bottom
- explains that process history stays on the left and report board stays on the right

## Spacing Guide

Main spacing tokens currently used in `InsightWorkbench.tsx`:

- large section spacing: `space-y-5` or `space-y-6`
- section internal spacing: `space-y-3` / `space-y-3.5`
- compact list spacing: `space-y-1.5` / `space-y-2`
- indented process list: `pl-12`, `pl-14`, `pl-5`

If future adjustments are needed, prefer changing these spacing groups consistently instead of tuning each node independently.

## Design Intent

- minimal
- light
- sequential
- process-first on the left
- report-first on the right
- avoid making the completed left side look like a different product page
