import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Database, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CategoryCascader } from './CategoryCascader';
import { CATEGORY_TREE } from './categoryData';
import { MemorySelectionDialog } from '@/components/modules/memory/MemorySelectionDialog';
import { CreatorSelectionDialog } from './CreatorSelectionDialog';
import type { CreatorLibraryItem } from './creatorLibrary';
import { toast } from '@/hooks/use-toast';

export interface MemoryItem {
  id: string;
  name: string;
  desc: string;
  tag: string;
  charCount: number;
}

interface ChatInputBarProps {
  onSend: (
    text: string,
    image?: string | null,
    category?: string,
    memoryIds?: string[],
    creatorIds?: string[],
  ) => void;
  disabled?: boolean;
  memoryItems: MemoryItem[];
  creators: CreatorLibraryItem[];
  initialCategory?: string;
  initialMemoryIds?: string[];
  initialCreatorIds?: string[];
}

const MAX_TAG_LENGTH = 20;
const MAX_TAG_COUNT = 10;

export function ChatInputBar({
  onSend,
  disabled,
  memoryItems,
  creators,
  initialCategory,
  initialMemoryIds,
  initialCreatorIds,
}: ChatInputBarProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [selectedMemoryIds, setSelectedMemoryIds] = useState<string[]>([]);
  const [selectedCreatorIds, setSelectedCreatorIds] = useState<string[]>([]);
  const [memoryDialogOpen, setMemoryDialogOpen] = useState(false);
  const [creatorDialogOpen, setCreatorDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof initialCategory === 'string') {
      setCategory(initialCategory);
    }
  }, [initialCategory]);

  useEffect(() => {
    if (!initialMemoryIds) return;
    const validIds = initialMemoryIds.filter((id) => memoryItems.some((item) => item.id === id));
    setSelectedMemoryIds(validIds);
  }, [initialMemoryIds, memoryItems]);

  useEffect(() => {
    if (!initialCreatorIds) return;
    const validIds = initialCreatorIds.filter((id) => creators.some((item) => item.id === id));
    setSelectedCreatorIds(validIds);
  }, [initialCreatorIds, creators]);

  const addTag = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    if (trimmed.length > MAX_TAG_LENGTH) {
      toast({
        title: '标签过长',
        description: `每个标签最多 ${MAX_TAG_LENGTH} 个字符`,
        variant: 'destructive',
      });
      return;
    }

    if (tags.length >= MAX_TAG_COUNT) {
      toast({
        title: '标签已满',
        description: `最多添加 ${MAX_TAG_COUNT} 个标签`,
        variant: 'destructive',
      });
      return;
    }

    if (tags.includes(trimmed)) {
      toast({ title: '标签重复', description: '该标签已存在' });
      return;
    }

    setTags((prev) => [...prev, trimmed]);
    setTagInput('');
  };

  const removeTag = (index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (tags.length === 0 || !image || !category || disabled) return;

    onSend(
      tags.join('\n'),
      image,
      category || undefined,
      selectedMemoryIds.length > 0 ? selectedMemoryIds : undefined,
      selectedCreatorIds.length > 0 ? selectedCreatorIds : undefined,
    );

    setTags([]);
    setTagInput('');
    setImage(null);
    setImageName(null);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImage(url);
    setImageName(file.name);
  };

  const removeImage = () => {
    setImage(null);
    setImageName(null);
  };

  const toggleMemory = (id: string) => {
    setSelectedMemoryIds((prev) =>
      prev.includes(id) ? prev.filter((memoryId) => memoryId !== id) : [...prev, id],
    );
  };

  const toggleCreator = (id: string) => {
    setSelectedCreatorIds((prev) => (prev[0] === id ? [] : [id]));
  };

  const hasContent = tags.length > 0 && image && category;
  const selectedCreators = creators.filter((item) => selectedCreatorIds.includes(item.id));

  return (
    <div className="border-t border-border/20 bg-transparent px-6 py-3">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-start gap-4">
          <div className="shrink-0 pt-0.5">
            {image ? (
              <div className="group relative h-[100px] w-[100px] overflow-hidden rounded-xl border border-border/60">
                <img src={image} alt="Product" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground/70 text-background opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-[100px] w-[100px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border/40 transition-colors hover:border-foreground/20"
              >
                <Plus className="h-5 w-5 text-muted-foreground/50" />
                <span className="px-2 text-center text-[10px] leading-tight text-muted-foreground/50">
                  上传商品白底图
                </span>
              </button>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <CategoryCascader
                data={CATEGORY_TREE}
                value={category}
                onChange={setCategory}
                placeholder="选择品类"
              />
            </div>

            <div className="flex min-h-[48px] flex-wrap items-center gap-1.5 py-1.5">
              {tags.map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="inline-flex h-6 items-center gap-1 rounded-full border border-border/40 bg-foreground/5 px-2.5 text-xs text-foreground/80"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}

              <input
                ref={tagInputRef}
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addTag(tagInput);
                  }

                  if (event.key === 'Backspace' && !tagInput && tags.length > 0) {
                    removeTag(tags.length - 1);
                  }
                }}
                onBlur={() => {
                  if (tagInput.trim()) addTag(tagInput);
                }}
                placeholder={
                  tags.length === 0
                    ? '输入卖点后按回车添加标签...'
                    : tags.length < MAX_TAG_COUNT
                      ? '继续添加...'
                      : ''
                }
                disabled={disabled || tags.length >= MAX_TAG_COUNT}
                className="min-w-[120px] flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMemoryDialogOpen(true)}
              className={cn(
                'flex h-8 items-center justify-center gap-1.5 rounded-full border px-3 transition-all duration-300 ease-out',
                selectedMemoryIds.length > 0
                  ? 'border-orange-400/60 bg-orange-400/10 text-accent/80'
                  : 'border-border/40 text-muted-foreground hover:border-border hover:text-foreground',
              )}
            >
              <Database className="h-4 w-4" />
              <span className="whitespace-nowrap text-[11px] font-medium">
                {selectedMemoryIds.length > 0 ? `${selectedMemoryIds.length} 个记忆库` : '记忆库'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCreatorDialogOpen(true)}
              className={cn(
                'flex min-h-8 items-center justify-center gap-1.5 rounded-full border px-3 py-1 transition-all duration-300 ease-out',
                selectedCreatorIds.length > 0
                  ? 'border-orange-400/60 bg-orange-400/10 text-accent/80'
                  : 'border-border/40 text-muted-foreground hover:border-border hover:text-foreground',
              )}
            >
              {selectedCreators.length > 0 ? (
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-1.5">
                    {selectedCreators.slice(0, 2).map((creator) => (
                      <img
                        key={creator.id}
                        src={creator.avatarUrl}
                        alt={creator.handle}
                        className="h-5 w-5 rounded-full border border-background object-cover"
                      />
                    ))}
                  </div>
                  <span className="max-w-[132px] truncate text-[11px] font-medium text-foreground/85">
                    {selectedCreators[0]?.handle}
                  </span>
                  {selectedCreators.length > 1 ? (
                    <span className="rounded-full bg-white/75 px-1.5 py-0.5 text-[10px] font-medium text-accent/80">
                      +{selectedCreators.length - 1}
                    </span>
                  ) : null}
                </div>
              ) : (
                <span className="whitespace-nowrap text-[11px] font-medium">达人库</span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground/60">预计消耗: 约 200 credit</span>
            <button
              type="button"
              onClick={handleSend}
              disabled={!hasContent || disabled}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
                hasContent && !disabled
                  ? 'bg-foreground text-background hover:bg-foreground/90'
                  : 'cursor-not-allowed bg-muted/60 text-muted-foreground/40',
              )}
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>

        {imageName && (
          <div className="mt-2 text-[11px] text-muted-foreground/50">
            当前图片: <span className="text-foreground/70">{imageName}</span>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      <MemorySelectionDialog
        open={memoryDialogOpen}
        onOpenChange={setMemoryDialogOpen}
        items={memoryItems}
        selectedIds={selectedMemoryIds}
        onToggle={toggleMemory}
        className="border-border/20 bg-background/40 backdrop-blur-xl"
      />

      <CreatorSelectionDialog
        open={creatorDialogOpen}
        onOpenChange={setCreatorDialogOpen}
        items={creators}
        selectedIds={selectedCreatorIds}
        onToggle={toggleCreator}
      />
    </div>
  );
}
