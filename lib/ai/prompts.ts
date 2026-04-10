import type { UserProfile, JobPosting } from "@/types";

export const PARSE_JOB_SYSTEM = `You are a job posting parser. Extract structured information from raw Upwork job postings.
Return ONLY valid JSON with no markdown, no code blocks, no extra text.
If a field cannot be determined, omit it.
List any fields that are missing or ambiguous in "missingInfo".`;

export function buildParseJobPrompt(rawText: string): string {
  return `Parse this job posting and return structured JSON:

${rawText}

Return this exact JSON schema (no markdown, no code blocks):
{
  "job": {
    "title": "string",
    "description": "string",
    "requiredSkills": ["string"],
    "experienceLevel": "entry|intermediate|expert (optional)",
    "projectLength": "string (optional)",
    "weeklyHours": "string (optional)",
    "budget": {
      "type": "hourly|fixed|unknown",
      "min": number (optional),
      "max": number (optional),
      "amount": number (optional),
      "currency": "USD (optional)"
    },
    "clientInfo": {
      "location": "string (optional)",
      "rating": number (optional),
      "totalSpent": "string (optional)",
      "paymentVerified": boolean (optional),
      "jobsPosted": number (optional)
    }
  },
  "missingInfo": ["list of missing or ambiguous fields"]
}`;
}

export function buildAnalyzeSystem(lang: "Korean" | "English"): string {
  return `You are an expert Upwork proposal strategist with 10+ years of experience.
Analyze the match between a freelancer profile and a job posting.
Return ONLY valid JSON with no markdown, no code blocks, no extra text.
Never fabricate experience the freelancer does not have.
Always include your assumptions and any missing information that affected your analysis.
Be honest about confidence level.

LANGUAGE RULE — THIS IS MANDATORY:
You MUST write every single text value in the JSON output in ${lang}.
This applies to ALL fields: coverLetter, keyPoints[].title, keyPoints[].description,
rateGuide.strategy, rateGuide.reasoning, assumptions[], missingInfo[].
Do NOT mix languages. Do NOT write any field in English if the language is Korean, or vice versa.

CRITICAL RULE — rateGuide:
- If the job budget type is "fixed": rateGuide.type MUST be "fixed", and rateGuide.recommended is the total fixed bid amount (NOT an hourly rate).
- If the job budget type is "hourly": rateGuide.type MUST be "hourly", and rateGuide.recommended is the hourly rate.
- Never recommend an hourly rate for a fixed-price job, or a fixed price for an hourly job.`;
}

export function buildAnalyzePrompt(
  profile: UserProfile,
  job: JobPosting
): string {
  const rateStr =
    profile.hourlyRate?.min && profile.hourlyRate?.max
      ? `$${profile.hourlyRate.min}–$${profile.hourlyRate.max}/hr`
      : profile.hourlyRate?.min
        ? `$${profile.hourlyRate.min}+/hr`
        : "미지정";

  const budgetStr = job.budget
    ? job.budget.type === "hourly"
      ? `시간당 $${job.budget.min ?? "?"}–$${job.budget.max ?? "?"}`
      : job.budget.type === "fixed"
        ? `고정 $${job.budget.amount ?? job.budget.max ?? "?"}`
        : "예산 불명확"
    : "예산 정보 없음";

  const lang = profile.preferredLanguage === "ko" ? "Korean" : "English";

  return `## FREELANCER PROFILE
Skills: ${profile.skills}
Experience: ${profile.experience}
Projects: ${profile.projects}
Availability: ${profile.availability ?? "N/A"}
Target Rate: ${rateStr}

## JOB POSTING
Title: ${job.title}
Budget: ${budgetStr}
Required Skills: ${job.requiredSkills.join(", ")}
Experience Level: ${job.experienceLevel ?? "N/A"}
Project Length: ${job.projectLength ?? "N/A"}
Description:
${job.description}

---

OUTPUT LANGUAGE: ${lang}. Every text value below MUST be written in ${lang}.

Analyze the match and return this exact JSON (no markdown, no code blocks):
{
  "coverLetter": "[${lang}] 120-220 words. First sentence directly connects to this job. 2-3 specific skill matches. Concrete achievement reference. Short CTA.",
  "fitScore": {
    "overall": 0-100,
    "breakdown": {
      "skills": 0-100,
      "experience": 0-100,
      "availability": 0-100
    },
    "matchedSkills": ["skill names — keep as-is, no translation needed"],
    "missingSkills": ["skill names — keep as-is, no translation needed"]
  },
  "keyPoints": [
    {
      "title": "[${lang}] short title",
      "description": "[${lang}] specific experience to highlight and why",
      "priority": "high|medium|low"
    }
  ],
  "rateGuide": {
    "type": "hourly or fixed — MUST match the job budget type",
    "recommended": number or null,
    "range": { "min": number, "max": number },
    "strategy": "[${lang}] bid strategy explanation",
    "reasoning": "[${lang}] reasoning based on budget and profile fit"
  },
  "assumptions": ["[${lang}] assumption 1", "[${lang}] assumption 2"],
  "missingInfo": ["[${lang}] missing info 1", "[${lang}] missing info 2"],
  "confidence": 0-100
}`;
}

export const PARSE_RESUME_SYSTEM = `You are a resume parser. Extract structured profile information from resume text.
Return ONLY valid JSON with no markdown, no code blocks, no extra text.
Extract skills, experience summary, notable projects, availability hints, and hourly rate expectations if mentioned.
If a field cannot be determined, use an empty string or omit optional fields.`;

export function buildParseResumePrompt(text: string): string {
  return `Parse this resume and return structured JSON:

${text}

Return this exact JSON schema (no markdown, no code blocks):
IMPORTANT: All fields must be plain strings, NOT arrays or objects.
{
  "skills": "React, Spring Boot, Kafka, PostgreSQL (comma-separated plain text)",
  "experience": "2-4 sentence plain text summary of work history and key roles",
  "projects": "Plain text: Project A (2023, React/Node) - built X. Project B (2022, Java) - improved Y. (2-3 projects, semicolons or newlines to separate, NO arrays)",
  "availability": "Full-time or Part-time 20hrs/week (plain text, omit if not found)",
  "hourlyRate": {
    "min": number or null,
    "max": number or null
  }
}`;
}
