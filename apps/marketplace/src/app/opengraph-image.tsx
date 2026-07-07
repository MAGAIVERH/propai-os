import { ImageResponse } from "next/og";

export const alt = "PropAI — US Real Estate Marketplace";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Branded social-share card, rendered on demand by next/og. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0b1220 0%, #1b2947 100%)",
          padding: 90,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              display: "flex",
              width: 72,
              height: 72,
              borderRadius: 16,
              background: "#ffffff",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 44,
              fontWeight: 800,
              color: "#1b2947",
            }}
          >
            P
          </div>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: "#93a4c7" }}>
            Real Estate OS
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 118,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: -4,
            marginTop: 40,
          }}
        >
          PropAI Marketplace
        </div>
        <div style={{ display: "flex", fontSize: 40, color: "#cbd5e1", marginTop: 16 }}>
          Homes &amp; rentals across the US · AI-powered search
        </div>
      </div>
    ),
    { ...size },
  );
}
