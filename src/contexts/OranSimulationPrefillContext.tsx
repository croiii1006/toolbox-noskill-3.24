import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

export interface OranSimulationPrefill {
  attachmentIds: string[];
  attachmentNames: string[];
  prompt?: string;
  autoStart?: boolean;
}

interface OranSimulationPrefillContextValue {
  prefill: OranSimulationPrefill | null;
  setPrefill: (data: OranSimulationPrefill) => void;
  consumePrefill: () => OranSimulationPrefill | null;
}

const OranSimulationPrefillContext = createContext<OranSimulationPrefillContextValue | null>(null);

export function OranSimulationPrefillProvider({ children }: { children: ReactNode }) {
  const [prefill, setPrefillState] = useState<OranSimulationPrefill | null>(null);

  const setPrefill = useCallback((data: OranSimulationPrefill) => {
    setPrefillState(data);
  }, []);

  const consumePrefill = useCallback(() => {
    const data = prefill;
    setPrefillState(null);
    return data;
  }, [prefill]);

  return (
    <OranSimulationPrefillContext.Provider value={{ prefill, setPrefill, consumePrefill }}>
      {children}
    </OranSimulationPrefillContext.Provider>
  );
}

export function useOranSimulationPrefill() {
  const ctx = useContext(OranSimulationPrefillContext);
  if (!ctx) {
    throw new Error('useOranSimulationPrefill must be used within OranSimulationPrefillProvider');
  }
  return ctx;
}
