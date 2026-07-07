import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PropAI Real Estate Marketplace",
    short_name: "PropAI",
    description:
      "Browse homes and rentals across the United States — AI-powered property search.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1220",
    theme_color: "#1b2947",
    icons: [
      {
        src: "/icon.svg",
        type: "image/svg+xml",
        sizes: "any",
      },
    ],
  };
}
