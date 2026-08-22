import { ImageResponse } from "next/og";

export const alt = "MSW Dev Tool — Runtime API scenario control for MSW";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(135deg, #0a0a0a 0%, #171717 55%, #351a09 100%)",
          color: "white",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "center",
          padding: "80px",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            background: "#f97316",
            borderRadius: "28px",
            boxShadow: "0 18px 80px rgba(249, 115, 22, 0.35)",
            display: "flex",
            fontSize: "46px",
            fontWeight: 700,
            letterSpacing: "-2px",
            marginBottom: "38px",
            padding: "18px 28px",
          }}
        >
          MSW DEV TOOL
        </div>
        <div style={{ fontSize: "68px", fontWeight: 700, letterSpacing: "-3px", textAlign: "center" }}>
          Inspect and control API scenarios.
        </div>
        <div style={{ color: "#d4d4d4", fontSize: "30px", marginTop: "28px", textAlign: "center" }}>
          Runtime scenario control for Mock Service Worker
        </div>
      </div>
    ),
    size,
  );
}
