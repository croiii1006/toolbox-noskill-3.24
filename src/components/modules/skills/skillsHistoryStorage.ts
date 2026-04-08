import type { SkillsState } from './useSkillsEngine';

export interface SkillsHistoryItem {
  id: string;
  category: string;
  sellingPoints: string;
  image: string | null;
  memoryEnabled: boolean;
  selectedMemoryIds: string[];
  date: string;
  snapshot: SkillsState;
}

const DB_NAME = 'oranai-skills';
const DB_VERSION = 1;
const STORE_HISTORY = 'skills_history';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_HISTORY)) {
        db.createObjectStore(STORE_HISTORY, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getSkillsHistory(): Promise<SkillsHistoryItem[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_HISTORY, 'readonly');
    const store = tx.objectStore(STORE_HISTORY);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as SkillsHistoryItem[]);
    req.onerror = () => reject(req.error);
  });
}

export async function upsertSkillsHistoryItem(item: SkillsHistoryItem): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_HISTORY, 'readwrite');
    const store = tx.objectStore(STORE_HISTORY);
    store.put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteSkillsHistoryItem(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_HISTORY, 'readwrite');
    const store = tx.objectStore(STORE_HISTORY);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
