"use client";

import { useState } from "react";

interface Props {
  text: string;
}

export default function CoverLetter({ text }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{text.length}자 · 초안이므로 지원 전 반드시 검토하세요</p>
        <button
          onClick={handleCopy}
          className="text-sm px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          {copied ? "✓ 복사됨" : "복사"}
        </button>
      </div>
      <div className="bg-gray-50 rounded-md p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap border border-gray-200">
        {text}
      </div>
    </div>
  );
}
