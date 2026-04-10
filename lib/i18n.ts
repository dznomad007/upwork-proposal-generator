export type Lang = "ko" | "en";

const dict = {
  // ResultPanel tabs
  tabCover:   { ko: "커버레터",    en: "Cover Letter" },
  tabFit:     { ko: "적합도",      en: "Fit Score" },
  tabPoints:  { ko: "강조 포인트", en: "Key Points" },
  tabRate:    { ko: "견적 가이드", en: "Rate Guide" },

  // ResultPanel footer
  aiConfidence:   { ko: "AI 신뢰도",  en: "AI Confidence" },
  assumptions:    { ko: "AI 가정 사항", en: "AI Assumptions" },
  missingInfo:    { ko: "누락 정보",   en: "Missing Info" },
  itemsCount:     { ko: "개",          en: "" },

  // FitScore
  overallFit:     { ko: "전체 적합도",   en: "Overall Fit" },
  fitHigh:        { ko: "높은 적합도 — 지원을 적극 권장합니다",                   en: "Strong match — highly recommended to apply" },
  fitMid:         { ko: "보통 적합도 — 강조 포인트를 잘 활용하세요",             en: "Moderate match — leverage your key points" },
  fitLow:         { ko: "낮은 적합도 — 부족한 스킬을 보완하거나 다른 공고를 고려하세요", en: "Weak match — consider strengthening skills or other postings" },
  skillMatch:     { ko: "스킬 매칭",   en: "Skill Match" },
  expFit:         { ko: "경력 적합도", en: "Experience" },
  availability:   { ko: "가용성",      en: "Availability" },
  matchedSkills:  { ko: "✓ 매칭된 스킬",  en: "✓ Matched Skills" },
  missingSkills:  { ko: "✗ 부족한 스킬",  en: "✗ Missing Skills" },
  scoreUnit:      { ko: "점",   en: "" },

  // KeyPoints
  keyPointsHint:  { ko: "커버레터 작성 시 강조할 포인트입니다.", en: "Points to emphasize in your cover letter." },
  priorityHigh:   { ko: "높음",  en: "High" },
  priorityMid:    { ko: "중간",  en: "Med" },
  priorityLow:    { ko: "낮음",  en: "Low" },

  // RateGuide
  recommendedHourly: { ko: "추천 시급",           en: "Recommended Rate" },
  recommendedFixed:  { ko: "추천 입찰가 (고정)",   en: "Recommended Bid (Fixed)" },
  rangeFixed:        { ko: "(고정)",  en: "(fixed)" },
  proposalStrategy:  { ko: "제안 전략", en: "Strategy" },
  reasoning:         { ko: "근거",      en: "Reasoning" },
} as const;

export type TransKey = keyof typeof dict;

export function t(key: TransKey, lang: Lang): string {
  return dict[key][lang];
}
