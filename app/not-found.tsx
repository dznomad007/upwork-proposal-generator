export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-700">404 — 페이지를 찾을 수 없습니다</h2>
        <p className="mt-2 text-gray-500">
          <a href="/" className="text-blue-600 hover:underline">홈으로 돌아가기</a>
        </p>
      </div>
    </div>
  );
}
