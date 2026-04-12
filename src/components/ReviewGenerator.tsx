"use client";
import React, { useState } from 'react';
import { Wand2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAI } from '@/lib/gemini';
import { Product } from '@/store/useCartStore';

interface ReviewGeneratorProps {
  product: Product;
}

export function ReviewGenerator({ product }: ReviewGeneratorProps) {
  const [generating, setGenerating] = useState(false);

  const handleGenerateReview = async () => {
    setGenerating(true);
    const toastId = toast.loading('Generating reviews...');
    try {
      const ai = getAI();
      const prompt = `Generate 7 realistic, positive customer reviews for the following product:
      Title: ${product.title}
      Category: ${product.category}
      
      Languages required: 3 in Swedish, 1 in Norwegian, 1 in Danish, 1 in English, 1 in Finnish.
      
      Return the response as a JSON array: [{"rating": number (1-5), "comment": "string", "userName": "string", "language": "string"}].`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const reviews = JSON.parse(response.text || '[]');
      
      await Promise.all(reviews.map((review: any) => 
        addDoc(collection(db, `products/${product.id}/reviews`), {
          productId: product.id,
          userId: 'fake-user',
          userName: review.userName || 'Anonymous User',
          rating: review.rating || 5,
          comment: review.comment || 'Great product!',
          language: review.language || 'English',
          createdAt: new Date(new Date('2025-01-01T00:00:00Z').getTime() + Math.random() * (new Date().getTime() - new Date('2025-01-01T00:00:00Z').getTime())).toISOString()
        })
      ));

      toast.success('7 reviews generated!', { id: toastId });
    } catch (error) {
      console.error('Error generating reviews:', error);
      toast.error('Failed to generate reviews.', { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      onClick={handleGenerateReview}
      disabled={generating}
      className="w-full sm:w-auto flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-800 border border-transparent px-6 py-3 text-sm font-medium rounded-md transition-colors disabled:opacity-50"
    >
      {generating ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
      {generating ? 'Generating...' : 'Generate Review'}
    </button>
  );
}
