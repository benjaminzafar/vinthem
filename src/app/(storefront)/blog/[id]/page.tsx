import React from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { BlogPost } from '@/types';
import Image from 'next/image';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from('blog_posts')
    .select('title')
    .eq('id', id)
    .single();

  if (!post) return { title: 'Article Not Found' };

  return {
    title: `${post.title['en'] || 'Journal'} | Mavren Shop`,
  };
}

export default async function BlogPostDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: postData, error } = await supabase
    .from('blog_posts')
    .select('*, imageUrl:image_url, createdAt:created_at')
    .eq('id', id)
    .single();

  if (error || !postData) {
    notFound();
  }

  const post = postData as BlogPost;

  // Fetch settings for text labels
  const { data: settingsData } = await supabase
    .from('settings')
    .select('data')
    .eq('id', 'primary')
    .single();

  const settings = settingsData?.data || {};
  const lang = 'en' as string; // Default or handle via cookies

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-in fade-in duration-700">
      <Link href="/blog" className="inline-flex items-center text-sm font-medium text-brand-muted hover:text-brand-ink mb-10 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> {settings.backToJournalText?.[lang] || 'Back to Journal'}
      </Link>

      <div>
        <h1 className="text-4xl md:text-6xl font-sans font-bold text-brand-ink mb-6 leading-tight">
          {post.title[lang] || post.title['en']}
        </h1>

        <div className="flex items-center text-brand-muted space-x-6 mb-10 pb-10 border-b border-gray-200">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString(lang === ('sv' as string) ? 'sv-SE' : lang) : ''}</span>
          </div>
          <div className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            <span>{settings.byAuthorText?.[lang] || 'By'} {post.author}</span>
          </div>
        </div>

        {post.imageUrl && (
          <div className="aspect-[21/9] rounded-2xl overflow-hidden mb-12 bg-gray-100 shadow-sm border border-gray-100 relative">
            <Image 
              src={post.imageUrl} 
              alt={post.title[lang] || post.title['en']} 
              fill
              priority
              className="object-cover transition-transform duration-700 hover:scale-105"
            />
          </div>
        )}

        <div className="prose prose-lg prose-nordic max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap font-light">
          {post.content[lang] || post.content['en']}
        </div>
      </div>
    </article>
  );
}
