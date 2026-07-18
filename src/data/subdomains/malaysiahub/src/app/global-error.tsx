"use client";

/**
 * Root error boundary. Explicit (rather than Next's injected default) so a
 * crash in the root layout still renders a designed page, and so the error
 * boundary chunk always exists in the client manifest. Must render its own
 * <html>/<body>; global styles may not be available here, hence inline
 * fallback styling.
 */
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          margin: 0,
          background: "#14161d",
          color: "#e7e8e4",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ fontFamily: "monospace", fontSize: 13, opacity: 0.7, margin: 0 }}>
            MalaysiaHub
          </p>
          <h1 style={{ fontSize: 32, margin: "12px 0" }}>Something broke at the root.</h1>
          <p style={{ opacity: 0.75, maxWidth: 420, margin: "0 auto 20px" }}>
            The application hit an error it couldn&apos;t recover from. Reloading usually fixes it.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#5c86d9",
              color: "#14161d",
              border: 0,
              borderRadius: 8,
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
