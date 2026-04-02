import { TextToImage } from './TextToImage';
import { AppPlaza } from './AppPlaza';
import { InsightWorkbench } from './InsightWorkbench';
import { OranSimulation } from './OranSimulation';
import { ReplicateWorkspace } from './ReplicateWorkspace';
import { TikTokReport } from './TikTokReport';

interface AIToolboxModuleProps {
  activeItem: string;
  onNavigate: (itemId: string) => void;
}

const PlaceholderPage = ({ title, description }: { title: string; description: string }) => (
  <div className="text-center py-20 animate-fade-in">
    <h2 className="text-xl font-semibold mb-2">{title}</h2>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export function AIToolboxModule({ activeItem, onNavigate }: AIToolboxModuleProps) {
  switch (activeItem) {
    case 'app-plaza':
      return <AppPlaza onNavigate={onNavigate} />;
    case 'insight-workbench':
      return <InsightWorkbench onNavigate={onNavigate} />;
    case 'oran-simulation':
      return <OranSimulation onNavigate={onNavigate} />;
    case 'text-to-image':
      return <TextToImage onNavigate={onNavigate} />;
    case 'text-to-video':
      return <PlaceholderPage title="文生视频" description="根据文字描述生成短视频" />;
    case 'replicate-video':
      return <ReplicateWorkspace onNavigate={onNavigate} />;
    case 'tiktok-report':
      return <TikTokReport onNavigate={onNavigate} />;
    default:
      return <AppPlaza onNavigate={onNavigate} />;
  }
}
