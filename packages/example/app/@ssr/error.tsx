"use client";

export default function SsrError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>SSR mocking</h2>
      <p style={{ color: "crimson" }}>SSR section failed: {error.message}</p>
      <button type="button" onClick={reset} style={{ padding: "8px 16px" }}>
        Retry SSR
      </button>
    </div>
  );
}
