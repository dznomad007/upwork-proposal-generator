"use client";

import type { JobPosting } from "@/types";

interface Props {
  job: JobPosting;
  missingInfo: string[];
  onJobChange: (job: JobPosting) => void;
}

export default function JobPreviewCard({ job, missingInfo, onJobChange }: Props) {
  const budgetText = job.budget
    ? job.budget.type === "hourly"
      ? `시간당 $${job.budget.min ?? "?"}–$${job.budget.max ?? "?"}`
      : job.budget.type === "fixed"
        ? `고정 $${job.budget.amount ?? job.budget.max ?? "?"}`
        : "예산 불명확"
    : "예산 정보 없음";

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">공고 구조화 완료</p>
          <h3 className="font-semibold text-gray-900 text-lg">{job.title}</h3>
        </div>
        <span className="text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-full whitespace-nowrap">
          {budgetText}
        </span>
      </div>

      {/* 스킬 태그 */}
      {job.requiredSkills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {job.requiredSkills.map((skill) => (
            <span
              key={skill}
              className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* 클라이언트 정보 */}
      {job.clientInfo && (
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          {job.clientInfo.location && (
            <span>📍 {job.clientInfo.location}</span>
          )}
          {job.clientInfo.rating && (
            <span>⭐ {job.clientInfo.rating.toFixed(1)}</span>
          )}
          {job.clientInfo.totalSpent && (
            <span>💰 총 지출 {job.clientInfo.totalSpent}</span>
          )}
          {job.clientInfo.paymentVerified && (
            <span className="text-green-600">✓ 결제 인증됨</span>
          )}
        </div>
      )}

      {/* 추가 정보 */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        {job.experienceLevel && <span>경력 수준: {job.experienceLevel}</span>}
        {job.projectLength && <span>기간: {job.projectLength}</span>}
        {job.weeklyHours && <span>주당 시간: {job.weeklyHours}</span>}
      </div>

      {/* 누락 정보 경고 */}
      {missingInfo.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
          <p className="text-sm font-medium text-amber-800 mb-1.5">
            ⚠ 누락/불명확한 정보
          </p>
          <ul className="space-y-0.5">
            {missingInfo.map((info, i) => (
              <li key={i} className="text-sm text-amber-700">
                • {info}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 설명 */}
      <details className="group">
        <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700 select-none">
          공고 설명 보기
        </summary>
        <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
          {job.description}
        </p>
      </details>

      {/* 스킬 수정 */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          필요 스킬 수정 (쉼표로 구분)
        </label>
        <input
          type="text"
          value={job.requiredSkills.join(", ")}
          onChange={(e) =>
            onJobChange({
              ...job,
              requiredSkills: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
