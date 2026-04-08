import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronDown, Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface CategoryNode {
  label: string;
  children?: CategoryNode[];
}

interface CategoryCascaderProps {
  data: CategoryNode[];
  value?: string;
  onChange?: (path: string) => void;
  placeholder?: string;
  className?: string;
}

export const CATEGORY_TREE: CategoryNode[] = [
  {
    label: '穆斯林时尚',
    children: [
      { label: '穆斯林女装' },
      { label: '头巾与配饰' },
      { label: '穆斯林男装' },
    ],
  },
  {
    label: '鞋靴',
    children: [
      { label: '女鞋', children: [{ label: '高跟鞋' }, { label: '平底鞋' }, { label: '凉鞋' }, { label: '靴子' }] },
      { label: '男鞋', children: [{ label: '运动鞋' }, { label: '皮鞋' }, { label: '休闲鞋' }, { label: '凉鞋' }] },
      { label: '童鞋' },
    ],
  },
  {
    label: '美妆个护',
    children: [
      { label: '面部护肤', children: [{ label: '洁面' }, { label: '面霜' }, { label: '精华' }, { label: '面膜' }, { label: '防晒' }] },
      { label: '彩妆', children: [{ label: '口红' }, { label: '粉底' }, { label: '眼影' }, { label: '眉笔' }, { label: '腮红' }] },
      { label: '身体护理', children: [{ label: '沐浴露' }, { label: '身体乳' }, { label: '护手霜' }] },
      { label: '美发护发', children: [{ label: '洗发水' }, { label: '护发素' }, { label: '发膜' }, { label: '造型产品' }] },
      { label: '个人清洁' },
      { label: '美甲' },
    ],
  },
  {
    label: '手机与数码',
    children: [
      { label: '手机配件', children: [{ label: '手机壳' }, { label: '充电器' }, { label: '数据线' }, { label: '屏幕保护膜' }] },
      { label: '摄影摄像', children: [{ label: '相机' }, { label: '镜头' }, { label: '三脚架' }, { label: '存储卡' }] },
      { label: '影音设备', children: [{ label: '耳机' }, { label: '音箱' }, { label: '麦克风' }, { label: '录音设备' }] },
      { label: '游戏设备', children: [{ label: '游戏手柄' }, { label: '游戏耳机' }, { label: '游戏键盘' }] },
      { label: '智能及穿戴设备', children: [{ label: '智能手表' }, { label: '智能手环' }, { label: '智能眼镜' }] },
      { label: '电子教育设备' },
    ],
  },
  {
    label: '电脑办公',
    children: [
      { label: '笔记本电脑' },
      { label: '台式机' },
      { label: '显示器' },
      { label: '键盘鼠标', children: [{ label: '机械键盘' }, { label: '无线鼠标' }, { label: '键鼠套装' }] },
      { label: '办公用品' },
      { label: '打印设备' },
    ],
  },
  {
    label: '服饰鞋包',
    children: [
      { label: '女装', children: [{ label: '连衣裙' }, { label: 'T恤' }, { label: '外套' }, { label: '裤子' }, { label: '半身裙' }] },
      { label: '男装', children: [{ label: 'T恤' }, { label: '衬衫' }, { label: '夹克' }, { label: '裤子' }] },
      { label: '内衣', children: [{ label: '文胸' }, { label: '内裤' }, { label: '家居服' }, { label: '袜子' }] },
      { label: '箱包', children: [{ label: '双肩包' }, { label: '手提包' }, { label: '钱包' }, { label: '行李箱' }] },
      { label: '配饰', children: [{ label: '帽子' }, { label: '围巾' }, { label: '皮带' }, { label: '太阳镜' }] },
    ],
  },
  {
    label: '家居日用',
    children: [
      { label: '厨房用品', children: [{ label: '锅具' }, { label: '餐具' }, { label: '收纳' }, { label: '厨房小工具' }] },
      { label: '家纺', children: [{ label: '床上用品' }, { label: '毛巾浴巾' }, { label: '窗帘' }] },
      { label: '家居装饰' },
      { label: '清洁用品' },
      { label: '灯具照明' },
    ],
  },
  {
    label: '宠物用品',
    children: [
      { label: '狗狗用品', children: [{ label: '狗粮' }, { label: '玩具' }, { label: '牵引绳' }, { label: '狗窝' }] },
      { label: '猫咪用品', children: [{ label: '猫粮' }, { label: '猫砂' }, { label: '猫玩具' }, { label: '猫爬架' }] },
      { label: '小宠用品' },
    ],
  },
  {
    label: '母婴用品',
    children: [
      { label: '奶粉辅食' },
      { label: '纸尿裤' },
      { label: '童装', children: [{ label: '婴儿服' }, { label: '童装套装' }, { label: '童鞋' }] },
      { label: '玩具早教', children: [{ label: '积木' }, { label: '毛绒玩具' }, { label: '益智玩具' }] },
      { label: '婴儿出行' },
    ],
  },
  {
    label: '运动与户外',
    children: [
      { label: '运动服饰' },
      { label: '运动鞋' },
      { label: '健身器材', children: [{ label: '哑铃' }, { label: '瑜伽垫' }, { label: '跳绳' }, { label: '弹力带' }] },
      { label: '户外装备', children: [{ label: '帐篷' }, { label: '睡袋' }, { label: '登山杖' }, { label: '户外背包' }] },
      { label: '骑行装备' },
    ],
  },
  {
    label: '食品饮料',
    children: [
      { label: '零食', children: [{ label: '坚果' }, { label: '饼干' }, { label: '糖果' }, { label: '膨化食品' }] },
      { label: '茶饮咖啡' },
      { label: '方便食品' },
      { label: '保健食品' },
    ],
  },
  {
    label: '珠宝饰品',
    children: [
      { label: '项链' },
      { label: '耳饰' },
      { label: '手链手镯' },
      { label: '戒指' },
      { label: '发饰' },
    ],
  },
];

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
    <div className="min-w-[160px] max-h-[320px] overflow-y-auto border-r border-border/20 last:border-r-0 py-1 scrollbar-thin">
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

// Flatten tree into searchable paths
function flattenTree(nodes: CategoryNode[], prefix: string[] = []): string[] {
  const results: string[] = [];
  for (const node of nodes) {
    const path = [...prefix, node.label];
    if (!node.children || node.children.length === 0) {
      results.push(path.join(' > '));
    } else {
      results.push(path.join(' > '));
      results.push(...flattenTree(node.children, path));
    }
  }
  return results;
}

export function CategoryCascader({ data, value, onChange, placeholder = '选择品类', className }: CategoryCascaderProps) {
  const [open, setOpen] = useState(false);
  const [selectedPath, setSelectedPath] = useState<CategoryNode[]>([]);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const allPaths = useMemo(() => flattenTree(data), [data]);
  const filteredPaths = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return allPaths.filter(p => p.toLowerCase().includes(q));
  }, [search, allPaths]);

  // Parse value into path on mount
  useEffect(() => {
    if (value) {
      const parts = value.split(' > ');
      const path: CategoryNode[] = [];
      let current = data;
      for (const part of parts) {
        const found = current.find((n) => n.label === part);
        if (found) {
          path.push(found);
          current = found.children || [];
        } else break;
      }
      if (path.length > 0) setSelectedPath(path);
    }
  }, []);

  // Focus search on open
  useEffect(() => {
    if (open) {
      setSearch('');
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSelect = (node: CategoryNode, level: number) => {
    const newPath = [...selectedPath.slice(0, level), node];
    setSelectedPath(newPath);

    if (!node.children || node.children.length === 0) {
      const pathStr = newPath.map((n) => n.label).join(' > ');
      onChange?.(pathStr);
      setOpen(false);
    }
  };

  const handleHover = (node: CategoryNode, level: number) => {
    setSelectedPath((prev) => [...prev.slice(0, level), node]);
  };

  const handleSearchSelect = (pathStr: string) => {
    onChange?.(pathStr);
    setOpen(false);
  };

  const displayValue = value || (selectedPath.length > 0 ? selectedPath.map(n => n.label).join(' > ') : '');

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
        {/* Search box */}
        <div className="px-3 py-2 border-b border-border/20">
          <div className="flex items-center gap-2 px-2 h-8 rounded-lg bg-muted/30 border border-border/20">
            <Search className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
            <input
              ref={searchInputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索品类..."
              className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
            />
          </div>
        </div>

        {search.trim() ? (
          /* Search results */
          <div className="max-h-[320px] overflow-y-auto py-1 scrollbar-thin">
            {filteredPaths.length === 0 ? (
              <p className="text-xs text-muted-foreground/50 text-center py-6">无匹配结果</p>
            ) : (
              filteredPaths.slice(0, 20).map(path => (
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
          /* Cascader columns */
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
