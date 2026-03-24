import { useState, useRef, useCallback } from 'react';
import { ArrowUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CategoryCascader, CATEGORY_TREE } from '@/components/modules/skills/CategoryCascader';

interface TikTokReportComposerProps {
  onSubmit: (payload: {category: string;sellingPoints: string[];}) => void;
  disabled?: boolean;
}

export function TikTokReportComposer({ onSubmit, disabled }: TikTokReportComposerProps) {
  const [category, setCategory] = useState('');
  const [sellingPoints, setSellingPoints] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const canSend = category.trim() !== '' && sellingPoints.length > 0;

  const handleSend = useCallback(() => {
    if (!canSend || disabled) return;
    const payload = { category, sellingPoints };
    console.log(payload);
    onSubmit(payload);
  }, [canSend, disabled, category, sellingPoints, onSubmit]);

  const addSellingPoint = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !sellingPoints.includes(trimmed)) {
      setSellingPoints((prev) => [...prev, trimmed]);
    }
    setInputValue('');
  };

  const removeSellingPoint = (point: string) => {
    setSellingPoints((prev) => prev.filter((p) => p !== point));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        addSellingPoint(inputValue);
      } else {
        handleSend();
      }
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 md:p-8 py-[80px] my-[100px]">
      <div className="w-full max-w-2xl animate-fade-in my-[90px]">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-normal tracking-tight text-[#3d3d3d]">
            TikTok 爆款视频匹配
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">选择品类并添加卖点，一键替你收集TikTok爆款视频

          </p>
        </div>

        {/* Composer Card - inline sentence style */}
        <div className="relative rounded-2xl border border-border/30 bg-card/80 backdrop-blur-sm shadow-sm transition-shadow hover:shadow-md">
          <div className="p-5">
            <div className="flex items-center flex-wrap gap-y-2 text-sm text-foreground/70 leading-relaxed">
              <span className="whitespace-nowrap">帮我搜索关于</span>

              {/* Category cascader inline */}
              <CategoryCascader
                data={CATEGORY_TREE}
                value={category}
                onChange={setCategory}
                placeholder="选择品类"
                className="h-7 rounded-lg px-2.5 text-sm mx-1" />
              

              <span className="whitespace-nowrap">，</span>

              {/* Selling points inline */}
              <div className="inline-flex items-center gap-1 flex-wrap mx-1.5">
                {sellingPoints.map((point) =>
                <span
                  key={point}
                  className="inline-flex items-center gap-1 h-6 rounded-full bg-muted/40 border border-border/20 px-2 text-xs text-foreground/80">
                  
                    {point}
                    <button
                    onClick={() => removeSellingPoint(point)}
                    className="hover:text-foreground transition-colors">
                    
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={() => {if (inputValue.trim()) addSellingPoint(inputValue);}}
                  placeholder={sellingPoints.length === 0 ? '输入卖点，回车添加' : '添加卖点...'}
                  className="h-6 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none w-[120px]" />
                
              </div>

              <span className="whitespace-nowrap">的 TikTok 爆款视频</span>
            </div>
          </div>

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-border/20">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground/70 tabular-nums">
                预计消耗：约 <span className="text-foreground/80 font-medium">200</span> credit
              </span>
            </div>

            <button
              onClick={handleSend}
              disabled={!canSend || disabled}
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center transition-all',
                canSend && !disabled ?
                'bg-foreground text-background hover:bg-foreground/90' :
                'bg-muted/60 text-muted-foreground/40 cursor-not-allowed'
              )}>
              
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>);

}