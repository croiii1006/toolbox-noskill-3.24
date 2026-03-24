import { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, X, Play, Bookmark, BookmarkCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TikTokVideoCard, type TikTokVideo } from './TikTokVideoCard';
import { cn } from '@/lib/utils';
import { useTikTokInspiration } from '@/contexts/TikTokInspirationContext';
import { toast } from 'sonner';

const coverColors = [
  'from-rose-300 to-orange-200',
  'from-blue-300 to-cyan-200',
  'from-violet-300 to-pink-200',
  'from-emerald-300 to-teal-200',
  'from-amber-300 to-yellow-200',
  'from-indigo-300 to-purple-200',
];

const MOCK_VIDEOS: TikTokVideo[] = [
  {
    videoId: 'v001', videoUrl: '', originalUrl: 'https://www.tiktok.com/@miniso/video/001',
    durationText: '0:39', isMuted: false,
    title: 'MINISO 爆款收纳盒测评，超高性价比！家居必备好物推荐',
    likeCountText: '98.6K', viewCountText: '2.1M', likeCount: 98600, viewCount: 2100000,
    analysisTitle: '视频解析', analysisText: '#f #MINISO、策略: 通过场景化展示产品使用效果，结合价格锚点突出性价比',
    metrics: { viewsText: '2.1M', likesText: '98.6K', gmvText: '$12.5K', trendText: '+15.2%' },
    hitRate: 95, hitRateText: '95%', source: 'tiktok',
  },
  {
    videoId: 'v002', videoUrl: '', originalUrl: 'https://www.tiktok.com/@user/video/002',
    durationText: '0:28', isMuted: true,
    title: '这个收纳神器太好用了！小空间大容量，租房党必看',
    likeCountText: '45.2K', viewCountText: '890K', likeCount: 45200, viewCount: 890000,
    analysisTitle: '视频解析', analysisText: '策略: 痛点切入 + before/after 对比，视觉冲击力强',
    metrics: { viewsText: '890K', likesText: '45.2K', gmvText: '$8.3K', trendText: '+22.1%' },
    hitRate: 88, hitRateText: '88%', source: 'tiktok',
  },
  {
    videoId: 'v003', videoUrl: '', originalUrl: 'https://www.tiktok.com/@user/video/003',
    durationText: '0:45', isMuted: false,
    title: '厨房收纳终极方案！10件好物让厨房整洁翻倍',
    likeCountText: '72.1K', viewCountText: '1.5M', likeCount: 72100, viewCount: 1500000,
    analysisTitle: '视频解析', analysisText: '策略: 清单类内容 + 实用场景演示，完播率高',
    metrics: { viewsText: '1.5M', likesText: '72.1K', gmvText: '$18.2K', trendText: '+8.7%' },
    hitRate: 92, hitRateText: '92%', source: 'tiktok',
  },
  {
    videoId: 'v004', videoUrl: '', originalUrl: 'https://www.tiktok.com/@user/video/004',
    durationText: '0:33', isMuted: false,
    title: 'Unboxing haul! Best home organization products from TikTok shop',
    likeCountText: '156K', viewCountText: '3.8M', likeCount: 156000, viewCount: 3800000,
    analysisTitle: '视频解析', analysisText: '策略: 开箱形式 + 惊喜感叠加，利用好奇心驱动观看',
    metrics: { viewsText: '3.8M', likesText: '156K', gmvText: '$32.1K', trendText: '+45.3%' },
    hitRate: 97, hitRateText: '97%', source: 'tiktok',
  },
];

interface TikTokReportResultsProps {
  category: string;
  sellingPoints: string[];
  onBack: () => void;
  onReplicate: (videoId: string, videoTitle?: string, viewCountText?: string, likeCountText?: string) => void;
}

export function TikTokReportResults({ category, sellingPoints, onBack, onReplicate }: TikTokReportResultsProps) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const { saveVideo, unsaveVideo, isVideoSaved } = useTikTokInspiration();

  const goPrev = useCallback(() => {
    setPreviewIndex((i) => (i !== null && i > 0 ? i - 1 : i));
  }, []);

  const goNext = useCallback(() => {
    setPreviewIndex((i) => (i !== null && i < MOCK_VIDEOS.length - 1 ? i + 1 : i));
  }, []);

  useEffect(() => {
    if (previewIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'Escape') setPreviewIndex(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [previewIndex, goPrev, goNext]);

  const handleToggleSave = (video: TikTokVideo) => {
    if (isVideoSaved(video.videoId)) {
      unsaveVideo(video.videoId);
      toast.success('已从灵感库移除');
    } else {
      saveVideo(video);
      toast.success('已保存到灵感库');
    }
  };

  const previewVideo = previewIndex !== null ? MOCK_VIDEOS[previewIndex] : null;
  const previewColorIdx = previewVideo
    ? Math.abs(previewVideo.videoId.charCodeAt(previewVideo.videoId.length - 1)) % coverColors.length
    : 0;

  return (
    <div className="min-h-full bg-background">
      {/* Fullscreen preview overlay */}
      {previewVideo && (
        <div
          className="fixed inset-0 z-50 bg-foreground/90 flex items-center justify-center"
          onClick={() => setPreviewIndex(null)}
        >
          <button
            onClick={() => setPreviewIndex(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center hover:bg-background/40 transition-colors z-10"
          >
            <X className="w-5 h-5 text-background" />
          </button>

          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
            <span className="text-background/70 text-sm font-medium">
              {previewIndex! + 1} / {MOCK_VIDEOS.length}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); handleToggleSave(previewVideo); }}
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
                isVideoSaved(previewVideo.videoId)
                  ? 'bg-foreground/30 text-yellow-400'
                  : 'bg-background/20 text-background hover:bg-background/40'
              )}
            >
              {isVideoSaved(previewVideo.videoId) ? (
                <BookmarkCheck className="w-4 h-4" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            disabled={previewIndex === 0}
            className={cn(
              'absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-colors z-10',
              previewIndex === 0
                ? 'bg-background/10 text-background/30 cursor-not-allowed'
                : 'bg-background/20 backdrop-blur-sm text-background hover:bg-background/40'
            )}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            disabled={previewIndex === MOCK_VIDEOS.length - 1}
            className={cn(
              'absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-colors z-10',
              previewIndex === MOCK_VIDEOS.length - 1
                ? 'bg-background/10 text-background/30 cursor-not-allowed'
                : 'bg-background/20 backdrop-blur-sm text-background hover:bg-background/40'
            )}
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="w-full max-w-sm aspect-[9/16] relative" onClick={(e) => e.stopPropagation()}>
            {previewVideo.videoUrl ? (
              <video
                key={previewVideo.videoId}
                src={previewVideo.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain rounded-2xl"
              />
            ) : (
              <div className={cn('w-full h-full rounded-2xl bg-gradient-to-br flex flex-col items-center justify-center gap-3', coverColors[previewColorIdx])}>
                <Play className="w-16 h-16 text-foreground/20" />
                <p className="text-foreground/40 text-sm font-medium max-w-[80%] text-center line-clamp-2">{previewVideo.title}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/20">
        <div className="px-6 py-4 max-w-7xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-medium text-foreground truncate">TikTok 爆款视频匹配</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">{category}</span>
              {sellingPoints.map((p) => (
                <span key={p} className="text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">{p}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm text-muted-foreground">共 {MOCK_VIDEOS.length} 个结果</span>
          </div>
        </div>
      </div>

      {/* Video grid */}
      <div className="px-6 py-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MOCK_VIDEOS.map((video, idx) => (
            <div key={video.videoId} className="relative">
              <TikTokVideoCard
                video={video}
                onReplicate={() => onReplicate(video.videoId, video.title, video.viewCountText, video.likeCountText)}
                onPreview={() => setPreviewIndex(idx)}
              />
              {/* Save/Bookmark button overlay */}
              <button
                onClick={() => handleToggleSave(video)}
                className={cn(
                  'absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center transition-all z-[5]',
                  isVideoSaved(video.videoId)
                    ? 'bg-foreground/80 text-yellow-400'
                    : 'bg-foreground/40 backdrop-blur-sm text-background/80 hover:bg-foreground/60'
                )}
              >
                {isVideoSaved(video.videoId) ? (
                  <BookmarkCheck className="w-4 h-4" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
