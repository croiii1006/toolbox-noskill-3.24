import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ModuleType } from '@/types/modules';
import { getDefaultPathForModule, getPathForModuleItem, getRouteStateFromPathname, moduleDefaultItems } from '@/navigation';

interface ModuleContextType {
  activeModule: ModuleType;
  activeItem: string;
  setActiveModule: (module: ModuleType) => void;
  navigateToItem: (itemId: string, module?: ModuleType) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

export function ModuleProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const routeState = useMemo(() => getRouteStateFromPathname(location.pathname), [location.pathname]);
  const activeModule = routeState?.activeModule ?? 'ai-toolbox';
  const activeItem = routeState?.activeItem ?? moduleDefaultItems[activeModule];

  const setActiveModule = useCallback((module: ModuleType) => {
    navigate(getDefaultPathForModule(module));
  }, [navigate]);

  const navigateToItem = useCallback((itemId: string, module: ModuleType = activeModule) => {
    const path = getPathForModuleItem(module, itemId);

    if (module === 'ai-toolbox' && (itemId === 'skills' || itemId === 'oran-gen')) {
      try {
        localStorage.removeItem('skills-active-history-id');
      } catch {
        // Ignore storage failures and continue navigation.
      }
    }

    if (path) {
      navigate(path);
    }
  }, [activeModule, navigate]);

  const value = useMemo(() => ({
    activeModule,
    activeItem,
    setActiveModule,
    navigateToItem,
    sidebarCollapsed,
    setSidebarCollapsed,
  }), [activeItem, activeModule, navigateToItem, setActiveModule, sidebarCollapsed]);

  return (
    <ModuleContext.Provider value={value}>
      {children}
    </ModuleContext.Provider>
  );
}

export function useModule() {
  const context = useContext(ModuleContext);
  if (context === undefined) {
    throw new Error('useModule must be used within a ModuleProvider');
  }
  return context;
}
