import { useEffect, useRef, useState } from 'react';
import { Plus, ArrowUp, X, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CategoryCascader } from './CategoryCascader';
import { CATEGORY_TREE } from './categoryData';
import { MemorySelectionDialog } from '@/components/modules/memory/MemorySelectionDialog';
import { toast } from '@/hooks/use-toast';

export interface MemoryItem {
  id: string;
  name: string;
  desc: string;
  tag: string;
  charCount: number;
}

interface ChatInputBarProps {
  onSend: (text: string, image?: string | null, category?: string, memoryIds?: string[]) => void;
  disabled?: boolean;
  memoryItems: MemoryItem[];
  initialCategory?: string;
  initialMemoryIds?: string[];
}

const MAX_TAG_LENGTH = 20;
const MAX_TAG_COUNT = 10;

export function ChatInputBar({
  onSend,
  disabled,
  memoryItems,
  initialCategory,
  initialMemoryIds,
}: ChatInputBarProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [selectedMemoryIds, setSelectedMemoryIds] = useState<string[]>([]);
  const [memoryDialogOpen, setMemoryDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof initialCategory === 'string') {
      setCategory(initialCategory);
    }
  }, [initialCategory]);

  useEffect(() => {
    if (!initialMemoryIds) {
      return;
    }

    const validIds = initialMemoryIds.filter((id) => memoryItems.some((item) => item.id === id));
    setSelectedMemoryIds(validIds);
  }, [initialMemoryIds, memoryItems]);

  const addTag = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_TAG_LENGTH) {
      toast({ title: '标签过长', description: `每个标签最多 ${MAX_TAG_LENGTH} 个字符`, variant: 'destructive' });
      return;
    }
    if (tags.length >= MAX_TAG_COUNT) {
      toast({ title: '标签已满', description: `最多添加 ${MAX_TAG_COUNT} 个标签`, variant: 'destructive' });
      return;
    }
    if (tags.includes(trimmed)) {
      toast({ title: '标签重复', description: '该标签已存在' });
      return;
    }
    setTags(prev => [...prev, trimmed]);
    setTagInput('');
  };

  const removeTag = (index: number) => {
    setTags(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (tags.length === 0 || !image || !category || disabled) return;
    const sellingPointsText = tags.join('\n');
    onSend(sellingPointsText, image, category || undefined, selectedMemoryIds.length > 0 ? selectedMemoryIds : undefined);
    setTags([]);
    setTagInput('');
    setImage(null);
    setImageName(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImage(url);
      setImageName(file.name);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImageName(null);
  };

  const toggleMemory = (id: string) => {
    setSelectedMemoryIds(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const hasContent = tags.length > 0 && image && category;

  return (
    <div className="border-t border-border/20 bg-transparent px-6 py-3">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start gap-4">
          {/* Left: Image upload box */}
          <div className="shrink-0 pt-0.5">
            {image ? (
              <div className="relative w-[100px] h-[100px] rounded-xl overflow-hidden border border-border/60 group">
                <img src={image} alt="Product" className="w-full h-full object-cover" />
                <button
                  onClick={removeImage}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-foreground/70 text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-[100px] h-[100px] rounded-xl border-2 border-dashed border-border/40 hover:border-foreground/20 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus className="w-5 h-5 text-muted-foreground/50" />
                <span className="text-[10px] text-muted-foreground/50 leading-tight text-center px-2">上传商品白底图</span>
              </button>
            )}
          </div>

          {/* Right: Input area */}
          <div className="flex-1 min-w-0">
            {/* Category selector */}
            <div className="flex items-center gap-2 mb-2">
              <CategoryCascader
                data={CATEGORY_TREE}
                value={category}
                onChange={setCategory}
                placeholder="选择品类"
              />
            </div>

            {/* Tag input area */}
            <div className="flex flex-wrap items-center gap-1.5 min-h-[48px] py-1.5">
              {tags.map((tag, i) => (
                <span
                  key={`${tag}-${i}`}
                  className="inline-flex items-center gap-1 h-6 rounded-full bg-foreground/5 border border-border/40 px-2.5 text-xs text-foreground/80"
                >
                  {tag}
                  <button onClick={() => removeTag(i)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                ref={tagInputRef}
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(tagInput);
                  }
                  if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
                    removeTag(tags.length - 1);
                  }
                }}
                onBlur={() => {
                  if (tagInput.trim()) addTag(tagInput);
                }}
                placeholder={tags.length === 0 ? '输入卖点后按回车添加标签...' : tags.length < MAX_TAG_COUNT ? '继续添加...' : ''}
                disabled={disabled || tags.length >= MAX_TAG_COUNT}
                className="flex-1 min-w-[120px] bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between mt-2 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMemoryDialogOpen(true)}
              className={cn(
                'h-8 rounded-full border flex items-center justify-center gap-1.5 px-3 transition-all duration-300 ease-out',
                selectedMemoryIds.length > 0
                  ? 'border-orange-400/60 bg-orange-400/10 text-accent/80'
                  : 'border-border/40 text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              <Database className="w-4 h-4" />
              <span className="text-[11px] font-medium whitespace-nowrap">
                {selectedMemoryIds.length > 0 ? `${selectedMemoryIds.length} 个记忆库` : '记忆库'}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground/60">预计消耗：约 200 credit</span>
            <button
              onClick={handleSend}
              disabled={!hasContent || disabled}
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
                hasContent && !disabled
                  ? 'bg-foreground text-background hover:bg-foreground/90'
                  : 'bg-muted/60 text-muted-foreground/40 cursor-not-allowed'
              )}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      </div>

      <MemorySelectionDialog
        open={memoryDialogOpen}
        onOpenChange={setMemoryDialogOpen}
        items={memoryItems}
        selectedIds={selectedMemoryIds}
        onToggle={toggleMemory}
        className="bg-background/40 backdrop-blur-xl border-border/20"
      />
    </div>
  );
}
