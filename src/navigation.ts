import { ModuleType } from "@/types/modules";

export interface RouteState {
  activeModule: ModuleType;
  activeItem: string;
}

interface RouteDefinition extends RouteState {
  path: string;
}

export const moduleDefaultItems: Record<ModuleType, string> = {
  "llm-console": "playground",
  "geo-insights": "dashboard",
  "ai-toolbox": "app-plaza",
};

const routeDefinitions: RouteDefinition[] = [
  { activeModule: "llm-console", activeItem: "playground", path: "/llm-console/playground" },
  { activeModule: "llm-console", activeItem: "dashboard", path: "/llm-console/dashboard" },
  { activeModule: "llm-console", activeItem: "tokens", path: "/llm-console/tokens" },
  { activeModule: "llm-console", activeItem: "usage", path: "/llm-console/usage" },
  { activeModule: "llm-console", activeItem: "wallet", path: "/llm-console/wallet" },
  { activeModule: "llm-console", activeItem: "profile", path: "/llm-console/profile" },
  { activeModule: "geo-insights", activeItem: "dashboard", path: "/geo-insights/dashboard" },
  { activeModule: "geo-insights", activeItem: "write-article", path: "/geo-insights/write-article" },
  { activeModule: "geo-insights", activeItem: "my-articles", path: "/geo-insights/my-articles" },
  { activeModule: "geo-insights", activeItem: "audit-history", path: "/geo-insights/audit-history" },
  { activeModule: "geo-insights", activeItem: "competitor", path: "/geo-insights/competitor" },
  { activeModule: "geo-insights", activeItem: "settings", path: "/geo-insights/settings" },
  { activeModule: "ai-toolbox", activeItem: "app-plaza", path: "/ai-toolbox/app-plaza" },
  { activeModule: "ai-toolbox", activeItem: "insight-workbench", path: "/ai-toolbox/insight-workbench" },
  { activeModule: "ai-toolbox", activeItem: "oran-simulation", path: "/ai-toolbox/oran-simulation" },
  { activeModule: "ai-toolbox", activeItem: "skills", path: "/ai-toolbox/skills" },
  { activeModule: "ai-toolbox", activeItem: "text-to-image", path: "/ai-toolbox/text-to-image" },
  { activeModule: "ai-toolbox", activeItem: "text-to-video", path: "/ai-toolbox/text-to-video" },
  { activeModule: "ai-toolbox", activeItem: "replicate-video", path: "/ai-toolbox/replicate-video" },
  { activeModule: "ai-toolbox", activeItem: "tiktok-report", path: "/ai-toolbox/tiktok-report" },
  { activeModule: "ai-toolbox", activeItem: "social-media-publishing", path: "/ai-toolbox/social-media-publishing" },
];

const routeByKey = new Map(routeDefinitions.map((route) => [`${route.activeModule}:${route.activeItem}`, route]));
const routeByPath = new Map(routeDefinitions.map((route) => [route.path, route]));

export const DEFAULT_PATH = "/ai-toolbox/app-plaza";

const itemAliases: Record<string, string> = {
  "oran-gen": "skills",
  "reference-to-video": "replicate-video",
};

const toolItemIds = new Set([
  "oran-simulation",
  "text-to-image",
  "text-to-video",
  "replicate-video",
  "social-media-publishing",
]);

const homeItemIds = new Set([
  "app-plaza",
  "dashboard",
  "playground",
]);

export function isKnownModule(module: string): module is ModuleType {
  return module in moduleDefaultItems;
}

export function getDefaultPathForModule(module: ModuleType): string {
  return getPathForModuleItem(module, moduleDefaultItems[module]) ?? DEFAULT_PATH;
}

export function getPathForModuleItem(module: ModuleType, item: string): string | null {
  const resolvedItem = itemAliases[item] ?? item;

  return routeByKey.get(`${module}:${resolvedItem}`)?.path ?? null;
}

export function getRouteStateFromPathname(pathname: string): RouteState | null {
  const normalizedPath = normalizePath(pathname);
  const route = routeByPath.get(normalizedPath);

  if (!route) {
    return null;
  }

  return {
    activeModule: route.activeModule,
    activeItem: route.activeItem,
  };
}

export function isToolItem(item: string): boolean {
  return toolItemIds.has(item);
}

export function isHomeItem(item: string): boolean {
  return homeItemIds.has(item);
}

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}
