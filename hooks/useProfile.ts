"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { UserProfile } from "@/types";

interface UseProfileReturn {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  activeProfileId: string | null;
  uploadResume: (file: File) => Promise<void>;
  resetToOriginal: (resumeId: string) => Promise<void>;
  isLoading: boolean;
  isUploading: boolean;
  isSaving: boolean;
  isDuplicate: boolean;
  error: string | null;
}

const DEFAULT_PROFILE: UserProfile = {
  skills: "",
  experience: "",
  projects: "",
  preferredLanguage: "ko",
};

export function useProfile(): UseProfileReturn {
  const [profile, setProfileState] = useState<UserProfile>(DEFAULT_PROFILE);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDirtyRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 앱 시작 시 active profile 로드
  useEffect(() => {
    async function loadActiveProfile() {
      try {
        const res = await fetch("/api/profile/active");
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.data) {
          setProfileState({ ...DEFAULT_PROFILE, ...(data.data.profileJson as UserProfile) });
          setActiveProfileId(data.data.id);
        }
      } catch {
        // 로그인 안 된 상태거나 네트워크 오류 — 조용히 무시
      } finally {
        setIsLoading(false);
      }
    }
    loadActiveProfile();
  }, []);

  // 프로필 변경 시 autosave (500ms debounce)
  const setProfile = useCallback((newProfile: UserProfile) => {
    setProfileState(newProfile);
    isDirtyRef.current = true;
  }, []);

  useEffect(() => {
    if (!isDirtyRef.current || !activeProfileId) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      isDirtyRef.current = false;
      setIsSaving(true);
      try {
        await fetch(`/api/profile/${activeProfileId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileJson: profile }),
        });
      } catch {
        // autosave 실패는 조용히 — 다음 변경 시 재시도됨
      } finally {
        setIsSaving(false);
      }
    }, 500);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [profile, activeProfileId]);

  // 이력서 업로드
  const uploadResume = useCallback(async (file: File) => {
    setIsUploading(true);
    setIsDuplicate(false);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/resumes/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message ?? "업로드에 실패했습니다");
      }

      const parsed = data.profile as UserProfile;
      // preferredLanguage는 기존 설정 유지
      setProfileState((prev) => ({ ...parsed, preferredLanguage: prev.preferredLanguage }));
      setActiveProfileId(data.profileId);
      setIsDuplicate(data.deduped === true);
      isDirtyRef.current = false;
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드에 실패했습니다");
    } finally {
      setIsUploading(false);
    }
  }, []);

  // resume 원본 파싱 결과로 되돌리기
  const resetToOriginal = useCallback(async (resumeId: string) => {
    setIsUploading(true);
    setError(null);

    try {
      const res = await fetch("/api/profile/from-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message ?? "원본 복원에 실패했습니다");
      }

      const parsed = data.data.profile as UserProfile;
      setProfileState((prev) => ({ ...parsed, preferredLanguage: prev.preferredLanguage }));
      setActiveProfileId(data.data.id);
      isDirtyRef.current = false;
    } catch (err) {
      setError(err instanceof Error ? err.message : "원본 복원에 실패했습니다");
    } finally {
      setIsUploading(false);
    }
  }, []);

  return {
    profile,
    setProfile,
    activeProfileId,
    uploadResume,
    resetToOriginal,
    isLoading,
    isUploading,
    isSaving,
    isDuplicate,
    error,
  };
}
