import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { HistoryStatus } from '@/types/history';
import type { TikTokVideo } from '@/components/modules/ai-toolbox/TikTokVideoCard';

/* ─── Types ─── */

export interface ReportHistoryItem {
  id: string;
  category: string;
  sellingPoints: string[];
  createdAt: string;
  videoCount: number;
  status: HistoryStatus;
}

export interface SavedInspirationVideo {
  id: string;
  videoId: string;
  title: string;
  views: string;
  likes: string;
  originalUrl?: string;
  savedAt: string;
  coverGradient: string;
  source: 'tiktok-report';
  /** Full TikTokVideo data for downstream use */
  raw: TikTokVideo;
}

interface TikTokInspirationContextValue {
  /** Saved inspiration videos (synced to replicate workspace) */
  savedVideos: SavedInspirationVideo[];
  saveVideo: (video: TikTokVideo) => void;
  unsaveVideo: (videoId: string) => void;
  isVideoSaved: (videoId: string) => boolean;

  /** Report search history */
  reportHistory: ReportHistoryItem[];
  addReportHistory: (item: Omit<ReportHistoryItem, 'id' | 'createdAt'>) => string;
  updateReportHistoryStatus: (id: string, status: HistoryStatus) => void;
  deleteReportHistory: (id: string) => void;
}

const SAVED_VIDEOS_KEY = 'tiktok-saved-inspiration';
const REPORT_HISTORY_KEY = 'tiktok-report-history';

const coverGradients = [
  'from-rose-500/60 to-orange-400/60',
  'from-blue-500/60 to-cyan-400/60',
  'from-violet-500/60 to-purple-400/60',
  'from-emerald-500/60 to-green-400/60',
  'from-amber-500/60 to-yellow-400/60',
  'from-pink-500/60 to-rose-400/60',
  'from-indigo-500/60 to-blue-400/60',
  'from-red-500/60 to-rose-400/60',
];

const TikTokInspirationContext = createContext<TikTokInspirationContextValue | null>(null);

export function TikTokInspirationProvider({ children }: { children: ReactNode }) {
  const [savedVideos, setSavedVideos] = useState<SavedInspirationVideo[]>(() => {
    try {
      const raw = localStorage.getItem(SAVED_VIDEOS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  const [reportHistory, setReportHistory] = useState<ReportHistoryItem[]>(() => {
    try {
      const raw = localStorage.getItem(REPORT_HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(SAVED_VIDEOS_KEY, JSON.stringify(savedVideos));
  }, [savedVideos]);

  useEffect(() => {
    localStorage.setItem(REPORT_HISTORY_KEY, JSON.stringify(reportHistory));
  }, [reportHistory]);

  const saveVideo = useCallback((video: TikTokVideo) => {
    setSavedVideos(prev => {
      if (prev.some(v => v.videoId === video.videoId)) return prev;
      const idx = Math.abs(video.videoId.charCodeAt(video.videoId.length - 1)) % coverGradients.length;
      const saved: SavedInspirationVideo = {
        id: crypto.randomUUID(),
        videoId: video.videoId,
        title: video.title,
        views: video.metrics.viewsText,
        likes: video.metrics.likesText,
        originalUrl: video.originalUrl,
        savedAt: new Date().toISOString(),
        coverGradient: coverGradients[idx],
        source: 'tiktok-report',
        raw: video,
      };
      return [saved, ...prev];
    });
  }, []);

  const unsaveVideo = useCallback((videoId: string) => {
    setSavedVideos(prev => prev.filter(v => v.videoId !== videoId));
  }, []);

  const isVideoSaved = useCallback((videoId: string) => {
    return savedVideos.some(v => v.videoId === videoId);
  }, [savedVideos]);

  const addReportHistory = useCallback((item: Omit<ReportHistoryItem, 'id' | 'createdAt'>) => {
    const newItem: ReportHistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setReportHistory(prev => [newItem, ...prev].slice(0, 20));
    return newItem.id;
  }, []);

  const updateReportHistoryStatus = useCallback((id: string, status: HistoryStatus) => {
    setReportHistory(prev => prev.map(h => h.id === id ? { ...h, status } : h));
  }, []);

  const deleteReportHistory = useCallback((id: string) => {
    setReportHistory(prev => prev.filter(h => h.id !== id));
  }, []);

  return (
    <TikTokInspirationContext.Provider value={{
      savedVideos, saveVideo, unsaveVideo, isVideoSaved,
      reportHistory, addReportHistory, updateReportHistoryStatus, deleteReportHistory,
    }}>
      {children}
    </TikTokInspirationContext.Provider>
  );
}

export function useTikTokInspiration() {
  const ctx = useContext(TikTokInspirationContext);
  if (!ctx) throw new Error('useTikTokInspiration must be used within TikTokInspirationProvider');
  return ctx;
}
