"use client";

import type { AnalysisResult } from "@/types";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

interface Props {
  rateGuide: AnalysisResult["rateGuide"];
  lang: Lang;
}

export default function RateGuide({ rateGuide, lang }: Props) {
  return (
    <div className="space-y-4">
      {/* 추천 금액 */}
      {(rateGuide.recommended || rateGuide.range) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs font-medium text-blue-600 mb-1">
            {rateGuide.type === "fixed" ? t("recommendedFixed", lang) : t("recommendedHourly", lang)}
          </p>
          {rateGuide.recommended && (
            <p className="text-3xl font-bold text-blue-700">
              ${rateGuide.recommended}
              {rateGuide.type === "hourly" && (
                <span className="text-base font-normal text-blue-500">/hr</span>
              )}
            </p>
          )}
          {rateGuide.range && (rateGuide.range.min || rateGuide.range.max) && (
            <p className="text-sm text-blue-600 mt-0.5">
              ${rateGuide.range.min ?? "?"}–${rateGuide.range.max ?? "?"}
              {rateGuide.type === "hourly" ? "/hr" : ` ${t("rangeFixed", lang)}`}
            </p>
          )}
        </div>
      )}

      {/* 전략 */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-700">{t("proposalStrategy", lang)}</p>
        <p className="text-sm text-gray-600 leading-relaxed">{rateGuide.strategy}</p>
      </div>

      {/* 근거 */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-700">{t("reasoning", lang)}</p>
        <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-md p-3 border border-gray-200">
          {rateGuide.reasoning}
        </p>
      </div>
    </div>
  );
}
