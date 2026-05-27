/** Shared mark for ImageResponse-based app icons. */
export function ProvisionlyIcon({ size }: { size: number }) {
  const radius = Math.round(size * 0.22);
  const pad = Math.round(size * 0.18);
  const lineHeight = Math.max(2, Math.round(size * 0.045));
  const gap = Math.round(size * 0.11);
  const checkSize = Math.round(size * 0.12);
  const listWidth = size - pad * 2;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(145deg, #0d9488 0%, #14b8a6 55%, #5eead4 100%)",
        borderRadius: radius,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap,
          width: listWidth,
          padding: `${pad}px`,
          background: "rgba(255,255,255,0.96)",
          borderRadius: Math.round(radius * 0.7),
          boxShadow: "0 8px 24px rgba(4,47,46,0.18)",
        }}
      >
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            style={{
              display: "flex",
              alignItems: "center",
              gap: Math.round(size * 0.06),
            }}
          >
            <div
              style={{
                width: checkSize,
                height: checkSize,
                borderRadius: Math.round(checkSize * 0.28),
                border: `${Math.max(2, Math.round(size * 0.018))}px solid ${
                  row === 0 ? "#0d9488" : "#cbd5e1"
                }`,
                background: row === 0 ? "#ccfbf1" : "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {row === 0 ? (
                <div
                  style={{
                    width: Math.round(checkSize * 0.34),
                    height: Math.round(checkSize * 0.2),
                    borderLeft: `${Math.max(2, Math.round(size * 0.022))}px solid #0d9488`,
                    borderBottom: `${Math.max(2, Math.round(size * 0.022))}px solid #0d9488`,
                    transform: "rotate(-45deg) translateY(-1px)",
                  }}
                />
              ) : null}
            </div>
            <div
              style={{
                flex: 1,
                height: lineHeight,
                borderRadius: lineHeight,
                background:
                  row === 0
                    ? "#0d9488"
                    : row === 1
                      ? "#94a3b8"
                      : "#cbd5e1",
                opacity: row === 0 ? 1 : 0.85,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
