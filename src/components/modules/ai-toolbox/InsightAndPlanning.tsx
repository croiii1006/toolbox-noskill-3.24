import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BrandHealth } from './BrandHealth';
import { CampaignPlanner } from './CampaignPlanner';
import { useTranslation } from 'react-i18next';

interface InsightAndPlanningProps {
  onNavigate: (itemId: string) => void;
}

export function InsightAndPlanning({ onNavigate }: InsightAndPlanningProps) {
  const { t } = useTranslation();

  return (
    <div className="animate-fade-in">
      <Tabs defaultValue="brand-health" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="brand-health">{t('sidebar.marketInsights')}</TabsTrigger>
          <TabsTrigger value="campaign-planner">{t('sidebar.planningScheme')}</TabsTrigger>
        </TabsList>
        <TabsContent value="brand-health">
          <BrandHealth onNavigate={onNavigate} />
        </TabsContent>
        <TabsContent value="campaign-planner">
          <CampaignPlanner />
        </TabsContent>
      </Tabs>
    </div>
  );
}
