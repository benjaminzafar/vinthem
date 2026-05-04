import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.vinthem.com'
  const languages = ['', 'sv', 'fi', 'da', 'de']
  
  const baseRoutes = [
    '',
    '/products',
    '/blog',
    '/cart',
    '/p/about',
    '/p/contact',
    '/p/faq',
    '/p/shipping-returns',
    '/p/privacy-policy'
  ]

  const routes: MetadataRoute.Sitemap = []

  languages.forEach((lang) => {
    const langPrefix = lang ? `/${lang}` : ''
    
    baseRoutes.forEach((route) => {
      const url = `${baseUrl}${langPrefix}${route}`
      routes.push({
        url,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: route === '' ? 1 : 0.8,
      })
    })
  })
 
  return routes
}
