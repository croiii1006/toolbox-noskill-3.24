import { useState, useRef } from 'react';
import { Play, Pause, ExternalLink, Copy, Volume2, VolumeX, Eye, Heart, ShoppingCart, TrendingUp, X, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CandidateVideo } from './useSkillsEngine';
import { cn } from '@/lib/utils';

interface VideoCandidateRowProps {
  videos: CandidateVideo[];
  onSelect: (video: CandidateVideo) => void;
  onPreview?: (video: CandidateVideo) => void;
  selectedVideoId?: string | null;
  disabled?: boolean;
}

const coverColors = [
'from-violet-200 to-violet-100',
'from-blue-200 to-blue-100',
'from-amber-200 to-amber-100',
'from-emerald-200 to-emerald-100',
'from-rose-200 to-rose-100'];


export function VideoCandidateRow({ videos, onSelect, onPreview, selectedVideoId, disabled }: VideoCandidateRowProps) {
  const [detailVideo, setDetailVideo] = useState<CandidateVideo | null>(null);
  const [detailIndex, setDetailIndex] = useState(0);

  const displayVideos = videos.slice(0, 4);

  const openDetail = (video: CandidateVideo, idx: number) => {
    setDetailVideo(video);
    setDetailIndex(idx);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5">
        {displayVideos.map((video, i) =>
        <div
          key={video.id}
          className="rounded-xl border border-border/30 bg-card overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
          onClick={() => openDetail(video, i)}>
          
            {/* Cover */}
            <div
            className={`relative aspect-[9/14] bg-gradient-to-br ${coverColors[i % coverColors.length]} flex items-center justify-center`}>
            
              <Play className="w-7 h-7 text-foreground/15" />
              <div className="absolute bottom-2 left-2 bg-foreground/75 text-background text-[10px] font-mono px-1.5 py-0.5 rounded-md">
                {video.duration}
              </div>
              <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-foreground/20 flex items-center justify-center">
                <Volume2 className="w-3 h-3 text-background" />
              </div>
            </div>

            {/* Content */}
            <div className="p-3 space-y-2.5">
              {/* Title - no likes */}
              <p className="text-xs font-medium text-foreground leading-snug line-clamp-2">{video.title}</p>

              {video.strategy &&
            <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                  策略:{video.strategy}
                </p>
            }

              {/* Stats */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-muted-foreground/60" />
                  <span className="text-[11px] text-foreground/80">{video.views}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShoppingCart className="w-3.5 h-3.5 text-muted-foreground/60" />
                  <span className="text-[11px] text-foreground/80">{video.salesCount ?? 0}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-muted-foreground/60" />
                  <span className="text-[11px] text-foreground/80">{video.likes}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-muted-foreground/60" />
                  <span className="text-[11px] text-foreground/80">{video.growthRate ?? '0%'}</span>
                </div>
              </div>

              {/* Selling point hit rate */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-muted-foreground">卖点命中率</span>
                  <span className="text-[11px] font-semibold text-foreground">{video.sellingPointHitRate ?? 0}%</span>
                </div>
                <Progress value={video.sellingPointHitRate ?? 0} className="h-1" />
              </div>

              {/* Action buttons */}
              <div className="flex gap-1.5 pt-0.5">
                {video.tiktokUrl &&
              <a
                href={video.tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex-1 h-8 rounded-full border border-border/50 flex items-center justify-center gap-1 text-[11px] text-muted-foreground hover:text-foreground hover:border-border transition-colors">
                
                    <ExternalLink className="w-3 h-3" />
                    原链接
                  </a>
              }
                <button
                onClick={(e) => {e.stopPropagation();if (!disabled) onSelect(video);}}
                disabled={disabled && selectedVideoId !== video.id}
                className={cn(
                  'flex-1 h-8 rounded-full flex items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                  selectedVideoId === video.id ?
                  'bg-muted text-foreground' :
                  disabled ?
                  'bg-muted/50 text-muted-foreground/50 cursor-not-allowed' :
                  'bg-foreground text-background hover:bg-foreground/90'
                )}>
                
                  <Copy className="w-3 h-3" />
                  {selectedVideoId === video.id ? '已选择' : '复刻'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detailVideo} onOpenChange={(open) => !open && setDetailVideo(null)}>
        <DialogContent className="max-w-3xl p-0 rounded-2xl overflow-hidden [&>button]:hidden border-border/30 shadow-2xl">
          {detailVideo &&
          <VideoDetailDialog
            video={detailVideo}
            colorIndex={detailIndex}
            selectedVideoId={selectedVideoId}
            onSelect={(v) => {onSelect(v);setDetailVideo(null);}}
            onClose={() => setDetailVideo(null)} />

          }
        </DialogContent>
      </Dialog>
    </div>);

}

/* ─── Detail Dialog (extracted component) ─── */

interface VideoDetailDialogProps {
  video: CandidateVideo;
  colorIndex: number;
  selectedVideoId?: string | null;
  onSelect: (video: CandidateVideo) => void;
  onClose: () => void;
}

function VideoDetailDialog({ video, colorIndex, selectedVideoId, onSelect, onClose }: VideoDetailDialogProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  return (
    <div className="flex h-[75vh] max-h-[680px]">
      {/* Left: Video player area */}
      <div
        className={`relative w-[340px] shrink-0 bg-gradient-to-br ${coverColors[colorIndex % coverColors.length]} flex items-center justify-center group`}>
        
        {/* Center play/pause */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-16 h-16 rounded-full bg-foreground/20 backdrop-blur-sm flex items-center justify-center hover:bg-foreground/30 transition-colors">
          
          {isPlaying ?
          <Pause className="w-7 h-7 text-background" /> :
          <Play className="w-7 h-7 text-background ml-1" />
          }
        </button>

        {/* Bottom controls bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/40 to-transparent flex items-center justify-between">
          <span className="bg-foreground/80 text-background text-xs font-mono px-2.5 py-1 rounded-lg">
            {video.duration}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="w-9 h-9 rounded-full bg-foreground/25 backdrop-blur-sm flex items-center justify-center hover:bg-foreground/35 transition-colors">
              
              {isMuted ?
              <VolumeX className="w-4 h-4 text-background" /> :
              <Volume2 className="w-4 h-4 text-background" />
              }
            </button>
            <button
              className="w-9 h-9 rounded-full bg-foreground/25 backdrop-blur-sm flex items-center justify-center hover:bg-foreground/35 transition-colors">
              
              <Maximize2 className="w-4 h-4 text-background" />
            </button>
          </div>
        </div>
      </div>

      {/* Right: Info (scrollable text) + Fixed bottom stats/actions */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border/20 flex items-center justify-between shrink-0">
          <span className="text-sm font-medium text-foreground">视频详情</span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
            
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Scrollable text content */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-5 py-4 space-y-4">
            <h3 className="text-base font-medium text-foreground leading-snug">{video.title}</h3>
            {video.strategy &&
            <div>
                <p className="text-xs text-muted-foreground mb-1">{video.analysis || '视频解析'}</p>
                <p className="text-sm text-foreground/80 leading-relaxed">策略：{video.strategy}</p>
              </div>
            }
          </div>
        </ScrollArea>

        {/* Fixed bottom: stats + actions */}
        <div className="shrink-0 border-t border-border/20 px-5 py-4 space-y-4 border-0">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <div className="flex items-center gap-[40px]">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground font-light">{video.views}</span>
            </div>
            <div className="text-left pr-0 flex items-center justify-start px-[28px] gap-0 pl-[75px]">
              <ShoppingCart className="w-4 h-4 text-muted-foreground text-left mx-[50px] mr-[50px] ml-0" />
              <span className="text-sm text-foreground font-light">{video.salesCount ?? 0}</span>
            </div>
            <div className="flex items-center gap-[40px]">
              <Heart className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground font-light">{video.likes}</span>
            </div>
            <div className="flex items-center justify-start gap-0 pl-[75px]">
              <TrendingUp className="w-4 h-4 text-orange-500 mr-[50px]" />
              <span className="text-sm text-foreground font-light">{video.growthRate ?? '0%'}</span>
            </div>
          </div>

          {/* Selling point hit rate - highlighted */}
          <div className="rounded-xl border-orange-500/15 p-3 bg-transparent border-0 px-px">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm text-muted-foreground">卖点命中率</span>
              <span className="font-light text-xl text-accent">{video.sellingPointHitRate ?? 0}%
                
              </span>
            </div>
            <Progress value={video.sellingPointHitRate ?? 0} className="h-1.5 [&>div]:bg-orange-500" />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {video.tiktokUrl &&
            <a
              href={video.tiktokUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-11 rounded-full border border-border/50 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors">
              
                <ExternalLink className="w-3.5 h-3.5" />
                原链接
              </a>
            }
            <Button
              onClick={() => onSelect(video)}
              className={cn(
                'flex-1 rounded-full h-11 font-medium text-sm gap-2',
                selectedVideoId === video.id ?
                'bg-muted text-foreground hover:bg-muted/80' :
                'bg-foreground text-background hover:bg-foreground/90'
              )}>
              
              <Copy className="w-4 h-4" />
              {selectedVideoId === video.id ? '已选择' : '一键复刻'}
            </Button>
          </div>
        </div>
      </div>
    </div>);

}