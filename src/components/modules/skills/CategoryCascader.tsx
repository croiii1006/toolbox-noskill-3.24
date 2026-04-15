import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronDown, Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  CATEGORY_TREE,
  flattenCategoryTree,
  type CategoryNode,
} from './categoryData';

export { CATEGORY_TREE } from './categoryData';
export type { CategoryNode } from './categoryData';

interface CategoryCascaderProps {
  data: CategoryNode[];
  value?: string;
  onChange?: (path: string) => void;
  placeholder?: string;
  className?: string;
}

function CascaderColumn({
  items,
  selectedLabel,
  onSelect,
  onHover,
  isLast,
}: {
  items: CategoryNode[];
  selectedLabel?: string;
  onSelect: (node: CategoryNode) => void;
  onHover: (node: CategoryNode) => void;
  isLast?: boolean;
}) {
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = (node: CategoryNode) => {
    if (node.children && node.children.length > 0) {
      hoverTimer.current = setTimeout(() => {
        onHover(node);
      }, 150);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };

  return (
    <div className="min-w-[160px] max-h-[320px] overflow-y-auto border-r border-border/20 last:border-r-0 py-1">
      {items.map((node) => {
        const isSelected = node.label === selectedLabel;
        const hasChildren = node.children && node.children.length > 0;

        return (
          <button
            key={node.label}
            onClick={() => onSelect(node)}
            onMouseEnter={() => handleMouseEnter(node)}
            onMouseLeave={handleMouseLeave}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors',
              isSelected
                ? 'bg-muted/60 text-foreground font-medium'
                : 'text-foreground/80 hover:bg-muted/30'
            )}
          >
            <span className="truncate">{node.label}</span>
            {hasChildren ? (
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0 ml-2" />
            ) : isSelected && isLast ? (
              <Check className="w-3.5 h-3.5 text-foreground shrink-0 ml-2" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function CategoryCascader({
  data,
  value,
  onChange,
  placeholder = '选择品类',
  className,
}: CategoryCascaderProps) {
  const [open, setOpen] = useState(false);
  const [selectedPath, setSelectedPath] = useState<CategoryNode[]>([]);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const allPaths = useMemo(() => flattenCategoryTree(data), [data]);
  const filteredPaths = useMemo(() => {
    if (!search.trim()) return [];
    const query = search.toLowerCase();
    return allPaths.filter((path) => path.toLowerCase().includes(query));
  }, [search, allPaths]);

  useEffect(() => {
    if (!value) {
      setSelectedPath([]);
      return;
    }

    const parts = value.split(' > ');
    const nextPath: CategoryNode[] = [];
    let currentNodes = data;

    for (const part of parts) {
      const found = currentNodes.find((node) => node.label === part);
      if (!found) break;
      nextPath.push(found);
      currentNodes = found.children || [];
    }

    setSelectedPath(nextPath);
  }, [data, value]);

  useEffect(() => {
    if (open) {
      setSearch('');
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSelect = (node: CategoryNode, level: number) => {
    const nextPath = [...selectedPath.slice(0, level), node];
    setSelectedPath(nextPath);

    if (!node.children || node.children.length === 0) {
      onChange?.(nextPath.map((item) => item.label).join(' > '));
      setOpen(false);
    }
  };

  const handleHover = (node: CategoryNode, level: number) => {
    setSelectedPath((prev) => [...prev.slice(0, level), node]);
  };

  const handleSearchSelect = (path: string) => {
    onChange?.(path);
    setOpen(false);
  };

  const displayValue =
    value || (selectedPath.length > 0 ? selectedPath.map((node) => node.label).join(' > ') : '');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-1 h-7 rounded-md border border-border/40 text-xs bg-transparent px-2 hover:border-border transition-colors',
            !displayValue && 'text-muted-foreground',
            className
          )}
        >
          <span className="truncate max-w-[200px]">{displayValue || placeholder}</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="p-0 rounded-xl shadow-lg w-auto max-w-[540px]"
      >
        <div className="px-3 py-2 border-b border-border/20">
          <div className="flex items-center gap-2 px-2 h-8 rounded-lg bg-muted/30 border border-border/20">
            <Search className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
            <input
              ref={searchInputRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜索品类..."
              className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
            />
          </div>
        </div>

        {search.trim() ? (
          <div className="max-h-[320px] overflow-y-auto py-1">
            {filteredPaths.length === 0 ? (
              <p className="text-xs text-muted-foreground/50 text-center py-6">无匹配结果</p>
            ) : (
              filteredPaths.slice(0, 20).map((path) => (
                <button
                  key={path}
                  onClick={() => handleSearchSelect(path)}
                  className={cn(
                    'w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-muted/30',
                    value === path ? 'bg-muted/60 text-foreground font-medium' : 'text-foreground/80'
                  )}
                >
                  {path}
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="flex">
            <CascaderColumn
              items={data}
              selectedLabel={selectedPath[0]?.label}
              onSelect={(node) => handleSelect(node, 0)}
              onHover={(node) => handleHover(node, 0)}
            />
            {selectedPath[0]?.children && selectedPath[0].children.length > 0 && (
              <CascaderColumn
                items={selectedPath[0].children}
                selectedLabel={selectedPath[1]?.label}
                onSelect={(node) => handleSelect(node, 1)}
                onHover={(node) => handleHover(node, 1)}
              />
            )}
            {selectedPath[1]?.children && selectedPath[1].children.length > 0 && (
              <CascaderColumn
                items={selectedPath[1].children}
                selectedLabel={selectedPath[2]?.label}
                onSelect={(node) => handleSelect(node, 2)}
                onHover={(node) => handleHover(node, 2)}
                isLast
              />
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
