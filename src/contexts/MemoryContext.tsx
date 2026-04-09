import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { toast } from "sonner";

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
  addEntry: (entry: Omit<MemoryEntry, "id" | "createdAt" | "updatedAt">) => void;
  ensureEntry: (entry: Omit<MemoryEntry, "id" | "createdAt" | "updatedAt">) => MemoryEntry;
  updateEntry: (entry: MemoryEntry) => void;
  deleteEntry: (id: string) => void;
  importEntries: (data: MemoryEntry[]) => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
}

const SEED: MemoryEntry[] = [];

const MemoryContext = createContext<MemoryContextValue | null>(null);

export function MemoryProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<MemoryEntry[]>(SEED);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const addEntry = useCallback(
    (entry: Omit<MemoryEntry, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString().slice(0, 10);
      setEntries((prev) => [
        ...prev,
        {
          ...entry,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        },
      ]);
      toast.success("已添加到记忆库");
    },
    [],
  );

  const ensureEntry = useCallback(
    (entry: Omit<MemoryEntry, "id" | "createdAt" | "updatedAt">) => {
      const existing = entries.find(
        (item) =>
          item.title === entry.title &&
          item.content === entry.content &&
          item.category === entry.category,
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
    },
    [entries],
  );

  const updateEntry = useCallback((entry: MemoryEntry) => {
    const now = new Date().toISOString().slice(0, 10);
    setEntries((prev) =>
      prev.map((item) => (item.id === entry.id ? { ...entry, updatedAt: now } : item)),
    );
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const importEntries = useCallback((data: MemoryEntry[]) => {
    setEntries((prev) => [
      ...prev,
      ...data.map((item) => ({ ...item, id: crypto.randomUUID() })),
    ]);
  }, []);

  return (
    <MemoryContext.Provider
      value={{
        entries,
        addEntry,
        ensureEntry,
        updateEntry,
        deleteEntry,
        importEntries,
        drawerOpen,
        setDrawerOpen,
      }}
    >
      {children}
    </MemoryContext.Provider>
  );
}

export function useMemory() {
  const ctx = useContext(MemoryContext);
  if (!ctx) {
    throw new Error("useMemory must be used within MemoryProvider");
  }
  return ctx;
}
