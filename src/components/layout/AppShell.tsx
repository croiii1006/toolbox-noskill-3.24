import { ReactNode, useEffect } from 'react';
import { TopNav } from './TopNav';
import { DynamicSidebar } from './DynamicSidebar';
import { useModule } from '@/contexts/ModuleContext';
import { isHomeItem, isToolItem } from '@/navigation';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { activeModule, activeItem, setSidebarCollapsed } = useModule();

  // Auto-collapse/expand based on active item
  useEffect(() => {
    if (isToolItem(activeItem)) {
      setSidebarCollapsed(true);
    } else if (isHomeItem(activeItem)) {
      setSidebarCollapsed(false);
    }
  }, [activeItem, setSidebarCollapsed]);

  const isAppPlaza = activeModule === 'ai-toolbox' && activeItem === 'app-plaza';
  const isInsightWorkbench = activeModule === 'ai-toolbox' && activeItem === 'insight-workbench';
  const isOranSimulation = activeModule === 'ai-toolbox' && activeItem === 'oran-simulation';

  return (
    <div
      className="min-h-screen flex flex-col"
      style={isAppPlaza ? {
        background: 'radial-gradient(ellipse at 20% 20%, hsla(25, 100%, 92%, 0.6) 0%, transparent 50%), radial-gradient(ellipse at 80% 60%, hsla(340, 80%, 92%, 0.5) 0%, transparent 50%), radial-gradient(ellipse at 50% 90%, hsla(0, 0%, 100%, 1) 0%, transparent 60%), hsl(0, 0%, 100%)'
      } : { background: 'hsl(var(--background))' }}
    >
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <DynamicSidebar />
        <main
          className={`min-h-0 flex-1 pt-14 transition-all duration-300 pl-[64px] ${
            isInsightWorkbench || isOranSimulation ? 'overflow-hidden' : 'overflow-auto'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
