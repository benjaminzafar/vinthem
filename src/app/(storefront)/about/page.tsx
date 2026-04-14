import React from 'react';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/server';
import { getSettings } from '@/lib/data';

export async function generateMetadata() {
  const settings = await getSettings();
  const lang = 'en';

  if (!settings) return {};

  return {
    title: settings.aboutHeroTitleText?.[lang] || 'About Us',
    description: settings.aboutPhilosophyDescription1Text?.[lang] || 'Learn about our journey and philosophy.',
  };
}

export default async function About() {
  const settings = await getSettings();
  const lang = 'en'; 

  if (!settings) return null;

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[400px] w-full flex items-center justify-center overflow-hidden bg-brand-ink">
        <div className="absolute inset-0 z-0">
          <Image 
            src="https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=2940&auto=format&fit=crop" 
            alt={settings.aboutHeroTitleText?.[lang] || 'About Us'} 
            fill
            priority
            className="object-cover opacity-40"
          />
        </div>
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-display text-white mb-6 animate-in fade-in slide-in-from-bottom-5 duration-1000">
            {settings.aboutHeroTitleText?.[lang]}
          </h1>
          <p className="text-xl text-gray-200 font-normal animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-200">
            {settings.aboutHeroSubtitleText?.[lang]}
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="prose prose-lg prose-nordic max-w-none text-gray-700">
          <h2 className="text-3xl font-display font-bold text-brand-ink mb-6">{settings.aboutPhilosophyTitleText?.[lang]}</h2>
          <p className="mb-8 leading-relaxed font-light">
            {settings.aboutPhilosophyDescription1Text?.[lang]}
          </p>
          <p className="mb-8 leading-relaxed font-light">
            {settings.aboutPhilosophyDescription2Text?.[lang]}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 my-16">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-xl border border-gray-100">
               <Image 
                src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=2832&auto=format&fit=crop" 
                alt={settings.aboutSustainableMaterialsTitleText?.[lang] || 'Sustainable Materials'} 
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
              />
            </div>
            <div className="flex flex-col justify-center">
              <h3 className="text-2xl font-display font-bold text-brand-ink mb-4">{settings.aboutSustainableMaterialsTitleText?.[lang]}</h3>
              <p className="leading-relaxed font-light">
                {settings.aboutSustainableMaterialsDescriptionText?.[lang]}
              </p>
            </div>
          </div>

          <h2 className="text-3xl font-display font-bold text-brand-ink mb-6">{settings.aboutContactUsTitleText?.[lang]}</h2>
          <p className="mb-4 font-light">{settings.aboutContactUsDescriptionText?.[lang]}</p>
          <ul className="list-none pl-0 space-y-2">
            <li><strong className="font-medium">{settings.aboutEmailLabelText?.[lang]}:</strong> {settings.aboutEmailValueText?.[lang]}</li>
            <li><strong className="font-medium">{settings.aboutPhoneLabelText?.[lang]}:</strong> {settings.aboutPhoneValueText?.[lang]}</li>
            <li><strong className="font-medium">{settings.aboutAddressLabelText?.[lang]}:</strong> {settings.aboutAddressValueText?.[lang]}</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
