"use client";
import React from 'react';
import { motion } from 'motion/react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTranslation } from 'react-i18next';

export default function About() {
  const { settings } = useSettingsStore();
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[400px] w-full flex items-center justify-center overflow-hidden bg-brand-ink">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=2940&auto=format&fit=crop" 
            alt={settings.aboutHeroTitleText?.[lang]} 
            className="w-full h-full object-cover opacity-40"
          />
        </div>
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-6xl font-sans text-white mb-6"
          >
            {settings.aboutHeroTitleText?.[lang]}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-gray-200 font-normal"
          >
            {settings.aboutHeroSubtitleText?.[lang]}
          </motion.p>
        </div>
      </section>

      {/* Content Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="prose prose-lg prose-nordic max-w-none text-gray-700">
          <h2 className="text-3xl font-sans font-bold text-brand-ink mb-6">{settings.aboutPhilosophyTitleText?.[lang]}</h2>
          <p className="mb-8 leading-relaxed">
            {settings.aboutPhilosophyDescription1Text?.[lang]}
          </p>
          <p className="mb-8 leading-relaxed">
            {settings.aboutPhilosophyDescription2Text?.[lang]}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 my-16">
            <img 
              src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=2832&auto=format&fit=crop" 
              alt={settings.aboutSustainableMaterialsTitleText?.[lang]} 
              className="rounded-2xl object-cover aspect-[4/5] w-full"
            />
            <div className="flex flex-col justify-center">
              <h3 className="text-2xl font-sans font-bold text-brand-ink mb-4">{settings.aboutSustainableMaterialsTitleText?.[lang]}</h3>
              <p className="leading-relaxed">
                {settings.aboutSustainableMaterialsDescriptionText?.[lang]}
              </p>
            </div>
          </div>

          <h2 className="text-3xl font-sans font-bold text-brand-ink mb-6">{settings.aboutContactUsTitleText?.[lang]}</h2>
          <p className="mb-4">{settings.aboutContactUsDescriptionText?.[lang]}</p>
          <ul className="list-none pl-0 space-y-2">
            <li><strong>{settings.aboutEmailLabelText?.[lang]}:</strong> {settings.aboutEmailValueText?.[lang]}</li>
            <li><strong>{settings.aboutPhoneLabelText?.[lang]}:</strong> {settings.aboutPhoneValueText?.[lang]}</li>
            <li><strong>{settings.aboutAddressLabelText?.[lang]}:</strong> {settings.aboutAddressValueText?.[lang]}</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
