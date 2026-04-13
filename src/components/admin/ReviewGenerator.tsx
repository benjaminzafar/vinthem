"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Product } from '@/store/useCartStore';
import { getAI } from '@/lib/gemini';
import { toast } from 'sonner';

export function ReviewGenerator() {
  const [products, setProducts] = useState<Product[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatingProductId, setGeneratingProductId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.from('products').select('*').then(({ data }) => {
      if (data) setProducts(data as unknown as Product[]);
    });
  }, [supabase]);

  const handleGenerateReview = async (product: Product) => {
    if (!product.id) return;
    setGeneratingProductId(product.id);
    setGenerating(true);
    const toastId = toast.loading('Generating fake review...');
    try {
      const ai = getAI();
      const prompt = `Generate a realistic, positive customer review for the following product:
      Title: ${product.title}
      Category: ${product.category}
      
      Return the response in JSON format: {"rating": number (1-5), "comment": "string", "userName": "string"}.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const review = JSON.parse(response.text || '{}');
      
      const { error } = await supabase.from('reviews').insert({
        product_id: product.id,
        user_id: null,
        rating: review.rating || 5,
        comment: review.comment || 'Great product!',
      });

      if (error) throw error;

      toast.success('Fake review generated!', { id: toastId });
    } catch (error) {
      console.error('Error generating review:', error);
      toast.error('Failed to generate review.', { id: toastId });
    } finally {
      setGeneratingProductId(null);
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Fake Review Generator</h2>
      <div className="py-8 border-b border-gray-200/60 last:border-0">
        <div className="space-y-4">
          {products.map(product => (
            <div key={product.id} className="flex items-center justify-between p-4 border border-gray-200/60 rounded">
              <span className="font-medium text-gray-900">{product.title}</span>
              <button
                onClick={() => handleGenerateReview(product)}
                disabled={generating && generatingProductId === product.id}
                className="w-full sm:w-auto flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-800 border border-transparent px-6 py-3 text-sm font-medium rounded-md transition-colors disabled:opacity-50"
              >
                {generating && generatingProductId === product.id ? 'Generating...' : 'Generate Review'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
