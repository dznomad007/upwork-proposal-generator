export interface UserProfile {
  skills: string;
  experience: string;
  projects: string;
  availability?: string;
  hourlyRate?: {
    min?: number;
    max?: number;
  };
  preferredLanguage: "ko" | "en";
}

export interface JobPosting {
  title: string;
  description: string;
  requiredSkills: string[];
  experienceLevel?: string;
  projectLength?: string;
  weeklyHours?: string;
  budget?: {
    type: "hourly" | "fixed" | "unknown";
    min?: number;
    max?: number;
    amount?: number;
    currency?: string;
  };
  clientInfo?: {
    location?: string;
    rating?: number;
    totalSpent?: string;
    paymentVerified?: boolean;
    jobsPosted?: number;
  };
  sourceUrl?: string;
  rawText?: string;
}

export interface AnalysisResult {
  coverLetter: string;
  fitScore: {
    overall: number;
    breakdown: {
      skills: number;
      experience: number;
      availability: number;
    };
    matchedSkills: string[];
    missingSkills: string[];
  };
  keyPoints: Array<{
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
  }>;
  rateGuide: {
    type: "hourly" | "fixed";
    recommended?: number;
    range?: {
      min?: number;
      max?: number;
    };
    strategy: string;
    reasoning: string;
  };
  assumptions: string[];
  missingInfo: string[];
  confidence: number;
}

export interface ParseJobResponse {
  success: boolean;
  data?: {
    job: JobPosting;
    missingInfo: string[];
  };
  message?: string;
}

export interface AnalyzeResponse {
  success: boolean;
  data?: AnalysisResult;
  message?: string;
}
