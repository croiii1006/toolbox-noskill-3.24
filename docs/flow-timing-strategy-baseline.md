# Flow Timing Strategy Baseline

This document preserves the timing strategy before the April 23, 2026 duration update, so the old behavior can be restored later if needed.

## Previous Durations

- Hub report reading progress checkpoints: 0.7s, 1.5s, 2.4s.
- Hub report generation progress checkpoints: 1.0s, 2.2s, 3.6s, 5.0s, 6.6s.
- Hub report generation completion timer: 8.2s.
- OranGen phase countdown targets:
  - Viral video crawl: 12s.
  - Reverse prompt: 9s.
  - Replicate video: 12s.
- OranGen actual stage waits used random helper delays:
  - `subDelay`: 1.0s to 2.0s.
  - `randDelay`: 1.5s to 3.5s.
  - `backendDelay`: 3.0s to 6.0s.

## Current Strategy After Update

- Keep the same staged UI and log order.
- Hub report generation scales the existing progress checkpoint ratios to the target total duration per report type.
- OranGen keeps the same random sub-step cadence, then waits until the phase deadline before revealing the next user action or final result.

## Updated Target Durations

- Insight report generation: 3m 44s.
- Strategy report generation: 3m 11s.
- Viral video crawl: 1m 22s.
- Reverse prompt: 33s.
- Replicate video: 4m 33s.
