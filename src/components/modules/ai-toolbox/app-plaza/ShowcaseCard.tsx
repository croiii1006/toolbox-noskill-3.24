import { Play, Heart, MessageSquare } from 'lucide-react';
import { TRENDING_VIDEOS } from '@/constants/trending-videos';
import logoDark from '@/assets/logo_dark.svg';

export interface ShowcaseCardDetail {
  author?: string;
  businessType?: string;
  purpose?: string;
  audience?: string;
  techHighlight?: string;
  stats?: { views: string; likes: string; comments: string; shares: string };
  tags?: string[];
}

export interface ShowcaseCardData {
  title: string;
  desc: string;
  hoverText: string;
  image: string;
  miniTitle: string;
  targetId: string;
  category: string;
  detail?: ShowcaseCardDetail;
  reportUrl?: string;
}

export function ShowcaseCard({
  card,
  onClick,
  variant = 'default',
}: {
  card: ShowcaseCardData;
  onClick: () => void;
  variant?: 'default' | 'visual';
}) {
  if (variant === 'visual') {
    return (
      <div className="relative group cursor-pointer" onClick={onClick}>
        <div className="relative overflow-hidden rounded-[16px] aspect-[4/3] border border-border/20">
          <img
            src={card.image}
            alt={card.title}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-3">
            <p className="text-background text-xs font-medium leading-snug line-clamp-2 drop-shadow-sm">
              {card.title}
            </p>
          </div>
          {/* Hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/55 opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-[16px]">
            <p className="text-background text-[11px] leading-[1.4] font-medium px-3 text-center">
              {card.hoverText}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative group cursor-pointer"
      onClick={onClick}
    >

      {/* Main card */}
      <div className="relative overflow-hidden bg-muted/40 dark:bg-muted/20 rounded-[16px] backdrop-blur-[5px] z-10 border border-border/20">
        {/* Floating mini report card */}
        <div className="absolute flex items-center justify-center right-[-10px] top-[2px] w-[90px] z-10 transition-transform duration-300 ease-out group-hover:translate-x-[-6px] group-hover:translate-y-[-4px]">
          <div className="flex-none rotate-[-6deg] transition-transform duration-300 ease-out group-hover:rotate-[-4deg]">
            <div className="bg-background overflow-hidden rounded-[4px] shadow-[0px_2px_16px_0px_rgba(35,35,35,0.18)] w-[80px] h-[104px] relative">
              {/* Window dots */}
              <div className="flex items-center gap-[2px] px-[5px] py-[3px]">
                <div className="w-[2.5px] h-[2.5px] rounded-full bg-destructive" />
                <div className="w-[2.5px] h-[2.5px] rounded-full bg-amber-400" />
                <div className="w-[2.5px] h-[2.5px] rounded-full bg-emerald-400" />
              </div>
              {/* Title area */}
              <div className="flex items-start gap-[3px] px-[5px] pt-[1px] pb-[3px]">
                <div className="flex flex-col gap-[3px] flex-1 min-w-0">
                  <p className="font-semibold leading-normal line-clamp-1 text-[5px] text-foreground">
                    {card.miniTitle}
                  </p>
                  <div className="flex items-center gap-[2px]">
                    <div className="w-[6px] h-[6px] rounded-full overflow-hidden bg-muted">
                      <img alt="OranAI" src={logoDark} className="w-full h-full object-contain" />
                    </div>
                    <p className="font-medium leading-normal text-[4px] text-muted-foreground truncate">
                      OranAI
                    </p>
                  </div>
                  <div className="flex items-center gap-[2px]">
                    <div className="flex items-center gap-px">
                      <Play className="w-[3.5px] h-[3.5px] text-muted-foreground fill-muted-foreground" />
                      <p className="font-medium text-[3.5px] text-muted-foreground">1080w</p>
                    </div>
                    <div className="flex items-center gap-px">
                      <Heart className="w-[3.5px] h-[3.5px] text-muted-foreground" />
                      <p className="font-medium text-[3.5px] text-muted-foreground">28w</p>
                    </div>
                    <div className="flex items-center gap-px">
                      <MessageSquare className="w-[3.5px] h-[3.5px] text-muted-foreground" />
                      <p className="font-medium text-[3.5px] text-muted-foreground">12w</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Thumbnail */}
              <div className="relative h-[70px] rounded-[3px] mx-[5px] mb-[5px] overflow-hidden">
                <img
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 max-w-none object-cover w-full h-full"
                  src={card.image}
                />
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-muted to-transparent" />
            </div>
          </div>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[16px] bg-foreground/55 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <p className="text-background text-[11px] leading-[1.4] font-medium">
            {card.hoverText}
          </p>
        </div>

        {/* Bottom text area */}
        <div className="relative h-[152px]">
          <div className="absolute left-0 bottom-0 flex flex-col gap-[4px] items-start justify-end p-[14px] py-[12px] w-full">
            <div className="relative shrink-0 w-[65%] whitespace-pre-wrap mb-0 group-hover:opacity-0 transition-opacity duration-200">
              <p className="font-medium leading-[1.35] text-[13px] text-foreground">
                {card.title}
              </p>
              <p className="mt-[6px] font-normal leading-[1.35] text-[10px] text-muted-foreground line-clamp-2">
                {card.desc}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const SHOWCASE_CARDS: ShowcaseCardData[] = [
  // 市场洞察 (30)
  { title: '海飞丝市场洞察深度报告', desc: '整合宏观趋势、全球化市场、人群画像、和竞品分析', hoverText: '点击查看市场洞察报告案例', image: '/haifeisi.jpg', miniTitle: '海飞丝市场洞察深度报告', targetId: 'brand-health', category: 'market', reportUrl: 'https://haifeisianalysis.photog.art/' },
  { title: '护肤品赛道趋势分析', desc: '消费者偏好变化与新兴品牌竞争格局', hoverText: '点击查看市场洞察报告案例', image: '/haifeisi.jpg', miniTitle: '护肤品赛道趋势分析', targetId: 'brand-health', category: 'market' },
  { title: '饮料行业消费者画像', desc: '年轻消费群体购买行为与偏好深度洞察', hoverText: '点击查看市场洞察报告案例', image: '/haifeisi.jpg', miniTitle: '饮料行业消费者画像', targetId: 'brand-health', category: 'market' },
  { title: '母婴品类竞品监测', desc: '头部品牌营销策略与市场份额对比分析', hoverText: '点击查看市场洞察报告案例', image: '/haifeisi.jpg', miniTitle: '母婴品类竞品监测', targetId: 'brand-health', category: 'market' },
  { title: '3C数码品牌声量追踪', desc: '主流社交平台品牌提及量与情感分析', hoverText: '点击查看市场洞察报告案例', image: '/haifeisi.jpg', miniTitle: '3C数码品牌声量追踪', targetId: 'brand-health', category: 'market' },
  { title: '食品行业新品机会挖掘', desc: '基于消费趋势发现蓝海品类与创新方向', hoverText: '点击查看市场洞察报告案例', image: '/haifeisi.jpg', miniTitle: '食品行业新品机会挖掘', targetId: 'brand-health', category: 'market' },
  { title: '宠物经济市场全景分析', desc: '宠物消费升级趋势与细分赛道机会', hoverText: '点击查看市场洞察报告案例', image: '/haifeisi.jpg', miniTitle: '宠物经济市场全景分析', targetId: 'brand-health', category: 'market' },
  { title: '运动户外品牌对比研究', desc: '头部运动品牌定位策略与用户心智分析', hoverText: '点击查看市场洞察报告案例', image: '/haifeisi.jpg', miniTitle: '运动户外品牌对比研究', targetId: 'brand-health', category: 'market' },
  { title: '家居行业消费升级报告', desc: '智能家居渗透率与消费者决策因素分析', hoverText: '点击查看市场洞察报告案例', image: '/haifeisi.jpg', miniTitle: '家居行业消费升级报告', targetId: 'brand-health', category: 'market' },
  { title: '美妆个护出海洞察', desc: '东南亚与北美市场品牌机会与消费特征', hoverText: '点击查看市场洞察报告案例', image: '/haifeisi.jpg', miniTitle: '美妆个护出海洞察', targetId: 'brand-health', category: 'market' },
  { title: '新能源汽车用户研究', desc: '购车决策链路与品牌认知度深度调研', hoverText: '点击查看市场洞察报告案例', image: '/haifeisi.jpg', miniTitle: '新能源汽车用户研究', targetId: 'brand-health', category: 'market' },
  { title: '咖啡茶饮赛道监测', desc: '连锁品牌扩张策略与区域市场份额', hoverText: '点击查看市场洞察报告案例', image: '/haifeisi.jpg', miniTitle: '咖啡茶饮赛道监测', targetId: 'brand-health', category: 'market' },
  { title: '跨境电商平台对比', desc: 'Amazon/Shopee/Temu 等平台流量与转化分析', hoverText: '点击查看市场洞察报告案例', image: '/haifeisi.jpg', miniTitle: '跨境电商平台对比', targetId: 'brand-health', category: 'market' },
  { title: '健康食品消费趋势', desc: '低糖低脂功能性食品市场规模与增长预测', hoverText: '点击查看市场洞察报告案例', image: '/haifeisi.jpg', miniTitle: '健康食品消费趋势', targetId: 'brand-health', category: 'market' },
  { title: '奢侈品数字化营销分析', desc: '高端品牌线上触达策略与ROI对比', hoverText: '点击查看市场洞察报告案例', image: '/haifeisi.jpg', miniTitle: '奢侈品数字化营销分析', targetId: 'brand-health', category: 'market' },
  { title: '教育行业获客成本研究', desc: '在线教育平台用户增长模型与LTV分析', hoverText: '点击查看市场洞察报告案例', image: '/haifeisi.jpg', miniTitle: '教育行业获客成本研究', targetId: 'brand-health', category: 'market' },
  { title: '服装行业季节性趋势', desc: '快时尚与设计师品牌的季节性销售规律', hoverText: '点击查看市场洞察报告案例', image: '/haifeisi.jpg', miniTitle: '服装行业季节性趋势', targetId: 'brand-health', category: 'market' },
  { title: '医疗健康品牌信任度', desc: '消费者对健康品牌的信任建立与传播路径', hoverText: '点击查看市场洞察报告案例', image: '/haifeisi.jpg', miniTitle: '医疗健康品牌信任度', targetId: 'brand-health', category: 'market' },
  { title: '游戏行业用户付费分析', desc: '手游付费用户画像与ARPPU趋势研究', hoverText: '点击查看市场洞察报告案例', image: '/haifeisi.jpg', miniTitle: '游戏行业用户付费分析', targetId: 'brand-health', category: 'market' },
  { title: '社交电商模式研究', desc: '拼团/直播/社群等社交电商转化效率对比', hoverText: '点击查看市场洞察报告案例', image: '/haifeisi.jpg', miniTitle: '社交电商模式研究', targetId: 'brand-health', category: 'market' },
  { title: '零食品类创新报告', desc: '新锐零食品牌产品创新与渠道策略', hoverText: '点击查看市场洞察报告案例', image: '/haifeisi.jpg', miniTitle: '零食品类创新报告', targetId: 'brand-health', category: 'market' },
  { title: '汽车后市场服务洞察', desc: '车主养护消费习惯与服务平台竞争格局', hoverText: '点击查看市场洞察报告案例', image: '/haifeisi.jpg', miniTitle: '汽车后市场服务洞察', targetId: 'brand-health', category: 'market' },
  { title: '旅游行业复苏追踪', desc: '出境游与本地游消费恢复趋势分析', hoverText: '点击查看市场洞察报告案例', image: '/haifeisi.jpg', miniTitle: '旅游行业复苏追踪', targetId: 'brand-health', category: 'market' },
  { title: '智能穿戴设备市场', desc: '智能手表/耳机品牌竞争与技术趋势', hoverText: '点击查看市场洞察报告案例', image: '/haifeisi.jpg', miniTitle: '智能穿戴设备市场', targetId: 'brand-health', category: 'market' },
  { title: '酒类消费年轻化趋势', desc: '低度酒与精酿啤酒在年轻群体中的渗透', hoverText: '点击查看市场洞察报告案例', image: '/haifeisi.jpg', miniTitle: '酒类消费年轻化趋势', targetId: 'brand-health', category: 'market' },
  { title: '家电行业渠道变革', desc: '线上线下融合趋势与新零售模式分析', hoverText: '点击查看市场洞察报告案例', image: '/haifeisi.jpg', miniTitle: '家电行业渠道变革', targetId: 'brand-health', category: 'market' },
  { title: '母婴营养品市场分析', desc: '奶粉/辅食/营养补充剂品牌格局与增长点', hoverText: '点击查看市场洞察报告案例', image: '/haifeisi.jpg', miniTitle: '母婴营养品市场分析', targetId: 'brand-health', category: 'market' },
  { title: '二手经济消费洞察', desc: '闲置交易平台用户行为与品类偏好', hoverText: '点击查看市场洞察报告案例', image: '/haifeisi.jpg', miniTitle: '二手经济消费洞察', targetId: 'brand-health', category: 'market' },
  { title: '本地生活服务竞争', desc: '美团/抖音/小红书本地生活业务对比', hoverText: '点击查看市场洞察报告案例', image: '/haifeisi.jpg', miniTitle: '本地生活服务竞争', targetId: 'brand-health', category: 'market' },
  { title: '新材料行业应用前景', desc: '可降解材料与新型包装在消费品中的应用', hoverText: '点击查看市场洞察报告案例', image: '/haifeisi.jpg', miniTitle: '新材料行业应用前景', targetId: 'brand-health', category: 'market' },

  // 策划方案 (30)
  { title: 'TikTok 爆款方案实战', desc: '从选题到脚本到素材清单，完整可执行方案', hoverText: '点击查看策划方案案例', image: '/haifeisi.jpg', miniTitle: 'TikTok 爆款方案实战', targetId: 'campaign-planner', category: 'campaign' },
  { title: '双十一整合营销方案', desc: '全渠道联动的促销策略与执行排期', hoverText: '点击查看策划方案案例', image: '/haifeisi.jpg', miniTitle: '双十一整合营销方案', targetId: 'campaign-planner', category: 'campaign' },
  { title: '新品上市推广计划', desc: '从预热到引爆的完整上市营销节奏', hoverText: '点击查看策划方案案例', image: '/haifeisi.jpg', miniTitle: '新品上市推广计划', targetId: 'campaign-planner', category: 'campaign' },
  { title: 'KOL 合作投放方案', desc: '达人筛选、内容共创与效果追踪一体化', hoverText: '点击查看策划方案案例', image: '/haifeisi.jpg', miniTitle: 'KOL 合作投放方案', targetId: 'campaign-planner', category: 'campaign' },
  { title: '品牌联名策划方案', desc: '跨界联名从选品到落地的完整执行手册', hoverText: '点击查看策划方案案例', image: '/haifeisi.jpg', miniTitle: '品牌联名策划方案', targetId: 'campaign-planner', category: 'campaign' },
  { title: '私域流量运营方案', desc: '从引流到转化的私域全链路运营策略', hoverText: '点击查看策划方案案例', image: '/haifeisi.jpg', miniTitle: '私域流量运营方案', targetId: 'campaign-planner', category: 'campaign' },
  { title: '节日营销活动策划', desc: '春节/中秋/圣诞等节点的创意营销方案', hoverText: '点击查看策划方案案例', image: '/haifeisi.jpg', miniTitle: '节日营销活动策划', targetId: 'campaign-planner', category: 'campaign' },
  { title: '直播带货策划方案', desc: '直播间选品、话术、节奏与复盘全流程', hoverText: '点击查看策划方案案例', image: '/haifeisi.jpg', miniTitle: '直播带货策划方案', targetId: 'campaign-planner', category: 'campaign' },
  { title: '会员日促销方案', desc: '品牌会员专属活动策划与复购提升策略', hoverText: '点击查看策划方案案例', image: '/haifeisi.jpg', miniTitle: '会员日促销方案', targetId: 'campaign-planner', category: 'campaign' },
  { title: '618 大促作战方案', desc: '预售/爆发/返场三阶段完整营销节奏', hoverText: '点击查看策划方案案例', image: '/haifeisi.jpg', miniTitle: '618 大促作战方案', targetId: 'campaign-planner', category: 'campaign' },
  { title: '品牌周年庆策划', desc: '周年庆活动创意与全渠道传播方案', hoverText: '点击查看策划方案案例', image: '/haifeisi.jpg', miniTitle: '品牌周年庆策划', targetId: 'campaign-planner', category: 'campaign' },
  { title: '跨境营销本地化方案', desc: '针对不同市场的本地化营销策略与执行', hoverText: '点击查看策划方案案例', image: '/haifeisi.jpg', miniTitle: '跨境营销本地化方案', targetId: 'campaign-planner', category: 'campaign' },
  { title: '社群裂变增长方案', desc: '基于社群的用户裂变与增长黑客策略', hoverText: '点击查看策划方案案例', image: '/haifeisi.jpg', miniTitle: '社群裂变增长方案', targetId: 'campaign-planner', category: 'campaign' },
  { title: '短视频矩阵运营方案', desc: '多账号矩阵内容规划与流量分配策略', hoverText: '点击查看策划方案案例', image: '/haifeisi.jpg', miniTitle: '短视频矩阵运营方案', targetId: 'campaign-planner', category: 'campaign' },
  { title: '品牌公关危机预案', desc: '舆情监控与危机公关应对标准流程', hoverText: '点击查看策划方案案例', image: '/haifeisi.jpg', miniTitle: '品牌公关危机预案', targetId: 'campaign-planner', category: 'campaign' },
  { title: '线下快闪店策划', desc: '快闪店选址、设计、引流与转化全案', hoverText: '点击查看策划方案案例', image: '/haifeisi.jpg', miniTitle: '线下快闪店策划', targetId: 'campaign-planner', category: 'campaign' },
  { title: '用户增长A/B测试方案', desc: '落地页/广告素材多版本测试与优化', hoverText: '点击查看策划方案案例', image: '/haifeisi.jpg', miniTitle: '用户增长A/B测试方案', targetId: 'campaign-planner', category: 'campaign' },
  { title: '内容营销年度规划', desc: '12个月内容日历与主题规划方案', hoverText: '点击查看策划方案案例', image: '/haifeisi.jpg', miniTitle: '内容营销年度规划', targetId: 'campaign-planner', category: 'campaign' },
  { title: 'SEO/SEM 整合投放', desc: '搜索引擎优化与付费推广协同策略', hoverText: '点击查看策划方案案例', image: '/haifeisi.jpg', miniTitle: 'SEO/SEM 整合投放', targetId: 'campaign-planner', category: 'campaign' },
  { title: '小红书种草方案', desc: '笔记投放策略与达人合作矩阵规划', hoverText: '点击查看策划方案案例', image: '/haifeisi.jpg', miniTitle: '小红书种草方案', targetId: 'campaign-planner', category: 'campaign' },
  { title: 'B端客户获取方案', desc: '企业客户精准触达与转化漏斗优化', hoverText: '点击查看策划方案案例', image: '/haifeisi.jpg', miniTitle: 'B端客户获取方案', targetId: 'campaign-planner', category: 'campaign' },
  { title: '品牌升级传播方案', desc: '品牌焕新后的市场传播与认知重塑', hoverText: '点击查看策划方案案例', image: '/haifeisi.jpg', miniTitle: '品牌升级传播方案', targetId: 'campaign-planner', category: 'campaign' },
  { title: '电商大促复盘模板', desc: '活动数据分析与下次大促优化建议', hoverText: '点击查看策划方案案例', image: '/haifeisi.jpg', miniTitle: '电商大促复盘模板', targetId: 'campaign-planner', category: 'campaign' },
  { title: '信息流广告投放方案', desc: '抖音/快手/微信信息流广告策略与创意', hoverText: '点击查看策划方案案例', image: '/haifeisi.jpg', miniTitle: '信息流广告投放方案', targetId: 'campaign-planner', category: 'campaign' },
  { title: '品牌IP打造方案', desc: '品牌虚拟形象设计与IP运营全案', hoverText: '点击查看策划方案案例', image: '/haifeisi.jpg', miniTitle: '品牌IP打造方案', targetId: 'campaign-planner', category: 'campaign' },
  { title: '口碑营销策划方案', desc: '用户评价管理与口碑传播激励机制', hoverText: '点击查看策划方案案例', image: '/haifeisi.jpg', miniTitle: '口碑营销策划方案', targetId: 'campaign-planner', category: 'campaign' },
  { title: '海外社媒运营方案', desc: 'Instagram/YouTube/Twitter 多平台运营策略', hoverText: '点击查看策划方案案例', image: '/haifeisi.jpg', miniTitle: '海外社媒运营方案', targetId: 'campaign-planner', category: 'campaign' },
  { title: '新店开业引流方案', desc: '开业前预热到首月引流的完整方案', hoverText: '点击查看策划方案案例', image: '/haifeisi.jpg', miniTitle: '新店开业引流方案', targetId: 'campaign-planner', category: 'campaign' },
  { title: '产品体验官招募方案', desc: '种子用户招募与UGC内容生产机制', hoverText: '点击查看策划方案案例', image: '/haifeisi.jpg', miniTitle: '产品体验官招募方案', targetId: 'campaign-planner', category: 'campaign' },
  { title: '年终盘点营销方案', desc: '年度总结类内容营销与品牌回顾策划', hoverText: '点击查看策划方案案例', image: '/haifeisi.jpg', miniTitle: '年终盘点营销方案', targetId: 'campaign-planner', category: 'campaign' },

  // 灵感库 — 从共享数据源生成
  ...TRENDING_VIDEOS.map(v => ({
    title: v.title,
    desc: v.desc,
    hoverText: '点击复刻此爆款视频',
    image: '/placeholder.svg',
    miniTitle: v.title,
    targetId: 'replicate-video',
    category: 'video',
  } as ShowcaseCardData)),
  { title: '互动投票视频', desc: '带互动选项的产品投票与调研视频', hoverText: '点击查看视频生成案例', image: '/placeholder.svg', miniTitle: '互动投票视频', targetId: 'reference-to-video', category: 'video' },
  { title: 'AI数字人带货视频', desc: '虚拟数字人产品讲解与带货视频', hoverText: '点击查看视频生成案例', image: '/placeholder.svg', miniTitle: 'AI数字人带货视频', targetId: 'reference-to-video', category: 'video' },
];
