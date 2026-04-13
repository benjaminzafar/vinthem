"use client";
import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

import { motion } from 'motion/react';
import { ArrowRight, Calendar } from 'lucide-react';
import { BlogPost } from '@/types';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function BlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useSettingsStore();
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const supabase = createClient();

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*, imageUrl:image_url, createdAt:created_at')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPosts(data as BlogPost[]);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();

    const channel = supabase
      .channel('blog_posts_all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blog_posts' }, fetchPosts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-ink"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-sans font-bold text-brand-ink mb-4">{settings.journalTitleText?.[lang]}</h1>
        <p className="text-lg text-brand-muted max-w-2xl mx-auto">
          {settings.journalSubtitleText?.[lang]}
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
          <p className="text-brand-gray text-lg">{settings.noJournalEntriesText?.[lang]}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {posts.map((post, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              key={post.id} 
              className="group cursor-pointer"
            >
              <Link href={`/blog/${post.id}`} className="block">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-gray-100">
                  {post.imageUrl && post.imageUrl.trim() !== "" ? (
                    <img 
                      src={post.imageUrl} 
                      alt={post.title[lang] || post.title['en']} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-sans">{settings.journalTitleText?.[lang]}</div>
                  )}
                </div>
                <div className="flex items-center text-sm text-brand-muted mb-3 space-x-4">
                  <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> {post.createdAt ? new Date(post.createdAt).toLocaleDateString(lang === 'sv' ? 'sv-SE' : lang) : ''}</span>
                  <span>{settings.byAuthorText?.[lang]} {post.author}</span>
                </div>
                <h2 className="text-2xl font-sans font-bold text-brand-ink mb-3 group-hover:text-brand-accent transition-colors">
                  {post.title[lang] || post.title['en']}
                </h2>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {post.excerpt[lang] || post.excerpt['en']}
                </p>
                <span className="inline-flex items-center text-sm font-medium text-brand-ink group-hover:text-brand-accent transition-colors">
                  {settings.readArticleText?.[lang]} <ArrowRight className="ml-1 w-4 h-4" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
