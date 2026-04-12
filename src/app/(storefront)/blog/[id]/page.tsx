"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { BlogPost } from '@/types';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function BlogPostDetail() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const { settings } = useSettingsStore();
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'blogs', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPost({ id: docSnap.id, ...docSnap.data() } as BlogPost);
        }
      } catch (error) {
        console.error("Error fetching blog post:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-ink"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <h2 className="text-3xl font-sans font-bold text-brand-ink mb-4">{settings.articleNotFoundText?.[lang]}</h2>
        <Link href="/blog" className="text-brand-accent hover:underline flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" /> {settings.backToJournalText?.[lang]}
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Link href="/blog" className="inline-flex items-center text-sm font-medium text-brand-muted hover:text-brand-ink mb-10 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> {settings.backToJournalText?.[lang]}
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl md:text-6xl font-sans font-bold text-brand-ink mb-6 leading-tight">
          {post.title[lang] || post.title['en']}
        </h1>

        <div className="flex items-center text-brand-muted space-x-6 mb-10 pb-10 border-b border-gray-200">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            <span>{new Date(post.createdAt).toLocaleDateString(lang === 'sv' ? 'sv-SE' : lang)}</span>
          </div>
          <div className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            <span>{settings.byAuthorText?.[lang]} {post.author}</span>
          </div>
        </div>

        {post.imageUrl && (
          <div className="aspect-[21/9] rounded-2xl overflow-hidden mb-12 bg-gray-100">
            <img 
              src={post.imageUrl} 
              alt={post.title[lang] || post.title['en']} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        <div className="prose prose-lg prose-nordic max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
          {post.content[lang] || post.content['en']}
        </div>
      </motion.div>
    </article>
  );
}
