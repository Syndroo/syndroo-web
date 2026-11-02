import type { Locale } from "@syndroo/content/site-data";

const CHINESE_LABELS: Record<string, string> = {
  terminal: "终端",
  "agent prompt": "智能体提示词",
  callback: "回调地址",
  usage: "用法",
  success: "成功",
  failure: "失败",
  envelope: "信封",
  "connect result": "连接结果",
  "prepared result": "准备结果",
  "execution result": "执行结果",
  "retry and confirm": "重试并确认",
};

/** Translate prose labels only; filenames and CLI tokens pass through. */
export function localizeCodeLabel(locale: Locale, label: string): string {
  return locale === "zh" ? (CHINESE_LABELS[label] ?? label) : label;
}
