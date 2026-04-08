import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';

export interface MemoryEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface MemoryContextValue {
  entries: MemoryEntry[];
  addEntry: (entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  ensureEntry: (entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt'>) => MemoryEntry;
  updateEntry: (entry: MemoryEntry) => void;
  deleteEntry: (id: string) => void;
  importEntries: (data: MemoryEntry[]) => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
}

const SEED: MemoryEntry[] = [
  {
    id: '1', title: '品牌调性指南', content: '品牌主色调为深海蓝 #1a365d，辅色珊瑚橙 #ed8936。语气亲切专业，面向 25-35 岁都市消费者。',
    category: 'brand', tags: ['调性', '色彩'], createdAt: '2026-02-20', updatedAt: '2026-03-01',
  },
  {
    id: '2', title: '核心产品卖点 - 蓝牙耳机 Pro', content: '主动降噪深度 40dB，续航 36 小时，IPX5 防水，蓝牙 5.3 低延迟。适合通勤与运动场景。',
    category: 'product', tags: ['耳机', '卖点'], createdAt: '2026-02-25', updatedAt: '2026-03-02',
  },
  {
    id: '3', title: '竞品 A 分析', content: '竞品 A 主打性价比路线，价格低 30%，但降噪深度仅 25dB，续航 24 小时。在 TikTok 上以开箱测评为主要内容策略。',
    category: 'competitor', tags: ['竞品', '对比'], createdAt: '2026-02-28', updatedAt: '2026-02-28',
  },
  {
    id: '4', title: 'TikTok 内容策略', content: '优先产出 15-30s 短视频，开头 3s 必须抓住痛点。推荐使用前后对比、场景化展示、KOL 口播三种模板。',
    category: 'strategy', tags: ['TikTok', '短视频'], createdAt: '2026-03-01', updatedAt: '2026-03-03',
  },
];

const MemoryContext = createContext<MemoryContextValue | null>(null);

export function MemoryProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<MemoryEntry[]>(SEED);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const addEntry = useCallback((entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString().slice(0, 10);
    setEntries(prev => [...prev, { ...entry, id: crypto.randomUUID(), createdAt: now, updatedAt: now }]);
    toast.success('已添加到记忆库');
  }, []);

  const ensureEntry = useCallback((entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const existing = entries.find((item) =>
      item.title === entry.title &&
      item.content === entry.content &&
      item.category === entry.category
    );

    if (existing) {
      return existing;
    }

    const now = new Date().toISOString().slice(0, 10);
    const nextEntry: MemoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    setEntries((prev) => [...prev, nextEntry]);
    return nextEntry;
  }, [entries]);

  const updateEntry = useCallback((entry: MemoryEntry) => {
    const now = new Date().toISOString().slice(0, 10);
    setEntries(prev => prev.map(e => e.id === entry.id ? { ...entry, updatedAt: now } : e));
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const importEntries = useCallback((data: MemoryEntry[]) => {
    setEntries(prev => [...prev, ...data.map(d => ({ ...d, id: crypto.randomUUID() }))]);
  }, []);

  return (
    <MemoryContext.Provider value={{ entries, addEntry, ensureEntry, updateEntry, deleteEntry, importEntries, drawerOpen, setDrawerOpen }}>
      {children}
    </MemoryContext.Provider>
  );
}

export function useMemory() {
  const ctx = useContext(MemoryContext);
  if (!ctx) throw new Error('useMemory must be used within MemoryProvider');
  return ctx;
}
