import { useState, useCallback, useRef } from 'react';
import type { AgentInfo } from './AgentCard';

export type TaskStatus = 'queued' | 'running' | 'done' | 'skipped' | 'error';

export interface TaskLog {
  time: string;
  message: string;
}

export interface SkillTask {
  id: string;
  title: string;
  status: TaskStatus;
  progress: number;
  startAt?: string;
  endAt?: string;
  logs: TaskLog[];
  children: SkillTask[];
  input?: string;
  output?: string;
  moduleChain?: string[];
  expert?: {
    name: string;
    avatar: string;
    role: string;
  };
}

export interface CandidateVideo {
  id: string;
  cover: string;
  videoUrl?: string;
  title: string;
  duration: string;
  tags: string[];
  views: string;
  likes: string;
  publishedAt?: string;
  revenue?: string;
  impressions?: string;
  comments?: string;
  shares?: string;
  salesCount?: number;
  growthRate?: string;
  analysis?: string;
  strategy?: string;
  sellingPointHitRate?: number;
  tiktokUrl?: string;
}

export interface SessionSetup {
  image: string | null;
  imageName: string | null;
  memoryEnabled: boolean;
  selectedMemoryIds: string[];
  selectedCreatorIds: string[];
  sellingPoints: string;
  category: string;
}

export type UIMode = 'single' | 'split';

export type StreamMessageType =
  | 'text'
  | 'setup-summary'
  | 'checklist'
  | 'agent-cluster'
  | 'agent-status'
  | 'create-agent'
  | 'read-checklist'
  | 'read-memory'
  | 'video-candidates'
  | 'prompt-editor'
  | 'result-preview'
  | 'video-gen-status'
  | 'selection-confirm'
  | 'final-result';

export interface StreamMessage {
  id: string;
  type: StreamMessageType;
  content: string;
  isStreaming?: boolean;
  /** For agent-cluster messages */
  agents?: AgentInfo[];
  /** For create-agent messages – inline agent names with avatars */
  agentNames?: { name: string; avatar: string }[];
  /** For read-memory messages – memory entry id */
  memoryId?: string;
}

export interface SkillsState {
  sessionId: string;
  setupCompleted: boolean;
  setup: SessionSetup;
  uiMode: UIMode;
  activeTaskId: string | null;
  tasks: SkillTask[];
  messages: StreamMessage[];
  candidateVideos: CandidateVideo[];
  selectedVideo: CandidateVideo | null;
  generatedPrompt: string;
  resultVideo: { url: string; cover: string } | null;
  isProcessing: boolean;
  runMeta: SkillsRunMeta | null;
  /** Agents state */
  agents: AgentInfo[];
  /** Active right panel view */
  activeRightView: 'none' | 'checklist' | 'agents' | 'read-memory';
  /** Which agent tab is active in the agents panel */
  activeAgentTab?: '01' | '02' | '03' | '04';
  /** Checklist items */
  checklistItems: string[];
  checklistDone: boolean[];
}

export type SkillsRunPhase =
  | 'phase1'
  | 'phase2'
  | 'phase3'
  | 'awaiting_select'
  | 'awaiting_confirm'
  | 'done';

export type SkillsAwaitingAction = 'select_video' | 'confirm_prompt' | null;

export interface SkillsRunMeta {
  phase: SkillsRunPhase;
  awaitingAction: SkillsAwaitingAction;
  nextActionAt: number | null;
  updatedAt: number;
}

const GENERATED_MELAXIN_RESULT = {
  url: '/generated-videos/replicate-melaxin.mp4',
  cover: '',
};

const GENERATED_POPMART_RESULT = {
  url: '/generated-videos/popmart-replicate.mov',
  cover: '',
};

const normalizeMaterialToken = (value: string) =>
  value.toLowerCase().replace(/[\s./\\_\->、，,·|]+/g, '');

const isPopmartMaterialSetup = (setup: Pick<SessionSetup, 'category' | 'sellingPoints'>) => {
  const combined = `${normalizeMaterialToken(setup.category || '')} ${normalizeMaterialToken(setup.sellingPoints || '')}`;

  return (
    combined.includes('popmart') ||
    combined.includes('泡泡玛特') ||
    combined.includes('labubu') ||
    combined.includes('dimoo') ||
    combined.includes('盲盒') ||
    combined.includes('潮流玩具') ||
    combined.includes('娱乐收藏')
  );
};

const CATEGORIES = ['美妆个护', '3C数码', '服饰鞋包', '家居日用', '食品饮料', '母婴用品', '其它'];

const legacyMockVideos = (): CandidateVideo[] => [
  { id: `v-${Date.now()}-1`, cover: '', title: 'These come in handy daily! @MINISO #translationearbuds', duration: '0:43', tags: ['美妆', '种草'], views: '28.0M', likes: '1.1M', comments: '12.3K', shares: '8.5K', salesCount: 268, growthRate: '0.0%', analysis: '视频解析', strategy: '开场直击跑步场景痛点，展现佩戴稳固与运动舒适。', sellingPointHitRate: 0, tiktokUrl: 'https://www.tiktok.com/@miniso' },
  { id: `v-${Date.now()}-2`, cover: '', title: '沉浸式开箱ASMR｜超治愈解压', duration: '0:45', tags: ['开箱', 'ASMR'], views: '15.2M', likes: '890K', comments: '6.7K', shares: '4.2K', salesCount: 1520, growthRate: '12.3%', analysis: '视频解析', strategy: '利用ASMR声效配合近景展示产品细节，引发感官共鸣。', sellingPointHitRate: 35, tiktokUrl: 'https://www.tiktok.com/' },
  { id: `v-${Date.now()}-3`, cover: '', title: '日常妆容教程｜通勤必备5分钟出门', duration: '1:02', tags: ['教程', '日常'], views: '42.1M', likes: '2.3M', comments: '18.9K', shares: '15.1K', salesCount: 3890, growthRate: '8.7%', analysis: '视频解析', strategy: '以通勤场景切入，展示快速上妆流程，突出便携性。', sellingPointHitRate: 72, tiktokUrl: 'https://www.tiktok.com/' },
  { id: `v-${Date.now()}-4`, cover: '', title: '产品对比测评TOP3｜真实体验分享', duration: '0:58', tags: ['测评', '对比'], views: '8.9M', likes: '520K', comments: '9.1K', shares: '3.8K', salesCount: 756, growthRate: '5.2%', analysis: '视频解析', strategy: '横向对比同类产品，通过数据和实测突出性价比优势。', sellingPointHitRate: 45, tiktokUrl: 'https://www.tiktok.com/' },
  { id: `v-${Date.now()}-5`, cover: '', title: '一分钟get氛围感穿搭｜秋冬必入', duration: '0:28', tags: ['穿搭', '氛围'], views: '31.2M', likes: '1.8M', comments: '14.2K', shares: '11.3K', salesCount: 2340, growthRate: '15.6%', analysis: '视频解析', strategy: '快节奏换装展示多套搭配，突出单品百搭特性。', sellingPointHitRate: 58, tiktokUrl: 'https://www.tiktok.com/' },
];

const mockVideos = (): CandidateVideo[] => [
  {
    id: 'dr-melaxin-hit-1',
    cover: '',
    videoUrl: '/orangen-reference-videos/dr-melaxin-hit-1.mp4',
    title: '出海热视频',
    duration: '0:43',
    tags: ['Dr.Melaxin', '爆款对标', '高转化开场'],
    views: '180.00万',
    likes: '3490',
    publishedAt: '2025-11-18 23:46:04',
    revenue: '$6.91万',
    impressions: '1660.00万',
    growthRate: '3.84%',
    analysis: '热视频拆解',
    strategy: '高密度产品镜头配合快速利益点抛出，适合做 Dr.Melaxin 冷启动拉新和功效心智建立。',
    sellingPointHitRate: 96,
    tiktokUrl: 'https://www.tiktok.com/@hangingwithalo/video/7574091997334572343?local=en',
  },
  {
    id: 'dr-melaxin-hit-2',
    cover: '',
    videoUrl: '/orangen-reference-videos/dr-melaxin-hit-2.mp4',
    title: '出海热视频_副本',
    duration: '0:32',
    tags: ['Dr.Melaxin', '场景化转化', '功效种草'],
    views: '220.00万',
    likes: '2081',
    publishedAt: '2026-04-07 11:49:03',
    revenue: '$3.92万',
    impressions: '220.00万',
    growthRate: '2.76%',
    analysis: '热视频拆解',
    strategy: '更偏真人口播和使用反馈，适合做 Dr.Melaxin 的信任感补强与二跳转化承接。',
    sellingPointHitRate: 91,
    tiktokUrl: 'https://www.tiktok.com/@patricknogueiraaa/video/7625859271007210766?local=en',
  },
  {
    id: 'dr-melaxin-hit-3',
    cover: '',
    videoUrl: '/orangen-reference-videos/dr-melaxin-hit-3.mp4',
    title: '自制1',
    duration: '0:24',
    tags: ['Dr.Melaxin', '自制素材', '轻口播'],
    views: '23.50万',
    likes: '645',
    publishedAt: '2025-12-13 15:29:56',
    revenue: '$1.28万',
    impressions: '50.85万',
    growthRate: '2.74%',
    analysis: '自制素材拆解',
    strategy: '镜头更克制，强调细节特写和真实肤感，适合作为 Dr.Melaxin 的低成本稳定投放模板。',
    sellingPointHitRate: 82,
    tiktokUrl: 'https://www.tiktok.com/@clayinspires/video/7583241245850422559?local=en',
  },
  {
    id: 'dr-melaxin-hit-4',
    cover: '',
    videoUrl: '/orangen-reference-videos/dr-melaxin-hit-4.mp4',
    title: '自制2',
    duration: '0:27',
    tags: ['Dr.Melaxin', '前后对比', '高曝光'],
    views: '80.00万',
    likes: '573',
    publishedAt: '2025-10-16 02:54:39',
    revenue: '$1.14万',
    impressions: '280.00万',
    growthRate: '0.72%',
    analysis: '自制素材拆解',
    strategy: '曝光强于互动，适合做 Dr.Melaxin 的素材扩量池，用前后对比吸引停留后再引导转化。',
    sellingPointHitRate: 78,
    tiktokUrl: 'https://www.tiktok.com/@nadiyafinds/video/7561523845375593783?local=en',
  },
  {
    id: 'dr-melaxin-hit-5',
    cover: '',
    videoUrl: '/orangen-reference-videos/dr-melaxin-hit-5.mp4',
    title: '自制3',
    duration: '0:21',
    tags: ['Dr.Melaxin', '高曝光测试', '转化切片'],
    views: '50.00万',
    likes: '369',
    publishedAt: '2026-01-18 19:15:27',
    revenue: '$7327.47',
    impressions: '530.00万',
    growthRate: '0.74%',
    analysis: '自制素材拆解',
    strategy: '属于典型的高曝光低互动测试素材，适合给 Dr.Melaxin 做开头钩子和节奏 AB 版本迭代。',
    sellingPointHitRate: 73,
    tiktokUrl: 'https://www.tiktok.com/@itskiaraoffline/video/7596658225185836302?local=en',
  },
  {
    id: 'dr-melaxin-hit-6',
    cover: '',
    videoUrl: '/orangen-reference-videos/dr-melaxin-hit-6.mp4',
    title: '自制4',
    duration: '0:19',
    tags: ['Dr.Melaxin', '爆点切片', '低成本复刻'],
    views: '20.00万',
    likes: '344',
    publishedAt: '2025-10-08 02:42:12',
    revenue: '$6798.02',
    impressions: '370.00万',
    growthRate: '1.72%',
    analysis: '自制素材拆解',
    strategy: '短时长、强钩子、快节奏，适合做 Dr.Melaxin 的爆点切片和账号日更补量素材。',
    sellingPointHitRate: 76,
    tiktokUrl: 'https://www.tiktok.com/@bymillie.finds/video/7558551951907097869?local=en',
  },
];

const getDrMelaxinReferenceVideos = (): CandidateVideo[] => [
  {
    id: 'dr-melaxin-hit-1',
    cover: '',
    videoUrl: '/orangen-reference-videos/dr-melaxin-hit-1.mp4',
    title: 'Replying to @LoveYoWholeSelf Tarot It ...',
    duration: '1:40',
    tags: ['Dr.Melaxin', '爆款对标', '高转化开场'],
    views: '180.00万',
    likes: '3490',
    publishedAt: '2025-11-18 23:46:04',
    revenue: '$6.91万',
    impressions: '1660.00万',
    growthRate: '3.84%',
    analysis: '热视频拆解',
    strategy: '高密度产品镜头配合快速利益点抛出，适合做 Dr.Melaxin 冷启动拉新和功效心智建立。',
    sellingPointHitRate: 96,
    tiktokUrl: 'https://www.tiktok.com/@hangingwithalo/video/7574091997334572343?local=en',
  },
  {
    id: 'dr-melaxin-hit-2',
    cover: '',
    videoUrl: '/orangen-reference-videos/dr-melaxin-hit-2.mp4',
    title: 'This is how you get rid of those tired eyes 👀...',
    duration: '0:55',
    tags: ['Dr.Melaxin', '场景化转化', '功效种草'],
    views: '220.00万',
    likes: '2081',
    publishedAt: '2026-04-07 11:49:03',
    revenue: '$3.92万',
    impressions: '220.00万',
    growthRate: '2.76%',
    analysis: '热视频拆解',
    strategy: '更偏真人口播和使用反馈，适合做 Dr.Melaxin 的信任感补强与二跳转化承接。',
    sellingPointHitRate: 91,
    tiktokUrl: 'https://www.tiktok.com/@patricknogueiraaa/video/7625859271007210766?local=en',
  },
  {
    id: 'dr-melaxin-hit-3',
    cover: '',
    videoUrl: '/orangen-reference-videos/dr-melaxin-hit-3.mp4',
    title: 'The deal ends tonight! #beauty #tiktokshop...',
    duration: '0:16',
    tags: ['Dr.Melaxin', '自制素材', '轻口播'],
    views: '23.50万',
    likes: '645',
    publishedAt: '2025-12-13 15:29:56',
    revenue: '$1.28万',
    impressions: '50.85万',
    growthRate: '2.74%',
    analysis: '自制素材拆解',
    strategy: '镜头更克制，强调细节特写和真实肤感，适合作为 Dr.Melaxin 的低成本稳定投放模板。',
    sellingPointHitRate: 82,
    tiktokUrl: 'https://www.tiktok.com/@clayinspires/video/7583241245850422559?local=en',
  },
  {
    id: 'dr-melaxin-hit-4',
    cover: '',
    videoUrl: '/orangen-reference-videos/dr-melaxin-hit-4.mp4',
    title: 'This Korean calcium balm by Dr. melaxin is saving my ski...',
    duration: '0:09',
    tags: ['Dr.Melaxin', '前后对比', '高曝光'],
    views: '80.00万',
    likes: '573',
    publishedAt: '2025-10-16 02:54:39',
    revenue: '$1.14万',
    impressions: '280.00万',
    growthRate: '0.72%',
    analysis: '自制素材拆解',
    strategy: '曝光强于互动，适合做 Dr.Melaxin 的素材扩量池，用前后对比吸引停留后再引导转化。',
    sellingPointHitRate: 78,
    tiktokUrl: 'https://www.tiktok.com/@nadiyafinds/video/7561523845375593783?local=en',
  },
  {
    id: 'dr-melaxin-hit-5',
    cover: '',
    videoUrl: '/orangen-reference-videos/dr-melaxin-hit-5.mp4',
    title: 'The best thing I could’ve found for my under eyes w...',
    duration: '0:09',
    tags: ['Dr.Melaxin', '高曝光测试', '转化切片'],
    views: '50.00万',
    likes: '369',
    publishedAt: '2026-01-18 19:15:27',
    revenue: '$7327.47',
    impressions: '530.00万',
    growthRate: '0.74%',
    analysis: '自制素材拆解',
    strategy: '属于典型的高曝光低互动测试素材，适合给 Dr.Melaxin 做开头钩子和节奏 AB 版本迭代。',
    sellingPointHitRate: 73,
    tiktokUrl: 'https://www.tiktok.com/@itskiaraoffline/video/7596658225185836302?local=en',
  },
  {
    id: 'dr-melaxin-hit-6',
    cover: '',
    videoUrl: '/orangen-reference-videos/dr-melaxin-hit-6.mp4',
    title: 'They call this Tox in a stick for a reason. It goes on like...',
    duration: '0:08',
    tags: ['Dr.Melaxin', '爆点切片', '低成本复刻'],
    views: '20.00万',
    likes: '344',
    publishedAt: '2025-10-08 02:42:12',
    revenue: '$6798.02',
    impressions: '370.00万',
    growthRate: '1.72%',
    analysis: '自制素材拆解',
    strategy: '短时长、强钩子、快节奏，适合做 Dr.Melaxin 的爆点切片和账号日更补量素材。',
    sellingPointHitRate: 76,
    tiktokUrl: 'https://www.tiktok.com/@bymillie.finds/video/7558551951907097869?local=en',
  },
];

const getPopmartReferenceVideos = (): CandidateVideo[] => [
  {
    id: 'popmart-hit-1',
    cover: '',
    videoUrl: '/orangen-reference-videos/popmart-hit-1.mp4',
    title: 'BIG INTO ENERGY LABUBUS ARE IN STOCK ON THE OFFICIAL...',
    duration: '1:56',
    tags: ['POP MART', 'Labubu', '达人视频'],
    views: '10.00万',
    likes: '15',
    revenue: '$401',
    impressions: '440.00万',
    analysis: '达人视频拆解',
    strategy: '官方店铺真实性背书 + 库存稀缺感，适合盲盒品类的信任转化开场。',
    sellingPointHitRate: 94,
    tiktokUrl: 'https://www.tiktok.com/@jennam4e/video/7559171501598018846',
  },
  {
    id: 'popmart-hit-2',
    cover: '',
    videoUrl: '/orangen-reference-videos/popmart-hit-2.mp4',
    title: 'Labubu Big Into Energy Unboxing! #labubu...',
    duration: '0:45',
    tags: ['POP MART', '盲盒开箱', '达人视频'],
    views: '3700',
    likes: '2',
    revenue: '$57',
    impressions: '43.12万',
    analysis: '达人视频拆解',
    strategy: '开箱即时惊喜 + 标签露出，适合强化正品与隐藏款机制。',
    sellingPointHitRate: 90,
    tiktokUrl: 'https://www.tiktok.com/@bambineandme/video/7561087041367313695',
  },
  {
    id: 'popmart-hit-3',
    cover: '',
    videoUrl: '/orangen-reference-videos/popmart-hit-3.mp4',
    title: 'We love this series we might need to get them all...',
    duration: '0:28',
    tags: ['POP MART', '自制视频', '系列收藏'],
    views: '1076',
    likes: '2',
    revenue: '$55',
    impressions: '1076',
    analysis: '自制视频拆解',
    strategy: '系列收集心理驱动，适合盲盒复购与套系追更内容。',
    sellingPointHitRate: 86,
    tiktokUrl: 'https://www.tiktok.com/@samanthawade/video/7624258603460922638',
  },
  {
    id: 'popmart-hit-4',
    cover: '',
    videoUrl: '/orangen-reference-videos/popmart-hit-4.mp4',
    title: 'Which color will you get? #labubu #popmart...',
    duration: '0:12',
    tags: ['POP MART', '颜色款式', '自制视频'],
    views: '344',
    likes: '2',
    revenue: '$44',
    impressions: '344',
    analysis: '自制视频拆解',
    strategy: '用颜色选择制造评论互动，适合盲盒款式偏好投票素材。',
    sellingPointHitRate: 84,
    tiktokUrl: 'https://www.tiktok.com/@thisislucygoosey/video/7629795340341792014',
  },
  {
    id: 'popmart-hit-5',
    cover: '',
    videoUrl: '/orangen-reference-videos/popmart-hit-5.mp4',
    title: '#labubu #labubuthemonsters #labububigintoenergy...',
    duration: '0:08',
    tags: ['POP MART', '短切片', '自制视频'],
    views: '293',
    likes: '1',
    revenue: '$32',
    impressions: '293',
    analysis: '自制视频拆解',
    strategy: '极短产品展示切片，适合做高频素材测试和再剪辑。',
    sellingPointHitRate: 80,
    tiktokUrl: 'https://www.tiktok.com/@libby_daugherty_cortes/video/7627204403887426846',
  },
  {
    id: 'popmart-hit-6',
    cover: '',
    videoUrl: '/orangen-reference-videos/popmart-hit-6.mp4',
    title: 'They are retail price with free shipping! Grab them now...',
    duration: '0:21',
    tags: ['POP MART', '价格机制', '达人视频'],
    views: '485',
    likes: '0',
    revenue: '$0',
    impressions: '485',
    analysis: '达人视频拆解',
    strategy: '价格与免邮刺激行动，适合承接 TikTok Shop 购买转化。',
    sellingPointHitRate: 76,
    tiktokUrl: 'https://www.tiktok.com/@jenlawson1/video/7581512742201281806',
  },
];

const getReferenceVideosForSetup = (setup: SessionSetup) =>
  isPopmartMaterialSetup(setup) ? getPopmartReferenceVideos() : getDrMelaxinReferenceVideos();

const getGeneratedResultForSetup = (setup: SessionSetup) =>
  isPopmartMaterialSetup(setup) ? GENERATED_POPMART_RESULT : GENERATED_MELAXIN_RESULT;

const buildDefaultCandidateVideoPrompt = (sellingPoints: string, category: string, title: string) =>
  `【爆款复刻Prompt】

镜头风格：近景特写 + 俯拍切换，暖色调滤镜
节奏：快节奏剪辑，BGM 节拍同步
内容结构：
1. 开场 - 产品白底展示，旋转 360°（0-3s）
2. 使用场景 - 手部特写展示质感（3-8s）
3. 效果对比 - 使用前后对比（8-15s）
4. 口播种草 - 真人出镜，口述卖点（15-25s）
5. 结尾 CTA - 点击链接，限时优惠（25-30s）

关键词：${sellingPoints.slice(0, 30)}
品类：${category}
参考来源：${title}`;

const DR_MELAXIN_CALCIUM_BALM_PROMPT = `原生真实 UGC 带货视频质感，画面冷调补光清晰聚焦，剪辑节奏快速卡点。

【核心目标・最高优先级】
生成【9:16】竖屏 TikTok UGC 信息流带货视频，仅参考下方拆解的纯文本逻辑（人物风格、场景类型、镜头语言、运镜节奏、画面动作逻辑、文案结构），完全不使用任何对标视频的画面、人物、产品、场景，生成全新的专属带货视频。

【专属元素替换（必须 100% 填写）】：
核心产品：仅为【紫色护肤除皱棒】（外观严格匹配上传的产品参考图）产品参考图
图片1

口播文案：
【全程】无真人声口播，仅搭配轻柔背景音乐。
视频中上方白色字幕：
【00:00-00:10】When you're 36 and look better than you did at 26 all because you saw some milf talking about this wrinkle stick that's better than botox.

【可复制逻辑复刻（严格遵循，填写拆解结果）】：
人物风格：【30-35 岁非裔女性，黑色羊羔卷短发，蓝色美瞳，精致全妆，佩戴多层金色项链及夸张戒指；身穿红色深 V 吊带背心，粉色真丝头巾挂于脖间；气质自信精致、御姐感、有说服力；标志性动作为将产品贴近面部展示、熟练涂抹眼周及额头、展示涂抹后光泽感】
场景类型：【室内生活化场景（卧室 / 化妆间），背景可见黑色皮质大容量包袋、化妆镜光线，整体环境略暗；环形灯冷色调补光，聚焦人物面部及产品；氛围标签种草、真实、精致护肤、对比感】
镜头语言：【核心景别为中景转特写，拍摄视角为平视自拍视角；运镜以固定机位为主，通过人物靠近镜头形成视觉冲击；剪辑节奏快速切换，配合 BGM 卡点，镜头切换频率约 1-2 秒一个部位】
运镜时序与画面动作逻辑（逐秒与口播强绑定）：
【00:00-00:01】固定机位 中景 画面动作：人物正对镜头，从包内拿出一支紫色护肤除皱棒
【00:01-00:02】略微推近 中景 画面动作：打开产品盖子，在左侧眼周、太阳穴位置上下涂抹
【00:02-00:03】略微推近 中景 画面动作：在额头、眉间快速横向涂抹，展示产品质地
【00:03-00:04】固定机位 中景 画面动作：微仰头，在颈部、下颚线位置大面积涂抹
【00:04-00:05】略微推近 中景 画面动作：在右侧眼下、脸颊位置快速涂抹
【00:05-00:07】固定机位 中景 画面动作：双手持一支打开一支闭合的紫色护肤除皱棒，展示产品包装
【00:07-00:08】固定机位 中景 画面动作：放下产品，用手指轻点眼周，展示皮肤吸收后状态

【核心强制约束（必须严格执行，不可修改）】：
全程画面仅出现【紫色护肤除皱棒】+【非裔女性及手部】，无任何其他产品、竞品、无关物品
全程画面无任何字幕、文字、水印、Logo、符号，画面干净无冗余内容
人物、场景必须是全新原创的，不能和任何对标视频、参考图里的人物 / 场景相同
运镜、节奏、画面动作逻辑严格遵循上方填写的可复制逻辑，口播与画面 100% 同步
产品外观、光影、质感 100% 匹配上传的产品参考图，连续帧无变形、无外观变化`;

const POPMART_LABUBU_PROMPT = `生成9秒9:16竖屏 TikTok UGC 信息流带货视频，仅参考对标视频的纯文本逻辑，不使用任何对标画面、人物、产品或场景。

核心产品：潮玩手办玩偶，外观严格匹配上传的产品参考图。
上方白色字幕：POV: You score an authentic Labubu from the ACTUAL Popmart shop on the TikTok shop

人物风格：前2秒完整人物出镜，后续仅手部；25-35岁欧美女性，浅棕色长发，自然妆容，居家休闲浅色背心，表情满足、真实分享、带一点小得意。
场景类型：室内居家，初始纯白墙面，后续浅色木质地板，自然明亮室内光，真实开箱氛围。
镜头语言：CU/MCU/ECU，POV结合自拍视角，快速推镜突出细节，手部旋转展示产品和正品吊牌。
时序：00:00-00:02 人物与潮玩手办并列，满意表情；00:02-00:03 极速推近眼部；00:03-00:04 正面展示毛绒质感；00:04-00:09 手部左右旋转，完整展示吊牌细节。
约束：全程仅出现潮玩手办、出镜欧美女性及手部，无竞品、无无关物品；画面无水印、Logo、冗余字幕；产品连续帧无变形、无外观变化。`;

const buildPromptForSelectedVideo = (
  setup: SessionSetup,
  video: CandidateVideo | null | undefined
) => {
  if (isPopmartMaterialSetup(setup) || video?.id.startsWith('popmart-hit-')) {
    return POPMART_LABUBU_PROMPT;
  }

  if (video?.id === 'dr-melaxin-hit-4') {
    return DR_MELAXIN_CALCIUM_BALM_PROMPT;
  }

  return buildDefaultCandidateVideoPrompt(
    setup.sellingPoints,
    setup.category,
    video?.title || ''
  );
};

function now() {
  return new Date().toLocaleTimeString('zh-CN', { hour12: false });
}

const PHASE1_MS = 82_000;
const PHASE2_MS = 33_000;
const PHASE3_MS = 273_000;

const makeRunMeta = (phase: SkillsRunPhase, awaitingAction: SkillsAwaitingAction, nextActionAt: number | null): SkillsRunMeta => ({
  phase,
  awaitingAction,
  nextActionAt,
  updatedAt: Date.now(),
});

const initialAgents: AgentInfo[] = [
  { id: 'agent-01', number: '01', name: 'TikTok爆款专家', role: 'TK爆款视频匹配', avatar: 'search', statusText: '等待启动', progress: 0, status: 'idle' },
  { id: 'agent-02', number: '02', name: '记忆库专家', role: '记忆库特征向量构建', avatar: 'memory', statusText: '等待启动', progress: 0, status: 'idle' },
  { id: 'agent-03', number: '03', name: 'Prompt专家', role: 'TikTok爆款视频Prompt设计', avatar: 'strategist', statusText: '等待启动', progress: 0, status: 'idle' },
  { id: 'agent-04', number: '04', name: '视频专家', role: '视频生成与合成', avatar: 'video', statusText: '等待启动', progress: 0, status: 'idle' },
];

export function useSkillsEngine() {
  const [state, setState] = useState<SkillsState>({
    sessionId: `session-${Date.now()}`,
    setupCompleted: false,
    setup: { image: null, imageName: null, memoryEnabled: true, selectedMemoryIds: [], selectedCreatorIds: [], sellingPoints: '', category: '' },
    uiMode: 'single',
    activeTaskId: null,
    tasks: [],
    messages: [],
    candidateVideos: [],
    selectedVideo: null,
    generatedPrompt: '',
    resultVideo: null,
    isProcessing: false,
    runMeta: null,
    agents: [...initialAgents],
    activeRightView: 'none',
    checklistItems: [],
    checklistDone: [],
  });

  const streamTimers = useRef<number[]>([]);

  const clearTimers = () => {
    streamTimers.current.forEach(clearTimeout);
    streamTimers.current = [];
  };

  // Helpers
  const addMessage = useCallback((msg: Omit<StreamMessage, 'id'>) => {
    const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setState(prev => ({ ...prev, messages: [...prev.messages, { ...msg, id }] }));
    return id;
  }, []);

  const streamText = useCallback((text: string, onDone?: () => void) => {
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, { id: msgId, type: 'text', content: '', isStreaming: true }],
    }));
    const chars = text.split('');
    let i = 0;
    const tick = () => {
      if (i < chars.length) {
        const batch = chars.slice(i, i + 3).join('');
        i += 3;
        setState(prev => ({
          ...prev,
          messages: prev.messages.map(m => m.id === msgId ? { ...m, content: m.content + batch } : m),
        }));
        const timer = window.setTimeout(tick, 30 + Math.random() * 20);
        streamTimers.current.push(timer);
      } else {
        setState(prev => ({
          ...prev,
          messages: prev.messages.map(m => m.id === msgId ? { ...m, isStreaming: false } : m),
        }));
        onDone?.();
      }
    };
    tick();
    return msgId;
  }, []);

  const updateAgent = useCallback((agentId: string, updates: Partial<AgentInfo>) => {
    setState(prev => ({
      ...prev,
      agents: prev.agents.map(a => a.id === agentId ? { ...a, ...updates } : a),
    }));
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<SkillTask>) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t),
    }));
  }, []);

  const addTaskLog = useCallback((taskId: string, message: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t =>
        t.id === taskId ? { ...t, logs: [...t.logs, { time: now(), message }] } : t
      ),
    }));
  }, []);

  const updateChild = useCallback((parentId: string, childId: string, updates: Partial<SkillTask>) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === parentId ? {
        ...t,
        children: t.children.map(c => c.id === childId ? { ...c, ...updates } : c),
      } : t),
    }));
  }, []);

  // Delay helpers
  const randDelay = () => new Promise<void>(r => { const t = window.setTimeout(r, 1500 + Math.random() * 2000); streamTimers.current.push(t); });
  const subDelay = () => new Promise<void>(r => { const t = window.setTimeout(r, 1000 + Math.random() * 1000); streamTimers.current.push(t); });
  const backendDelay = () => new Promise<void>(r => { const t = window.setTimeout(r, 3000 + Math.random() * 3000); streamTimers.current.push(t); });
  const pause = (ms = 600) => new Promise<void>(r => { const t = window.setTimeout(r, ms); streamTimers.current.push(t); });
  const waitUntil = (deadline: number) => new Promise<void>(r => {
    const remaining = Math.max(0, deadline - Date.now());
    if (remaining === 0) {
      r();
      return;
    }
    const t = window.setTimeout(r, remaining);
    streamTimers.current.push(t);
  });

  // Update agent in cluster messages (to keep them in sync for rendering)
  const updateAgentInMessages = useCallback((agentId: string, updates: Partial<AgentInfo>) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(m => {
        if (m.type === 'agent-cluster' && m.agents) {
          return {
            ...m,
            agents: m.agents.map(a => a.id === agentId ? { ...a, ...updates } : a),
          };
        }
        return m;
      }),
    }));
  }, []);

  // ─── Phase 0: Complete setup ───
  const completeSetup = useCallback((setup: SessionSetup) => {
    const phase1Deadline = Date.now() + PHASE1_MS;
    const checklistItems = [
      '匹配对标品类和卖点的爆款视频列表',
      '构建记忆库特征向量',
      '设计专属TikTok爆款视频Prompt',
      '生成专属爆款视频',
    ];

    // Create tasks
    const tasks: SkillTask[] = [
      {
        id: 'task-crawl', title: '抓取同品类 TK 爆款视频',
        status: 'queued', progress: 0, logs: [], children: [
          { id: 'task-crawl-spider', title: '启动 TikTok 爬虫', status: 'queued', progress: 0, logs: [], children: [], expert: { name: '爬虫专家', avatar: 'crawler', role: '数据爬取专家' } },
          { id: 'task-crawl-analyze', title: '分析卖点匹配度', status: 'queued', progress: 0, logs: [], children: [], expert: { name: '数据专家', avatar: 'analyst', role: '数据分析专家' } },
          { id: 'task-crawl-rank', title: '排序生成 Top 20', status: 'queued', progress: 0, logs: [], children: [], expert: { name: '策略专家', avatar: 'strategist', role: '策略专家' } },
          { id: 'task-crawl-cover', title: '提取视频封面', status: 'queued', progress: 0, logs: [], children: [], expert: { name: '视频专家', avatar: 'video', role: '视频制作专家' } },
        ],
        moduleChain: ['TikTokCrawler', 'ContentAnalyzer', 'RankingEngine', 'ThumbnailGen'],
        input: `品类: ${setup.category}, 卖点: ${setup.sellingPoints.slice(0, 50)}`,
        expert: { name: '爬虫', avatar: 'crawler', role: '' },
      },
      {
        id: 'task-memory', title: '构建记忆库特征向量',
        status: setup.memoryEnabled ? 'queued' : 'skipped',
        progress: 0, logs: [], children: [
          { id: 'task-memory-connect', title: '连接记忆库', status: 'queued', progress: 0, logs: [], children: [], expert: { name: '记忆专家', avatar: 'memory', role: '记忆管理专家' } },
          { id: 'task-memory-retrieve', title: '检索相关记忆', status: 'queued', progress: 0, logs: [], children: [], expert: { name: '检索专家', avatar: 'search', role: '信息检索专家' } },
          { id: 'task-memory-context', title: '构建上下文向量', status: 'queued', progress: 0, logs: [], children: [], expert: { name: '数据专家', avatar: 'analyst', role: '数据分析专家' } },
        ],
        expert: { name: '记忆库', avatar: 'memory', role: '' },
      },
      {
        id: 'task-reverse-prompt', title: '设计专属Prompt',
        status: 'queued', progress: 0, logs: [], children: [
          { id: 'rp-frame', title: '视频帧分析', status: 'queued', progress: 0, logs: [], children: [], expert: { name: '视频专家', avatar: 'video', role: '视频制作专家' } },
          { id: 'rp-style', title: '风格特征提取', status: 'queued', progress: 0, logs: [], children: [], expert: { name: '设计专家', avatar: 'designer', role: '创意制作专家' } },
          { id: 'rp-prompt', title: '提示词生成', status: 'queued', progress: 0, logs: [], children: [], expert: { name: '策略专家', avatar: 'strategist', role: '策略专家' } },
        ],
        expert: { name: '提示词', avatar: 'strategist', role: '' },
      },
      {
        id: 'task-generate-video', title: '生成爆款视频',
        status: 'queued', progress: 0, logs: [], children: [
          { id: 'sub-scene', title: '渲染场景', status: 'queued', progress: 0, logs: [], children: [], expert: { name: '设计专家', avatar: 'designer', role: '创意制作专家' } },
          { id: 'sub-audio', title: '音频合成', status: 'queued', progress: 0, logs: [], children: [], expert: { name: '音频专家', avatar: 'audio', role: '音频制作专家' } },
          { id: 'sub-compose', title: '视频合成', status: 'queued', progress: 0, logs: [], children: [], expert: { name: '视频专家', avatar: 'video', role: '视频制作专家' } },
        ],
        expert: { name: '视频', avatar: 'video', role: '' },
      },
    ];

    setState(prev => ({
      ...prev,
      setup,
      setupCompleted: true,
      isProcessing: true,
      tasks,
      checklistItems,
      checklistDone: [false, false, false, false],
      runMeta: makeRunMeta('phase1', null, phase1Deadline),
    }));

    // Add setup summary
    addMessage({ type: 'setup-summary', content: JSON.stringify(setup) });

    (async () => {
      // Intro text
      streamText('现在让我为你编写专属TikTok解决方案。', async () => {
        await pause(600);

        // Show checklist
        addMessage({ type: 'checklist', content: '' });
        await pause(800);

        // ─── Phase 1: Agent 01 - 爆款专家 ───
        addMessage({ type: 'create-agent', content: '创建TikTok爆款专家代理', agentNames: [{ name: 'TikTok爆款专家', avatar: 'search' }] });
        await pause(400);

        const agent01: AgentInfo = {
          id: 'agent-01', number: '01', name: 'TikTok爆款专家', role: 'TK爆款视频匹配',
          avatar: 'search', status: 'running',
          statusText: `正在为你匹配对标「${setup.category}」品类和「${setup.sellingPoints.slice(0, 20)}」卖点的爆款视频列表`,
          progress: 10,
        };

        setState(prev => ({
          ...prev,
          agents: prev.agents.map(a => a.id === 'agent-01' ? agent01 : a),
          activeRightView: 'agents',
          activeAgentTab: '01',
        }));

        addMessage({ type: 'agent-cluster', content: '', agents: [agent01] });
        await pause(400);

        // Run crawl task
        updateTask('task-crawl', { status: 'running', startAt: now() });
        addTaskLog('task-crawl', 'TikTok爆款专家启动 TikTok 爬虫...');

        // Sub 1: Spider
        updateChild('task-crawl', 'task-crawl-spider', { status: 'running', title: '爬虫专家正在启动 TikTok 爬虫' });
        updateAgentInMessages('agent-01', { progress: 25, statusText: '正在抓取TikTok视频数据...' });
        updateAgent('agent-01', { progress: 25, statusText: '正在抓取TikTok视频数据...' });
        await backendDelay();
        updateChild('task-crawl', 'task-crawl-spider', { status: 'done', progress: 100, title: '爬虫专家完成启动 TikTok 爬虫' });
        const crawlCount = Math.floor(Math.random() * 251) + 50;
        addTaskLog('task-crawl', `爬虫专家完成抓取 → 共获取 ${crawlCount} 条视频数据`);

        // Sub 2: Analyze
        updateChild('task-crawl', 'task-crawl-analyze', { status: 'running', title: '数据专家正在分析卖点匹配度' });
        addTaskLog('task-crawl', '数据专家正在分析卖点匹配度...');
        updateAgentInMessages('agent-01', { progress: 50, statusText: '正在分析卖点匹配度...' });
        updateAgent('agent-01', { progress: 50, statusText: '正在分析卖点匹配度...' });
        await backendDelay();
        updateChild('task-crawl', 'task-crawl-analyze', { status: 'done', progress: 100, title: '数据专家完成分析卖点匹配度' });
        const matchRate = (Math.random() * 50 + 50).toFixed(1);
        const highMatchCount = Math.floor(Math.random() * 21) + 10;
        addTaskLog('task-crawl', `数据专家完成分析 → 平均匹配度 ${matchRate}%，高匹配 ${highMatchCount} 条`);

        // Sub 3: Rank
        updateChild('task-crawl', 'task-crawl-rank', { status: 'running', title: '策略专家正在排序生成 Top 20' });
        updateAgentInMessages('agent-01', { progress: 75, statusText: '正在生成 Top 20 排名...' });
        updateAgent('agent-01', { progress: 75, statusText: '正在生成 Top 20 排名...' });
        await randDelay();
        updateChild('task-crawl', 'task-crawl-rank', { status: 'done', progress: 100, title: '策略专家完成排序生成 Top 20' });
        addTaskLog('task-crawl', '策略专家完成排序 → Top 6候选已生成');

        // Sub 4: Cover
        updateChild('task-crawl', 'task-crawl-cover', { status: 'running', title: '视频专家正在提取视频封面' });
        updateAgentInMessages('agent-01', { progress: 90, statusText: '正在提取视频封面...' });
        updateAgent('agent-01', { progress: 90, statusText: '正在提取视频封面...' });
        await subDelay();
        updateChild('task-crawl', 'task-crawl-cover', { status: 'done', progress: 100, title: '视频专家完成提取视频封面' });
        addTaskLog('task-crawl', '视频专家完成封面提取 → 6张高清封面已缓存');
        await waitUntil(phase1Deadline);

        updateTask('task-crawl', { status: 'done', progress: 100, endAt: now(), output: '抓取 142 条，Top 20 已排序' });
        updateAgentInMessages('agent-01', { progress: 100, status: 'done', statusText: '已完成爆款视频匹配，请选择对标视频' });
        updateAgent('agent-01', { progress: 100, status: 'done', statusText: '已完成爆款视频匹配，请选择对标视频' });

        // Update checklist
        setState(prev => ({
          ...prev,
          checklistDone: [true, ...prev.checklistDone.slice(1)],
        }));

        // Show video candidates
        const videos = getReferenceVideosForSetup(setup);
        setState(prev => ({
          ...prev,
          candidateVideos: videos,
          isProcessing: false,
          activeRightView: 'agents',
          activeAgentTab: '01',
          runMeta: makeRunMeta('awaiting_select', 'select_video', null),
        }));

        addMessage({ type: 'video-gen-status', content: '请从右侧面板选择一条对标视频进行复刻 →' });
      });
    })();
  }, [streamText, addMessage, updateTask, addTaskLog, updateChild, updateAgent, updateAgentInMessages]);

  // ─── Select video → Phase 2: Agent 02 + 03 parallel ───
  const selectVideo = useCallback((video: CandidateVideo) => {
    const phase2Deadline = Date.now() + PHASE2_MS;
    setState(prev => ({
      ...prev,
      selectedVideo: video,
      isProcessing: true,
      runMeta: makeRunMeta('phase2', null, phase2Deadline),
    }));

    addMessage({ type: 'selection-confirm', content: `已选择「${video.title}」作为对标视频，现在为你生成专属爆款视频Prompt。` });

    (async () => {
      await pause(600);
      addMessage({ type: 'read-checklist', content: '读取待办清单' });
      await pause(400);

      // Show memory files if enabled
      if (state.setup.memoryEnabled && state.setup.selectedMemoryIds.length > 0) {
        for (const memId of state.setup.selectedMemoryIds) {
          addMessage({ type: 'read-memory', content: '', memoryId: memId });
          await pause(300);
        }
        await pause(200);
      }

      addMessage({ type: 'create-agent', content: '创建记忆库信息和Prompt设计专家代理', agentNames: [{ name: '记忆库专家', avatar: 'memory' }, { name: 'Prompt专家', avatar: 'strategist' }] });
      await pause(400);

      // Agent 02 + 03 cluster
      const agent02: AgentInfo = {
        id: 'agent-02', number: '02', name: '记忆库专家', role: '记忆库特征向量构建',
        avatar: 'memory', status: 'running',
        statusText: '正在为你构建记忆库特征向量',
        progress: 10,
      };
      const agent03: AgentInfo = {
        id: 'agent-03', number: '03', name: 'Prompt专家', role: 'Prompt设计',
        avatar: 'strategist', status: 'running',
        statusText: '正在为你设计专属TikTok爆款视频Prompt',
        progress: 10,
      };

      setState(prev => ({
        ...prev,
        agents: prev.agents.map(a => {
          if (a.id === 'agent-02') return agent02;
          if (a.id === 'agent-03') return agent03;
          return a;
        }),
        activeRightView: 'agents',
        activeAgentTab: '02',
      }));

      addMessage({ type: 'agent-cluster', content: '', agents: [agent02, agent03] });

      // Run Agent 02 (memory) and Agent 03 (prompt) in parallel
      const runAgent02 = async () => {
        const setup = state.setup;
        if (!setup.memoryEnabled) {
          updateTask('task-memory', { status: 'skipped', endAt: now() });
          updateAgentInMessages('agent-02', { status: 'skipped', progress: 0, statusText: '未选择记忆库，已跳过' });
          updateAgent('agent-02', { status: 'skipped', progress: 0, statusText: '未选择记忆库，已跳过' });
          return;
        }

        updateTask('task-memory', { status: 'running', startAt: now() });
        addTaskLog('task-memory', '记忆专家正在连接记忆库...');

        updateChild('task-memory', 'task-memory-connect', { status: 'running', title: '记忆专家正在连接记忆库' });
        updateAgentInMessages('agent-02', { progress: 20, statusText: '正在连接记忆库...' });
        updateAgent('agent-02', { progress: 20, statusText: '正在连接记忆库...' });
        await subDelay();
        updateChild('task-memory', 'task-memory-connect', { status: 'done', progress: 100, title: '记忆专家完成连接记忆库' });
        addTaskLog('task-memory', '记忆专家完成连接记忆库 → 已建立安全连接');

        updateChild('task-memory', 'task-memory-retrieve', { status: 'running', title: '检索专家正在检索相关记忆' });
        updateAgentInMessages('agent-02', { progress: 50, statusText: '正在检索相关记忆...' });
        updateAgent('agent-02', { progress: 50, statusText: '正在检索相关记忆...' });
        await subDelay();
        const memoryCount = setup.selectedMemoryIds.length || 4;
        updateChild('task-memory', 'task-memory-retrieve', { status: 'done', progress: 100, title: '检索专家完成检索相关记忆' });
        addTaskLog('task-memory', `检索专家完成检索 → 命中 ${memoryCount} 条相关记忆`);

        updateChild('task-memory', 'task-memory-context', { status: 'running', title: '数据专家正在构建上下文向量' });
        updateAgentInMessages('agent-02', { progress: 80, statusText: '正在构建特征向量...' });
        updateAgent('agent-02', { progress: 80, statusText: '正在构建特征向量...' });
        await subDelay();
        updateChild('task-memory', 'task-memory-context', { status: 'done', progress: 100, title: '数据专家完成构建上下文向量' });
        const vectorDim = Math.floor(Math.random() * 50) + 1;
        addTaskLog('task-memory', `数据专家完成构建上下文向量 → 生成 ${vectorDim} 维特征向量`);

        updateTask('task-memory', { status: 'done', progress: 100, endAt: now(), output: `已检索 ${memoryCount} 条记忆，构建上下文完成` });
        updateAgentInMessages('agent-02', { status: 'done', progress: 100, statusText: `已完成，检索到 ${memoryCount} 条记忆` });
        updateAgent('agent-02', { status: 'done', progress: 100, statusText: `已完成，检索到 ${memoryCount} 条记忆` });

        setState(prev => ({
          ...prev,
          checklistDone: [prev.checklistDone[0], true, ...prev.checklistDone.slice(2)],
          activeAgentTab:
            prev.activeRightView === 'agents' && prev.activeAgentTab === '02'
              ? '03'
              : prev.activeAgentTab,
        }));
      };

      const runAgent03 = async () => {
        updateTask('task-reverse-prompt', { status: 'running', startAt: now(), input: `视频: ${video.title}` });
        addTaskLog('task-reverse-prompt', '开始分析视频内容...');

        updateChild('task-reverse-prompt', 'rp-frame', { status: 'running', title: '视频专家正在分析视频帧' });
        updateAgentInMessages('agent-03', { progress: 20, statusText: '正在分析视频帧...' });
        updateAgent('agent-03', { progress: 20, statusText: '正在分析视频帧...' });
        await randDelay();
        updateChild('task-reverse-prompt', 'rp-frame', { status: 'done', progress: 100, title: '视频专家完成视频帧分析' });
        const keyFrames = Math.floor(Math.random() * 41) + 20;
        addTaskLog('task-reverse-prompt', `视频专家完成视频帧分析 → 提取 ${keyFrames} 个关键帧`);

        updateChild('task-reverse-prompt', 'rp-style', { status: 'running', title: '设计专家正在提取风格特征' });
        updateAgentInMessages('agent-03', { progress: 50, statusText: '正在提取风格特征...' });
        updateAgent('agent-03', { progress: 50, statusText: '正在提取风格特征...' });
        await randDelay();
        updateChild('task-reverse-prompt', 'rp-style', { status: 'done', progress: 100, title: '设计专家完成风格特征提取' });
        addTaskLog('task-reverse-prompt', '设计专家完成风格特征提取');

        updateChild('task-reverse-prompt', 'rp-prompt', { status: 'running', title: '策略专家正在生成提示词' });
        updateAgentInMessages('agent-03', { progress: 80, statusText: '正在生成Prompt...' });
        updateAgent('agent-03', { progress: 80, statusText: '正在生成Prompt...' });
        await backendDelay();
        updateChild('task-reverse-prompt', 'rp-prompt', { status: 'done', progress: 100, title: '策略专家完成提示词生成' });
        addTaskLog('task-reverse-prompt', '策略专家完成提示词生成 → 包含镜头、节奏、结构等 6 个维度');

        updateTask('task-reverse-prompt', { status: 'done', progress: 100, endAt: now(), output: '提示词生成完成' });
        updateAgentInMessages('agent-03', { status: 'done', progress: 100, statusText: '已完成Prompt设计' });
        updateAgent('agent-03', { status: 'done', progress: 100, statusText: '已完成Prompt设计' });

        setState(prev => ({
          ...prev,
          checklistDone: [prev.checklistDone[0], prev.checklistDone[1], true, ...prev.checklistDone.slice(3)],
        }));
      };

      await Promise.all([runAgent02(), runAgent03()]);
      await waitUntil(phase2Deadline);

      const mockPrompt = `【爆款复刻 Prompt】\n\n镜头风格：近景特写 + 俯拍切换，暖色调滤镜\n节奏：快节奏剪辑，BGM 节拍同步\n内容结构：\n1. 开场 - 产品白底展示，旋转 360°（0-3s）\n2. 使用场景 - 手部特写展示质感（3-8s）\n3. 效果对比 - 使用前后对比（8-15s）\n4. 口播种草 - 真人出镜，口述卖点（15-25s）\n5. 结尾 CTA - 点击链接，限时优惠（25-30s）\n\n关键词：${state.setup.sellingPoints.slice(0, 30)}\n品类：${state.setup.category}\n参考来源：${video.title}`;

      const resolvedPrompt = buildPromptForSelectedVideo(state.setup, video);

      setState(prev => ({
        ...prev,
        generatedPrompt: resolvedPrompt,
        isProcessing: false,
        runMeta: makeRunMeta('awaiting_confirm', 'confirm_prompt', null),
      }));

      addMessage({ type: 'video-gen-status', content: '✅ Prompt已生成，请在右侧面板查看和编辑，确认后生成视频 →' });
    })();
  }, [state.setup, addMessage, updateTask, addTaskLog, updateChild, updateAgent, updateAgentInMessages]);

  // ─── Confirm prompt → Phase 3: Agent 04 ───
  const confirmGenerate = useCallback(() => {
    const phase3Deadline = Date.now() + PHASE3_MS;
    setState(prev => ({
      ...prev,
      isProcessing: true,
      runMeta: makeRunMeta('phase3', null, phase3Deadline),
    }));

    (async () => {
      addMessage({ type: 'read-checklist', content: '读取待办清单' });
      await pause(400);
      addMessage({ type: 'create-agent', content: '创建视频生成专家代理', agentNames: [{ name: '视频专家', avatar: 'video' }] });
      await pause(400);

      const agent04: AgentInfo = {
        id: 'agent-04', number: '04', name: '视频专家', role: '视频生成与合成',
        avatar: 'video', status: 'running',
        statusText: '正在为你生成专属爆款视频',
        progress: 10,
      };

      setState(prev => ({
        ...prev,
        agents: prev.agents.map(a => a.id === 'agent-04' ? agent04 : a),
        activeRightView: 'agents',
        activeAgentTab: '04',
      }));

      addMessage({ type: 'agent-cluster', content: '', agents: [agent04] });

      // Run video generation
      const genTaskId = 'task-generate-video';
      updateTask(genTaskId, { status: 'running', startAt: now() });
      addTaskLog(genTaskId, '开始渲染视频...');

      // Scene
      updateChild(genTaskId, 'sub-scene', { status: 'running', title: '设计专家正在渲染场景' });
      updateAgentInMessages('agent-04', { progress: 20, statusText: '正在渲染场景...' });
      updateAgent('agent-04', { progress: 20, statusText: '正在渲染场景...' });
      await backendDelay();
      addTaskLog(genTaskId, '设计专家渲染场景');
      await pause(800);
      updateChild(genTaskId, 'sub-scene', { status: 'done', progress: 100, title: '设计专家完成渲染场景' });
      addTaskLog(genTaskId, '设计专家完成场景渲染');

      // Audio
      updateChild(genTaskId, 'sub-audio', { status: 'running', title: '音频专家正在合成音频' });
      updateAgentInMessages('agent-04', { progress: 55, statusText: '正在合成音频...' });
      updateAgent('agent-04', { progress: 55, statusText: '正在合成音频...' });
      addTaskLog(genTaskId, '音频专家正在合成音频...');
      await randDelay();
      updateChild(genTaskId, 'sub-audio', { status: 'done', progress: 100, title: '音频专家完成合成音频' });
      addTaskLog(genTaskId, '音频专家完成音频合成 → BGM 节拍同步');

      // Compose
      updateChild(genTaskId, 'sub-compose', { status: 'running', title: '视频专家正在合成视频' });
      updateAgentInMessages('agent-04', { progress: 80, statusText: '正在合成最终视频...' });
      updateAgent('agent-04', { progress: 80, statusText: '正在合成最终视频...' });
      addTaskLog(genTaskId, '视频专家正在合成视频...');
      await backendDelay();
      updateChild(genTaskId, 'sub-compose', { status: 'done', progress: 100, title: '视频专家完成合成视频' });
      addTaskLog(genTaskId, '视频专家完成视频合成');
      addTaskLog(genTaskId, '质量检测通过');
      await waitUntil(phase3Deadline);

      updateTask(genTaskId, { status: 'done', progress: 100, endAt: now(), output: '视频生成完成，时长 30s' });
      updateAgentInMessages('agent-04', { status: 'done', progress: 100, statusText: '视频生成完成！' });
      updateAgent('agent-04', { status: 'done', progress: 100, statusText: '视频生成完成！' });

      setState(prev => ({
        ...prev,
        checklistDone: [true, true, true, true],
        resultVideo: getGeneratedResultForSetup(prev.setup),
        isProcessing: false,
        runMeta: makeRunMeta('done', null, null),
      }));

      addMessage({ type: 'video-gen-status', content: '🎉 所有任务已完成！复刻视频已生成，请在右侧面板查看和下载。' });
    })();
  }, [addMessage, updateTask, addTaskLog, updateChild, updateAgent, updateAgentInMessages]);

  // Update prompt
  const updatePrompt = useCallback((prompt: string) => {
    setState(prev => ({ ...prev, generatedPrompt: prompt }));
  }, []);

  // Refresh candidates
  const refreshCandidates = useCallback(() => {
    setState(prev => ({ ...prev, isProcessing: true }));
    const newVideos = getReferenceVideosForSetup(state.setup);
    const timer = window.setTimeout(() => {
      setState(prev => ({
        ...prev,
        candidateVideos: newVideos,
        isProcessing: false,
      }));
      streamText('🔄 已更新候选视频列表，请重新选择。');
    }, 1500);
    streamTimers.current.push(timer);
  }, [state.setup, streamText]);

  // Back to video select
  const backToVideoSelect = useCallback(() => {
    clearTimers();
    setState(prev => ({
      ...prev,
      generatedPrompt: '',
      resultVideo: null,
      selectedVideo: null,
      isProcessing: false,
      activeRightView: 'agents',
      activeAgentTab: '01',
      // Reset agents 02-04
      agents: prev.agents.map(a => {
        if (['agent-02', 'agent-03', 'agent-04'].includes(a.id)) {
          return { ...a, status: 'idle' as const, progress: 0, statusText: '等待启动' };
        }
        return a;
      }),
      // Remove phase 2/3 messages
      messages: prev.messages.filter(m =>
        !(m.type === 'selection-confirm') &&
        !(m.type === 'read-checklist') &&
        !(m.type === 'read-memory') &&
        !(m.type === 'create-agent' && m.content.includes('记忆库')) &&
        !(m.type === 'create-agent' && m.content.includes('视频生成')) &&
        !(m.type === 'agent-cluster' && m.agents?.some(a => ['agent-02', 'agent-03', 'agent-04'].includes(a.id))) &&
        !(m.type === 'video-gen-status' && (m.content.includes('Prompt') || m.content.includes('🎉')))
      ),
      tasks: prev.tasks.map(t => {
        if (['task-memory', 'task-reverse-prompt', 'task-generate-video'].includes(t.id)) {
          return { ...t, status: 'queued' as TaskStatus, progress: 0, startAt: undefined, endAt: undefined, output: undefined, logs: [], children: t.children.map(c => ({ ...c, status: 'queued' as TaskStatus, progress: 0 })) };
        }
        return t;
      }),
      checklistDone: [true, false, false, false],
      runMeta: makeRunMeta('awaiting_select', 'select_video', null),
    }));
  }, []);

  // Regenerate
  const regenerate = useCallback(() => {
    clearTimers();
    setState(prev => ({
      ...prev,
      resultVideo: null,
      isProcessing: false,
      activeRightView: 'agents',
      activeAgentTab: '04',
      agents: prev.agents.map(a => a.id === 'agent-04' ? { ...a, status: 'idle' as const, progress: 0, statusText: '等待启动' } : a),
      messages: prev.messages.filter(m =>
        !(m.type === 'agent-cluster' && m.agents?.some(a => a.id === 'agent-04')) &&
        !(m.type === 'create-agent' && m.content.includes('视频生成')) &&
        !(m.type === 'read-checklist' && prev.messages.indexOf(m) > prev.messages.length - 5) &&
        !(m.type === 'video-gen-status' && m.content.includes('🎉'))
      ),
      tasks: prev.tasks.map(t => t.id === 'task-generate-video' ? {
        ...t, status: 'queued' as TaskStatus, progress: 0, startAt: undefined, endAt: undefined, output: undefined, logs: [],
        children: t.children.map(c => ({ ...c, status: 'queued' as TaskStatus, progress: 0 })),
      } : t),
      checklistDone: [true, true, true, false],
      runMeta: makeRunMeta('phase3', null, Date.now() + PHASE3_MS),
    }));
    const timer = window.setTimeout(() => confirmGenerate(), 300);
    streamTimers.current.push(timer);
  }, [confirmGenerate]);

  const setActiveTaskId = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, activeTaskId: id }));
  }, []);

  const setActiveRightView = useCallback((view: SkillsState['activeRightView'], agentTab?: SkillsState['activeAgentTab']) => {
    setState(prev => ({ ...prev, activeRightView: view, ...(agentTab ? { activeAgentTab: agentTab } : {}) }));
  }, []);

  const handleUserInput = useCallback((text: string) => {
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, { id: `msg-user-${Date.now()}`, type: 'text', content: `👤 ${text}` }],
    }));
    const lower = text.toLowerCase();
    if (lower.includes('换一批') || lower.includes('refresh')) {
      refreshCandidates();
    } else {
      streamText(`收到指令「${text}」，正在处理中...`, () => {
        const timer = window.setTimeout(() => {
          streamText('✅ 已完成处理。还有其他需要调整的吗？');
        }, 1500);
        streamTimers.current.push(timer);
      });
    }
  }, [refreshCandidates, streamText]);

  const resetSession = useCallback(() => {
    clearTimers();
    setState({
      sessionId: `session-${Date.now()}`,
      setupCompleted: false,
      setup: { image: null, imageName: null, memoryEnabled: true, selectedMemoryIds: [], selectedCreatorIds: [], sellingPoints: '', category: '' },
      uiMode: 'single',
      activeTaskId: null,
      tasks: [],
      messages: [],
      candidateVideos: [],
      selectedVideo: null,
      generatedPrompt: '',
      resultVideo: null,
      isProcessing: false,
      runMeta: null,
      agents: [...initialAgents],
      activeRightView: 'none',
      checklistItems: [],
      checklistDone: [],
    });
  }, []);

  /**
   * Restore a snapshot. If a phase was actively running (timers now lost),
   * fast-forward that phase to completion so the user can continue.
   */
  const restoreState = useCallback((snapshot: SkillsState) => {
    clearTimers();

    const nowTs = Date.now();
    const meta = snapshot.runMeta;
    let restoreCounter = 0;
    const makeRestoreId = (suffix: string) => `msg-restore-${suffix}-${Date.now()}-${restoreCounter++}`;

    const normalizeMessages = (base: SkillsState): StreamMessage[] => {
      const baseMessages = [...base.messages];
      const hasAgentCluster = (agentId: string) =>
        baseMessages.some(m => m.type === 'agent-cluster' && m.agents?.some(a => a.id === agentId));
      const hasCreateAgent = (predicate: (m: StreamMessage) => boolean) =>
        baseMessages.some(m => m.type === 'create-agent' && predicate(m));

      const agent01 = base.agents.find(a => a.id === 'agent-01');
      const agent02 = base.agents.find(a => a.id === 'agent-02');
      const agent03 = base.agents.find(a => a.id === 'agent-03');
      const agent04 = base.agents.find(a => a.id === 'agent-04');

      const phase2Ready =
        !!base.selectedVideo ||
        base.runMeta?.phase === 'phase2' ||
        base.runMeta?.awaitingAction === 'confirm_prompt' ||
        !!base.generatedPrompt ||
        base.runMeta?.phase === 'phase3' ||
        base.runMeta?.phase === 'done' ||
        !!base.resultVideo;

      const phase3Ready =
        base.runMeta?.phase === 'phase3' ||
        base.runMeta?.phase === 'done' ||
        !!base.resultVideo ||
        base.agents.find(a => a.id === 'agent-04')?.status === 'running';

      const shouldShowSelect = base.candidateVideos.length > 0 && !base.selectedVideo && !base.generatedPrompt;
      const shouldShowPrompt = !!base.generatedPrompt;
      const shouldShowFinal = !!base.resultVideo;

      const pickFirst = (predicate: (m: StreamMessage) => boolean) => baseMessages.find(predicate) || null;

      const flow: StreamMessage[] = [];
      const push = (m: StreamMessage | null) => { if (m) flow.push(m); };

      push(pickFirst(m => m.type === 'setup-summary') || {
        id: makeRestoreId('setup-summary'),
        type: 'setup-summary',
        content: JSON.stringify(base.setup),
      });
      push(pickFirst(m => m.type === 'checklist') || {
        id: makeRestoreId('checklist'),
        type: 'checklist',
        content: '',
      });
      push(
        pickFirst(m => m.type === 'create-agent' && (m.agentNames?.some(n => n.avatar === 'search') || (m.content || '').includes('TikTok')))
          || (agent01 ? {
            id: makeRestoreId('create-agent-01'),
            type: 'create-agent',
            content: '创建TikTok爆款专家代理',
            agentNames: [{ name: agent01.name, avatar: agent01.avatar }],
          } : null)
      );
      push(
        pickFirst(m => m.type === 'agent-cluster' && m.agents?.some(a => a.id === 'agent-01'))
          || (agent01 && !hasAgentCluster('agent-01')
            ? { id: makeRestoreId('agent-cluster-01'), type: 'agent-cluster', content: '', agents: [agent01] }
            : null)
      );

      if (shouldShowSelect) {
        push(
          pickFirst(m => m.type === 'video-gen-status' && m.content.includes('对标视频')) || {
            id: makeRestoreId('select-video'),
            type: 'video-gen-status',
            content: '请从右侧面板选择一条对标视频进行复刻 →',
          }
        );
      }

      if (base.selectedVideo) {
        push(
          pickFirst(m => m.type === 'selection-confirm') || {
            id: makeRestoreId('selection-confirm'),
            type: 'selection-confirm',
            content: `已选择“${base.selectedVideo.title}”作为对标视频，现在为你生成专属爆款视频Prompt。`,
          }
        );
      }

      if (phase2Ready) {
        push(pickFirst(m => m.type === 'read-checklist') || {
          id: makeRestoreId('read-checklist-1'),
          type: 'read-checklist',
          content: '读取待办清单',
        });

        if (base.setup.memoryEnabled && base.setup.selectedMemoryIds.length > 0) {
          for (const memId of base.setup.selectedMemoryIds) {
            push(
              pickFirst(m => m.type === 'read-memory' && m.memoryId === memId) || {
                id: makeRestoreId(`read-memory-${memId}`),
                type: 'read-memory',
                content: '',
                memoryId: memId,
              }
            );
          }
        }

        push(
          pickFirst(m => m.type === 'create-agent' && (m.agentNames?.some(n => n.avatar === 'memory') || m.agentNames?.some(n => n.avatar === 'strategist')))
            || (agent02 && agent03 ? {
              id: makeRestoreId('create-agent-02-03'),
              type: 'create-agent',
              content: '创建记忆库信息和Prompt设计专家代理',
              agentNames: [
                { name: agent02.name, avatar: agent02.avatar },
                { name: agent03.name, avatar: agent03.avatar },
              ],
            } : null)
        );
        push(
          pickFirst(m => m.type === 'agent-cluster' && m.agents?.some(a => a.id === 'agent-02' || a.id === 'agent-03'))
            || (agent02 && agent03 && !hasAgentCluster('agent-02') && !hasAgentCluster('agent-03')
              ? { id: makeRestoreId('agent-cluster-02-03'), type: 'agent-cluster', content: '', agents: [agent02, agent03] }
              : null)
        );
        if (shouldShowPrompt) {
          push(
            pickFirst(m => m.type === 'video-gen-status' && m.content.includes('Prompt')) || {
              id: makeRestoreId('prompt-ready'),
              type: 'video-gen-status',
              content: '✅ Prompt已生成，请在右侧面板查看和编辑，确认后生成视频 →',
            }
          );
        }
      }

      if (phase3Ready) {
        const readChecklists = baseMessages.filter(m => m.type === 'read-checklist');
        push(readChecklists[1] || {
          id: makeRestoreId('read-checklist-2'),
          type: 'read-checklist',
          content: '读取待办清单',
        });
        push(
          pickFirst(m => m.type === 'create-agent' && m.agentNames?.some(n => n.avatar === 'video'))
            || (agent04 ? {
              id: makeRestoreId('create-agent-04'),
              type: 'create-agent',
              content: '创建视频生成专家代理',
              agentNames: [{ name: agent04.name, avatar: agent04.avatar }],
            } : null)
        );
        push(
          pickFirst(m => m.type === 'agent-cluster' && m.agents?.some(a => a.id === 'agent-04'))
            || (agent04 && !hasAgentCluster('agent-04')
              ? { id: makeRestoreId('agent-cluster-04'), type: 'agent-cluster', content: '', agents: [agent04] }
              : null)
        );
        if (shouldShowFinal) {
          push(
            pickFirst(m => m.type === 'video-gen-status' && m.content.includes('所有任务已完成')) || {
              id: makeRestoreId('final'),
              type: 'video-gen-status',
              content: '🎉 所有任务已完成！复刻视频已生成，请在右侧面板查看和下载。',
            }
          );
        }
      }

      const flowIds = new Set(flow.map(m => m.id));
      const extras = baseMessages.filter(m => !flowIds.has(m.id));
      // Remove invalid terminal messages
      const filteredExtras = extras.filter((m) => {
        if (m.type === 'video-gen-status' && m.content.includes('所有任务已完成')) return shouldShowFinal;
        if (m.type === 'video-gen-status' && m.content.includes('Prompt')) return shouldShowPrompt;
        if (m.type === 'video-gen-status' && m.content.includes('对标视频')) return shouldShowSelect;
        if (m.type === 'selection-confirm') return !!base.selectedVideo;
        return true;
      });

      return [...flow, ...filteredExtras];
    };
    const normalizeProgress = (base: SkillsState): SkillsState => {
      if (!base.tasks || base.tasks.length === 0) return base;

      const setTask = (task: SkillTask, status: TaskStatus, childStatus: TaskStatus) => ({
        ...task,
        status,
        progress: status === 'done' ? 100 : status === 'running' ? 50 : task.progress,
        children: task.children.map(c => ({ ...c, status: childStatus, progress: childStatus === 'done' ? 100 : childStatus === 'running' ? 50 : c.progress })),
      });

      let tasks = base.tasks.map(t => t);
      let agents = [...base.agents];
      const checklistDone = [...base.checklistDone];

      if (base.candidateVideos.length > 0 || base.runMeta?.awaitingAction === 'select_video') {
        tasks = tasks.map(t => t.id === 'task-crawl' ? setTask(t, 'done', 'done') : t);
        agents = agents.map(a => a.id === 'agent-01' ? { ...a, status: 'done', progress: 100 } : a);
        checklistDone[0] = true;
      }

      if (base.generatedPrompt || base.runMeta?.awaitingAction === 'confirm_prompt') {
        tasks = tasks.map(t => t.id === 'task-memory' ? setTask(t, base.setup.memoryEnabled ? 'done' : 'skipped', base.setup.memoryEnabled ? 'done' : 'skipped') : t);
        tasks = tasks.map(t => t.id === 'task-reverse-prompt' ? setTask(t, 'done', 'done') : t);
        agents = agents.map(a => a.id === 'agent-02' ? { ...a, status: base.setup.memoryEnabled ? 'done' : 'skipped', progress: base.setup.memoryEnabled ? 100 : 0 } : a);
        agents = agents.map(a => a.id === 'agent-03' ? { ...a, status: 'done', progress: 100 } : a);
        checklistDone[1] = true;
        checklistDone[2] = true;
      } else if (base.runMeta?.phase === 'phase2') {
        tasks = tasks.map(t => t.id === 'task-memory' ? setTask(t, base.setup.memoryEnabled ? 'running' : 'skipped', base.setup.memoryEnabled ? 'running' : 'skipped') : t);
        tasks = tasks.map(t => t.id === 'task-reverse-prompt' ? setTask(t, 'running', 'running') : t);
      }

      if (base.resultVideo) {
        tasks = tasks.map(t => t.id === 'task-generate-video' ? setTask(t, 'done', 'done') : t);
        agents = agents.map(a => a.id === 'agent-04' ? { ...a, status: 'done', progress: 100 } : a);
        checklistDone[3] = true;
      } else if (base.runMeta?.phase === 'phase3') {
        tasks = tasks.map(t => t.id === 'task-generate-video' ? setTask(t, 'running', 'running') : t);
      }

      return { ...base, tasks, agents, checklistDone };
    };
    const normalizeTasks = (base: SkillsState): SkillTask[] => {
      if (!base.tasks || base.tasks.length === 0) return base.tasks;
      const extractNumber = (text: string, pattern: RegExp, fallback: number) => {
        const match = text.match(pattern);
        if (!match) return fallback;
        const num = Number(match[1]);
        return Number.isFinite(num) ? num : fallback;
      };

      const withExpectedLogs = (task: SkillTask, expected: Array<{ key: string; message: string }>) => {
        const logs = task.logs && task.logs.length > 0 ? [...task.logs] : [];
        const hasLog = (key: string) => logs.some(l => l.message.includes(key));
        if (task.status === 'queued' && task.children.every(c => c.status === 'queued')) {
          return task;
        }
        for (const item of expected) {
          if (!hasLog(item.key)) {
            logs.push({ time: now(), message: item.message });
          }
        }
        return { ...task, logs };
      };

      return base.tasks.map((task) => {
        if (task.id === 'task-crawl') {
          const existingText = (task.logs || []).map(l => l.message).join(' ');
          const crawlCount = extractNumber(task.output || existingText, /(\d+)\s*条/, base.candidateVideos.length > 0 ? base.candidateVideos.length : 200);
          const matchRate = extractNumber(existingText, /匹配度\s*([0-9.]+)%/, 51.8);
          const highMatchCount = extractNumber(existingText, /高匹配\s*(\d+)\s*条/, 17);
          return withExpectedLogs(task, [
            { key: '启动 TikTok 爬虫', message: 'TikTok爆款专家启动 TikTok 爬虫...' },
            { key: '完成抓取', message: `爬虫专家完成抓取 → 共获取 ${crawlCount} 条视频数据` },
            { key: '正在分析卖点匹配度', message: '数据专家正在分析卖点匹配度...' },
            { key: '完成分析', message: `数据专家完成分析 → 平均匹配度 ${matchRate}%，高匹配 ${highMatchCount} 条` },
            { key: '完成排序', message: '策略专家完成排序 → Top 6候选已生成' },
            { key: '完成封面提取', message: '视频专家完成封面提取 → 6张高清封面已缓存' },
          ]);
        }

        if (task.id === 'task-memory') {
          if (!base.setup.memoryEnabled) return task;
          const existingText = (task.logs || []).map(l => l.message).join(' ');
          const memoryCount = base.setup.selectedMemoryIds.length > 0 ? base.setup.selectedMemoryIds.length : 4;
          const vectorDim = extractNumber(existingText, /生成\s*(\d+)\s*维/, 32);
          return withExpectedLogs(task, [
            { key: '正在连接记忆库', message: '记忆专家正在连接记忆库...' },
            { key: '完成连接记忆库', message: '记忆专家完成连接记忆库 → 已建立安全连接' },
            { key: '完成检索', message: `检索专家完成检索 → 命中 ${memoryCount} 条相关记忆` },
            { key: '完成构建上下文向量', message: `数据专家完成构建上下文向量 → 生成 ${vectorDim} 维特征向量` },
          ]);
        }

        if (task.id === 'task-reverse-prompt') {
          const existingText = (task.logs || []).map(l => l.message).join(' ');
          const keyFrames = extractNumber(existingText, /提取\s*(\d+)\s*个关键帧/, 38);
          return withExpectedLogs(task, [
            { key: '开始分析视频内容', message: '开始分析视频内容...' },
            { key: '完成视频帧分析', message: `视频专家完成视频帧分析 → 提取 ${keyFrames} 个关键帧` },
            { key: '完成风格特征提取', message: '设计专家完成风格特征提取' },
            { key: '完成提示词生成', message: '策略专家完成提示词生成 → 包含镜头、节奏、结构等 6 个维度' },
          ]);
        }

        if (task.id === 'task-generate-video') {
          return withExpectedLogs(task, [
            { key: '开始渲染视频', message: '开始渲染视频...' },
            { key: '渲染场景', message: '设计专家渲染场景' },
            { key: '完成场景渲染', message: '设计专家完成场景渲染' },
            { key: '正在合成音频', message: '音频专家正在合成音频...' },
            { key: '完成音频合成', message: '音频专家完成音频合成 → BGM 节拍同步' },
            { key: '正在合成视频', message: '视频专家正在合成视频...' },
            { key: '完成视频合成', message: '视频专家完成视频合成' },
            { key: '质量检测通过', message: '质量检测通过' },
          ]);
        }

        return task;
      });
    };
    const commitState = (next: SkillsState) => {
      const withProgress = normalizeProgress(next);
      setState({ ...withProgress, tasks: normalizeTasks(withProgress), messages: normalizeMessages(withProgress) });
    };

    const ensureSelectMessage = (messages: StreamMessage[]) => {
      const exists = messages.some(m => m.type === 'video-gen-status' && m.content.includes('对标视频'));
      if (exists) return messages;
      return [
        ...messages,
        { id: `msg-restore-pick-${Date.now()}`, type: 'video-gen-status', content: '请从右侧面板选择一条对标视频进行复刻 →' },
      ];
    };

    const ensurePromptMessage = (messages: StreamMessage[]) => {
      const exists = messages.some(m => m.type === 'video-gen-status' && m.content.includes('Prompt已生成'));
      if (exists) return messages;
      return [
        ...messages,
        { id: `msg-restore-prompt-${Date.now()}`, type: 'video-gen-status', content: '✅ Prompt已生成，请在右侧面板查看和编辑，确认后生成视频 →' },
      ];
    };

    const ensureReadMemoryMessages = (messages: StreamMessage[]) => {
      if (!snapshot.setup.memoryEnabled || snapshot.setup.selectedMemoryIds.length === 0) return messages;
      const existingIds = new Set(
        messages.filter(m => m.type === 'read-memory' && m.memoryId).map(m => m.memoryId as string)
      );
      const additions: StreamMessage[] = [];
      for (const memId of snapshot.setup.selectedMemoryIds) {
        if (!existingIds.has(memId)) {
          additions.push({ id: `msg-restore-mem-${memId}-${Date.now()}`, type: 'read-memory', content: '', memoryId: memId });
        }
      }
      if (additions.length === 0) return messages;
      return [...messages, ...additions];
    };

    const ensureFinalMessage = (messages: StreamMessage[]) => {
      const exists = messages.some(m => m.type === 'video-gen-status' && m.content.includes('所有任务已完成'));
      if (exists) return messages;
      return [
        ...messages,
        { id: `msg-restore-final-${Date.now()}`, type: 'video-gen-status', content: '🎉 所有任务已完成！复刻视频已生成，请在右侧面板查看和下载。' },
      ];
    };

    const buildMockPrompt = (base: SkillsState, title: string) => `【爆款复刻Prompt】\n\n镜头风格：近景特写 + 俯拍切换，暖色调滤镜\n节奏：快节奏剪辑，BGM 节拍同步\n内容结构：\n1. 开场- 产品白底展示，旋转360°（0-3s）\n2. 使用场景 - 手部特写展示质感（3-8s）\n3. 效果对比 - 使用前后对比（8-15s）\n4. 口播种草 - 真人出镜，口述卖点（15-25s）\n5. 结尾 CTA - 点击链接，限时优惠（25-30s）\n\n关键词：${base.setup.sellingPoints.slice(0, 30)}\n品类：${base.setup.category}\n参考来源：${title}`;

    const fastForwardToSelect = (base: SkillsState) => {
      const videos = base.candidateVideos.length > 0 ? base.candidateVideos : getReferenceVideosForSetup(base.setup);
      commitState({
        ...base,
        isProcessing: false,
        candidateVideos: videos,
        activeRightView: 'agents',
        activeAgentTab: '01',
        checklistDone: [true, ...base.checklistDone.slice(1)],
        runMeta: makeRunMeta('awaiting_select', 'select_video', null),
        agents: base.agents.map(a =>
          a.id === 'agent-01'
            ? { ...a, status: 'done' as const, progress: 100, statusText: '已完成爆款视频匹配，请选择对标视频' }
            : a.status === 'running' ? { ...a, status: 'done' as const } : a
        ),
        messages: ensureSelectMessage(
          base.messages.map(m => {
            if (m.type === 'agent-cluster' && m.agents) {
              return { ...m, agents: m.agents.map(a => a.id === 'agent-01' ? { ...a, status: 'done' as const, progress: 100, statusText: '已完成爆款视频匹配，请选择对标视频' } : a) };
            }
            return m;
          })
        ),
      });
    };

    const fastForwardToPrompt = (base: SkillsState) => {
      const prompt = base.generatedPrompt || buildPromptForSelectedVideo(base.setup, base.selectedVideo);
      commitState({
        ...base,
        isProcessing: false,
        generatedPrompt: prompt,
        checklistDone: [true, true, true, false],
        runMeta: makeRunMeta('awaiting_confirm', 'confirm_prompt', null),
        agents: base.agents.map(a => {
          if (a.id === 'agent-02') return { ...a, status: 'done' as const, progress: 100, statusText: '已完成记忆库构建' };
          if (a.id === 'agent-03') return { ...a, status: 'done' as const, progress: 100, statusText: '已完成Prompt设计' };
          return a.status === 'running' ? { ...a, status: 'done' as const } : a;
        }),
        messages: ensurePromptMessage(
          ensureReadMemoryMessages(
            base.messages.map(m => {
              if (m.type === 'agent-cluster' && m.agents) {
                return { ...m, agents: m.agents.map(a => a.status === 'running' ? { ...a, status: 'done' as const, progress: 100 } : a) };
              }
              return m;
            })
          )
        ),
      });
    };

    const fastForwardToResult = (base: SkillsState) => {
      commitState({
        ...base,
        isProcessing: false,
        resultVideo: getGeneratedResultForSetup(base.setup),
        checklistDone: [true, true, true, true],
        runMeta: makeRunMeta('done', null, null),
        agents: base.agents.map(a =>
          a.id === 'agent-04'
            ? { ...a, status: 'done' as const, progress: 100, statusText: '视频生成完成！' }
            : a.status === 'running' ? { ...a, status: 'done' as const } : a
        ),
        messages: ensureFinalMessage(
          base.messages.map(m => {
            if (m.type === 'agent-cluster' && m.agents) {
              return { ...m, agents: m.agents.map(a => a.status === 'running' ? { ...a, status: 'done' as const, progress: 100 } : a) };
            }
            return m;
          })
        ),
      });
    };

    const scheduleFastForward = (phase: SkillsRunPhase, remainingMs: number) => {
      const timer = window.setTimeout(() => {
        if (phase === 'phase1') fastForwardToSelect(snapshot);
        if (phase === 'phase2') fastForwardToPrompt(snapshot);
        if (phase === 'phase3') fastForwardToResult(snapshot);
      }, Math.max(0, remainingMs));
      streamTimers.current.push(timer);
    };

    if (meta) {
      if (meta.phase === 'done') {
        commitState({ ...snapshot, isProcessing: false });
        return;
      }
      if (meta.awaitingAction === 'select_video') {
        commitState({ ...snapshot, isProcessing: false });
        return;
      }
      if (meta.awaitingAction === 'confirm_prompt') {
        commitState({ ...snapshot, isProcessing: false });
        return;
      }
      if ((meta.phase === 'phase1' || meta.phase === 'phase2' || meta.phase === 'phase3') && meta.nextActionAt) {
        const remaining = meta.nextActionAt - nowTs;
        if (remaining <= 0) {
          if (meta.phase === 'phase1') fastForwardToSelect(snapshot);
          if (meta.phase === 'phase2') fastForwardToPrompt(snapshot);
          if (meta.phase === 'phase3') fastForwardToResult(snapshot);
          return;
        }
        commitState({ ...snapshot, isProcessing: true });
        scheduleFastForward(meta.phase, remaining);
        return;
      }
    }

    // Determine which phase was active
    const hasResult = !!snapshot.resultVideo;
    const hasPrompt = !!snapshot.generatedPrompt;
    const hasSelected = !!snapshot.selectedVideo;
    const hasCandidates = snapshot.candidateVideos.length > 0;
    const agent04Running = snapshot.agents.find(a => a.id === 'agent-04')?.status === 'running';

    // Already completed – just restore
    if (hasResult) {
      commitState({ ...snapshot, isProcessing: false, runMeta: makeRunMeta('done', null, null) });
      return;
    }

    // Phase 3 was running (agent 04) → fast-forward to done
    if (hasPrompt && agent04Running) {
      commitState({
        ...snapshot,
        isProcessing: false,
        resultVideo: getGeneratedResultForSetup(snapshot.setup),
        checklistDone: [true, true, true, true],
        runMeta: makeRunMeta('done', null, null),
        agents: snapshot.agents.map(a =>
          a.id === 'agent-04'
            ? { ...a, status: 'done' as const, progress: 100, statusText: '视频生成完成！' }
            : a.status === 'running' ? { ...a, status: 'done' as const } : a
        ),
        messages: snapshot.messages.map(m => {
          if (m.type === 'agent-cluster' && m.agents) {
            return { ...m, agents: m.agents.map(a => a.status === 'running' ? { ...a, status: 'done' as const, progress: 100 } : a) };
          }
          return m;
        }),
      });
      return;
    }

    // Has prompt, waiting for user confirm → just restore
    if (hasPrompt) {
      commitState({
        ...snapshot,
        isProcessing: false,
        runMeta: makeRunMeta('awaiting_confirm', 'confirm_prompt', null),
        agents: snapshot.agents.map(a => a.status === 'running' ? { ...a, status: 'done' as const } : a),
        messages: ensureReadMemoryMessages(
          snapshot.messages.map(m => {
            if (m.type === 'agent-cluster' && m.agents) {
              return { ...m, agents: m.agents.map(a => a.status === 'running' ? { ...a, status: 'done' as const } : a) };
            }
            return m;
          })
        ),
      });
      return;
    }

    // Phase 2 was running (selected video, no prompt yet) → fast-forward to prompt generated
    if (hasSelected && !hasPrompt) {
      const mockPrompt = `【爆款复刻 Prompt】\n\n镜头风格：近景特写 + 俯拍切换，暖色调滤镜\n节奏：快节奏剪辑，BGM 节拍同步\n内容结构：\n1. 开场 - 产品白底展示，旋转 360°（0-3s）\n2. 使用场景 - 手部特写展示质感（3-8s）\n3. 效果对比 - 使用前后对比（8-15s）\n4. 口播种草 - 真人出镜，口述卖点（15-25s）\n5. 结尾 CTA - 点击链接，限时优惠（25-30s）\n\n关键词：${snapshot.setup.sellingPoints.slice(0, 30)}\n品类：${snapshot.setup.category}\n参考来源：${snapshot.selectedVideo?.title || ''}`;
      const resolvedPrompt = buildPromptForSelectedVideo(snapshot.setup, snapshot.selectedVideo);

      commitState({
        ...snapshot,
        isProcessing: false,
        generatedPrompt: resolvedPrompt,
        checklistDone: [true, true, true, false],
        runMeta: makeRunMeta('awaiting_confirm', 'confirm_prompt', null),
        agents: snapshot.agents.map(a => {
          if (a.id === 'agent-02') return { ...a, status: 'done' as const, progress: 100, statusText: '已完成记忆库构建' };
          if (a.id === 'agent-03') return { ...a, status: 'done' as const, progress: 100, statusText: '已完成Prompt设计' };
          return a.status === 'running' ? { ...a, status: 'done' as const } : a;
        }),
        messages: [
          ...ensureReadMemoryMessages(
            snapshot.messages.map(m => {
              if (m.type === 'agent-cluster' && m.agents) {
                return { ...m, agents: m.agents.map(a => a.status === 'running' ? { ...a, status: 'done' as const, progress: 100 } : a) };
              }
              return m;
            })
          ),
          { id: `msg-restore-prompt-${Date.now()}`, type: 'video-gen-status' as const, content: '✅ Prompt已生成，请在右侧面板查看和编辑，确认后生成视频 →' },
        ],
      });
      return;
    }

    // Has candidates, waiting for user to pick → just restore
    if (hasCandidates && !hasSelected) {
      commitState({
        ...snapshot,
        isProcessing: false,
        runMeta: makeRunMeta('awaiting_select', 'select_video', null),
        agents: snapshot.agents.map(a => a.status === 'running' ? { ...a, status: 'done' as const } : a),
        messages: snapshot.messages.map(m => {
          if (m.type === 'agent-cluster' && m.agents) {
            return { ...m, agents: m.agents.map(a => a.status === 'running' ? { ...a, status: 'done' as const, progress: 100 } : a) };
          }
          return m;
        }),
      });
      return;
    }

    // Phase 1 was running (no candidates yet) → fast-forward to candidates generated
    if (snapshot.setupCompleted && !hasCandidates) {
      const videos = getReferenceVideosForSetup(snapshot.setup);
      commitState({
        ...snapshot,
        isProcessing: false,
        candidateVideos: videos,
        checklistDone: [true, false, false, false],
        activeRightView: 'agents',
        activeAgentTab: '01',
        runMeta: makeRunMeta('awaiting_select', 'select_video', null),
        agents: snapshot.agents.map(a =>
          a.id === 'agent-01'
            ? { ...a, status: 'done' as const, progress: 100, statusText: '已完成爆款视频匹配，请选择对标视频' }
            : a.status === 'running' ? { ...a, status: 'done' as const } : a
        ),
        messages: [
          ...snapshot.messages.map(m => {
            if (m.type === 'agent-cluster' && m.agents) {
              return { ...m, agents: m.agents.map(a => a.id === 'agent-01' ? { ...a, status: 'done' as const, progress: 100, statusText: '已完成爆款视频匹配，请选择对标视频' } : a) };
            }
            return m;
          }),
          { id: `msg-restore-pick-${Date.now()}`, type: 'video-gen-status' as const, content: '请从右侧面板选择一条对标视频进行复刻 →' },
        ],
      });
      return;
    }

    // Fallback: just restore
    commitState({ ...snapshot, isProcessing: false });
  }, []);

  return {
    state,
    CATEGORIES: [...CATEGORIES, '美妆护肤 · K-beauty 功效护肤'],
    completeSetup,
    refreshCandidates,
    selectVideo,
    updatePrompt,
    confirmGenerate,
    regenerate,
    backToVideoSelect,
    setActiveTaskId,
    setActiveRightView,
    handleUserInput,
    resetSession,
    restoreState,
  };
}
