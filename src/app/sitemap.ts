import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.vinthem.com'
  
  // In a full production setup, we would fetch products, collections, and blogs here.
  // For now, we seed the crawler with the primary storefront routes.
  const routes = [
    '',
    '/products',
    '/cart',
    '/auth',
    '/terms-of-service',
    '/privacy-policy',
    '/returns',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }))
 
  return routes
}
