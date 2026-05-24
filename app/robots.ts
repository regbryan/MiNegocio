import type { MetadataRoute } from "next";

function origin() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://minegocio.digital";
}

export default function robots(): MetadataRoute.Robots {
  // Block crawlers entirely in staging / preview to prevent accidental indexing.
  if (
    process.env.VERCEL_ENV === "preview" ||
    process.env.NODE_ENV !== "production"
  ) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dev/", "/onboard", "/chat/", "/widget"],
      },
    ],
    sitemap: `${origin()}/sitemap.xml`,
  };
}
