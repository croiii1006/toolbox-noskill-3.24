import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { TRENDING_VIDEOS } from '@/constants/trending-videos';
import {
  Video,
  ImageIcon,
  Sparkles,
  Loader2,
  Play,
  X,
  Copy,
  Check,
  Plus,
  ArrowUp,
  ArrowLeft,
  Flame,
  Bookmark,
  FolderOpen,
  Maximize2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  History,
  Download,
  Edit3,
  AlertCircle,
  RefreshCw,
  Database,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ShowcaseDetailDialog } from "@/components/modules/ai-toolbox/app-plaza/ShowcaseDetailDialog";
import type { ShowcaseCardData } from "@/components/modules/ai-toolbox/app-plaza/ShowcaseCard";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useTikTokInspiration } from "@/contexts/TikTokInspirationContext";
import { useReplicatePrefill } from "@/contexts/ReplicatePrefillContext";
import { cn } from "@/lib/utils";
import { type HistoryStatus, statusConfig } from "@/types/history";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useMemory } from "@/contexts/MemoryContext";
import { MemorySelectionDialog } from "@/components/modules/memory/MemorySelectionDialog";
import { Button } from "@/components/ui/button";
import { useCredits } from "@/contexts/CreditsContext";
import { InsufficientCreditsDrawer } from "@/components/modules/InsufficientCreditsDrawer";

/* ─── Field Contract Types (DO NOT MODIFY) ─── */

export type VideoStatus = "queued" | "processing" | "success" | "failed";

export interface ReplicateSettings {
  motionLevel: number;
  outputResolution: "720p" | "1080p" | "2k_hdr";
  aspectRatio: "16:9" | "9:16";
}

export interface GeneratedVideo {
  videoId: string;
  videoUrl: string;
  createdAt: string;
  status: VideoStatus;
}

export interface ExtractPayload {
  styleVideoFile: File | null;
  sellingPoints: string[];
  settings: ReplicateSettings;
}

export interface ReplicatePayload {
  promptText: string;
  settings: ReplicateSettings;
  projectLibraryId: string | null;
}

/* ─── Default settings ─── */
const DEFAULT_SETTINGS: ReplicateSettings = {
  motionLevel: 0.5,
  outputResolution: "1080p",
  aspectRatio: "16:9",
};

/* ─── History helpers ─── */
interface ReplicateHistoryItem {
  id: string;
  tiktokLink: string;
  sellingPoints: string[];
  videoName: string;
  date: string;
  promptText: string;
  inspirationVideo?: InspirationVideo | null;
  status: HistoryStatus;
  generatedVideoUrl?: string | null;
}

const REPLICATE_HISTORY_KEY = "replicate-workspace-history";

function loadReplicateHistory(): ReplicateHistoryItem[] {
  try {
    const raw = localStorage.getItem(REPLICATE_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveReplicateHistory(items: ReplicateHistoryItem[]) {
  localStorage.setItem(REPLICATE_HISTORY_KEY, JSON.stringify(items));
}

/* ─── Mock trending data ─── */
interface InspirationVideo {
  id: string;
  title: string;
  views: string;
  likes: string;
  coverGradient: string;
  source: "trending" | "saved";
}

const MOCK_TRENDING: InspirationVideo[] = TRENDING_VIDEOS.map(v => ({
  id: v.id,
  title: v.title,
  views: v.views,
  likes: v.likes,
  coverGradient: v.coverGradient,
  source: "trending" as const,
}));

interface ReplicateWorkspaceProps {
  onNavigate?: (itemId: string) => void;
}

export function ReplicateWorkspace({ onNavigate }: ReplicateWorkspaceProps) {
  const { t } = useTranslation();
  const { savedVideos, unsaveVideo } = useTikTokInspiration();
  const { consumePrefill } = useReplicatePrefill();
  const { entries } = useMemory();
  const { credits, deduct, canAfford, shortfall, refund } = useCredits();

  /* ── Insufficient credits drawer ── */
  const [creditsDrawerOpen, setCreditsDrawerOpen] = useState(false);
  const [creditsShortfall, setCreditsShortfall] = useState(0);
  /* ── Memory ── */
  const [selectedMemoryIds, setSelectedMemoryIds] = useState<string[]>([]);
  const [memoryDialogOpen, setMemoryDialogOpen] = useState(false);
  const memoryItems = useMemo(
    () =>
      entries.map((e) => ({
        id: e.id,
        name: e.title,
        desc: e.content.slice(0, 60),
        tag: e.category,
        charCount: e.content.length,
      })),
    [entries],
  );
  const toggleMemory = useCallback((id: string) => {
    setSelectedMemoryIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }, []);

  /* ── Input Side ── */
  const [styleVideoFile, setStyleVideoFile] = useState<File | null>(null);
  const [styleVideoUrl, setStyleVideoUrl] = useState<string | null>(null);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);
  const [inspirationVideo, setInspirationVideo] = useState<InspirationVideo | null>(null);
  const [settings] = useState<ReplicateSettings>(DEFAULT_SETTINGS);

  /* ── UI-only state ── */
  const [sellingPoints, setSellingPoints] = useState<string[]>([]);
  const [spInput, setSpInput] = useState("");

  /* ── History ── */
  const [history, setHistory] = useState<ReplicateHistoryItem[]>(loadReplicateHistory);

  /* ── Action & Status ── */
  const hasVideoSource = !!(styleVideoFile || inspirationVideo);
  const canSend = hasVideoSource && sellingPoints.length > 0;
  const [isExtracting, setIsExtracting] = useState(false);
  const [viewMode, setViewMode] = useState<"composer" | "conversation">("composer");
  const [lastDeductedAmount, setLastDeductedAmount] = useState(0);

  /* ── Estimated cost helper ── */
  const estimatedCost = useMemo(() => {
    let cost = 0;
    if (styleVideoFile || inspirationVideo) cost += 8;
    if (productImageFile) cost += 2;
    cost += sellingPoints.length;
    cost += selectedMemoryIds.length;
    return Math.max(cost, 0);
  }, [styleVideoFile, inspirationVideo, productImageFile, sellingPoints, selectedMemoryIds]);

  /* ── Multi-step conversation state ── */
  type ConvStep = "extracting" | "extracted" | "fusing" | "fused" | "replicating" | "done";
  const [convStep, setConvStep] = useState<ConvStep>("extracting");
  const [extractedOriginalPrompt, setExtractedOriginalPrompt] = useState("");
  const [replicatePrompt, setReplicatePrompt] = useState("");
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [refVideoDialogOpen, setRefVideoDialogOpen] = useState(false);
  const [productImageDialogOpen, setProductImageDialogOpen] = useState(false);
  const [originalPromptExpanded, setOriginalPromptExpanded] = useState(false);
  const [errorInfo, setErrorInfo] = useState<{ step: ConvStep; message: string } | null>(null);
  /* ── Output Side ── */
  const [extractedPromptText, setExtractedPromptText] = useState<string>("");
  const [promptCopied, setPromptCopied] = useState(false);

  /* ── Completed rounds history (immutable prompt+video pairs) ── */
  interface CompletedRound {
    prompt: string;
    videoUrl: string;
  }
  const [completedRounds, setCompletedRounds] = useState<CompletedRound[]>([]);
  const [previewingVideoUrl, setPreviewingVideoUrl] = useState<string | null>(null);

  /* ── Refs ── */
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const spInputRef = useRef<HTMLInputElement>(null);
  const prefillConsumed = useRef(false);

  /* ── Consume prefill from TikTok report or showcase ── */
  useEffect(() => {
    if (prefillConsumed.current) return;
    const data = consumePrefill();
    if (!data) return;
    prefillConsumed.current = true;
    if (data.sellingPoints.length > 0) setSellingPoints(data.sellingPoints);

    // If prefill includes an inspiration video (from showcase), set it as reference
    if (data.inspirationVideo) {
      const iv: InspirationVideo = {
        id: data.inspirationVideo.id,
        title: data.inspirationVideo.title,
        views: data.inspirationVideo.views,
        likes: data.inspirationVideo.likes,
        coverGradient: data.inspirationVideo.coverGradient,
        source: "trending",
      };
      setInspirationVideo(iv);
      toast.success(`已将「${iv.title}」设为对标视频`);
    }

    if (data.autoStart) {
      setTimeout(() => {
        setViewMode("conversation");
        setConvStep("fusing");
        setIsExtracting(true);
        setExtractedPromptText("");
        setPromptCopied(false);
        setTimeout(async () => {
          await new Promise((r) => setTimeout(r, 2500));
          const mockPrompt = `产品特写镜头，柔和暖色灯光，缓慢推拉运镜，背景虚化，商品居中展示。\n\n核心卖点融入：${data.sellingPoints.join("、")}。\n\n电商广告风格，高清画质，节奏紧凑，适合 TikTok 短视频传播。`;
          setReplicatePrompt(mockPrompt);
          setExtractedPromptText(mockPrompt);
          setConvStep("fused");
          setIsExtracting(false);
          toast.success("复刻视频prompt已生成！");
        }, 0);
      }, 0);
    }
  }, [consumePrefill]);

  /* ── Handlers ── */
  const handleVideoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("请上传视频文件");
      e.target.value = "";
      return;
    }
    const url = URL.createObjectURL(file);
    // Check duration ≤ 15s
    const tempVideo = document.createElement("video");
    tempVideo.preload = "metadata";
    tempVideo.onloadedmetadata = () => {
      URL.revokeObjectURL(tempVideo.src);
      if (tempVideo.duration > 15) {
        toast.error("视频时长不能超过 15 秒，请裁剪后重新上传");
        URL.revokeObjectURL(url);
        return;
      }
      setStyleVideoFile(file);
      setStyleVideoUrl(url);
      setInspirationVideo(null);
      toast.success("对标视频已上传");
    };
    tempVideo.onerror = () => {
      URL.revokeObjectURL(tempVideo.src);
      setStyleVideoFile(file);
      setStyleVideoUrl(url);
      setInspirationVideo(null);
      toast.success("对标视频已上传");
    };
    tempVideo.src = url;
    e.target.value = "";
  }, []);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("请上传图片文件");
      return;
    }
    const url = URL.createObjectURL(file);
    setProductImageFile(file);
    setProductImageUrl(url);
    toast.success("商品白底图已上传");
    e.target.value = "";
  }, []);

  const handleSend = useCallback(async () => {
    if (!canSend) return;

    // Credit check
    const cost = estimatedCost;
    if (!canAfford(cost)) {
      setCreditsShortfall(shortfall(cost));
      setCreditsDrawerOpen(true);
      return;
    }
    deduct(cost, "视频复刻工作台");
    setLastDeductedAmount(cost);

    const mockPrompt = `产品特写镜头，柔和暖色灯光，缓慢推拉运镜，背景虚化，商品居中展示。\n\n核心卖点融入：${sellingPoints.join("、")}。\n\n电商广告风格，高清画质，节奏紧凑，适合 TikTok 短视频传播。`;

    // Save to history (with prompt)
    const newItem: ReplicateHistoryItem = {
      id: crypto.randomUUID(),
      tiktokLink: "",
      sellingPoints,
      videoName: styleVideoFile?.name || inspirationVideo?.title || "",
      date: new Date().toISOString(),
      promptText: mockPrompt,
      inspirationVideo: inspirationVideo || null,
      status: "in_progress",
    };
    const updated = [newItem, ...history].slice(0, 20);
    setHistory(updated);
    saveReplicateHistory(updated);

    setViewMode("conversation");
    setConvStep("fusing");
    setExtractedOriginalPrompt("");
    setReplicatePrompt("");
    setGeneratedVideoUrl(null);
    setIsEditingPrompt(false);
    setOriginalPromptExpanded(false);
    setIsExtracting(true);
    setExtractedPromptText("");
    setPromptCopied(false);
    setErrorInfo(null);

    const extractPayload: ExtractPayload = { styleVideoFile, sellingPoints, settings };
    console.log("ExtractPayload:", extractPayload);

    try {
      // Generate replicate prompt by combining selling points
      await new Promise((r) => setTimeout(r, 2000));
      const fusePrompt = `产品特写镜头，柔和暖色灯光，缓慢推拉运镜，背景虚化，商品居中展示。\n\n核心卖点融入：${sellingPoints.join("、")}。${productImageFile ? "\n\n参考商品白底图进行产品外观还原。" : ""}\n\n电商广告风格，高清画质，节奏紧凑，适合 TikTok 短视频传播。`;
      setReplicatePrompt(fusePrompt);
      setExtractedPromptText(fusePrompt);
      setConvStep("fused");
      setIsExtracting(false);
      toast.success("复刻视频prompt已生成！");
    } catch {
      setErrorInfo({ step: "fusing", message: "生成复刻 Prompt 失败，请检查网络后重试" });
      setIsExtracting(false);
      return;
    }
  }, [
    canSend,
    styleVideoFile,
    sellingPoints,
    settings,
    inspirationVideo,
    history,
    productImageFile,
    estimatedCost,
    canAfford,
    shortfall,
    deduct,
  ]);

  const handleConfirmReplicate = useCallback(async () => {
    setConvStep("replicating");
    setErrorInfo(null);
    try {
      // Mock video generation (4s)
      await new Promise((r) => setTimeout(r, 4000));
      const videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
      setGeneratedVideoUrl(videoUrl);
      setConvStep("done");
      // Update history status to completed and save video URL
      setHistory((prev) => {
        const updated = prev.map((h, i) =>
          i === 0 ? { ...h, status: "completed" as HistoryStatus, generatedVideoUrl: videoUrl } : h,
        );
        saveReplicateHistory(updated);
        return updated;
      });
      toast.success("✅ 视频生成完毕！");
    } catch {
      setErrorInfo({ step: "replicating", message: "视频生成失败，请检查网络后重试" });
      // Refund credits on failure
      if (lastDeductedAmount > 0) {
        refund(lastDeductedAmount, "视频复刻退款");
        toast.error(
          `❌ 生成失败（触发安全策略/接口拥堵）。扣除的 ${lastDeductedAmount} credit 已全额解冻退回您的账户。`,
        );
        setLastDeductedAmount(0);
      }
      // Update history status to failed
      setHistory((prev) => {
        const updated = prev.map((h, i) => (i === 0 ? { ...h, status: "failed" as HistoryStatus } : h));
        saveReplicateHistory(updated);
        return updated;
      });
      setConvStep("fused");
    }
  }, [lastDeductedAmount, refund]);

  const addSellingPoint = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !sellingPoints.includes(trimmed)) {
      setSellingPoints((prev) => [...prev, trimmed]);
    }
    setSpInput("");
  };

  const handleSpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (spInput.trim()) {
        addSellingPoint(spInput);
      } else if (canSend) {
        handleSend();
      }
    }
  };

  const handleInspirationSelect = (video: InspirationVideo) => {
    setInspirationVideo(video);
    setStyleVideoFile(null);
    setStyleVideoUrl(null);
    toast.success(`已将「${video.title}」设为对标视频`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRestoreHistory = (item: ReplicateHistoryItem) => {
    setSellingPoints(item.sellingPoints);
    setStyleVideoFile(null);
    setStyleVideoUrl(null);
    setInspirationVideo(item.inspirationVideo || null);
    setPromptCopied(false);

    const prompt =
      item.promptText ||
      `产品特写镜头，柔和暖色灯光，缓慢推拉运镜，背景虚化，商品居中展示。\n\n核心卖点融入：${item.sellingPoints.join("、")}。\n\n电商广告风格，高清画质，节奏紧凑，适合 TikTok 短视频传播。`;
    setExtractedPromptText(prompt);
    setReplicatePrompt(prompt);
    setExtractedOriginalPrompt("");
    setIsExtracting(false);
    setErrorInfo(null);

    // Restore generated video if available
    if (item.generatedVideoUrl) {
      setGeneratedVideoUrl(item.generatedVideoUrl);
      setConvStep("done");
    } else if (item.status === "completed" || item.promptText) {
      setGeneratedVideoUrl(null);
      setConvStep("fused");
    } else {
      setGeneratedVideoUrl(null);
      setConvStep("extracting");
    }

    setViewMode("conversation");
  };

  const handleDeleteHistory = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    saveReplicateHistory(updated);
  };

  const historySheet = (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-muted/40">
          <History className="w-3.5 h-3.5" />
          <span>历史记录</span>
        </button>
      </SheetTrigger>
      <SheetContent className="w-80 sm:w-96">
        <SheetHeader>
          <SheetTitle className="text-base font-medium">历史记录</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => handleRestoreHistory(item)}
              className="w-full text-left p-3 rounded-xl border border-border/30 hover:border-border/60 hover:bg-muted/20 transition-all group relative"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground truncate max-w-[180px]">
                  {item.videoName || "未命名"}
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full border ${statusConfig[item.status || "completed"].className}`}
                  >
                    {statusConfig[item.status || "completed"].label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(item.date).toLocaleString("zh-CN", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {item.sellingPoints.map((p) => (
                  <span key={p} className="text-[10px] bg-muted/40 text-muted-foreground px-1.5 py-0.5 rounded-full">
                    {p}
                  </span>
                ))}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteHistory(item.id);
                }}
                className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-muted/40 transition-all"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground/50" />
              </button>
            </button>
          ))}
          {history.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">暂无历史记录</p>}
        </div>
      </SheetContent>
    </Sheet>
  );
  const handleCopyPrompt = useCallback(() => {
    navigator.clipboard.writeText(replicatePrompt);
    setPromptCopied(true);
    toast.success("已复制到剪贴板");
    setTimeout(() => setPromptCopied(false), 2000);
  }, [replicatePrompt]);

  if (viewMode === "conversation") {
    const stepOrder: ConvStep[] = ["extracting", "extracted", "fusing", "fused", "replicating", "done"];
    const stepIndex = stepOrder.indexOf(convStep);
    const originalPromptLines = extractedOriginalPrompt.split("\n");
    const shouldCollapse = originalPromptLines.length > 5;
    const displayOriginalPrompt =
      !shouldCollapse || originalPromptExpanded
        ? extractedOriginalPrompt
        : originalPromptLines.slice(0, 5).join("\n") + "...";

    return (
      <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-background">
        {/* ── Top bar ── */}
        <div className="shrink-0 px-6 py-3 border-b border-border/20 flex items-center gap-2">
          <button
            onClick={() => {
              setViewMode("composer");
              setExtractedPromptText("");
              setSellingPoints([]);
              setStyleVideoFile(null);
              setStyleVideoUrl(null);
              setProductImageFile(null);
              setProductImageUrl(null);
              setInspirationVideo(null);
              setGeneratedVideoUrl(null);
              setCompletedRounds([]);
              setSelectedMemoryIds([]);
            }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            返回
          </button>
        </div>

        {/* ── Steps area ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">
            {/* Summary card */}
            <div className="rounded-xl border border-border/20 bg-muted/10 p-4 space-y-2">
              <button
                onClick={() => (styleVideoUrl || inspirationVideo) && setRefVideoDialogOpen(true)}
                className={cn(
                  "flex items-center gap-2 text-xs text-muted-foreground",
                  (styleVideoUrl || inspirationVideo) && "hover:text-foreground cursor-pointer transition-colors",
                )}
              >
                <Video className="w-3.5 h-3.5" />
                <span>对标视频：{styleVideoFile?.name || inspirationVideo?.title || "—"}</span>
                {(styleVideoUrl || inspirationVideo) && <Play className="w-3 h-3 ml-0.5" />}
              </button>
              {productImageUrl && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>产品图：</span>
                  <button
                    onClick={() => setProductImageDialogOpen(true)}
                    className="hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={productImageUrl}
                      alt="产品图"
                      className="w-8 h-8 rounded object-contain border border-border/30 bg-muted/20 cursor-pointer"
                    />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-muted-foreground">卖点：</span>
                {sellingPoints.map((p) => (
                  <span
                    key={p}
                    className="inline-flex h-5 items-center rounded-full bg-muted/40 border border-border/20 px-2 text-[11px] text-foreground/70"
                  >
                    {p}
                  </span>
                ))}
              </div>
              {selectedMemoryIds.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-muted-foreground">记忆库：</span>
                  {selectedMemoryIds.map((id) => {
                    const entry = entries.find((e) => e.id === id);
                    if (!entry) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex h-5 items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 text-[11px] text-primary"
                      >
                        <Database className="w-3 h-3" />
                        {entry.title}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reference video preview dialog */}
            <Dialog open={refVideoDialogOpen} onOpenChange={setRefVideoDialogOpen}>
              <DialogContent className="max-w-fit w-auto p-0 gap-0 overflow-hidden rounded-2xl bg-black border-none">
                <DialogTitle className="sr-only">对标视频预览</DialogTitle>
                <div className="relative max-h-[80vh] flex items-center justify-center">
                  {styleVideoUrl ? (
                    <video src={styleVideoUrl} className="max-h-[80vh] w-auto object-contain" controls autoPlay />
                  ) : inspirationVideo ? (
                    <div
                      className={cn(
                        "w-[300px] aspect-[9/16] bg-gradient-to-br flex items-center justify-center",
                        inspirationVideo.coverGradient,
                      )}
                    >
                      <span className="text-background text-lg font-medium">{inspirationVideo.title}</span>
                    </div>
                  ) : null}
                </div>
              </DialogContent>
            </Dialog>

            {/* Product image preview dialog */}
            <Dialog open={productImageDialogOpen} onOpenChange={setProductImageDialogOpen}>
              <DialogContent className="max-w-fit w-auto p-0 gap-0 overflow-hidden rounded-2xl border-none bg-background">
                <DialogTitle className="sr-only">产品图预览</DialogTitle>
                <div className="relative max-h-[80vh] flex items-center justify-center p-2">
                  {productImageUrl && (
                    <img src={productImageUrl} alt="产品图" className="max-h-[75vh] w-auto object-contain rounded-lg" />
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {convStep === "fusing" && !errorInfo && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground animate-fade-in">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>正在结合卖点（{sellingPoints.join("、")}），为您生成复刻视频prompt...</span>
              </div>
            )}

            {/* ── Error: fusing failed ── */}
            {errorInfo?.step === "fusing" && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-2 animate-fade-in">
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errorInfo.message}</span>
                </div>
                <button
                  onClick={() => {
                    setErrorInfo(null);
                    handleSend();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  重试
                </button>
              </div>
            )}

            {/* ── Completed rounds (immutable) ── */}
            {completedRounds.map((round, idx) => (
              <React.Fragment key={idx}>
                {/* Immutable prompt card */}
                <div className="rounded-xl border border-border/20 bg-card/40 p-4 space-y-3 opacity-80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-foreground/50">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>复刻视频prompt（第 {idx + 1} 次）</span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(round.prompt);
                        toast.success("已复制到剪贴板");
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      复制
                    </button>
                  </div>
                  <p className="text-sm text-foreground/60 leading-relaxed whitespace-pre-line select-text">
                    {round.prompt}
                  </p>
                </div>
                {/* Immutable video card */}
                <div className="rounded-xl border border-border/20 bg-card/40 p-4 space-y-3 opacity-80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-foreground/50">
                      <Check className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>复刻视频（第 {idx + 1} 次）</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={round.videoUrl}
                        download={`replicated-video-${idx + 1}.mp4`}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        下载
                      </a>
                      <button
                        onClick={() => {
                          setPreviewingVideoUrl(round.videoUrl);
                          setVideoDialogOpen(true);
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                      >
                        <Maximize2 className="w-3 h-3" />
                        放大
                      </button>
                    </div>
                  </div>
                  <div
                    className="relative rounded-lg overflow-hidden bg-muted/20 cursor-pointer"
                    onClick={() => {
                      setPreviewingVideoUrl(round.videoUrl);
                      setVideoDialogOpen(true);
                    }}
                  >
                    <video
                      src={round.videoUrl}
                      muted
                      loop
                      playsInline
                      className="w-full max-h-[300px] object-contain"
                    />
                  </div>
                </div>
              </React.Fragment>
            ))}

            {/* ── Current round: prompt card (editable before confirming) ── */}
            {stepIndex >= 3 && replicatePrompt && !isEditingPrompt && (
              <div className="rounded-xl border border-primary/30 bg-card/60 p-4 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-foreground/70">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>复刻视频prompt已生成！</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {convStep === "fused" && (
                      <button
                        onClick={() => setIsEditingPrompt(true)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                        编辑
                      </button>
                    )}
                    <button
                      onClick={handleCopyPrompt}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                    >
                      {promptCopied ? (
                        <>
                          <Check className="w-3 h-3" />
                          已复制
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          复制
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line select-text">
                  {replicatePrompt}
                </p>

                {convStep === "fused" && (
                  <button
                    onClick={handleConfirmReplicate}
                    className="w-full mt-2 py-2.5 rounded-xl text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    确认复刻
                  </button>
                )}
              </div>
            )}

            {/* ── New editable prompt card (for re-generation) ── */}
            {isEditingPrompt && (
              <div className="rounded-xl border border-primary/30 bg-card/60 p-4 space-y-3 animate-fade-in">
                <div className="flex items-center gap-2 text-xs text-foreground/70">
                  <Edit3 className="w-3.5 h-3.5 text-primary" />
                  <span>编辑复刻视频prompt</span>
                </div>
                <textarea
                  value={replicatePrompt}
                  onChange={(e) => setReplicatePrompt(e.target.value)}
                  className="w-full min-h-[120px] rounded-lg border border-border/30 bg-background/50 px-3 py-2 text-sm text-foreground leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary/40 resize-y"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditingPrompt(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border/30 text-foreground/70 hover:bg-muted/30 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingPrompt(false);
                      handleConfirmReplicate();
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1"
                  >
                    <Play className="w-3 h-3" />
                    确认并生成视频
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 5: Replicating video ── */}
            {convStep === "replicating" && !errorInfo && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground animate-fade-in">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>正在为您复刻视频...</span>
              </div>
            )}

            {/* ── Error: replicating failed ── */}
            {errorInfo?.step === "replicating" && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-2 animate-fade-in">
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errorInfo.message}</span>
                </div>
                <button
                  onClick={() => {
                    setErrorInfo(null);
                    handleConfirmReplicate();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  重试
                </button>
              </div>
            )}

            {/* ── Step 6: Video done ── */}
            {convStep === "done" && generatedVideoUrl && (
              <div className="rounded-xl border border-border/30 bg-card/60 p-4 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-foreground/70">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>复刻视频已完成</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={generatedVideoUrl}
                      download="replicated-video.mp4"
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      下载
                    </a>
                    <button
                      onClick={() => {
                        setPreviewingVideoUrl(generatedVideoUrl);
                        setVideoDialogOpen(true);
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                    >
                      <Maximize2 className="w-3 h-3" />
                      放大
                    </button>
                  </div>
                </div>
                <div
                  className="relative rounded-lg overflow-hidden bg-muted/20 cursor-pointer"
                  onClick={() => {
                    setPreviewingVideoUrl(generatedVideoUrl);
                    setVideoDialogOpen(true);
                  }}
                >
                  <video
                    src={generatedVideoUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full max-h-[400px] object-contain"
                  />
                </div>
              </div>
            )}

            {/* ── Regenerate button after done ── */}
            {convStep === "done" && !isEditingPrompt && <div className="flex justify-center pt-2"></div>}
          </div>
        </div>

        {/* Video fullscreen dialog */}
        <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
          <DialogContent className="max-w-4xl p-2 bg-background/95 backdrop-blur-sm">
            <DialogTitle className="sr-only">复刻视频预览</DialogTitle>
            {previewingVideoUrl && (
              <video src={previewingVideoUrl} autoPlay controls playsInline className="w-full rounded-lg" />
            )}
          </DialogContent>
        </Dialog>

        {/* Memory selection dialog (conversation view) */}
        <MemorySelectionDialog
          open={memoryDialogOpen}
          onOpenChange={setMemoryDialogOpen}
          items={memoryItems}
          selectedIds={selectedMemoryIds}
          onToggle={toggleMemory}
        />
      </div>
    );
  }

  // ── Composer view (initial) ──
  return (
    <div className="relative h-full">
      <div className="absolute top-4 right-4 z-20">{historySheet}</div>
      <div className="min-h-full flex flex-col items-center justify-center p-6 md:p-8 py-[80px]">
        <div className="w-full max-w-2xl animate-fade-in my-[18px] mt-[80px] mb-0">
          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-2xl md:text-3xl font-normal tracking-tight text-[#3d3d3d]">复刻视频</h1>
            <p className="mt-2 text-sm text-muted-foreground">上传对标视频，输入卖点，AI 生成复刻 Prompt</p>
          </div>

          {/* ─── Composer Card ─── */}
          <div className="relative rounded-2xl border border-border/30 bg-card/80 backdrop-blur-sm shadow-sm transition-shadow hover:shadow-md">
            <div className="p-5">
              <div className="flex gap-4">
                {/* ── LEFT: Video Upload / TK Link ── */}
                <div className="shrink-0">
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleVideoUpload}
                  />
                  {styleVideoUrl ? (
                    <div className="relative w-[120px] h-[120px] rounded-xl overflow-hidden border border-border/40 bg-muted/30 group">
                      <video src={styleVideoUrl} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-6 h-6 text-white" />
                      </div>
                      <button
                        className="absolute top-1 right-1 p-0.5 rounded-full bg-background/80 hover:bg-background transition-colors"
                        onClick={() => {
                          setStyleVideoFile(null);
                          setStyleVideoUrl(null);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1.5 py-0.5 text-[10px] text-white truncate">
                        {styleVideoFile?.name}
                      </div>
                    </div>
                  ) : inspirationVideo ? (
                    <div className="relative w-[120px] h-[120px] rounded-xl overflow-hidden border border-border/40 group">
                      <div className={cn("absolute inset-0 bg-gradient-to-br", inspirationVideo.coverGradient)} />
                      <button
                        className="absolute top-1 right-1 p-0.5 rounded-full bg-background/80 hover:bg-background transition-colors opacity-0 group-hover:opacity-100"
                        onClick={() => setInspirationVideo(null)}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => videoInputRef.current?.click()}
                      className="w-[120px] h-[100px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1.5 transition-colors border-border/40 hover:border-foreground/20 hover:bg-muted/20"
                    >
                      <Plus className="w-5 h-5 text-muted-foreground/60" />
                      <span className="text-[11px] text-muted-foreground/60 leading-tight text-center px-1">
                        上传对标视频
                      </span>
                    </button>
                  )}
                </div>

                {/* ── Product white-bg image ── */}
                <div className="shrink-0">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  {productImageUrl ? (
                    <div className="relative w-[120px] h-[120px] rounded-xl overflow-hidden border border-border/40 bg-white group">
                      <img src={productImageUrl} alt="商品白底图" className="w-full h-full object-contain" />
                      <button
                        className="absolute top-1 right-1 p-0.5 rounded-full bg-background/80 hover:bg-background transition-colors opacity-0 group-hover:opacity-100"
                        onClick={() => {
                          setProductImageFile(null);
                          setProductImageUrl(null);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="w-[120px] h-[100px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1.5 transition-colors border-border/40 hover:border-foreground/20 hover:bg-muted/20"
                    >
                      <ImageIcon className="w-5 h-5 text-muted-foreground/60" />
                      <span className="text-[11px] text-muted-foreground/60 leading-tight text-center px-1">
                        上传商品白底图
                      </span>
                    </button>
                  )}
                </div>

                {/* ── RIGHT: Selling Points ── */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <label className="text-xs font-medium text-muted-foreground mb-1.5">产品卖点</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {sellingPoints.map((point) => (
                      <span
                        key={point}
                        className="inline-flex items-center gap-1 h-6 rounded-full bg-muted/40 border border-border/20 px-2 text-xs text-foreground/80"
                      >
                        {point}
                        <button
                          onClick={() => setSellingPoints((prev) => prev.filter((p) => p !== point))}
                          className="hover:text-foreground transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      ref={spInputRef}
                      value={spInput}
                      onChange={(e) => setSpInput(e.target.value)}
                      onKeyDown={handleSpKeyDown}
                      onBlur={() => {
                        if (spInput.trim()) addSellingPoint(spInput);
                      }}
                      placeholder={sellingPoints.length === 0 ? "输入商品卖点，回车添加..." : "添加更多卖点..."}
                      className="flex-1 min-w-[140px] h-7 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom toolbar */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-border/20">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMemoryDialogOpen(true)}
                  className={cn(
                    'h-8 rounded-full border flex items-center justify-center gap-1.5 px-3 transition-all duration-300 ease-out',
                    selectedMemoryIds.length > 0
                      ? 'border-orange-400/60 bg-orange-400/10 text-accent/80'
                      : 'border-border/40 text-muted-foreground hover:text-foreground hover:border-border'
                  )}
                >
                  <Database className="w-4 h-4" />
                  <span className="text-[11px] font-medium whitespace-nowrap">
                    {selectedMemoryIds.length > 0 ? `${selectedMemoryIds.length} 个记忆库` : '记忆库'}
                  </span>
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground/70 tabular-nums">
                  预计消耗：约 <span className="text-foreground/80 font-medium">{estimatedCost}</span> credit
                </span>
                <button
                  onClick={handleSend}
                  disabled={!canSend || isExtracting}
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                    canSend && !isExtracting
                      ? "bg-foreground text-background hover:bg-foreground/90"
                      : "bg-muted/60 text-muted-foreground/40 cursor-not-allowed",
                  )}
                >
                  {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Inspiration Library ─── */}
        <div className="w-full max-w-4xl my-0 mt-[70px]">
          <Tabs defaultValue="trending" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-medium text-foreground">灵感库</h2>
              <TabsList className="h-8 bg-muted/30 p-0.5 rounded-lg">
                <TabsTrigger
                  value="trending"
                  className="h-7 text-xs rounded-md px-3 gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Flame className="w-3.5 h-3.5" />
                  近期热门
                </TabsTrigger>
                <TabsTrigger
                  value="saved"
                  className="h-7 text-xs rounded-md px-3 gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  我的灵感库
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="trending" className="mt-0 min-h-[420px]">
              <PaginatedInspirationGrid videos={MOCK_TRENDING} onSelect={handleInspirationSelect} />
            </TabsContent>

            <TabsContent value="saved" className="mt-0 min-h-[420px]">
              {savedVideos.length > 0 ? (
                <PaginatedInspirationGrid
                  videos={savedVideos.map((sv) => ({
                    id: sv.id,
                    title: sv.title,
                    views: sv.views,
                    likes: sv.likes,
                    coverGradient: sv.coverGradient,
                    source: "saved" as const,
                  }))}
                  onSelect={handleInspirationSelect}
                  renderOverlay={(video) => {
                    const sv = savedVideos.find((s) => s.id === video.id);
                    if (!sv) return null;
                    return (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          unsaveVideo(sv.videoId);
                          toast.success("已从灵感库移除");
                        }}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-foreground/60 text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-[5]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    );
                  }}
                />
              ) : (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  <Bookmark className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p>暂无保存的灵感视频</p>
                  <p className="text-xs text-muted-foreground/50 mt-1">在 TikTok 爆款报告中保存视频，即可同步到此处</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Memory selection dialog */}
      <MemorySelectionDialog
        open={memoryDialogOpen}
        onOpenChange={setMemoryDialogOpen}
        items={memoryItems}
        selectedIds={selectedMemoryIds}
        onToggle={toggleMemory}
      />
      <InsufficientCreditsDrawer
        open={creditsDrawerOpen}
        onOpenChange={setCreditsDrawerOpen}
        shortfall={creditsShortfall}
      />
    </div>
  );
}

/* ─── Inspiration Card Sub-component ─── */
const INSPO_PER_PAGE = 16; // 4 cols × 4 rows

function PaginatedInspirationGrid({
  videos,
  onSelect,
  renderOverlay,
}: {
  videos: InspirationVideo[];
  onSelect: (video: InspirationVideo) => void;
  renderOverlay?: (video: InspirationVideo) => React.ReactNode;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(videos.length / INSPO_PER_PAGE);
  const pagedVideos = videos.slice(page * INSPO_PER_PAGE, (page + 1) * INSPO_PER_PAGE);

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {pagedVideos.map((video) => (
          <div key={video.id} className="relative">
            <InspirationCard video={video} onSelect={onSelect} />
            {renderOverlay?.(video)}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-1.5 rounded-md border border-border/40 text-muted-foreground hover:text-foreground hover:border-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="p-1.5 rounded-md border border-border/40 text-muted-foreground hover:text-foreground hover:border-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function InspirationCard({
  video,
  onSelect,
}: {
  video: InspirationVideo;
  onSelect: (video: InspirationVideo) => void;
}) {
  const [detailOpen, setDetailOpen] = useState(false);

  // Find full detail from TRENDING_VIDEOS
  const trendingData = TRENDING_VIDEOS.find(v => v.id === video.id);

  // Convert to ShowcaseCardData for the detail dialog
  const cardData: ShowcaseCardData = {
    title: video.title,
    desc: trendingData?.desc || '',
    hoverText: '点击复刻此爆款视频',
    image: '/placeholder.svg',
    miniTitle: video.title,
    targetId: 'replicate-video',
    category: 'video',
    detail: trendingData?.detail ? {
      author: trendingData.detail.author,
      businessType: trendingData.detail.businessType,
      purpose: trendingData.detail.purpose,
      audience: trendingData.detail.audience,
      techHighlight: trendingData.detail.techHighlight,
      stats: trendingData.detail.stats,
      tags: trendingData.detail.tags,
    } : undefined,
  };

  return (
    <>
      <div
        onClick={() => setDetailOpen(true)}
        className="relative group cursor-pointer"
      >
        <div className="relative overflow-hidden rounded-[16px] aspect-[4/3] border border-border/20">
          {/* Gradient background as cover */}
          <div className={cn("absolute inset-0 bg-gradient-to-br", video.coverGradient)} />
          {/* Play icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="w-10 h-10 text-white/60 group-hover:text-white/90 transition-colors" />
          </div>
          {/* Views badge */}
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-foreground/40 backdrop-blur-sm rounded-full px-2.5 py-1">
            <Flame className="w-3 h-3 text-accent/80" />
            <span className="text-[11px] text-white font-medium">{video.views}</span>
          </div>
          {/* Bottom gradient + title */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent pt-10 pb-3 px-3">
            <p className="text-background text-xs font-medium leading-snug line-clamp-2 drop-shadow-sm">
              {video.title}
            </p>
          </div>
          {/* Hover overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-foreground/55 opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-[16px]">
            <span className="text-[11px] text-background/90 font-medium">查看视频详情</span>
          </div>
        </div>
      </div>

      <ShowcaseDetailDialog
        card={cardData}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onReplicate={() => onSelect(video)}
      />
    </>
  );
}
