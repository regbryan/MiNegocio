import type { MetadataRoute } from "next";

function origin() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://minegocio.digital";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = origin();
  const lastModified = new Date();
  const publicRoutes = [
    "/",
    "/legal/privacidad",
    "/legal/terminos",
    "/legal/subprocesadores",
    "/legal/derechos-arco",
  ];
  return publicRoutes.map((p) => ({
    url: `${base}${p}`,
    lastModified,
    changeFrequency: p === "/" ? "weekly" : "monthly",
    priority: p === "/" ? 1.0 : 0.6,
  }));
}
