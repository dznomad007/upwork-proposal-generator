"use client";

import type { AnalysisResult } from "@/types";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

interface Props {
  fitScore: AnalysisResult["fitScore"];
  lang: Lang;
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color =
    value >= 70 ? "bg-green-500" : value >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="font-medium text-gray-800">{value}점</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default function FitScore({ fitScore, lang }: Props) {
  const overall = fitScore.overall;
  const color =
    overall >= 70 ? "text-green-600" : overall >= 40 ? "text-amber-600" : "text-red-600";
  const ringColor =
    overall >= 70 ? "stroke-green-500" : overall >= 40 ? "stroke-amber-500" : "stroke-red-500";

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (overall / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* 전체 점수 */}
      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg viewBox="0 0 88 88" className="w-full h-full -rotate-90">
            <circle cx="44" cy="44" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle
              cx="44"
              cy="44"
              r={radius}
              fill="none"
              className={ringColor}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${color}`}>{overall}</span>
            <span className="text-xs text-gray-400">/ 100</span>
          </div>
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-800">{t("overallFit", lang)}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {overall >= 70 ? t("fitHigh", lang) :
             overall >= 40 ? t("fitMid",  lang) :
                             t("fitLow",  lang)}
          </p>
        </div>
      </div>

      {/* 세부 점수 */}
      <div className="space-y-3">
        <ScoreBar label={t("skillMatch",   lang)} value={fitScore.breakdown.skills} />
        <ScoreBar label={t("expFit",       lang)} value={fitScore.breakdown.experience} />
        <ScoreBar label={t("availability", lang)} value={fitScore.breakdown.availability} />
      </div>

      {/* 스킬 매칭 */}
      <div className="grid grid-cols-2 gap-4">
        {fitScore.matchedSkills.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">{t("matchedSkills", lang)}</p>
            <div className="flex flex-wrap gap-1.5">
              {fitScore.matchedSkills.map((s) => (
                <span key={s} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
        {fitScore.missingSkills.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">{t("missingSkills", lang)}</p>
            <div className="flex flex-wrap gap-1.5">
              {fitScore.missingSkills.map((s) => (
                <span key={s} className="text-xs bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
