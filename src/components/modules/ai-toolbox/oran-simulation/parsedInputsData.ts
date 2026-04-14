import type { ParsedInputSection } from "./workflowTypes";

export const DEFAULT_PARSED_INPUTS: ParsedInputSection[] = [
  {
    title: "现实世界种子",
    fields: [
      { label: "品牌资产", value: "去屑科技 40 年积淀，ZPT 专利活性因子" },
      { label: "当前品牌认知", value: "功效强但缺乏情感联结，偏中老年心智" },
      { label: "市场趋势", value: "头皮护理赛道增速 23%，氨基酸/益生菌概念走高" },
      { label: "核心竞品", value: "清扬、阿道夫、Spes" },
      { label: "风险议题", value: "化学成分争议、动物实验敏感度" },
    ],
  },
  {
    title: "潜在触达用户画像",
    fields: [
      { label: "目标人群包", value: "18-35 岁城市白领 + 大学生" },
      { label: "年龄层", value: "18-24 (35%), 25-30 (40%), 31-35 (25%)" },
      { label: "兴趣圈层", value: "护肤/美妆、健身/运动、职场社交" },
      { label: "意向层级", value: "高意向 15%, 泛兴趣 45%, 观望 40%" },
      { label: "内容偏好", value: "短视频测评 > 成分科普 > KOL 种草" },
      { label: "平台分布", value: "抖音 55%, 小红书 35%, 其他 10%" },
    ],
  },
  {
    title: "营销活动策划",
    fields: [
      { label: "活动主题", value: "「头皮自由计划」春季去屑焕新季" },
      { label: "卖点方向", value: "长期安全有效 vs 高压场景头皮稳定在线" },
      { label: "内容形式", value: "情景短剧 + 成分解读 + 素人挑战赛" },
      { label: "节奏计划", value: "W1-2 预热 -> W3-6 爆发 -> W7-8 长尾" },
      { label: "KPI 目标", value: "曝光 500W+, 互动 15W+, 搜索提升 30%" },
    ],
  },
];

export function normalizeParsedInputs(
  value?: ParsedInputSection[] | null,
): ParsedInputSection[] {
  return DEFAULT_PARSED_INPUTS.map((section, sectionIndex) => ({
    title:
      typeof value?.[sectionIndex]?.title === "string"
        ? value[sectionIndex].title
        : section.title,
    fields: section.fields.map((field, fieldIndex) => ({
      label:
        typeof value?.[sectionIndex]?.fields?.[fieldIndex]?.label === "string"
          ? value[sectionIndex].fields[fieldIndex].label
          : field.label,
      value:
        typeof value?.[sectionIndex]?.fields?.[fieldIndex]?.value === "string"
          ? value[sectionIndex].fields[fieldIndex].value
          : field.value,
    })),
  }));
}
