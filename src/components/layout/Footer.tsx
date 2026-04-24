import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cookies } from 'next/headers';
import { CookiePreferencesButton } from '@/components/CookiePreferencesButton';
import { localizeHref } from '@/lib/i18n-routing';
import { StorefrontSettingsType } from '@/types';

interface FooterProps {
  settings: StorefrontSettingsType;
}

export default async function Footer({ settings }: FooterProps) {
  const cookieStore = await cookies();
  const lang = cookieStore.get('NEXT_LOCALE')?.value || 'en';

  return (
    <footer className="bg-white border-t border-gray-200 pt-24 pb-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 mb-20">
          <div className="col-span-1 md:col-span-4 lg:col-span-5 pr-8">
            <Link href={localizeHref(lang, '/')} className="inline-block mb-8 group">
              {settings.logoImage ? (
                <div className="relative h-10 w-40">
                  <Image 
                    src={settings.logoImage} 
                    alt={settings.storeName?.[lang] || 'Vinthem'} 
                    fill
                    className="object-contain transition-transform group-hover:scale-105" 
                    sizes="(max-width: 768px) 120px, 160px"
                  />
                </div>
              ) : (
                <span className="text-xl font-normal text-gray-900">{settings.storeName?.[lang]}</span>
              )}
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
              {settings.footerDescription?.[lang] || settings.footerDescription?.en || settings.footerDescription?.sv}
            </p>
          </div>
          
          <div className="col-span-1 md:col-span-8 lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {(settings.footerSections || []).map((section, index) => (
              <div key={index}>
                <h3 className="text-sm font-bold text-brand-ink mb-6">{section.title?.[lang] || section.title?.en}</h3>
                <ul className="space-y-4 text-sm text-gray-500">
                  {(section.links || []).map((link, lIndex) => (
                    <li key={lIndex}>
                      <Link href={link.href ? localizeHref(lang, link.href) : '#'} className="hover:text-brand-ink transition-colors">
                        {link.label?.[lang] || link.label?.en}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        
        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-gray-600">
            &copy; {new Date().getFullYear()} {settings.storeName?.[lang] || settings.storeName?.en}. {settings.footerCopyright?.[lang] || settings.footerCopyright?.en}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
            <CookiePreferencesButton label={settings.cookiePreferencesButtonText?.[lang] || 'Cookie Preferences'} />
            <Link href={localizeHref(lang, '/unsubscribe')} className="hover:text-brand-ink transition-colors">
              {settings.unsubscribeLinkText?.[lang] || 'Unsubscribe'}
            </Link>
            {settings.socialInstagram && <a href={settings.socialInstagram} target="_blank" rel="noopener noreferrer" className="hover:text-brand-ink transition-colors" aria-label="Visit our Instagram">{settings.instagramText?.[lang] || 'Instagram'}</a>}
            {settings.socialTikTok && <a href={settings.socialTikTok} target="_blank" rel="noopener noreferrer" className="hover:text-brand-ink transition-colors" aria-label="Visit our TikTok">{settings.tiktokText?.[lang] || 'TikTok'}</a>}
            {settings.socialFacebook && <a href={settings.socialFacebook} target="_blank" rel="noopener noreferrer" className="hover:text-brand-ink transition-colors" aria-label="Visit our Facebook">{settings.facebookText?.[lang] || 'Facebook'}</a>}
            {settings.socialTwitter && <a href={settings.socialTwitter} target="_blank" rel="noopener noreferrer" className="hover:text-brand-ink transition-colors" aria-label="Visit our Twitter">{settings.twitterText?.[lang] || 'Twitter'}</a>}
          </div>
        </div>
      </div>
    </footer>
  );
}
