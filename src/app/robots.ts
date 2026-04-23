import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/auth/callback'],
    },
    sitemap: 'https://www.vinthem.com/sitemap.xml',
  }
}
