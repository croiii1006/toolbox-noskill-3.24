import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Copy,
  History,
  ImageIcon,
  Shield,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { FeatureCard } from './FeatureCard';
import {
  PreviewImageGen,
  PreviewInsight,
  PreviewPlanner,
  PreviewTikTok,
  PreviewVideoGen,
} from './FeaturePreviews';
import { ShowcaseCard, ShowcaseCardData, SHOWCASE_CARDS } from './ShowcaseCard';
import { ShowcaseDetailDialog } from './ShowcaseDetailDialog';
import { useReplicatePrefill } from '@/contexts/ReplicatePrefillContext';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

const fadeUp = (index: number) => ({
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.1, duration: 0.5, ease },
  },
});

const ORAN_WORKFLOWS = [
  {
    label: 'ORAN HUB',
    targetId: 'insight-workbench',
    desc: '整合趋势、竞品与人群，快速生成品牌洞察报告和策划方案',
    preview: <PreviewInsight />,
  },
  {
    label: 'ORAN SIM',
    targetId: 'oran-simulation',
    desc: '基于已有洞察与策划输入，模拟传播扩散过程并输出预测报告',
    preview: <PreviewPlanner />,
  },
  {
    label: 'ORAN GEN',
    targetId: 'skills',
    desc: '承接已有报告进入内容生成，输出爆款视频素材',
    preview: <PreviewTikTok />,
  },
];

const TOOLBOX_FEATURES = [
  {
    label: '图片/视频生成',
    targetId: 'text-to-image',
    desc: '通过文字描述批量生成封面图、场景图与视频素材',
    preview: <PreviewImageGen />,
  },
  {
    label: '复刻视频',
    targetId: 'replicate-video',
    desc: '基于参考视频快速复刻结构、镜头节奏与表达方式',
    preview: <PreviewVideoGen />,
  },
  {
    label: 'TikTok爆款视频匹配',
    targetId: 'tiktok-report',
    desc: '对齐爆款视频样本，提炼可复用的内容模式与方向建议',
    preview: <PreviewTikTok />,
  },
];

const CASE_CATEGORIES = [
  { id: 'market', label: '市场洞察' },
  { id: 'campaign', label: '策划方案' },
  { id: 'video', label: '灵感库' },
] as const;

interface HeroSectionProps {
  onNavigate: (itemId: string) => void;
}

export function HeroSection({ onNavigate }: HeroSectionProps) {
  const { setPrefill } = useReplicatePrefill();
  const [activeCaseCategory, setActiveCaseCategory] = useState<string>('market');
  const [page, setPage] = useState(0);
  const [detailCard, setDetailCard] = useState<ShowcaseCardData | null>(null);

  const isVisualCategory = activeCaseCategory === 'video';
  const itemsPerPage = isVisualCategory ? 12 : 16;
  const filteredCases = SHOWCASE_CARDS.filter((card) => card.category === activeCaseCategory);
  const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
  const pagedCases = filteredCases.slice(
    page * itemsPerPage,
    (page + 1) * itemsPerPage,
  );

  const handleCategoryChange = (id: string) => {
    setActiveCaseCategory(id);
    setPage(0);
  };

  return (
    <>
      <section className="pt-20 lg:pt-28 flex flex-col">
        <div className="w-full">
          <motion.div variants={fadeUp(0)} initial="hidden" animate="visible">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.1] text-[#3d3d3d] font-normal">
              ORAN GEN Toolbox
            </h1>
            <p className="font-display text-lg sm:text-xl md:text-2xl font-light text-foreground/60 mt-3 max-w-2xl tracking-tight">
              把洞察、仿真与内容生成串成可复用的营销工作流。
            </p>
          </motion.div>

          <motion.p
            variants={fadeUp(1)}
            initial="hidden"
            animate="visible"
            className="text-sm sm:text-base font-light text-muted-foreground mt-6 max-w-2xl leading-relaxed"
          >
            应用广场现在和侧边栏保持同一套入口结构，先走 ORAN 主流程，再进入工具箱完成素材生产与爆款匹配。
          </motion.p>

          <motion.div
            variants={fadeUp(2)}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row gap-4 sm:gap-8 mt-8"
          >
            {[
              { icon: <Zap className="w-4 h-4 text-accent" />, text: '更快：主流程和工具入口统一，减少切换成本' },
              { icon: <Shield className="w-4 h-4 text-accent" />, text: '更稳：广场与侧边栏同名同跳转，不会再走错入口' },
              { icon: <History className="w-4 h-4 text-accent" />, text: '更顺：从洞察到仿真再到内容生成，路径更连贯' },
            ].map((point, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-foreground/70 font-light">
                {point.icon}
                <span>{point.text}</span>
              </div>
            ))}
          </motion.div>

          <motion.div variants={fadeUp(3)} initial="hidden" animate="visible" className="mt-12">
            <h2 className="text-lg font-normal text-foreground/60 mb-5">品牌营销全链路</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {ORAN_WORKFLOWS.map((item) => (
                <FeatureCard
                  key={item.targetId}
                  title={item.label}
                  description={item.desc}
                  preview={item.preview}
                  onClick={() => onNavigate(item.targetId)}
                />
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeUp(4)} initial="hidden" animate="visible" className="mt-10">
            <h2 className="text-lg font-normal text-foreground/60 mb-5">工具箱</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {TOOLBOX_FEATURES.map((item) => (
                <FeatureCard
                  key={item.targetId}
                  title={item.label}
                  description={item.desc}
                  preview={item.preview}
                  onClick={() => onNavigate(item.targetId)}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section id="showcase-section" className="flex flex-col px-0 pt-2 pb-6">
        <h2 className="text-lg font-normal text-foreground/60 mb-2 shrink-0">案例</h2>
        <div className="flex gap-1 mb-2 shrink-0">
          {CASE_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`px-3 py-1 rounded-md text-xs transition-colors ${
                activeCaseCategory === category.id
                  ? 'text-orange-600 font-medium bg-orange-50 dark:text-orange-400 dark:bg-orange-950/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {pagedCases.map((card) => (
              <ShowcaseCard
                key={card.title}
                card={card}
                variant={isVisualCategory ? 'visual' : 'default'}
                onClick={() => {
                  if (isVisualCategory) {
                    setDetailCard(card);
                    return;
                  }

                  if (card.reportUrl) {
                    window.open(card.reportUrl, '_blank');
                  }
                }}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4 shrink-0">
              <button
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-md border border-border/40 text-muted-foreground hover:text-foreground hover:border-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-muted-foreground">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                disabled={page === totalPages - 1}
                className="p-1.5 rounded-md border border-border/40 text-muted-foreground hover:text-foreground hover:border-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </section>

      <ShowcaseDetailDialog
        card={detailCard}
        open={!!detailCard}
        onOpenChange={(open) => {
          if (!open) {
            setDetailCard(null);
          }
        }}
        onReplicate={() => {
          if (!detailCard) {
            return;
          }

          setPrefill({
            sellingPoints: [],
            inspirationVideo: {
              id: `showcase-${detailCard.title}`,
              title: detailCard.title,
              views: detailCard.detail?.stats?.views || '0',
              likes: detailCard.detail?.stats?.likes || '0',
              coverGradient: 'from-rose-500/60 to-orange-400/60',
            },
          });

          onNavigate(detailCard.targetId);
        }}
      />
    </>
  );
}
