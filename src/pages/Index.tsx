import { AppShell } from '@/components/layout/AppShell';
import { ModuleProvider, useModule } from '@/contexts/ModuleContext';
import { PendingAssetsProvider } from '@/contexts/PendingAssetsContext';
import { MemoryProvider } from '@/contexts/MemoryContext';
import { LLMConsoleModule } from '@/components/modules/llm-console/LLMConsoleModule';
import { GEOInsightsModule } from '@/components/modules/geo-insights/GEOInsightsModule';
import { AIToolboxModule } from '@/components/modules/ai-toolbox/AIToolboxModule';

function ModuleRenderer() {
  const { activeModule, activeItem, navigateToItem } = useModule();

  switch (activeModule) {
    case 'llm-console':
      return <LLMConsoleModule activeItem={activeItem} />;
    case 'geo-insights':
      return <GEOInsightsModule activeItem={activeItem} />;
    case 'ai-toolbox':
      return <AIToolboxModule activeItem={activeItem} onNavigate={navigateToItem} />;
    default:
      return <LLMConsoleModule activeItem={activeItem} />;
  }
}

const Index = () => {
  return (
    <ModuleProvider>
      <PendingAssetsProvider>
        <MemoryProvider>
          <AppShell>
            <ModuleRenderer />
          </AppShell>
        </MemoryProvider>
      </PendingAssetsProvider>
    </ModuleProvider>
  );
};

export default Index;
