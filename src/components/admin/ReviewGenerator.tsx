"use client";

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { createClient } from '@/utils/supabase/client';
import { Product } from '@/store/useCartStore';
import { genAI } from '@/lib/ai';
import { toast } from 'sonner';
import { createAdminReviewAction } from '@/app/actions/reviews';

export function ReviewGenerator() {
  const [products, setProducts] = useState<Product[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatingProductId, setGeneratingProductId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.from('products').select('*').limit(10).then(({ data }) => {
      if (data) setProducts(data as any);
    });
  }, []);

  const handleGenerateReview = async (product: Product) => {
    if (!product.id) return;
    setGeneratingProductId(product.id);
    setGenerating(true);
    const toastId = toast.loading('Generating fake review...');
    try {
      const prompt = `Generate a realistic, positive customer review for the following product:
      Title: ${product.title}
      Category: ${product.categoryName || 'General'}
      
      Return the response in JSON format: {"rating": number (1-5), "comment": "string", "userName": "string"}.`;

      const model = genAI.getGenerativeModel({ 
        model: 'llama-3.3-70b-versatile',
        generationConfig: {
          responseMimeType: 'application/json',
        }
      });

      const aiResponse = await model.generateContent(prompt);
      const reviewText = aiResponse.response.text();
      const review = JSON.parse(reviewText || '{}');
      
      const result = await createAdminReviewAction({
        productId: product.id,
        rating: review.rating || 5,
        comment: review.comment || 'Great product!',
      });

      if (!result.success) throw new Error(result.message);

      toast.success('Fake review generated!', { id: toastId });
    } catch (error: unknown) {
      logger.error('Error generating review:', error);
      const timestamp = new Date().toLocaleTimeString('sv-SE', { hour12: false });
      const errorMessage = (error as any)?.message || 'Internal Error';
      const status = (error as any)?.status;

      if (status === 401 || status === 403) {
        toast.error('Action Required: Please set your Groq API Key in the Integrations Manager.', { 
          id: toastId,
          duration: 6000
        });
        return;
      }

      toast.error(`AI Review Generation failed: ${errorMessage}`, { id: toastId, duration: 5000 });
    } finally {
      setGeneratingProductId(null);
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-[18px] font-bold text-slate-900 border-b border-slate-100 pb-4">Fake Review Generator</h2>
      <div className="space-y-4">
        {products.map(product => (
          <div key={product.id} className="flex items-center justify-between p-4 border border-gray-200/60 rounded-xl bg-white shadow-sm">
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 text-[13px]">{product.title}</span>
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">{product.categoryName || 'Product'}</span>
            </div>
            <button
              onClick={() => handleGenerateReview(product)}
              disabled={generating && generatingProductId === product.id}
              className="px-6 py-2 bg-slate-900 text-white text-[11px] font-bold uppercase tracking-widest rounded-[4px] hover:bg-black transition-all disabled:opacity-50"
            >
              {generating && generatingProductId === product.id ? 'Generating...' : 'Generate Review'}
            </button>
          </div>
        ))}
        {products.length === 0 && (
          <div className="py-12 text-center text-gray-500 text-sm italic">
            No products available to generate reviews for.
          </div>
        )}
      </div>
    </div>
  );
}
