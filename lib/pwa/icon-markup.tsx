import { lightPalette } from "@/lib/design/palette";

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
        background: `linear-gradient(145deg, ${lightPalette.fjordBlue} 0%, ${lightPalette.sageLeaf} 55%, ${lightPalette.birchWood} 100%)`,
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
          background: `${lightPalette.snowWhite}f5`,
          borderRadius: Math.round(radius * 0.7),
          boxShadow: `0 8px 24px color-mix(in srgb, ${lightPalette.fjordBlue} 22%, transparent)`,
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
                  row === 0 ? lightPalette.fjordBlue : lightPalette.birchWood
                }`,
                background: row === 0 ? lightPalette.oatmeal : lightPalette.snowWhite,
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
                    borderLeft: `${Math.max(2, Math.round(size * 0.022))}px solid ${lightPalette.cloudberryOrange}`,
                    borderBottom: `${Math.max(2, Math.round(size * 0.022))}px solid ${lightPalette.cloudberryOrange}`,
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
                    ? lightPalette.fjordBlue
                    : row === 1
                      ? lightPalette.sageLeaf
                      : lightPalette.birchWood,
                opacity: row === 0 ? 1 : 0.85,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
