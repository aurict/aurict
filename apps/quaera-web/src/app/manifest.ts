import type { MetadataRoute } from "next";
import { DESCRIPTION } from "@/content/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Quaera",
    short_name: "Quaera",
    description: DESCRIPTION,
    start_url: "/",
    display: "browser",
    background_color: "#faf6f1",
    theme_color: "#5b4bdb",
    icons: [{ src: "/icon-512.png", sizes: "512x512", type: "image/png" }],
  };
}
