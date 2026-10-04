import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://saltrepublic.mv";
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/book`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/travel-agents`, changeFrequency: "monthly", priority: 0.8 },
  ];
}
