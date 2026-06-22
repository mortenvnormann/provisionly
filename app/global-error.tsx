"use client";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          backgroundColor: "#faf9f7",
          color: "#1a1a1a",
        }}
      >
        <main
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "3rem 1.5rem",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "0.875rem",
              fontWeight: 500,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: "#2d6a4f",
            }}
          >
            Provisionly
          </p>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>
            Something went wrong
          </h1>
          <p
            style={{
              maxWidth: "24rem",
              fontSize: "0.875rem",
              color: "#666",
              margin: 0,
            }}
          >
            An unexpected error occurred. You can try again or go back to your
            lists.
          </p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: "0.5rem 1rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                borderRadius: "0.5rem",
                border: "none",
                backgroundColor: "#2d6a4f",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a
              href="/home"
              style={{
                display: "inline-block",
                padding: "0.5rem 1rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                borderRadius: "0.5rem",
                border: "1px solid #ddd",
                backgroundColor: "#fff",
                color: "#1a1a1a",
                textDecoration: "none",
              }}
            >
              Go to your lists
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
