"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  rawText: string;
  onRawTextChange: (text: string) => void;
  onJobScraped: (text: string) => void;
  disabled?: boolean;
}

type Tab = "text" | "bookmarklet";

// ─── 북마클릿 코드 ────────────────────────────────────────────────────────────
// Upwork 공고 페이지에서 실행 시 __NEXT_DATA__ → JSON-LD → meta → DOM 순으로 추출,
// 클립보드에 복사 후 토스트 표시.
/* eslint-disable no-script-url */
const BOOKMARKLET =
  `javascript:(function(){function flat(v){if(typeof v==='string')return v.trim();if(Array.isArray(v))return v.map(function(i){return typeof i==='string'?i:(i&&(i.name||i.prettyName||i.label))||''}).filter(Boolean).join(', ');if(v&&typeof v==='object'){if(v.min!=null&&v.max!=null)return '$'+v.min+'\u2013$'+v.max+'/hr';if(v.amount!=null)return '$'+v.amount;return Object.entries(v).map(function(e){return e[0]+': '+flat(e[1])}).join(', ');}return v!=null?String(v):'';}var result=[];var seen={};var F=['title','description','skills','requiredSkills','budget','hourlyBudget','fixedBudget','duration','weeklyHours','engagement','contractorTier','category','experienceLevel'];function search(o,d){if(!o||d>10||typeof o!=='object')return;if(Array.isArray(o)){o.forEach(function(i){search(i,d+1)});return;}Object.entries(o).forEach(function(pair){var k=pair[0],v=pair[1],lk=k.toLowerCase();if(!seen[lk]&&F.some(function(f){return lk===f.toLowerCase()||lk.endsWith(f.toLowerCase())})){var s=flat(v);if(s&&s.length>2){result.push(k+': '+s);seen[lk]=true;}}search(v,d+1);});}var nd=window.__NEXT_DATA__;if(nd)search(nd,0);if(!result.length){['og:title','og:description','description'].forEach(function(n){var el=document.querySelector('meta[property="'+n+'"],meta[name="'+n+'"]');if(el&&el.getAttribute('content')&&el.getAttribute('content').length>5)result.push(n.replace('og:','')+': '+el.getAttribute('content'));});}if(!result.length){var main=document.querySelector('main,[role="main"]');var txt=main?(main.innerText||''):(document.body.innerText||'');txt=txt.replace(/\\s{3,}/g,'\\n\\n').trim().slice(0,4000);if(txt.length>100)result.push(txt);}if(!result.length){alert('Upwork \uacf5\uace0 \ud398\uc774\uc9c0\uc5d0\uc11c \uc2e4\ud589\ud574\uc8fc\uc138\uc694.');return;}var text=result.join('\\n\\n');function toast(msg){var el=document.createElement('div');el.innerHTML=msg;el.style.cssText='position:fixed;top:24px;left:50%;transform:translateX(-50%);background:#1d4ed8;color:#fff;padding:14px 28px;border-radius:12px;z-index:2147483647;font-size:14px;font-family:-apple-system,sans-serif;box-shadow:0 4px 24px rgba(0,0,0,.25);text-align:center;line-height:1.6;pointer-events:none';document.body.appendChild(el);setTimeout(function(){el.remove();},3000);}function copyExec(t){var ta=document.createElement('textarea');ta.value=t;ta.setAttribute('readonly','');ta.style.cssText='position:fixed;top:-9999px;left:-9999px;opacity:0';document.body.appendChild(ta);ta.focus();ta.select();var ok=false;try{ok=document.execCommand('copy');}catch(e){}document.body.removeChild(ta);return ok;}function doCopy(){window.focus();if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(function(){toast('<b>\u2713 \uacf5\uace0 \ubcf5\uc0ac \uc644\ub8cc!</b><br><small>\uc571\uc73c\ub85c \ub3cc\uc544\uac00 \ud154\uc2a4\ud2b8 \ud0ed\uc5d0 \ubd99\uc5ec\ub123\uae30 \ud558\uc138\uc694</small>');},function(){if(copyExec(text)){toast('<b>\u2713 \uacf5\uace0 \ubcf5\uc0ac \uc644\ub8cc!</b><br><small>\uc571\uc73c\ub85c \ub3cc\uc544\uac00 \ud154\uc2a4\ud2b8 \ud0ed\uc5d0 \ubd99\uc5ec\ub123\uae30 \ud558\uc138\uc694</small>');}else{prompt('\uc544\ub798 \ud14d\uc2a4\ud2b8\ub97c \ubcf5\uc0ac\ud558\uc138\uc694:',text);}});}else if(copyExec(text)){toast('<b>\u2713 \uacf5\uace0 \ubcf5\uc0ac \uc644\ub8cc!</b><br><small>\uc571\uc73c\ub85c \ub3cc\uc544\uac00 \ud154\uc2a4\ud2b8 \ud0ed\uc5d0 \ubd99\uc5ec\ub123\uae30 \ud558\uc138\uc694</small>');}else{prompt('\uc544\ub798 \ud14d\uc2a4\ud2b8\ub97c \ubcf5\uc0ac\ud558\uc138\uc694:',text);}}doCopy();})()`  ;
/* eslint-enable no-script-url */

export default function JobInputSection({
  rawText,
  onRawTextChange,
  disabled,
}: Props) {
  const [tab, setTab] = useState<Tab>("text");
  const [codeCopied, setCodeCopied] = useState(false);
  const bookmarkletRef = useRef<HTMLAnchorElement>(null);

  // React blocks javascript: URLs in href — set it directly on the DOM element.
  // No dependency array: re-runs after every render so React's href="#" override is
  // immediately corrected before the user can drag the element.
  useEffect(() => {
    if (bookmarkletRef.current) {
      bookmarkletRef.current.setAttribute("href", BOOKMARKLET);
    }
  });

  function handleCopyCode() {
    navigator.clipboard.writeText(BOOKMARKLET).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      {/* 탭 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">채용 공고</h2>
        <div className="flex rounded-md border border-gray-200 overflow-hidden text-sm">
          <button
            onClick={() => setTab("text")}
            className={`px-3 py-1.5 transition-colors ${
              tab === "text"
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            텍스트 붙여넣기
          </button>
          <button
            onClick={() => setTab("bookmarklet")}
            className={`px-3 py-1.5 border-l border-gray-200 transition-colors ${
              tab === "bookmarklet"
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            북마클릿
          </button>
        </div>
      </div>

      {/* 텍스트 탭 */}
      {tab === "text" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            공고 전문 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={rawText}
            onChange={(e) => onRawTextChange(e.target.value)}
            disabled={disabled}
            placeholder="Upwork 공고 내용 전체를 복사해서 붙여넣으세요."
            rows={14}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400 resize-none"
          />
          {rawText && (
            <p className="text-xs text-gray-400 mt-1 text-right">
              {rawText.length.toLocaleString()}자
            </p>
          )}
        </div>
      )}

      {/* 북마클릿 탭 */}
      {tab === "bookmarklet" && (
        <div className="space-y-5">
          {/* 설명 */}
          <p className="text-sm text-gray-600">
            아래 버튼을 북마크바로 드래그해 저장하세요. Upwork 공고 페이지에서
            클릭하면 공고 내용을 클립보드에 자동으로 복사합니다.
          </p>

          {/* 북마클릿 설치 방법 A: 드래그 */}
          <div className="flex flex-col items-center gap-2">
            <a
              ref={bookmarkletRef}
              href="#"
              draggable
              onClick={(e) => e.preventDefault()}
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl text-sm font-semibold shadow-md cursor-grab active:cursor-grabbing select-none hover:from-blue-700 hover:to-blue-600 transition-all"
              title="북마크바로 드래그하세요"
            >
              <span className="text-base">🔖</span>
              Upwork 공고 복사기
            </a>
            <p className="text-xs text-gray-400">↑ 드래그해서 북마크바에 저장</p>
          </div>

          {/* 북마클릿 설치 방법 B: 수동 북마크 만들기 */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
            <p className="text-xs font-medium text-gray-600">
              드래그가 안 되면 — 수동 설치
            </p>
            <ol className="text-xs text-gray-500 space-y-1 list-decimal list-inside">
              <li>아래 코드 복사 버튼 클릭</li>
              <li>
                북마크 관리자에서 새 북마크 만들기{" "}
                <span className="text-gray-400">(Cmd+Shift+O → 새 북마크)</span>
              </li>
              <li>이름: <code className="bg-white px-1 rounded border text-gray-600">Upwork 공고 복사기</code></li>
              <li>URL 칸에 복사한 코드 붙여넣기 → 저장</li>
            </ol>
            <button
              onClick={handleCopyCode}
              className="w-full mt-1 py-1.5 rounded-md border border-gray-300 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {codeCopied ? "✓ 복사됨" : "북마클릿 코드 복사"}
            </button>
          </div>

          {/* 사용 단계 */}
          <ol className="space-y-3 text-sm text-gray-700">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                1
              </span>
              <span>
                위 방법으로 <strong>북마크 저장</strong>
                <span className="block text-xs text-gray-400 mt-0.5">
                  북마크바 안 보이면 Cmd+Shift+B (Mac) / Ctrl+Shift+B (Win)
                </span>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                2
              </span>
              <span>
                Upwork 공고 페이지에서 저장한 <strong>북마크 클릭</strong>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                3
              </span>
              <span>
                여기로 돌아와 <strong>텍스트 붙여넣기</strong> 탭에서{" "}
                <kbd className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-mono">
                  Cmd+V
                </kbd>
              </span>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}
