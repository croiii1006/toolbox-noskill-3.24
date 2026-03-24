export type HistoryStatus = 'completed' | 'in_progress' | 'failed';

export const statusConfig: Record<HistoryStatus, { label: string; className: string }> = {
  completed: { label: '已完成', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  in_progress: { label: '进行中', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  failed: { label: '失败', className: 'bg-red-500/10 text-red-600 border-red-500/20' },
};
