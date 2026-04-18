import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useMemory } from '@/contexts/MemoryContext';
import { useOranGenPrefill } from '@/contexts/OranGenPrefillContext';
import { useSkillsEngine, SessionSetup, SkillsState, StreamMessageType } from './useSkillsEngine';
import { SetupSummary } from './SetupSummary';
import { AgentCard, AgentClusterCard } from './AgentCard';
import { RightWorkspace, type RightView } from './RightWorkspace';
import { ChatInputBar } from './ChatInputBar';
import { creatorLibraryItems } from './creatorLibrary';
import {
  Loader2, RefreshCw, ArrowLeft, PartyPopper, Search, ListChecks, Check, X, History, ChevronRight, Users, FileText, ArrowUp } from
'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { getSkillsHistory, upsertSkillsHistoryItem, deleteSkillsHistoryItem, type SkillsHistoryItem } from './skillsHistoryStorage';
import pixelCross from '@/assets/pixel-cross.png';

import pixelSearch from '@/assets/pixel-search.svg';
import pixelMemory from '@/assets/pixel-memory.svg';
import pixelPrompt from '@/assets/pixel-prompt.svg';
import pixelVideo from '@/assets/pixel-video.svg';
import pixelCreate from '@/assets/pixel-create.svg';
import pixelTrend from '@/assets/pixel-trend.svg';
import expertCrawler from '@/assets/expert-crawler.png';
import expertDesigner from '@/assets/expert-designer.png';

const avatarMap: Record<string, string> = {
  memory: pixelMemory, crawler: expertCrawler, video: pixelVideo,
  designer: expertDesigner, strategist: pixelPrompt, search: pixelSearch
};

/* ─── Agent task background descriptions ─── */
const getAgentDescriptions = (category: string, sellingPoints: string, memoryNames: string): Record<string, string> => ({
  'agent-01': `你是一名TikTok爆款视频专家，需要为用户收集「${category}」品类下最符合「${sellingPoints}」卖点的对标爆款视频，并生成一个可供复刻的视频列表。`,
  'agent-02': `你是一名记忆库专家，需要根据「${memoryNames || '品牌记忆库'}」中的核心信息，提取关键特征向量，为后续内容生成提供品牌一致性保障。`,
  'agent-03': '你是一名Prompt设计专家，需要基于用户选择的爆款视频结构和上述所有品牌信息，设计出高质量的TikTok视频复刻Prompt。',
  'agent-04': '你是一名视频生成专家，需要根据Prompt和素材图，生成高质量的TikTok短视频内容。'
});

/* ─── Agent rows inside flow-step card ─── */
function AgentClusterSteps({ agents, isLast, msgId, category, sellingPoints, memoryNames }: {agents: import('./AgentCard').AgentInfo[];isLast: boolean;msgId: string;category?: string;sellingPoints?: string;memoryNames?: string;}) {
  const agentDescriptions = getAgentDescriptions(category || '', sellingPoints || '', memoryNames || '');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div>
      {agents.map((agent) => {
        const avatarSrc = avatarMap[agent.avatar];
        const isExpanded = expandedId === agent.id;

        return (
          <div key={agent.id} className="border-b border-border/10 last:border-b-0">
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/20 transition-colors"
              onClick={() => setExpandedId(isExpanded ? null : agent.id)}>
              
              <img src={pixelCreate} alt="创建助手" className="w-4 h-4 shrink-0" />
              <span className="text-sm text-foreground/80">创建助手</span>
              <div className="w-px h-4 bg-border/30" />
              <div className={cn(
                'shrink-0 transition-all duration-200',
                isExpanded ? 'w-8 h-8' : 'w-5 h-5'
              )}>
                {avatarSrc ?
                <img src={avatarSrc} alt={agent.name} className="w-full h-full object-contain" /> :

                <div className="w-full h-full rounded bg-muted flex items-center justify-center text-[9px] font-medium">{agent.name[0]}</div>
                }
              </div>
              <span className={cn(
                'flex-1 text-foreground/70 transition-all duration-200',
                isExpanded ? 'text-base font-semibold text-foreground' : 'text-sm font-medium'
              )}>{agent.name}</span>
              <ChevronRight className={cn(
                'w-4 h-4 text-muted-foreground/30 transition-transform duration-200',
                isExpanded && 'rotate-90'
              )} />
            </div>

            {isExpanded &&
            <div className="px-4 pb-4 animate-fade-in">
                <div className="flex items-start gap-3">
                  <img src={pixelCreate} alt="" className="w-4 h-4 shrink-0 invisible" />
                  <span className="text-sm invisible">创建助手</span>
                  <div className="w-px h-4 invisible" />
                  <div className={cn('shrink-0 invisible', isExpanded ? 'w-8' : 'w-5')} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground/60 mb-1">任务背景</p>
                    <p className="text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap">
                      {agentDescriptions[agent.id] || agent.statusText}
                    </p>
                  </div>
                </div>
              </div>
            }
          </div>);

      })}
      {!isLast &&
      <div className="flex justify-start pl-[26px]">
          <div className="w-px h-5 border-l border-dashed border-border/40" />
        </div>
      }
    </div>);

}

/* ─── History helpers ─── */

function deriveStatusLabel(snapshot: SkillsState): string {
  if (snapshot.resultVideo) return '已完成';
  if (snapshot.generatedPrompt) return '提示词已生成';
  if (snapshot.selectedVideo) return '已选择视频';
  if (snapshot.candidateVideos.length > 0) return '候选视频已生成';
  return '进行中';
}

export function SkillsModule() {
  const {
    state, completeSetup, refreshCandidates, selectVideo,
    updatePrompt, confirmGenerate, regenerate, backToVideoSelect,
    setActiveTaskId, setActiveRightView, handleUserInput, resetSession, restoreState
  } = useSkillsEngine();

  const { toast } = useToast();
  const { entries } = useMemory();
  const { consumePrefill: consumeOranGenPrefill } = useOranGenPrefill();
  const memoryItems = useMemo(() => entries.map((e) => ({
    id: e.id,
    name: e.title,
    desc: e.content.slice(0, 60) + (e.content.length > 60 ? '...' : ''),
    tag: e.category,
    charCount: e.content.length
  })), [entries]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<SkillsHistoryItem[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(() => {
    try { return localStorage.getItem('skills-active-history-id'); } catch { return null; }
  });
  const [activeMemoryId, setActiveMemoryId] = useState<string | null>(null);
  const [chatOnlyInput, setChatOnlyInput] = useState('');
  const [historySheetOpen, setHistorySheetOpen] = useState(false);
  const [prefilledCategory, setPrefilledCategory] = useState('');
  const [prefilledMemoryIds, setPrefilledMemoryIds] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const items = await getSkillsHistory();
        if (!mounted) return;
        const sorted = items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setHistory(sorted);
      } finally {
        if (mounted) setHistoryLoaded(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const prefill = consumeOranGenPrefill();
    if (!prefill) {
      return;
    }

    setPrefilledCategory(prefill.category || '');
    setPrefilledMemoryIds(prefill.attachmentIds);
  }, [consumeOranGenPrefill]);

  // Persist activeHistoryId to localStorage
  useEffect(() => {
    if (activeHistoryId) {
      localStorage.setItem('skills-active-history-id', activeHistoryId);
    } else {
      localStorage.removeItem('skills-active-history-id');
    }
  }, [activeHistoryId]);

  // When history is loaded: if we have an activeHistoryId but no live state, restore from history
  useEffect(() => {
    if (!historyLoaded) return;
    if (activeHistoryId && !state.setupCompleted) {
      const item = history.find(h => h.id === activeHistoryId);
      if (item && item.snapshot.setupCompleted) {
        restoreState(item.snapshot);
      }
    }
  }, [historyLoaded, activeHistoryId, state.setupCompleted, history, restoreState]);

  const activeMemoryEntry = useMemo(() => {
    if (!activeMemoryId) return null;
    return entries.find((e) => e.id === activeMemoryId) || null;
  }, [activeMemoryId, entries]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.messages.length]);

  // Show toast when agents hit error status
  useEffect(() => {
    const errorAgent = state.agents.find((a) => a.status === 'error');
    if (errorAgent) {
      toast({
        title: '网络异常，请重试',
        description: `${errorAgent.name} 执行过程中出现错误`,
        variant: 'destructive'
      });
    }
  }, [state.agents.map((a) => a.status).join(',')]);

  useEffect(() => {
    if (!activeHistoryId || !state.setupCompleted) return;
    setHistory((prev) => {
      const updated = prev.map((h) => h.id === activeHistoryId ? { ...h, snapshot: { ...state } } : h);
      const item = updated.find((h) => h.id === activeHistoryId);
      if (item) void upsertSkillsHistoryItem(item);
      return updated;
    });
  }, [activeHistoryId, state.setupCompleted, state.isProcessing, state.tasks, state.messages, state.candidateVideos, state.selectedVideo, state.generatedPrompt, state.resultVideo, state.runMeta]);

  const addHistory = useCallback((setup: SessionSetup) => {
    const newItem: SkillsHistoryItem = {
      id: crypto.randomUUID(),
      category: setup.category,
      sellingPoints: setup.sellingPoints,
      image: setup.image,
      memoryEnabled: setup.memoryEnabled,
      selectedMemoryIds: setup.selectedMemoryIds,
      selectedCreatorIds: setup.selectedCreatorIds,
      date: new Date().toISOString(),
      snapshot: { ...state }
    };
    setHistory((prev) => {
      const updated = [newItem, ...prev].slice(0, 20);
      const removed = prev.slice(19);
      void upsertSkillsHistoryItem(newItem);
      removed.forEach((item) => {
        void deleteSkillsHistoryItem(item.id);
      });
      return updated;
    });
    setActiveHistoryId(newItem.id);
    return newItem.id;
  }, [state]);

  const deleteHistory = useCallback((id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
    void deleteSkillsHistoryItem(id);
    if (activeHistoryId === id) setActiveHistoryId(null);
  }, [activeHistoryId]);

  const hasInProgressSession = useMemo(() => {
    return history.some((h) => h.snapshot.setupCompleted && !h.snapshot.resultVideo);
  }, [history]);

  const handleSend = (
    text: string,
    image?: string | null,
    category?: string,
    memoryIds?: string[],
    creatorIds?: string[],
  ) => {
    if (!state.setupCompleted && (image || text)) {
      if (!historyLoaded) {
        toast({
          title: '历史记录加载中',
          description: '正在恢复历史记录，请稍候再试',
          variant: 'destructive'
        });
        return;
      }
      if (hasInProgressSession) {
        toast({
          title: '当前已有进行中的任务',
          description: '请等待当前任务完成后再开始新任务',
          variant: 'destructive'
        });
        return;
      }
      const setup: SessionSetup = {
        image: image || null,
        imageName: image ? 'uploaded-image' : null,
        memoryEnabled: memoryIds && memoryIds.length > 0 || false,
        selectedMemoryIds: memoryIds || [],
        selectedCreatorIds: creatorIds || [],
        sellingPoints: text || '',
        category: category || '其它'
      };
      addHistory(setup);
      completeSetup(setup);
    } else {
      handleUserInput(text);
    }
  };

  const handleRestoreHistory = (item: SkillsHistoryItem) => {
    const isCurrentActive = item.id === activeHistoryId;
    const isItemInProgress = !item.snapshot.resultVideo && item.snapshot.setupCompleted;

    // Restore snapshot as-is; running agents will be frozen to 'done'
    restoreState(item.snapshot);
    setActiveHistoryId(item.id);
    setHistorySheetOpen(false);
  };

  const handleNewSession = () => {
    resetSession();
    setActiveHistoryId(null);
  };

  const showRightPanel = state.activeRightView !== 'none';

  /* ─── Flow-step types that get grouped into one card ─── */
  const FLOW_STEP_TYPES = new Set<StreamMessageType>(['checklist', 'create-agent', 'read-checklist', 'read-memory', 'agent-cluster']);

  /** Group consecutive flow-step messages into clusters */
  const groupedMessages = useMemo(() => {
    const groups: {type: 'flow-group';msgs: typeof state.messages;} | typeof state.messages[0][] = [];
    const result: Array<{kind: 'single';msg: typeof state.messages[0];} | {kind: 'flow-group';msgs: typeof state.messages;}> = [];

    let currentFlowGroup: typeof state.messages = [];

    for (const msg of state.messages) {
      if (FLOW_STEP_TYPES.has(msg.type)) {
        currentFlowGroup.push(msg);
      } else {
        if (currentFlowGroup.length > 0) {
          result.push({ kind: 'flow-group', msgs: [...currentFlowGroup] });
          currentFlowGroup = [];
        }
        result.push({ kind: 'single', msg });
      }
    }
    if (currentFlowGroup.length > 0) {
      result.push({ kind: 'flow-group', msgs: currentFlowGroup });
    }
    return result;
  }, [state.messages]);

  /* ─── Render a flow-step group as a single card ─── */
  const renderFlowGroup = (msgs: typeof state.messages, groupKey: string) => {
    return (
      <div key={groupKey} className="rounded-xl border border-border/30 bg-background overflow-hidden animate-fade-in">
        {msgs.map((msg, i) => {
          const isLast = i === msgs.length - 1;

          // agent-cluster → render each agent as a separate expandable row
          if (msg.type === 'agent-cluster') {
            const agents = msg.agents || [];
            return (
              <AgentClusterSteps
                key={msg.id}
                agents={agents}
                isLast={isLast}
                msgId={msg.id}
                category={state.setup.category}
                sellingPoints={state.setup.sellingPoints}
                memoryNames={state.setup.selectedMemoryIds.map((id) => entries.find((e) => e.id === id)?.title).filter(Boolean).join('、')} />);


          }

          let icon: React.ReactNode;
          let label: string;
          let onClick: (() => void) | undefined;

          if (msg.type === 'checklist') {
            icon = <ListChecks className="w-4 h-4 text-foreground/60" />;
            label = '编写待办清单';
            onClick = () => setActiveRightView('checklist');
          } else if (msg.type === 'create-agent') {
            // Show as a bullet point step (agent details below)
            icon = <span className="w-4 h-4 text-foreground/60 flex items-center justify-center">•</span>;
            label = msg.content;
          } else if (msg.type === 'read-checklist') {
            icon = <ListChecks className="w-4 h-4 text-foreground/60" />;
            label = msg.content;
            onClick = () => setActiveRightView('checklist');
          } else if (msg.type === 'read-memory') {
            const memEntry = entries.find((e) => e.id === msg.memoryId);
            const memTitle = memEntry?.title || msg.content || '记忆库';
            icon = <FileText className="w-4 h-4 text-foreground/60" />;
            label = `阅读`;
            onClick = () => {
              setActiveMemoryId(msg.memoryId || null);
              setActiveRightView('read-memory');
            };
          } else {
            icon = <span className="w-4 h-4 text-foreground/60 flex items-center justify-center">•</span>;
            label = msg.content;
          }

          return (
            <div key={msg.id}>
              {/* Main step row */}
              <div
                onClick={onClick}
                className={cn(
                  'flex items-center justify-between px-4 py-3 text-sm text-foreground/80',
                  onClick && 'cursor-pointer hover:bg-muted/20',
                  'transition-colors'
                )}>
                
                <div className="flex items-center gap-2.5">
                  {icon}
                  <span>{label}</span>
                  {msg.type === 'read-memory' &&
                  <>
                      <div className="w-px h-4 bg-border/30" />
                      <span className="text-foreground/70">{entries.find((e) => e.id === msg.memoryId)?.title || msg.content}</span>
                    </>
                  }
                  {msg.type === 'checklist' &&
                  <span className="text-[10px] text-muted-foreground/50 ml-1">
                      {state.checklistDone.filter(Boolean).length}/{state.checklistItems.length}
                    </span>
                  }
                </div>
                {onClick && <ChevronRight className="w-4 h-4 text-muted-foreground/30" />}
              </div>

              {/* Inline agent rows removed – agent-cluster handles collapsible detail */}

              {/* Dotted connecting line to next step */}
              {!isLast && !(msg.type === 'create-agent' && msg.agentNames && msg.agentNames.length > 0) &&
              <div className="flex justify-start pl-[26px]">
                  <div className="w-px h-5 border-l border-dashed border-border/40" />
                </div>
              }
            </div>);

        })}
      </div>);

  };

  /* ─── Render single message ─── */
  const renderMessage = (msg: typeof state.messages[0]) => {
    switch (msg.type) {
      case 'setup-summary':{
          const setup = JSON.parse(msg.content);
          return <SetupSummary key={msg.id} setup={setup} />;
        }

      case 'agent-cluster':
        return (
          <AgentClusterCard
            key={msg.id}
            agents={msg.agents || []}
            onAgentClick={(agentId) => {
              if (agentId === 'agent-01') setActiveRightView('agents', '01');else
              if (agentId === 'agent-02') setActiveRightView('agents', '02');else
              if (agentId === 'agent-03') setActiveRightView('agents', '03');else
              if (agentId === 'agent-04') setActiveRightView('agents', '04');
            }} />);



      case 'selection-confirm':
        return (
          <div key={msg.id} className="flex items-start gap-2 text-sm text-foreground/80 leading-relaxed animate-fade-in">
            <img src={pixelTrend} className="w-4 h-4 shrink-0 mt-0.5" alt="" />
            <span>{msg.content}</span>
          </div>);


      case 'video-gen-status':{
          const content = msg.content;
          let icon = null;
          let cleanContent = content;
          if (content.startsWith('✅')) {
            icon = <img src={pixelTrend} className="w-4 h-4 shrink-0 mt-0.5" alt="" />;
            cleanContent = content.slice(2).trim();
          } else if (content.startsWith('🎉')) {
            icon = <PartyPopper className="w-4 h-4 text-foreground shrink-0 mt-0.5" />;
            cleanContent = content.slice(2).trim();
          } else if (content.startsWith('🔄')) {
            icon = <RefreshCw className="w-4 h-4 text-foreground/60 shrink-0 mt-0.5" />;
            cleanContent = content.slice(2).trim();
          } else if (content.startsWith('❌')) {
            icon = <img src={pixelCross} className="w-4 h-4 shrink-0 mt-0.5" alt="" />;
            cleanContent = content.slice(2).trim();
          }
          return (
            <div key={msg.id} className={cn("flex items-start gap-2 text-sm leading-relaxed animate-fade-in", content.startsWith('❌') ? 'text-destructive' : 'text-foreground/80')}>
            {icon}
            <span>{cleanContent}</span>
          </div>);

        }

      case 'text':
      default:{
          const content = msg.content;
          let icon = null;
          let cleanContent = content;
          if (content.startsWith('✅')) {
            icon = <img src={pixelTrend} className="w-4 h-4 shrink-0 mt-0.5" alt="" />;
            cleanContent = content.slice(2).trim();
          } else if (content.startsWith('🔍') || content.startsWith('🎯')) {
            icon = <Search className="w-4 h-4 text-foreground/60 shrink-0 mt-0.5" />;
            cleanContent = content.slice(2).trim();
          }
          return (
            <div key={msg.id} className="flex items-start gap-2 text-sm text-foreground/80 leading-relaxed">
            {icon}
            <span className={cn(
                msg.isStreaming && 'after:inline-block after:w-1 after:h-3.5 after:bg-foreground/50 after:ml-0.5 after:animate-pulse after:rounded-sm'
              )}>
              {cleanContent}
            </span>
          </div>);

        }
    }
  };

  const isEmpty = !state.setupCompleted && state.messages.length === 0;

  const historySheet =
  <Sheet open={historySheetOpen} onOpenChange={setHistorySheetOpen}>
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
        <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(100vh-6rem)]">
          {history.map((item) => {
          const statusLabel = deriveStatusLabel(item.snapshot);
          const isActive = activeHistoryId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleRestoreHistory(item)}
              className={cn(
                "w-full text-left p-3 rounded-xl border transition-all group relative",
                isActive ? "border-primary/40 bg-primary/5" : "border-border/30 hover:border-border/60 hover:bg-muted/20"
              )}>
              
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{item.category}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(item.date).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{item.sellingPoints}</p>
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full",
                  statusLabel === '已完成' ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400" : "bg-muted/40 text-muted-foreground"
                )}>
                    {statusLabel}
                  </span>
                </div>
                <button
                onClick={(e) => {e.stopPropagation();deleteHistory(item.id);}}
                className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-muted/40 transition-all">
                
                  <X className="w-3.5 h-3.5 text-muted-foreground/50" />
                </button>
              </button>);

        })}
          {history.length === 0 &&
        <p className="text-sm text-muted-foreground text-center py-8">暂无历史记录</p>
        }
        </div>
      </SheetContent>
    </Sheet>;


  // Get task refs for right panel
  const taskCrawl = state.tasks.find((t) => t.id === 'task-crawl');
  const taskMemory = state.tasks.find((t) => t.id === 'task-memory');
  const taskPrompt = state.tasks.find((t) => t.id === 'task-reverse-prompt');
  const taskGenVideo = state.tasks.find((t) => t.id === 'task-generate-video');

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-background">
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Conversation column */}
        <div className={cn(
          'flex min-h-0 flex-col transition-all duration-300',
          showRightPanel ? 'w-1/2 border-r border-border/20' : 'w-full'
        )}>
          {isEmpty ?
          <div className="relative min-h-full flex flex-col items-center justify-start gap-20 px-6 pt-[100px] pb-6 md:px-8 md:pt-[180px] md:pb-8">
              <div className="absolute top-4 right-4 z-20 md:top-6 md:right-8">{historySheet}</div>
              <div className="w-full max-w-5xl animate-fade-in">
                <div className="mb-10 text-center">
                  <h1 className="mb-2 text-4xl font-light tracking-[0.2em] text-foreground">
                    ORAN GEN
                  </h1>
                  <p className="mt-3 text-sm font-light tracking-[0.1em] text-muted-foreground">
                    上传商品图开始对话，或直接输入问题
                  </p>
                </div>
                <div className="mx-auto max-w-2xl rounded-2xl border border-border/50 bg-card/90 backdrop-blur-sm shadow-sm">
                  <ChatInputBar
                    onSend={handleSend}
                    disabled={state.isProcessing}
                    memoryItems={memoryItems}
                    creators={creatorLibraryItems}
                    initialCategory={prefilledCategory}
                    initialMemoryIds={prefilledMemoryIds}
                  />
                </div>
              </div>
            </div> :

          <>
              {/* Top bar */}
              <div className="px-4 py-2 border-b border-border/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <button onClick={handleNewSession} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-muted/40">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>返回</span>
                  </button>
                </div>
              </div>

              {/* Messages area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto">
                <div className="px-6 py-6 pb-[60px]">
                  <div className="max-w-3xl mx-auto space-y-4">
                    {groupedMessages.map((group, gi) => {
                    if (group.kind === 'flow-group') {
                      // Extract agent-cluster messages to render as standalone cards after the flow card
                      const agentClusterMsgs = group.msgs.filter((m) => m.type === 'agent-cluster');
                      return (
                        <div key={`flow-group-${gi}`} className="space-y-4">
                            {renderFlowGroup(group.msgs, `flow-group-${gi}`)}
                            {agentClusterMsgs.map((acMsg) =>
                          <div key={`ac-${acMsg.id}`} id={`agent-cluster-card-${acMsg.id}`}>
                                <AgentClusterCard
                              agents={acMsg.agents || []}
                              onAgentClick={(agentId) => {
                                if (agentId === 'agent-01') setActiveRightView('agents', '01');else
                                if (agentId === 'agent-02') setActiveRightView('agents', '02');else
                                if (agentId === 'agent-03') setActiveRightView('agents', '03');else
                                if (agentId === 'agent-04') setActiveRightView('agents', '04');
                              }} />
                            
                              </div>
                          )}
                          </div>);

                    }
                    return renderMessage(group.msg);
                  })}
                    {state.isProcessing && state.messages.length > 0 &&
                  <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>正在处理中...</span>
                      </div>
                  }
                  </div>
                </div>
              </div>

              {/* Chat input – only show setup input before setup is completed */}
              {!state.setupCompleted &&
            <ChatInputBar
              onSend={handleSend}
              disabled={state.isProcessing}
              memoryItems={memoryItems}
              creators={creatorLibraryItems}
              initialCategory={prefilledCategory}
              initialMemoryIds={prefilledMemoryIds}
            />
            }
            </>
          }
        </div>

        {/* Right: Workspace panel */}
        {showRightPanel &&
        <div className="w-1/2 min-h-0 overflow-hidden animate-in slide-in-from-right-4 duration-300">
            <RightWorkspace
            view={state.activeRightView as RightView}
            onClose={() => setActiveRightView('none')}
            activeAgentTab={state.activeAgentTab || '01'}
            onAgentTabChange={(tab) => setActiveRightView('agents', tab)}
            // Checklist
            checklistItems={state.checklistItems}
            checklistDone={state.checklistDone}
            // Agent 01
            agent01={state.agents.find((a) => a.id === 'agent-01')}
            agent01Task={taskCrawl}
            candidateVideos={state.candidateVideos}
            selectedVideoId={state.selectedVideo?.id}
            onVideoSelect={selectVideo}
            videoSelectDisabled={!!state.selectedVideo}
            // Agent 02/03
            agent02={state.agents.find((a) => a.id === 'agent-02')}
            agent03={state.agents.find((a) => a.id === 'agent-03')}
            agent02Task={taskMemory}
            agent03Task={taskPrompt}
            generatedPrompt={state.generatedPrompt}
            onPromptChange={updatePrompt}
            onPromptConfirm={confirmGenerate}
            onBackToVideoSelect={() => {
              backToVideoSelect();
            }}
            memoryEnabled={state.setup.memoryEnabled}
            isProcessing={state.isProcessing}
            // Agent 04
            agent04={state.agents.find((a) => a.id === 'agent-04')}
            agent04Task={taskGenVideo}
            resultVideo={state.resultVideo}
            onRegenerate={regenerate}
            // Memory
            memoryTitle={activeMemoryEntry?.title}
            memoryContent={activeMemoryEntry?.content}
            memoryCategory={activeMemoryEntry?.category} />
          
          </div>
        }
      </div>
    </div>);

}
