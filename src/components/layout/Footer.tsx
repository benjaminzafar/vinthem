import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cookies } from 'next/headers';
import { CookiePreferencesButton } from '@/components/CookiePreferencesButton';
import { localizeHref } from '@/lib/i18n-routing';
import { StorefrontSettingsType } from '@/types';
import { normalizeSocialUrl } from '@/lib/utils';

const InstagramIcon = ({ className, strokeWidth = 1.5 }: { className?: string; strokeWidth?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon = ({ className, strokeWidth = 1.5 }: { className?: string; strokeWidth?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const TwitterIcon = ({ className, strokeWidth = 1.5 }: { className?: string; strokeWidth?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
  </svg>
);

interface FooterProps {
  settings: StorefrontSettingsType;
}

export default async function Footer({ settings }: FooterProps) {
  const cookieStore = await cookies();
  const lang = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  const instagramUrl = normalizeSocialUrl(settings.socialInstagram, 'instagram');
  const tiktokUrl = normalizeSocialUrl(settings.socialTikTok, 'tiktok');
  const facebookUrl = normalizeSocialUrl(settings.socialFacebook, 'facebook');
  const twitterUrl = normalizeSocialUrl(settings.socialTwitter, 'twitter');

  return (
    <footer className="bg-white border-t border-gray-200 pt-24 pb-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 mb-20">
          <div className="col-span-1 md:col-span-4 lg:col-span-5 pr-8 flex flex-col items-start">
            <Link href={localizeHref(lang, '/')} className="inline-block mb-8 group">
              {settings.logoImage ? (
                <div className="relative h-6 w-24">
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
            <p className="text-zinc-700 !text-[14px] leading-relaxed max-w-sm mb-8">
              {settings.footerDescription?.[lang] || settings.footerDescription?.en || settings.footerDescription?.sv}
            </p>

            {/* Social Media Links under description */}
            <div className="flex items-center gap-5 mb-8">
              {instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-brand-ink transition-colors" aria-label="Visit our Instagram">
                  <InstagramIcon className="w-5 h-5" strokeWidth={1.5} />
                </a>
              )}
              {tiktokUrl && (
                <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-brand-ink transition-colors" aria-label="Visit our TikTok">
                  <TikTokIcon className="w-5 h-5" />
                </a>
              )}
              {facebookUrl && (
                <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-brand-ink transition-colors" aria-label="Visit our Facebook">
                  <FacebookIcon className="w-5 h-5" strokeWidth={1.5} />
                </a>
              )}
              {twitterUrl && (
                <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-brand-ink transition-colors" aria-label="Visit our Twitter">
                  <TwitterIcon className="w-5 h-5" strokeWidth={1.5} />
                </a>
              )}
            </div>

            <p className="text-[13px] text-zinc-500">
              &copy; {new Date().getFullYear()} {settings.storeName?.[lang] || settings.storeName?.en}. {settings.footerCopyright?.[lang] || settings.footerCopyright?.en}
            </p>
          </div>
          
          <div className="col-span-1 md:col-span-8 lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {(settings.footerSections || []).map((section, index) => (
              <div key={index}>
                <h3 className="!text-[12px] !font-bold !uppercase !tracking-widest text-gray-900 mb-6">{section.title?.[lang] || section.title?.en}</h3>
                <ul className="space-y-4 text-sm text-gray-700">
                  {(section.links || []).map((link, lIndex) => (
                    <li key={lIndex}>
                      <Link href={localizeHref(lang, link.href || '/')} className="hover:text-brand-ink transition-colors">
                        {link.label?.[lang] || link.label?.en}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        
        <div className="pt-8 border-t border-gray-100 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-[13px] text-zinc-500">
          <CookiePreferencesButton label={settings.cookiePreferencesButtonText?.[lang] || 'Cookie Preferences'} />
          <Link href={localizeHref(lang, '/unsubscribe')} className="hover:text-brand-ink transition-colors">
            {settings.unsubscribeLinkText?.[lang] || 'Unsubscribe'}
          </Link>
        </div>
      </div>
    </footer>
  );
}
