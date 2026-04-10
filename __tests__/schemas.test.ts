import { describe, it, expect } from "vitest";
import {
  UserProfileSchema,
  ParseJobRequestSchema,
  AnalyzeRequestSchema,
  AnalysisResultSchema,
  ParseResumeResponseSchema,
} from "@/lib/validation/schemas";

// ============================================================
// UserProfileSchema
// ============================================================
describe("UserProfileSchema", () => {
  describe("유효한 입력", () => {
    it("필수 필드가 모두 있으면 파싱에 성공해야 한다", () => {
      // Arrange
      const input = {
        skills: "TypeScript, React",
        experience: "백엔드 개발 5년",
        projects: "커머스 플랫폼 개발",
        preferredLanguage: "ko",
      };

      // Act
      const result = UserProfileSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it("선택 필드를 포함해도 파싱에 성공해야 한다", () => {
      // Arrange
      const input = {
        skills: "TypeScript, React",
        experience: "백엔드 개발 5년",
        projects: "커머스 플랫폼 개발",
        availability: "즉시 가능",
        hourlyRate: { min: 50, max: 100 },
        preferredLanguage: "en",
      };

      // Act
      const result = UserProfileSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hourlyRate?.min).toBe(50);
        expect(result.data.hourlyRate?.max).toBe(100);
      }
    });

    it("preferredLanguage는 'ko'와 'en' 둘 다 허용해야 한다", () => {
      // Arrange
      const base = {
        skills: "TypeScript",
        experience: "3년",
        projects: "프로젝트",
      };

      // Act & Assert
      expect(UserProfileSchema.safeParse({ ...base, preferredLanguage: "ko" }).success).toBe(true);
      expect(UserProfileSchema.safeParse({ ...base, preferredLanguage: "en" }).success).toBe(true);
    });
  });

  describe("유효하지 않은 입력", () => {
    it("skills가 빈 문자열이면 실패해야 한다", () => {
      // Arrange
      const input = {
        skills: "",
        experience: "3년",
        projects: "프로젝트",
        preferredLanguage: "ko",
      };

      // Act
      const result = UserProfileSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("experience가 빈 문자열이면 실패해야 한다", () => {
      // Arrange
      const input = {
        skills: "TypeScript",
        experience: "",
        projects: "프로젝트",
        preferredLanguage: "ko",
      };

      // Act
      const result = UserProfileSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("projects가 빈 문자열이면 실패해야 한다", () => {
      // Arrange
      const input = {
        skills: "TypeScript",
        experience: "3년",
        projects: "",
        preferredLanguage: "ko",
      };

      // Act
      const result = UserProfileSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("preferredLanguage가 'ko'/'en' 이외의 값이면 실패해야 한다", () => {
      // Arrange
      const input = {
        skills: "TypeScript",
        experience: "3년",
        projects: "프로젝트",
        preferredLanguage: "ja",
      };

      // Act
      const result = UserProfileSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("필수 필드가 누락되면 실패해야 한다", () => {
      // Arrange
      const input = { skills: "TypeScript" };

      // Act
      const result = UserProfileSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================
// ParseJobRequestSchema
// ============================================================
describe("ParseJobRequestSchema", () => {
  describe("유효한 입력", () => {
    it("10자 이상의 rawText가 있으면 파싱에 성공해야 한다", () => {
      // Arrange
      const input = { rawText: "채용 공고 내용이 여기에 들어갑니다" };

      // Act
      const result = ParseJobRequestSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe("유효하지 않은 입력", () => {
    it("rawText가 10자 미만이면 실패해야 한다", () => {
      // Arrange
      const input = { rawText: "짧은공고" };

      // Act
      const result = ParseJobRequestSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("공고 내용이 너무 짧습니다");
      }
    });

    it("rawText가 빈 문자열이면 실패해야 한다", () => {
      // Arrange
      const input = { rawText: "" };

      // Act
      const result = ParseJobRequestSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("rawText 필드가 없으면 실패해야 한다", () => {
      // Arrange
      const input = {};

      // Act
      const result = ParseJobRequestSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================
// AnalyzeRequestSchema
// ============================================================
describe("AnalyzeRequestSchema", () => {
  const validProfile = {
    skills: "TypeScript, React",
    experience: "백엔드 개발 5년",
    projects: "커머스 플랫폼 개발",
    preferredLanguage: "ko" as const,
  };

  const validJob = {
    title: "시니어 풀스택 개발자",
    description: "Next.js를 이용한 웹 개발",
    requiredSkills: ["TypeScript", "React", "Node.js"],
  };

  describe("유효한 입력", () => {
    it("필수 필드가 모두 있으면 파싱에 성공해야 한다", () => {
      // Arrange
      const input = { profile: validProfile, job: validJob };

      // Act
      const result = AnalyzeRequestSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it("job에 선택 필드를 포함해도 파싱에 성공해야 한다", () => {
      // Arrange
      const input = {
        profile: validProfile,
        job: {
          ...validJob,
          experienceLevel: "시니어",
          projectLength: "6개월",
          weeklyHours: "40시간",
          budget: {
            type: "hourly" as const,
            min: 50,
            max: 100,
            currency: "USD",
          },
          clientInfo: {
            location: "미국",
            rating: 4.8,
            paymentVerified: true,
            jobsPosted: 50,
            totalSpent: "$10,000",
          },
          sourceUrl: "https://example.com/job",
          rawText: "원본 공고 텍스트",
        },
      };

      // Act
      const result = AnalyzeRequestSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it.each(["hourly", "fixed", "unknown"] as const)(
      "budget.type이 '%s'이면 파싱에 성공해야 한다",
      (budgetType) => {
        // Arrange
        const input = {
          profile: validProfile,
          job: {
            ...validJob,
            budget: { type: budgetType },
          },
        };

        // Act
        const result = AnalyzeRequestSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      }
    );
  });

  describe("유효하지 않은 입력", () => {
    it("profile이 없으면 실패해야 한다", () => {
      // Arrange
      const input = { job: validJob };

      // Act
      const result = AnalyzeRequestSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("job이 없으면 실패해야 한다", () => {
      // Arrange
      const input = { profile: validProfile };

      // Act
      const result = AnalyzeRequestSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("budget.type이 허용되지 않은 값이면 실패해야 한다", () => {
      // Arrange
      const input = {
        profile: validProfile,
        job: {
          ...validJob,
          budget: { type: "monthly" },
        },
      };

      // Act
      const result = AnalyzeRequestSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================
// AnalysisResultSchema
// ============================================================
describe("AnalysisResultSchema", () => {
  const validResult = {
    coverLetter: "안녕하세요. 저는 이 포지션에 지원하게 되어...",
    fitScore: {
      overall: 85,
      breakdown: {
        skills: 90,
        experience: 80,
        availability: 85,
      },
      matchedSkills: ["TypeScript", "React"],
      missingSkills: ["GraphQL"],
    },
    keyPoints: [
      {
        title: "TypeScript 전문성",
        description: "5년간의 TypeScript 경험",
        priority: "high" as const,
      },
    ],
    rateGuide: {
      recommended: 75,
      range: { min: 60, max: 90 },
      strategy: "시장 평균 대비 10% 높게 제안",
      reasoning: "희귀한 스킬셋 보유",
    },
    assumptions: ["풀타임 근무 가정"],
    missingInfo: ["클라이언트 시간대 정보 없음"],
    confidence: 82,
  };

  describe("유효한 입력", () => {
    it("완전한 결과 객체가 파싱에 성공해야 한다", () => {
      // Arrange & Act
      const result = AnalysisResultSchema.safeParse(validResult);

      // Assert
      expect(result.success).toBe(true);
    });

    it.each(["high", "medium", "low"] as const)(
      "keyPoints.priority가 '%s'이면 파싱에 성공해야 한다",
      (priority) => {
        // Arrange
        const input = {
          ...validResult,
          keyPoints: [
            { title: "포인트", description: "설명", priority },
          ],
        };

        // Act
        const result = AnalysisResultSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      }
    );

    it("fitScore.overall이 0이면 파싱에 성공해야 한다 (경계값)", () => {
      // Arrange
      const input = {
        ...validResult,
        fitScore: { ...validResult.fitScore, overall: 0 },
      };

      // Act
      const result = AnalysisResultSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it("fitScore.overall이 100이면 파싱에 성공해야 한다 (경계값)", () => {
      // Arrange
      const input = {
        ...validResult,
        fitScore: { ...validResult.fitScore, overall: 100 },
      };

      // Act
      const result = AnalysisResultSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it("confidence가 0이면 파싱에 성공해야 한다 (경계값)", () => {
      // Arrange
      const input = { ...validResult, confidence: 0 };

      // Act
      const result = AnalysisResultSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it("confidence가 100이면 파싱에 성공해야 한다 (경계값)", () => {
      // Arrange
      const input = { ...validResult, confidence: 100 };

      // Act
      const result = AnalysisResultSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe("유효하지 않은 입력", () => {
    it("fitScore.overall이 0 미만이면 실패해야 한다", () => {
      // Arrange
      const input = {
        ...validResult,
        fitScore: { ...validResult.fitScore, overall: -1 },
      };

      // Act
      const result = AnalysisResultSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("fitScore.overall이 100 초과이면 실패해야 한다", () => {
      // Arrange
      const input = {
        ...validResult,
        fitScore: { ...validResult.fitScore, overall: 101 },
      };

      // Act
      const result = AnalysisResultSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("confidence가 0 미만이면 실패해야 한다", () => {
      // Arrange
      const input = { ...validResult, confidence: -1 };

      // Act
      const result = AnalysisResultSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("confidence가 100 초과이면 실패해야 한다", () => {
      // Arrange
      const input = { ...validResult, confidence: 101 };

      // Act
      const result = AnalysisResultSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("keyPoints.priority가 허용되지 않은 값이면 실패해야 한다", () => {
      // Arrange
      const input = {
        ...validResult,
        keyPoints: [
          { title: "포인트", description: "설명", priority: "critical" },
        ],
      };

      // Act
      const result = AnalysisResultSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("coverLetter가 없으면 실패해야 한다", () => {
      // Arrange
      const { coverLetter: _omit, ...input } = validResult;

      // Act
      const result = AnalysisResultSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================
// ParseResumeResponseSchema
// ============================================================
describe("ParseResumeResponseSchema", () => {
  describe("유효한 입력", () => {
    it("필수 필드만 있어도 파싱에 성공해야 한다", () => {
      // Arrange
      const input = {
        skills: "TypeScript, React, Node.js",
        experience: "풀스택 개발 5년",
        projects: "커머스 플랫폼, SaaS 대시보드",
      };

      // Act
      const result = ParseResumeResponseSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it("hourlyRate를 포함해도 파싱에 성공해야 한다", () => {
      // Arrange
      const input = {
        skills: "TypeScript",
        experience: "3년",
        projects: "프로젝트",
        availability: "주 40시간",
        hourlyRate: { min: 60, max: 100 },
      };

      // Act
      const result = ParseResumeResponseSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hourlyRate?.min).toBe(60);
        expect(result.data.hourlyRate?.max).toBe(100);
      }
    });

    it("hourlyRate의 min/max가 null이어도 파싱에 성공해야 한다", () => {
      // Arrange
      const input = {
        skills: "TypeScript",
        experience: "3년",
        projects: "프로젝트",
        hourlyRate: { min: null, max: null },
      };

      // Act
      const result = ParseResumeResponseSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it("hourlyRate.min만 있어도 파싱에 성공해야 한다", () => {
      // Arrange
      const input = {
        skills: "TypeScript",
        experience: "3년",
        projects: "프로젝트",
        hourlyRate: { min: 50 },
      };

      // Act
      const result = ParseResumeResponseSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe("AI가 배열로 반환하는 경우 (preprocess 변환)", () => {
    it("projects가 문자열 배열이면 줄바꿈으로 이어붙여 성공해야 한다", () => {
      // Arrange
      const input = {
        skills: "TypeScript, React",
        experience: "풀스택 5년",
        projects: ["커머스 플랫폼", "SaaS 대시보드", "추천 시스템"],
      };

      // Act
      const result = ParseResumeResponseSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.projects).toBe("커머스 플랫폼\nSaaS 대시보드\n추천 시스템");
      }
    });

    it("projects가 객체 배열이면 key:value 형태로 변환해야 한다", () => {
      // Arrange
      const input = {
        skills: "TypeScript",
        experience: "3년",
        projects: [
          { name: "커머스 플랫폼", tech: "React/Node", year: "2023" },
          { name: "SaaS 대시보드", tech: "Vue/Spring", year: "2022" },
        ],
      };

      // Act
      const result = ParseResumeResponseSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.projects).toContain("커머스 플랫폼");
        expect(result.data.projects).toContain("React/Node");
      }
    });

    it("skills가 배열이면 줄바꿈으로 변환해야 한다", () => {
      // Arrange
      const input = {
        skills: ["TypeScript", "React", "Spring Boot"],
        experience: "풀스택 5년",
        projects: "커머스 플랫폼",
      };

      // Act
      const result = ParseResumeResponseSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.skills).toBe("TypeScript\nReact\nSpring Boot");
      }
    });
  });

  describe("유효하지 않은 입력", () => {
    it("skills가 없으면 실패해야 한다", () => {
      // Arrange
      const input = {
        experience: "3년",
        projects: "프로젝트",
      };

      // Act
      const result = ParseResumeResponseSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("experience가 없으면 실패해야 한다", () => {
      // Arrange
      const input = {
        skills: "TypeScript",
        projects: "프로젝트",
      };

      // Act
      const result = ParseResumeResponseSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("projects가 없으면 실패해야 한다", () => {
      // Arrange
      const input = {
        skills: "TypeScript",
        experience: "3년",
      };

      // Act
      const result = ParseResumeResponseSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("빈 객체이면 실패해야 한다", () => {
      // Arrange
      const input = {};

      // Act
      const result = ParseResumeResponseSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});
