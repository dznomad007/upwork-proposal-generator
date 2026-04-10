"use client";

import type { AnalysisResult } from "@/types";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

interface Props {
  keyPoints: AnalysisResult["keyPoints"];
  lang: Lang;
}

export default function KeyPoints({ keyPoints, lang }: Props) {
  const PRIORITY_CONFIG = {
    high:   { label: t("priorityHigh", lang), bg: "bg-red-50",   border: "border-red-200",   dot: "bg-red-500",   text: "text-red-700" },
    medium: { label: t("priorityMid",  lang), bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500", text: "text-amber-700" },
    low:    { label: t("priorityLow",  lang), bg: "bg-gray-50",  border: "border-gray-200",  dot: "bg-gray-400",  text: "text-gray-600" },
  };

  const sorted = [...keyPoints].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">{t("keyPointsHint", lang)}</p>
      {sorted.map((point, i) => {
        const cfg = PRIORITY_CONFIG[point.priority];
        return (
          <div
            key={i}
            className={`rounded-lg border p-4 ${cfg.bg} ${cfg.border}`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`} />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-800">{point.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{point.description}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
