export type SimulationPlatform =
  | "douyin"
  | "xiaohongshu"
  | "tmall"
  | "jd"
  | "wechat";

export type SimulationCycle = 7 | 14 | 30 | 60;

export type OranSimWorkspaceView =
  | "checklist"
  | "files"
  | "setup"
  | "parsed"
  | "scope"
  | "graph"
  | "environment"
  | "clusters"
  | "activation"
  | "monitor"
  | "report";

export type OranSimRunTab =
  | "diffusion"
  | "segments"
  | "lifecycle"
  | "compare";

export interface OranSimulationSetupState {
  projectName: string;
  brandName: string;
  category: string;
  simulationQuestion: string;
  insightMemoryId: string | null;
  planningMemoryId: string | null;
  supplementalMemoryIds: string[];
  cycleDays: SimulationCycle;
  platforms: SimulationPlatform[];
  mainDirection: string;
  compareDirections: string[];
  competitorDisturbance: boolean;
  riskFeedback: boolean;
}

export interface OranSimulationSceneSnapshot {
  progress: number;
  selectedView: OranSimWorkspaceView;
  runTab: OranSimRunTab;
  selectedNodeId: string | null;
}
