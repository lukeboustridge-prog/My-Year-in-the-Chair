import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "My Year in the Chair",
    short_name: "Year in Chair",
    description: "Freemasons Master companion",
    start_url: "/",
    display: "standalone",
    scope: "/",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    icons: [
      {
        src: "/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
