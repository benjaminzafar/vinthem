"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Product } from '@/store/useCartStore';
import { genAI } from '@/lib/ai';
import { toast } from 'sonner';

export function ReviewGenerator() {
  const [products, setProducts] = useState<Product[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatingProductId, setGeneratingProductId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('*, categories(name)');
      if (data) {
        const mapped = (data as any[]).map(p => ({
          ...p,
          categoryName: p.categories?.name
        }));
        setProducts(mapped as Product[]);
      }
    };

    fetchProducts();
  }, [supabase]);

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
      const review = JSON.parse(aiResponse.response.text() || '{}');
      
      const { error } = await supabase.from('reviews').insert({
        product_id: product.id,
        user_id: null,
        rating: review.rating || 5,
        comment: review.comment || 'Great product!',
      });

      if (error) throw error;

      toast.success('Fake review generated!', { id: toastId });
    } catch (error: any) {
      console.error('Error generating review:', error);
      const timestamp = new Date().toLocaleTimeString('sv-SE', { hour12: false });
      const errorMessage = error?.message || '';
      const status = error?.status;

      if (status === 401 || status === 403) {
        toast.error('Action Required: Please set your Groq API Key in the Integrations Manager.', { 
          id: toastId,
          duration: 6000
        });
        return;
      }

      toast.error(`## Error Type\nConsole Error\n\n## Error Message\n[${timestamp}] AI Review Generation failed. ${errorMessage}`, { 
        id: toastId, 
        duration: 8000 
      });
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
