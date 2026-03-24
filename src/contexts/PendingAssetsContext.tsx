import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface PendingAsset {
  id: string;
  name: string;
  type: 'video' | 'image';
  thumbnail: string;
  isPublished: boolean;
  publishedAt?: string;
  addedAt: string;
}

interface PendingAssetsContextType {
  pendingAssets: PendingAsset[];
  addPendingAsset: (asset: Omit<PendingAsset, 'addedAt' | 'isPublished'>) => void;
  removePendingAsset: (id: string) => void;
  markAsPublished: (id: string) => void;
}

const PendingAssetsContext = createContext<PendingAssetsContextType | undefined>(undefined);

export function PendingAssetsProvider({ children }: { children: ReactNode }) {
  const [pendingAssets, setPendingAssets] = useState<PendingAsset[]>([]);

  const addPendingAsset = useCallback((asset: Omit<PendingAsset, 'addedAt' | 'isPublished'>) => {
    setPendingAssets(prev => {
      // Prevent duplicates
      if (prev.some(a => a.id === asset.id)) {
        return prev;
      }
      return [
        {
          ...asset,
          isPublished: false,
          addedAt: new Date().toISOString(),
        },
        ...prev,
      ];
    });
  }, []);

  const removePendingAsset = useCallback((id: string) => {
    setPendingAssets(prev => prev.filter(a => a.id !== id));
  }, []);

  const markAsPublished = useCallback((id: string) => {
    setPendingAssets(prev => 
      prev.map(a => 
        a.id === id 
          ? { ...a, isPublished: true, publishedAt: new Date().toISOString().split('T')[0] }
          : a
      )
    );
  }, []);

  return (
    <PendingAssetsContext.Provider value={{ pendingAssets, addPendingAsset, removePendingAsset, markAsPublished }}>
      {children}
    </PendingAssetsContext.Provider>
  );
}

export function usePendingAssets() {
  const context = useContext(PendingAssetsContext);
  if (!context) {
    throw new Error('usePendingAssets must be used within a PendingAssetsProvider');
  }
  return context;
}
