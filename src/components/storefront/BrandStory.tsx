"use client";

import React from 'react';

export function BrandStory({ lang }: { lang: string }) {
  // Simplified for performance, but rich in natural keywords
  return (
    <section className="py-20 bg-slate-50 border-t border-slate-100 overflow-hidden" aria-labelledby="brand-story-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 id="brand-story-title" className="text-[24px] md:text-[32px] font-bold text-slate-900 mb-8 tracking-tight uppercase">
              Vinthem: The Essence of Scandinavian Minimalism
            </h2>
            <div className="space-y-6 text-[15px] text-slate-600 leading-relaxed max-w-2xl">
              <p>
                Founded in the heart of Stockholm, **Vinthem** (also known as *Vindhem* or *Vinhem*) emerged from a desire to redefine luxury through the lens of Nordic simplicity. Our philosophy is rooted in the belief that true style doesn't need to shout—it speaks through impeccable tailoring, premium organic materials, and a timeless silhouette.
              </p>
              <p>
                As a leading **Scandinavian fashion brand**, we specialize in quiet luxury and capsule wardrobe essentials. From our signature hoodies to our architectural outerwear, every piece in the **Vinthem collection** is designed for the modern individual who values quality over quantity.
              </p>
              <p>
                Whether you know us as *Vintham*, *Vintam*, or the official **Vinthem Store**, our commitment to sustainable slow fashion remains unwavering. We ship our curated selections globally, bringing the unique Stockholm aesthetic to a discerning international audience who appreciate the fine balance between streetwear and high-end apparel.
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="aspect-[4/5] bg-slate-200 rounded animate-pulse" />
                <div className="aspect-square bg-slate-100 rounded animate-pulse" />
              </div>
              <div className="pt-8 space-y-4">
                <div className="aspect-square bg-slate-100 rounded animate-pulse" />
                <div className="aspect-[4/5] bg-slate-200 rounded animate-pulse" />
              </div>
            </div>
            {/* These pulse divs will be replaced by the user with real campaign images later, 
                but they maintain the layout and improve CLS score */}
          </div>
        </div>
      </div>
    </section>
  );
}
