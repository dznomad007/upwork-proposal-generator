/**
 * lib/scraping/upwork.ts
 * Upwork 공고 페이지 HTML에서 공고 텍스트를 추출하는 순수 함수 모음.
 * 외부 라이브러리 없이 정규식 + 기본 문자열 처리만 사용.
 */

// ─── 차단 감지 ────────────────────────────────────────────────────────────────

const BLOCK_SIGNALS = [
  "captcha",
  "access denied",
  "request blocked",
  "cf-challenge",
  "cloudflare",
  "enable javascript",
  "please verify you are a human",
];

export function isBlockedResponse(html: string): boolean {
  const lower = html.toLowerCase();
  return BLOCK_SIGNALS.some((signal) => lower.includes(signal));
}

// ─── HTML 정규화 ───────────────────────────────────────────────────────────────

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
  "&#x27;": "'",
  "&#x2F;": "/",
};

function decodeHtmlEntities(text: string): string {
  return text.replace(/&[a-z#0-9]+;/gi, (entity) => HTML_ENTITIES[entity] ?? entity);
}

export function normalizeText(text: string): string {
  return decodeHtmlEntities(text)
    .replace(/\s+/g, " ")         // 연속 공백 압축
    .replace(/( \n){2,}/g, "\n")  // 연속 줄바꿈 압축
    .trim();
}

// ─── 1순위: __NEXT_DATA__ (Next.js SSR 데이터) ────────────────────────────────

// Upwork 공고 데이터에서 의미 있는 필드 경로 후보 (깊이 우선 탐색용 키 이름)
const CANDIDATE_KEYS = [
  "title",
  "description",
  "skills",
  "requiredSkills",
  "budget",
  "fixedPriceBudget",
  "hourlyBudget",
  "contractorTier",
  "category",
  "subcategory",
  "duration",
  "weeklyBudget",
  "weeklyHours",
  "clientInfo",
  "experienceLevel",
  "jobType",
];

/**
 * 재귀적으로 JSON 객체에서 후보 키만 수집해 "Key: Value" 텍스트로 합성.
 * JSON 전체 dump를 피해 AI 토큰 낭비를 방지.
 */
function collectCandidateFields(
  obj: unknown,
  depth = 0,
  results: string[] = []
): string[] {
  if (depth > 8 || obj === null || obj === undefined) return results;

  if (typeof obj === "object" && !Array.isArray(obj)) {
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (CANDIDATE_KEYS.some((k) => key.toLowerCase().includes(k.toLowerCase()))) {
        const str = flattenValue(value);
        if (str && str.length > 2) {
          results.push(`${key}: ${str}`);
        }
      }
      collectCandidateFields(value, depth + 1, results);
    }
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      collectCandidateFields(item, depth + 1, results);
    }
  }

  return results;
}

function flattenValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "string" ? v : typeof v === "object" && v !== null ? JSON.stringify(v) : String(v)))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof value === "object" && value !== null) {
    // 단순 객체는 key:value 문자열로 펼침
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${flattenValue(v)}`)
      .join(", ");
  }
  return "";
}

export function extractNextData(html: string): string | null {
  try {
    const match = html.match(/<script[^>]+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
    if (!match) return null;

    const json = JSON.parse(match[1]);
    const fields = collectCandidateFields(json);

    // 중복 제거
    const unique = [...new Set(fields)];
    if (unique.length === 0) return null;

    const text = unique.join("\n");
    return text.length >= 100 ? normalizeText(text) : null;
  } catch {
    return null;
  }
}

// ─── 2순위: JSON-LD ────────────────────────────────────────────────────────────

export function extractJsonLd(html: string): string | null {
  try {
    const matches = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
    if (matches.length === 0) return null;

    const parts: string[] = [];

    for (const match of matches) {
      const data = JSON.parse(match[1]);
      // JobPosting 타입 우선, 나머지는 보조
      if (data["@type"] === "JobPosting" || data["@type"] === "Job") {
        const fields: string[] = [];
        if (data.title) fields.push(`Title: ${data.title}`);
        if (data.description) fields.push(`Description: ${data.description}`);
        if (data.skills) fields.push(`Skills: ${flattenValue(data.skills)}`);
        if (data.baseSalary) fields.push(`Salary: ${flattenValue(data.baseSalary)}`);
        if (data.employmentType) fields.push(`Type: ${data.employmentType}`);
        if (fields.length > 0) parts.push(...fields);
      }
    }

    if (parts.length === 0) return null;
    const text = parts.join("\n");
    return text.length >= 100 ? normalizeText(text) : null;
  } catch {
    return null;
  }
}

// ─── 3순위: meta 태그 ─────────────────────────────────────────────────────────

export function extractMeta(html: string): string | null {
  function getMeta(name: string): string {
    const match =
      html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, "i")) ||
      html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`, "i"));
    return match ? match[1].trim() : "";
  }

  const title = getMeta("og:title") || getMeta("twitter:title");
  const description = getMeta("og:description") || getMeta("description") || getMeta("twitter:description");

  if (!title && !description) return null;

  const parts: string[] = [];
  if (title) parts.push(`Title: ${title}`);
  if (description) parts.push(`Description: ${description}`);

  const text = parts.join("\n");
  return text.length >= 50 ? normalizeText(text) : null;
}

// ─── 4순위: 본문 텍스트 직접 추출 ────────────────────────────────────────────

const MIN_BODY_LENGTH = 100;

export function extractBodyText(html: string): string | null {
  // <script>, <style>, <nav>, <header>, <footer> 제거
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "");

  // <main> 또는 <article> 안만 추출 시도
  const mainMatch = text.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
                    text.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (mainMatch) text = mainMatch[1];

  // 모든 태그 제거
  text = text.replace(/<[^>]+>/g, " ");

  // 정규화
  text = decodeHtmlEntities(text)
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text.length >= MIN_BODY_LENGTH ? text : null;
}

// ─── 통합 추출 함수 ────────────────────────────────────────────────────────────

/**
 * HTML에서 공고 텍스트 추출. 폴백 체인 순서대로 시도.
 * @returns 추출된 rawText 또는 null (모두 실패)
 */
export function extractJobTextFromHtml(html: string): string | null {
  return (
    extractNextData(html) ??
    extractJsonLd(html) ??
    extractMeta(html) ??
    extractBodyText(html)
  );
}
