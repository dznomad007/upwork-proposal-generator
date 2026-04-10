"use client";

import { useState } from "react";
import { UserButton, SignInButton, useUser } from "@clerk/nextjs";
import ProfileForm from "@/components/ProfileForm";
import JobInputSection from "@/components/JobInputSection";
import JobPreviewCard from "@/components/JobPreviewCard";
import ResultPanel from "@/components/ResultPanel";
import { useProfile } from "@/hooks/useProfile";
import type { JobPosting, AnalysisResult } from "@/types";

type AppState = "idle" | "parsing" | "preview" | "analyzing" | "result" | "error";

export default function Home() {
  const { isLoaded, isSignedIn } = useUser();
  const {
    profile,
    setProfile,
    uploadResume,
    isLoading: isProfileLoading,
    isUploading,
    isSaving,
    isDuplicate,
    error: profileError,
  } = useProfile();

  const [appState, setAppState] = useState<AppState>("idle");
  const [jobRawText, setJobRawText] = useState("");
  const [parsedJob, setParsedJob] = useState<JobPosting | null>(null);
  const [jobMissingInfo, setJobMissingInfo] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleParseJob() {
    if (!jobRawText.trim()) return;
    setAppState("parsing");
    setErrorMessage("");

    try {
      const res = await fetch("/api/parse-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: jobRawText }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message ?? "공고 파싱에 실패했습니다");
      setParsedJob(data.data.job);
      setJobMissingInfo(data.data.missingInfo ?? []);
      setAppState("preview");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "알 수 없는 오류");
      setAppState("error");
    }
  }

  async function handleAnalyze() {
    if (!parsedJob) return;
    setAppState("analyzing");
    setErrorMessage("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, job: parsedJob }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message ?? "분석에 실패했습니다");
      setAnalysisResult(data.data);
      setAppState("result");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "알 수 없는 오류");
      setAppState("error");
    }
  }

  function handleReset() {
    setAppState("idle");
    setParsedJob(null);
    setJobMissingInfo([]);
    setAnalysisResult(null);
    setErrorMessage("");
  }

  const isLoading = appState === "parsing" || appState === "analyzing";
  const canParse =
    !isProfileLoading &&
    jobRawText.trim().length > 10 &&
    profile.skills &&
    profile.experience &&
    profile.projects;

  return (
    <main className="min-h-screen">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Upwork Proposal Generator</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                setProfile({ ...profile, preferredLanguage: profile.preferredLanguage === "ko" ? "en" : "ko" })
              }
              className="text-sm px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 transition-colors"
              title={profile.preferredLanguage === "ko" ? "Switch to English" : "한국어로 전환"}
            >
              {profile.preferredLanguage === "ko" ? "KO → EN" : "EN → KO"}
            </button>
            {isLoaded && isSignedIn
              ? <UserButton />
              : !isSignedIn && (
                  <SignInButton mode="modal">
                    <button className="text-sm px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                      로그인
                    </button>
                  </SignInButton>
                )
            }
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* 프로필 로딩 스켈레톤 */}
        {isProfileLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
              <div className="space-y-3">
                {[80, 60, 70, 50].map((w, i) => (
                  <div key={i} className={`h-3 bg-gray-200 rounded w-${w}`} />
                ))}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="h-32 bg-gray-200 rounded" />
            </div>
          </div>
        ) : (
          /* 입력 영역 */
          appState !== "result" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProfileForm
                profile={profile}
                onChange={setProfile}
                disabled={isLoading}
                onFileUpload={uploadResume}
                isUploading={isUploading}
                isSaving={isSaving}
                isDuplicate={isDuplicate}
                uploadError={profileError}
              />
              <JobInputSection
                rawText={jobRawText}
                onRawTextChange={setJobRawText}
                disabled={isLoading}
                onJobScraped={setJobRawText}
              />
            </div>
          )
        )}

        {/* 에러 */}
        {appState === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <p className="text-red-700 text-sm">{errorMessage}</p>
            <button
              onClick={() => setAppState(parsedJob ? "preview" : "idle")}
              className="text-sm text-red-600 underline ml-4"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 공고 파싱 버튼 */}
        {(appState === "idle" || appState === "error") && !parsedJob && !isProfileLoading && (
          <div className="flex justify-center">
            <button
              onClick={handleParseJob}
              disabled={!canParse || isLoading}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              공고 구조화
            </button>
          </div>
        )}

        {/* 로딩 */}
        {appState === "parsing" && (
          <div className="flex justify-center py-4">
            <div className="flex items-center gap-3 text-gray-600">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">공고를 분석하는 중...</span>
            </div>
          </div>
        )}

        {/* 공고 미리보기 */}
        {(appState === "preview" || appState === "error") && parsedJob && (
          <>
            <JobPreviewCard job={parsedJob} missingInfo={jobMissingInfo} onJobChange={setParsedJob} />
            <div className="flex justify-center gap-4">
              <button
                onClick={handleReset}
                className="px-6 py-3 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                처음부터
              </button>
              <button
                onClick={handleAnalyze}
                disabled={isLoading}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                분석 시작
              </button>
            </div>
          </>
        )}

        {/* 분석 로딩 */}
        {appState === "analyzing" && (
          <div className="flex justify-center py-8">
            <div className="flex items-center gap-3 text-gray-600">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">AI가 분석하는 중...</span>
            </div>
          </div>
        )}

        {/* 결과 */}
        {appState === "result" && analysisResult && (
          <>
            <ResultPanel result={analysisResult} lang={profile.preferredLanguage} />
            <div className="flex justify-center">
              <button
                onClick={handleReset}
                className="px-6 py-3 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                새 공고 분석
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
