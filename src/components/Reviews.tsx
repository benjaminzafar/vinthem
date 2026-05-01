"use client";
import { logger } from '@/lib/logger';
import React, { useEffect, useState } from 'react';
import { checkPurchasedProductAction, submitProductReviewAction } from '@/app/actions/reviews';
import { createClient } from '@/utils/supabase/client';
import { Review } from '@/types';
import { Star, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import type { StorefrontSettings } from '@/store/useSettingsStore';
import { useStorefrontSettings } from '@/hooks/useStorefrontSettings';

import { User } from '@supabase/supabase-js';

interface ReviewsProps {
  productId: string;
  initialSettings: Partial<StorefrontSettings>;
  lang: string;
}

export default function Reviews({ productId, initialSettings, lang }: ReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasPurchased, setHasPurchased] = useState<boolean | null>(null);
  const settings = useStorefrontSettings(initialSettings);
  const supabase = createClient();

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*, userName:user_name, userId:user_id, productId:product_id, createdAt:created_at, adminReply:admin_reply, adminReplyAt:admin_reply_at')
          .eq('product_id', productId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReviews(data as Review[]);
      } catch (error) {
        logger.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();

    // Subscribe to changes
    const channel = supabase
      .channel(`reviews:${productId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews', filter: `product_id=eq.${productId}` }, fetchReviews)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId]);

  useEffect(() => {
    const checkPurchase = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHasPurchased(false);
        return;
      }

      try {
        const result = await checkPurchasedProductAction(productId);
        setHasPurchased(result.purchased);
      } catch (error) {
        logger.error("Error checking purchase status:", error);
        setHasPurchased(false);
      }
    };

    checkPurchase();
  }, [productId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error(settings.pleaseLoginToReviewText?.[lang] || 'Please log in to leave a review.');
      return;
    }

    try {
      setSubmitting(true);
      const result = await submitProductReviewAction({
        productId,
        rating,
        comment,
      });

      if (!result.success) {
        throw new Error(result.error || result.message);
      }

      setComment('');
      toast.success(settings.reviewSubmittedText?.[lang] || result.message);
    } catch (error) {
      logger.error("Error submitting review:", error);
      toast.error(settings.failedToSubmitReviewText?.[lang] || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  }, []);

  return (
    <div className="mt-16 mb-16">
      <h2 className="text-[20px] md:text-[24px] font-bold text-brand-ink mb-8 tracking-tight">{settings.customerReviewsText?.[lang] || 'Customer Reviews'}</h2>
      
      {currentUser ? (
        hasPurchased === true ? (
          <form onSubmit={handleSubmit} className="mb-12 bg-zinc-50/50 p-6 sm:p-8 rounded-none border border-zinc-100">
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-600">Verified Purchase</span>
            </div>
            <h3 className="text-[12px] font-bold mb-4 text-slate-950 uppercase tracking-[0.2em]">{settings.leaveReviewText?.[lang] || 'Leave a Review'}</h3>
            <div className="flex gap-1 mb-6">
              {[1, 2, 3, 4, 5].map((r) => (
                <Star 
                  key={r} 
                  className={`w-6 h-6 cursor-pointer transition-all hover:scale-110 ${r <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-200 hover:text-yellow-300'}`}
                  onClick={() => setRating(r)}
                />
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-5 bg-white border border-zinc-200 rounded-none mb-6 focus:ring-2 focus:ring-brand-ink/5 focus:border-brand-ink transition-all text-sm font-medium placeholder:text-zinc-300"
              placeholder={settings.shareThoughtsPlaceholder?.[lang] || "Share your thoughts..."}
              rows={4}
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="bg-slate-950 text-white px-10 py-4 rounded-none text-[12px] font-bold uppercase tracking-[0.2em] hover:bg-slate-800 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : (settings.submitReviewButtonText?.[lang] || 'Submit Review')}
            </button>
          </form>
        ) : hasPurchased === false ? (
          <div className="mb-12 p-8 rounded-none border border-dashed border-slate-200 bg-slate-50/30 text-center">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-4" />
            <h3 className="text-[12px] font-bold text-slate-900 uppercase tracking-[0.2em] mb-2">Verified Reviews Only</h3>
            <p className="text-[14px] text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">
              To ensure the highest quality of feedback, only customers who have purchased this product can leave a review.
            </p>
          </div>
        ) : (
          <div className="mb-12 h-32 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-none animate-spin" />
          </div>
        )
      ) : (
        <div className="mb-12 p-8 rounded-none border border-dashed border-slate-200 bg-slate-50/30 text-center">
          <p className="text-[12px] text-slate-500 font-bold uppercase tracking-wider mb-4">Please log in to leave a review.</p>
          <button 
            onClick={() => window.location.href = '/auth'}
            className="text-[12px] font-bold uppercase tracking-[0.2em] text-slate-950 border-b-2 border-slate-950 pb-1 hover:opacity-70 transition-opacity"
          >
            Sign In Now
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">{settings.loadingReviewsText?.[lang] || 'Loading reviews...'}</p>
      ) : reviews.length === 0 ? (
        <p className="text-gray-500 text-sm">{settings.noReviewsText?.[lang] || 'No reviews yet. Be the first to review!'}</p>
      ) : (
        <div className="space-y-6">
          {reviews.map(review => (
            <div key={review.id} className="pb-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} />
                    ))}
                  </div>
                  <span className="font-bold text-[12px] uppercase tracking-wider text-slate-950">{review.userName}</span>
                </div>
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}</span>
              </div>
              <p className="text-gray-600 leading-relaxed text-sm font-light">{review.comment}</p>
              
              {review.adminReply && (
                <div className="mt-4 ml-6 p-4 bg-slate-50 rounded-none border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900">Admin Response</span>
                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">{review.adminReplyAt ? new Date(review.adminReplyAt).toLocaleDateString() : ''}</span>
                  </div>
                  <p className="text-slate-600 text-[14px] font-medium italic">"{review.adminReply}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

