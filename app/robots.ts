import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://camspecelite.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/admin-cam-review/", "/admin-cylinder-head-review/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
