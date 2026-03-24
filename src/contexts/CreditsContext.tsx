import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { USER_SUBSCRIPTION_CREDITS, USER_TOPUP_CREDITS, USER_GIFT_CREDITS } from '@/constants/user';

export interface UsageRecord {
  id: string;
  label: string;
  amount: number;
  date: string;
  status: '已消耗' | '已获取' | '已退还';
}

interface CreditsContextValue {
  credits: number;
  subscriptionCredits: number;
  topupCredits: number;
  giftCredits: number;
  usageHistory: UsageRecord[];
  deduct: (amount: number, label?: string) => boolean;
  refund: (amount: number, label?: string) => void;
  canAfford: (amount: number) => boolean;
  shortfall: (amount: number) => number;
}

const CreditsContext = createContext<CreditsContextValue | null>(null);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const [subscriptionCredits, setSubscriptionCredits] = useState(USER_SUBSCRIPTION_CREDITS);
  const [topupCredits, setTopupCredits] = useState(USER_TOPUP_CREDITS);
  const [giftCredits, setGiftCredits] = useState(USER_GIFT_CREDITS);
  const [usageHistory, setUsageHistory] = useState<UsageRecord[]>([
    {
      id: 'init-sub',
      label: '订阅赠送积分',
      amount: USER_SUBSCRIPTION_CREDITS,
      date: new Date().toISOString(),
      status: '已获取',
    },
    {
      id: 'init-topup',
      label: '额外充值积分',
      amount: USER_TOPUP_CREDITS,
      date: new Date().toISOString(),
      status: '已获取',
    },
    {
      id: 'init-gift',
      label: '赠送积分',
      amount: USER_GIFT_CREDITS,
      date: new Date().toISOString(),
      status: '已获取',
    },
  ]);
  const credits = subscriptionCredits + topupCredits + giftCredits;

  const canAfford = useCallback((amount: number) => credits >= amount, [credits]);

  const shortfall = useCallback((amount: number) => Math.max(0, amount - credits), [credits]);

  const addRecord = useCallback((label: string, amount: number, status: UsageRecord['status']) => {
    setUsageHistory(prev => [{
      id: crypto.randomUUID(),
      label,
      amount,
      date: new Date().toISOString(),
      status,
    }, ...prev]);
  }, []);

  const deduct = useCallback((amount: number, label: string = '未知操作') => {
    if (subscriptionCredits + topupCredits + giftCredits < amount) return false;
    let remaining = amount;
    const fromSub = Math.min(remaining, subscriptionCredits);
    remaining -= fromSub;
    const fromTop = Math.min(remaining, topupCredits);
    remaining -= fromTop;
    const fromGift = Math.min(remaining, giftCredits);
    setSubscriptionCredits(prev => prev - fromSub);
    setTopupCredits(prev => prev - fromTop);
    setGiftCredits(prev => prev - fromGift);
    addRecord(label, amount, '已消耗');
    return true;
  }, [subscriptionCredits, topupCredits, giftCredits, addRecord]);

  const refund = useCallback((amount: number, label: string = '退款') => {
    setTopupCredits(prev => prev + amount);
    addRecord(label, amount, '已退还');
  }, [addRecord]);

  return (
    <CreditsContext.Provider value={{ credits, subscriptionCredits, topupCredits, giftCredits, usageHistory, deduct, refund, canAfford, shortfall }}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const ctx = useContext(CreditsContext);
  if (!ctx) throw new Error('useCredits must be used within CreditsProvider');
  return ctx;
}
