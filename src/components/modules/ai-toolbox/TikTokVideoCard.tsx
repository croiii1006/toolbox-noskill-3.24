import { useState } from 'react';
import { Play, Eye, Heart, ShoppingCart, TrendingUp, Volume2, VolumeX, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export interface TikTokVideo {
  videoId: string;
  videoUrl: string;
  originalUrl?: string;
  durationText: string;
  isMuted: boolean;
  title: string;
  likeCountText: string;
  viewCountText: string;
  likeCount: number;
  viewCount: number;
  analysisTitle: string;
  analysisText: string;
  metrics: {
    viewsText: string;
    likesText: string;
    gmvText: string;
    trendText: string;
  };
  hitRate: number;
  hitRateText: string;
  source?: 'tiktok';
}

const coverColors = [
  'from-rose-300 to-orange-200',
  'from-blue-300 to-cyan-200',
  'from-violet-300 to-pink-200',
  'from-emerald-300 to-teal-200',
  'from-amber-300 to-yellow-200',
  'from-indigo-300 to-purple-200',
];

interface TikTokVideoCardProps {
  video: TikTokVideo;
  onReplicate: () => void;
  onPreview?: () => void;
}

export function TikTokVideoCard({ video, onReplicate, onPreview }: TikTokVideoCardProps) {
  const [muted, setMuted] = useState(video.isMuted);
  const colorIdx = Math.abs(video.videoId.charCodeAt(video.videoId.length - 1)) % coverColors.length;

  return (
    <div className="rounded-2xl border border-border/30 bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
      {/* Video preview area - portrait 9:16 */}
      <div
        onClick={() => onPreview?.()}
        className={cn('relative aspect-[9/16] bg-gradient-to-br flex items-center justify-center cursor-pointer shrink-0', coverColors[colorIdx])}
      >
        {video.videoUrl ? (
          <video src={video.videoUrl} muted={muted} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <Play className="w-10 h-10 text-foreground/15" />
        )}

        {/* Bottom fade overlay */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-card to-transparent pointer-events-none" />

        {/* Duration - bottom left */}
        <div className="absolute bottom-2 left-2 bg-foreground/80 text-background text-[10px] font-mono px-1.5 py-0.5 rounded-md">
          {video.durationText}
        </div>

        {/* Mute toggle - bottom right */}
        <button
          onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
          className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-foreground/25 backdrop-blur-sm flex items-center justify-center hover:bg-foreground/40 transition-colors"
        >
          {muted ? <VolumeX className="w-3 h-3 text-background" /> : <Volume2 className="w-3 h-3 text-background" />}
        </button>

        {/* Like count highlight - top right */}
        <div className="absolute top-2 right-2 bg-foreground/80 text-background text-[10px] font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1">
          <Heart className="w-2.5 h-2.5 fill-current" />
          {video.likeCountText}
        </div>
      </div>

      {/* Content - flex col to pin bottom elements */}
      <div className="p-3 flex flex-col flex-1">
        {/* Variable height area */}
        <div className="flex-1 space-y-2.5 mb-2.5">
          {/* Title - fixed 2 lines */}
          <h3 className="text-xs font-medium text-foreground leading-snug line-clamp-2 min-h-[2.5em]">{video.title}</h3>

          {/* Analysis - fixed 2 lines */}
          <div>
            <p className="text-[10px] font-medium text-muted-foreground mb-0.5">{video.analysisTitle}</p>
            <p className="text-[11px] text-foreground/70 leading-relaxed line-clamp-2 min-h-[2.4em]">{video.analysisText}</p>
          </div>
        </div>

        {/* Pinned bottom area - always same position */}
        <div className="space-y-2.5">
          {/* 4-grid metrics */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 py-1">
            <div className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-sm font-semibold text-foreground tracking-tight">{video.metrics.viewsText}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-sm font-semibold text-foreground tracking-tight">{video.metrics.likesText}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShoppingCart className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-sm font-semibold text-foreground tracking-tight">{video.metrics.gmvText}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-accent shrink-0" />
              <span className="text-sm font-semibold text-accent tracking-tight">{video.metrics.trendText}</span>
            </div>
          </div>

          {/* Hit rate */}
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] text-muted-foreground">卖点命中率</span>
              <span className="text-[11px] font-semibold text-foreground">{video.hitRateText}</span>
            </div>
            <Progress value={video.hitRate} className="h-1" />
          </div>

          {/* CTA buttons */}
          <div className="flex items-center gap-2">
            {video.originalUrl && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="flex-1 rounded-full h-8 font-medium text-xs gap-1.5"
              >
                <a href={video.originalUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="w-3.5 h-3.5" />
                  原链接
                </a>
              </Button>
            )}
            <Button
              onClick={onReplicate}
              size="sm"
              className="flex-1 rounded-full h-8 font-medium text-xs gap-1.5 bg-foreground text-background hover:bg-foreground/90"
            >
              <Copy className="w-3.5 h-3.5" />
              复刻
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
