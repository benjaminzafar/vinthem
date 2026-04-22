import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { ShieldCheck, Truck, Clock, AlertCircle } from 'lucide-react';

interface ReturnPolicyPageProps {
  params: Promise<{ lang: string }>;
}

export default async function ReturnPolicyPage({ params }: ReturnPolicyPageProps) {
  const { lang } = await params;
  const supabase = await createClient();

  // Fetch the localized content for 'return-policy' slug
  const { data: page, error } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', 'return-policy')
    .single();

  if (error || !page) {
    notFound();
  }

  // Handle multilingual content (stored as JSON in DB)
  const content = typeof page.content === 'object' ? page.content?.[lang] || page.content?.['en'] : page.content;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-zinc-50 border-b border-zinc-100 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-6 text-center lg:text-left">
          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-[0.2em] mb-4 block">Storefront Support</span>
          <h1 className="text-4xl lg:text-5xl font-bold text-zinc-900 tracking-tight mb-6">
            {lang === 'sv' ? 'Retur- och reklamationspolicy' : 'Return & Refund Policy'}
          </h1>
          <p className="text-lg text-zinc-500 max-w-2xl font-medium leading-relaxed mx-auto lg:mx-0">
            {lang === 'sv' 
              ? 'Fullständig information om hur du returnerar varor och EU/Sveriges lagstadgade standarder.' 
              : 'Detailed information on how to return items and EU/Sweden legal standards.'}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Main Content */}
          <div className="lg:col-span-8">
            <div className="prose prose-zinc max-w-none prose-p:text-zinc-600 prose-p:leading-relaxed prose-headings:font-bold prose-headings:tracking-tight">
              {/* Dangerous HTML from DB (Standard for page managers) */}
              <div dangerouslySetInnerHTML={{ __html: String(content || '') }} />
            </div>

            {/* Swedish/EU Legal Badge */}
            <div className="mt-12 p-8 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-start gap-6">
              <div className="p-3 bg-white border border-zinc-100 rounded-xl shadow-sm">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-2">EU Consumer Protection</h3>
                <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                  {lang === 'sv' 
                    ? 'Vi följer EU:s och Sveriges konsumentlagar. Returfrakt betalas av kunden på grund av låga marginaler.' 
                    : 'We comply with EU and Swedish consumer laws. Return shipping is paid by the customer due to low margins.'}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar / Quick Info */}
          <div className="lg:col-span-4 space-y-8">
            <div className="p-6 border border-zinc-100 rounded-2xl space-y-6">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-rose-500" />
                <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-widest">Courier Info</h4>
              </div>
              <div className="space-y-4">
                <div className="bg-zinc-50 p-4 rounded-xl">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Return Cost</span>
                  <p className="text-sm font-bold text-zinc-900 italic">Customer Self-Paid</p>
                </div>
              </div>
            </div>

            <div className="p-6 border border-zinc-100 rounded-2xl space-y-6">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-rose-500" />
                <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-widest">Processing Time</h4>
              </div>
              <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                {'Return processing usually takes 3-5 business days.'}
              </p>
            </div>
            
            <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <h4 className="text-xs font-bold text-rose-900 uppercase tracking-widest text-wrap">Important</h4>
              </div>
              <p className="text-xs text-rose-700 font-semibold leading-relaxed">
                {'Items must be in original packaging and show no signs of use.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
