"use client";

/** Last-resort boundary when the root layout itself fails. Must render its own <html>. */
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#16171b", color: "#f3f4f6", margin: 0 }}>
        <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
          <div>
            <h1 style={{ fontSize: 22, margin: 0 }}>Streamly couldn’t load</h1>
            <p style={{ color: "#9ca3af", marginTop: 8 }}>Something went wrong on our side. Try again in a moment.</p>
            <button
              onClick={() => retry()}
              style={{ marginTop: 20, padding: "10px 18px", borderRadius: 999, border: 0, background: "#2dd4a8", color: "#0b1f1a", fontWeight: 600, cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
