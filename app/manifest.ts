import type { MetadataRoute } from "next";

const BRAND_ICON_URL = "https://freemasonsnz.org/wp-content/uploads/2024/05/TransparentBlueCompass.png";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "My Year in the Chair",
    short_name: "Year in Chair",
    description: "Freemasons Master companion",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#00529B",
    icons: [
      {
        src: BRAND_ICON_URL,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
