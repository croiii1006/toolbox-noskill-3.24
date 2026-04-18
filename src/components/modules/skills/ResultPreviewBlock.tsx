import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResultPreviewBlockProps {
  resultVideo: {
    url: string;
    cover: string;
  };
}

export function ResultPreviewBlock({ resultVideo }: ResultPreviewBlockProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm">
      <div className="border-b border-border/30 px-5 py-3">
        <h4 className="text-sm font-normal text-foreground">复刻视频预览</h4>
      </div>

      <div className="relative flex aspect-video items-center justify-center bg-neutral-50">
        <video
          src={resultVideo.url}
          className="result-preview-video h-full w-full object-contain"
          controls
          autoPlay
          playsInline
          preload="metadata"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 p-4">
        <Button asChild variant="outline" size="sm" className="gap-1.5 rounded-lg border-border/50 text-xs">
          <a href={resultVideo.url} download>
            <Download className="h-3.5 w-3.5" /> 导出下载
          </a>
        </Button>
      </div>
    </div>
  );
}
