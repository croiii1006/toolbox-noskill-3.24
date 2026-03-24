import { ReactNode, useState, useEffect } from 'react';
import { TopNav } from './TopNav';
import { DynamicSidebar } from './DynamicSidebar';
import { useModule } from '@/contexts/ModuleContext';
import { ModuleType } from '@/types/modules';

interface AppShellProps {
  children: (activeItem: string, onNavigate: (itemId: string) => void) => ReactNode;
}

const defaultItems: Record<ModuleType, string> = {
  'llm-console': 'playground',
  'geo-insights': 'dashboard',
  'ai-toolbox': 'app-plaza',
};

// Items that should trigger auto-collapse (tool/canvas views)
const toolItems = [
  'text-to-image',
  'ecommerce-assets',
  'reference-to-image',
  'text-to-video',
  'reference-to-video',
];

// Items that should trigger auto-expand (home/dashboard views)
const homeItems = [
  'app-plaza',
  'dashboard',
  'playground',
];

export function AppShell({ children }: AppShellProps) {
  const { activeModule, sidebarCollapsed, setSidebarCollapsed } = useModule();
  const [activeItem, setActiveItem] = useState(defaultItems[activeModule]);

  useEffect(() => {
    setActiveItem(defaultItems[activeModule]);
  }, [activeModule]);

  // Auto-collapse/expand based on active item
  useEffect(() => {
    if (toolItems.includes(activeItem)) {
      setSidebarCollapsed(true);
    } else if (homeItems.includes(activeItem)) {
      setSidebarCollapsed(false);
    }
  }, [activeItem, setSidebarCollapsed]);

  const isAppPlaza = activeModule === 'ai-toolbox' && activeItem === 'app-plaza';

  return (
    <div
      className="min-h-screen flex flex-col"
      style={isAppPlaza ? {
        background: 'radial-gradient(ellipse at 20% 20%, hsla(25, 100%, 92%, 0.6) 0%, transparent 50%), radial-gradient(ellipse at 80% 60%, hsla(340, 80%, 92%, 0.5) 0%, transparent 50%), radial-gradient(ellipse at 50% 90%, hsla(0, 0%, 100%, 1) 0%, transparent 60%), hsl(0, 0%, 100%)'
      } : { background: 'hsl(var(--background))' }}
    >
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <DynamicSidebar activeItem={activeItem} onItemClick={setActiveItem} />
        <main className="flex-1 overflow-auto pt-14 transition-all duration-300 pl-[64px]">
          {children(activeItem, setActiveItem)}
        </main>
      </div>
    </div>
  );
}
