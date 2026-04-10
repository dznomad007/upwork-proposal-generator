"use client";

import { useRef, useState } from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import type { UserProfile } from "@/types";

interface Props {
  profile: UserProfile;
  onChange: (profile: UserProfile) => void;
  disabled?: boolean;
  onFileUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  isSaving: boolean;
  isDuplicate: boolean;
  uploadError: string | null;
}

export default function ProfileForm({
  profile,
  onChange,
  disabled,
  onFileUpload,
  isUploading,
  isSaving,
  isDuplicate,
  uploadError,
}: Props) {
  const { isSignedIn } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function update<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    onChange({ ...profile, [key]: value });
  }

  async function handleFile(file: File) {
    setUploadedFileName(file.name);
    await onFileUpload(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">내 프로필</h2>
        {isSaving && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
            저장 중...
          </span>
        )}
      </div>

      {/* 이력서 업로드 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          이력서 업로드 (PDF / DOCX)
        </label>
        {!isSignedIn ? (
          <SignInButton mode="modal">
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <p className="text-sm text-gray-400">
                이력서를 업로드하려면{" "}
                <span className="text-blue-600 font-medium">로그인</span>
                이 필요합니다
              </p>
            </div>
          </SignInButton>
        ) : (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors text-center
              ${isDragging ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"}
              ${isUploading ? "cursor-wait opacity-70" : ""}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
            />
            {isUploading ? (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                이력서 파싱 중...
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                드래그하거나 클릭하여 업로드
              </p>
            )}
          </div>
        )}

        {/* 상태 배지 */}
        {uploadedFileName && !isUploading && !uploadError && (
          <div className={`mt-2 flex items-center gap-1.5 text-xs px-2 py-1 rounded border w-fit
            ${isDuplicate
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-green-50 text-green-700 border-green-200"}`}
          >
            {isDuplicate ? "⚡ 이미 업로드한 이력서 — 캐시 반환" : `✓ ${uploadedFileName} 파싱 완료`}
          </div>
        )}
        {uploadError && (
          <p className="mt-2 text-xs text-red-600">{uploadError}</p>
        )}
      </div>

      <div className="border-t border-gray-100" />

      {/* 텍스트 입력 폼 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          보유 스킬 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={profile.skills}
          onChange={(e) => update("skills", e.target.value)}
          disabled={disabled || isUploading}
          placeholder="예: React, TypeScript, Node.js, PostgreSQL, REST API 설계, 5년 경력"
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          경력 요약 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={profile.experience}
          onChange={(e) => update("experience", e.target.value)}
          disabled={disabled || isUploading}
          placeholder="예: 5년간 SaaS 스타트업에서 풀스택 개발자로 근무. 월 10만 사용자 서비스 개발 및 운영 경험."
          rows={4}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          주요 프로젝트 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={profile.projects}
          onChange={(e) => update("projects", e.target.value)}
          disabled={disabled || isUploading}
          placeholder="예: 이커머스 풀스택 개발 (React+Node, MAU 5만), 실시간 채팅 앱 (WebSocket, 동시접속 1000명)"
          rows={4}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          가용 시간
        </label>
        <input
          type="text"
          value={profile.availability ?? ""}
          onChange={(e) => update("availability", e.target.value)}
          disabled={disabled || isUploading}
          placeholder="예: 주 20시간, 풀타임 가능"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          목표 시급 (USD)
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">$</span>
          <input
            type="number"
            value={profile.hourlyRate?.min ?? ""}
            onChange={(e) =>
              update("hourlyRate", { ...profile.hourlyRate, min: e.target.value ? Number(e.target.value) : undefined })
            }
            disabled={disabled || isUploading}
            placeholder="최소"
            className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
          />
          <span className="text-sm text-gray-400">~</span>
          <span className="text-sm text-gray-500">$</span>
          <input
            type="number"
            value={profile.hourlyRate?.max ?? ""}
            onChange={(e) =>
              update("hourlyRate", { ...profile.hourlyRate, max: e.target.value ? Number(e.target.value) : undefined })
            }
            disabled={disabled || isUploading}
            placeholder="최대"
            className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
          />
          <span className="text-sm text-gray-500">/hr</span>
        </div>
      </div>
    </div>
  );
}
