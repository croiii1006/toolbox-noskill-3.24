import { Database, FolderOpen, Tag, Users } from 'lucide-react';
import type { SessionSetup } from './useSkillsEngine';
import { creatorLibraryItems } from './creatorLibrary';

interface SetupSummaryProps {
  setup: SessionSetup;
}

export function SetupSummary({ setup }: SetupSummaryProps) {
  const selectedCreators = creatorLibraryItems.filter((item) =>
    (setup.selectedCreatorIds || []).includes(item.id),
  );

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border/20 bg-muted/20 px-4 py-3 text-sm">
      {setup.image && (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 overflow-hidden rounded-lg border border-border/30">
            <img src={setup.image} alt="Product" className="h-full w-full object-cover" />
          </div>
          <span className="max-w-[80px] truncate text-xs text-muted-foreground/60">{setup.imageName}</span>
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <FolderOpen className="h-3.5 w-3.5 text-muted-foreground/50" />
        <span className="text-xs text-foreground/70">{setup.category}</span>
      </div>

      {setup.sellingPoints && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Tag className="h-3.5 w-3.5 text-muted-foreground/50" />
          {setup.sellingPoints
            .split('\n')
            .filter(Boolean)
            .map((sellingPoint, index) => (
              <span
                key={`${sellingPoint}-${index}`}
                className="inline-flex h-5 items-center rounded-full border border-border/30 bg-foreground/5 px-2 text-[10px] text-foreground/70"
              >
                {sellingPoint}
              </span>
            ))}
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <Database className="h-3.5 w-3.5 text-muted-foreground/50" />
        <span className="text-xs text-foreground/70">
          {setup.memoryEnabled ? `记忆库 (${setup.selectedMemoryIds.length})` : '记忆库关闭'}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5 text-muted-foreground/50" />
        <span className="text-xs text-foreground/70">
          {selectedCreators.length > 0
            ? `达人库 (${selectedCreators.length}) ${selectedCreators
                .slice(0, 2)
                .map((item) => item.handle)
                .join('、')}${selectedCreators.length > 2 ? '…' : ''}`
            : '达人库未选择'}
        </span>
      </div>
    </div>
  );
}
