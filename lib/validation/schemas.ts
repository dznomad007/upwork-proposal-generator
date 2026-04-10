import { z } from "zod";

export const UserProfileSchema = z.object({
  skills: z.string().min(1, "스킬을 입력해주세요"),
  experience: z.string().min(1, "경력을 입력해주세요"),
  projects: z.string().min(1, "프로젝트를 입력해주세요"),
  availability: z.string().optional(),
  hourlyRate: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
  preferredLanguage: z.enum(["ko", "en"]),
});

export const ParseJobRequestSchema = z.object({
  rawText: z.string().min(10, "공고 내용이 너무 짧습니다"),
});

export const AnalyzeRequestSchema = z.object({
  profile: UserProfileSchema,
  job: z.object({
    title: z.string(),
    description: z.string().optional().default(""),
    requiredSkills: z.array(z.string()),
    experienceLevel: z.string().optional(),
    projectLength: z.string().optional(),
    weeklyHours: z.string().optional(),
    budget: z
      .object({
        type: z.enum(["hourly", "fixed", "unknown"]),
        min: z.number().optional(),
        max: z.number().optional(),
        amount: z.number().optional(),
        currency: z.string().optional(),
      })
      .optional(),
    clientInfo: z
      .object({
        location: z.string().optional(),
        rating: z.number().optional(),
        totalSpent: z.string().optional(),
        paymentVerified: z.boolean().optional(),
        jobsPosted: z.number().optional(),
      })
      .optional(),
    sourceUrl: z.string().optional(),
    rawText: z.string().optional(),
  }),
});

export const AnalysisResultSchema = z.object({
  coverLetter: z.string(),
  fitScore: z.object({
    overall: z.number().min(0).max(100),
    breakdown: z.object({
      skills: z.number().min(0).max(100),
      experience: z.number().min(0).max(100),
      availability: z.number().min(0).max(100),
    }),
    matchedSkills: z.array(z.string()),
    missingSkills: z.array(z.string()),
  }),
  keyPoints: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      priority: z.enum(["high", "medium", "low"]),
    })
  ),
  rateGuide: z.object({
    type: z.enum(["hourly", "fixed"]).default("hourly"),
    recommended: z.number().optional(),
    range: z
      .object({
        min: z.number().optional(),
        max: z.number().optional(),
      })
      .optional(),
    strategy: z.string(),
    reasoning: z.string(),
  }),
  assumptions: z.array(z.string()),
  missingInfo: z.array(z.string()),
  confidence: z.number().min(0).max(100),
});

// AI가 projects/skills/experience를 배열로 반환할 수 있으므로 전처리로 문자열 변환
function arrayToString(val: unknown): unknown {
  if (Array.isArray(val)) {
    return val
      .map((item) =>
        typeof item === "object" && item !== null
          ? Object.entries(item)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ")
          : String(item)
      )
      .join("\n");
  }
  return val;
}

export const ParseResumeResponseSchema = z.object({
  skills: z.preprocess(arrayToString, z.string()),
  experience: z.preprocess(arrayToString, z.string()),
  projects: z.preprocess(arrayToString, z.string()),
  availability: z.preprocess(arrayToString, z.string().optional()),
  hourlyRate: z
    .object({
      min: z.number().nullable().optional(),
      max: z.number().nullable().optional(),
    })
    .optional(),
});
