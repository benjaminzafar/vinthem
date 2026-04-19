import React from 'react';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { ArrowRight, Calendar } from 'lucide-react';
import { BlogPost } from '@/types';
import Image from 'next/image';

export async function generateMetadata() {
  const supabase = await createClient();
  const { data: settingsData } = await supabase
    .from('settings')
    .select('data')
    .eq('id', 'primary')
    .single();

  const settings = settingsData?.data || {};
  const lang = 'en'; // Default or handle via cookie logic if possible here

  return {
    title: `${settings.journalTitleText?.[lang] || 'Journal'} | Mavren Shop`,
    description: settings.journalSubtitleText?.[lang] || 'Read the latest stories and updates from Mavren Shop.',
  };
}

export default async function BlogList() {
  const supabase = await createClient();

  const { data: postsData, error } = await supabase
    .from('blog_posts')
    .select('*, imageUrl:image_url, createdAt:created_at')
    .order('created_at', { ascending: false });

  const posts = postsData as BlogPost[] || [];

  const { data: settingsData } = await supabase
    .from('settings')
    .select('data')
    .eq('id', 'primary')
    .single();

  const settings = settingsData?.data || {};
  const lang = 'en' as string; // Default or handle via cookies

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-in fade-in duration-700">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-sans font-bold text-brand-ink mb-4">
          {settings.journalTitleText?.[lang] || 'Journal'}
        </h1>
        <p className="text-lg text-brand-muted max-w-2xl mx-auto">
          {settings.journalSubtitleText?.[lang] || 'Explore our latest articles and updates.'}
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
          <p className="text-brand-gray text-lg">{settings.noJournalEntriesText?.[lang] || 'No journal entries found.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {posts.map((post, index) => (
            <div 
              key={post.id} 
              className="group cursor-pointer"
            >
              <Link href={`/blog/${post.id}`} className="block">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-gray-100 shadow-sm border border-gray-100 relative">
                  {post.imageUrl && post.imageUrl.trim() !== "" ? (
                    <Image 
                      src={post.imageUrl} 
                      alt={post.title[lang] || post.title['en']} 
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-sans">
                      {settings.journalTitleText?.[lang] || 'Mavren'}
                    </div>
                  )}
                </div>
                <div className="flex items-center text-sm text-brand-muted mb-3 space-x-4">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" /> 
                    {post.createdAt ? new Date(post.createdAt).toLocaleDateString(lang === 'sv' ? 'sv-SE' : lang) : ''}
                  </span>
                  <span>{settings.byAuthorText?.[lang] || 'By'} {post.author}</span>
                </div>
                <h2 className="text-2xl font-sans font-bold text-brand-ink mb-3 group-hover:text-brand-accent transition-colors">
                  {post.title[lang] || post.title['en']}
                </h2>
                <p className="text-gray-600 mb-4 line-clamp-3 font-light text-sm leading-relaxed">
                  {post.excerpt[lang] || post.excerpt['en']}
                </p>
                <span className="inline-flex items-center text-sm font-medium text-brand-ink group-hover:text-brand-accent transition-colors">
                  {settings.readArticleText?.[lang] || 'Read More'} <ArrowRight className="ml-1 w-4 h-4" />
                </span>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
