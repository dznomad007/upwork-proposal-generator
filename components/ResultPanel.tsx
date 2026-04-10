"use client";

import { useState } from "react";
import CoverLetter from "./CoverLetter";
import FitScore from "./FitScore";
import KeyPoints from "./KeyPoints";
import RateGuide from "./RateGuide";
import type { AnalysisResult } from "@/types";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

interface Props {
  result: AnalysisResult;
  lang: Lang;
}

type Tab = "cover" | "fit" | "points" | "rate";

export default function ResultPanel({ result, lang }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("cover");

  const TABS: { id: Tab; label: string }[] = [
    { id: "cover",  label: t("tabCover",  lang) },
    { id: "fit",    label: t("tabFit",    lang) },
    { id: "points", label: t("tabPoints", lang) },
    { id: "rate",   label: t("tabRate",   lang) },
  ];

  const scoreUnit = t("scoreUnit", lang);
  const countSuffix = t("itemsCount", lang);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* 탭 헤더 */}
      <div className="flex border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-blue-700 border-b-2 border-blue-600 bg-blue-50/50"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            {tab.id === "fit"
              ? `${t("tabFit", lang)} ${result.fitScore.overall}${scoreUnit}`
              : tab.label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div className="p-6">
        {activeTab === "cover"  && <CoverLetter text={result.coverLetter} />}
        {activeTab === "fit"    && <FitScore fitScore={result.fitScore} lang={lang} />}
        {activeTab === "points" && <KeyPoints keyPoints={result.keyPoints} lang={lang} />}
        {activeTab === "rate"   && <RateGuide rateGuide={result.rateGuide} lang={lang} />}
      </div>

      {/* 하단: 신뢰도 + 가정/누락 정보 */}
      <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-500">{t("aiConfidence", lang)}</span>
          <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-32">
            <div
              className={`h-1.5 rounded-full ${
                result.confidence >= 70
                  ? "bg-green-500"
                  : result.confidence >= 40
                    ? "bg-amber-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${result.confidence}%` }}
            />
          </div>
          <span className="text-xs text-gray-600">{result.confidence}%</span>
        </div>

        {result.assumptions.length > 0 && (
          <details>
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
              {t("assumptions", lang)} ({result.assumptions.length}{countSuffix})
            </summary>
            <ul className="mt-1.5 space-y-0.5">
              {result.assumptions.map((a, i) => (
                <li key={i} className="text-xs text-gray-600">• {a}</li>
              ))}
            </ul>
          </details>
        )}

        {result.missingInfo.length > 0 && (
          <details>
            <summary className="text-xs text-amber-600 cursor-pointer hover:text-amber-700">
              ⚠ {t("missingInfo", lang)} ({result.missingInfo.length}{countSuffix})
            </summary>
            <ul className="mt-1.5 space-y-0.5">
              {result.missingInfo.map((m, i) => (
                <li key={i} className="text-xs text-amber-700">• {m}</li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}
