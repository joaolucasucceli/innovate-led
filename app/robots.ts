import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/configuracoes/", "/leads/"],
    },
    sitemap: `${process.env.NEXTAUTH_URL || "https://central-innovate.vercel.app"}/sitemap.xml`,
  }
}
