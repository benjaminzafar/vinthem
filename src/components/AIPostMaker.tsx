"use client";
import React, { useState } from 'react';
import { Wand2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAI } from '@/lib/gemini';
import { createClient } from '@/utils/supabase/client';

export function AIPostMaker() {
  const supabase = createClient();
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleGeneratePost = async () => {
    if (!topic) return;
    setGenerating(true);
    const toastId = toast.loading('Generating AI post...');
    try {
      const ai = getAI();
      const prompt = `Generate an engaging blog post about: ${topic}.
      
      Return the response in JSON format: {"title": "string", "excerpt": "string", "content": "string"}.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const post = JSON.parse(response.text || '{}');
      
      const { error } = await supabase
        .from('blog_posts')
        .insert({
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          author: 'AI Assistant',
          image_url: 'https://picsum.photos/seed/post/800/400'
        });

      if (error) throw error;

      toast.success('AI post generated and saved!', { id: toastId });
      setTopic('');
    } catch (error: any) {
      console.error('Error generating post:', error);
      toast.error(error.message || 'Failed to generate post.', { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="py-8 border-b border-gray-200/60 last:border-0 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">AI Post Maker</h3>
      <input
        type="text"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="Enter a topic for your post..."
        className="w-full p-3 border border-gray-200 rounded-lg"
      />
      <button
        onClick={handleGeneratePost}
        disabled={generating}
        className="w-full sm:w-auto flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-800 border border-transparent px-6 py-3 text-sm font-medium rounded-md transition-colors disabled:opacity-50"
      >
        {generating ? <Loader2 className="animate-spin" /> : <Wand2 size={18} />}
        {generating ? 'Generating...' : 'Generate Post'}
      </button>
    </div>
  );
}
