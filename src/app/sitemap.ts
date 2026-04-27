import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.vinthem.com'
  
  // In a full production setup, we would fetch products, collections, and blogs here.
  // For now, we seed the crawler with the primary storefront routes.
  const routes = [
    '',
    '/sv',
    '/products',
    '/sv/products',
    '/cart',
    '/sv/cart',
    '/blog',
    '/sv/blog',
    '/terms-of-service',
    '/privacy-policy',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' || route === '/sv' ? 1 : 0.8,
  }))
 
  return routes
}
