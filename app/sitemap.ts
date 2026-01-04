import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://camspecelite.com";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/calculators`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/calculators/cam-horsepower-calculator`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1, // High priority - main SEO landing page
    },
    {
      url: `${baseUrl}/cams`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/cylinder-heads`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/forum`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/dyno-wars`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];

  // Calculator pages
  const calculatorSlugs = [
    "cam-spec-elite",
    "cam-spec-elite-selective",
    "cam-spec-elite-generative",
    "drag-simulator",
    "roll-race-60-130",
    "gear-ratio",
    "boost-estimator",
    "turbo-sizing-calculator",
    "camshaft-suggestor-basic",
    "camshaft-suggestor-selective",
    "cam-suggestor-global",
    "tire-size",
    "brake-math",
  ];

  const calculatorPages: MetadataRoute.Sitemap = calculatorSlugs.map((slug) => ({
    url: `${baseUrl}/calculators/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...calculatorPages];
}
