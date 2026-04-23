
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface OTPVerificationProps {
  email: string;
  type?: 'signup' | 'magiclink' | 'recovery' | 'email_change';
  onSuccess?: () => void;
  lang?: string;
  labels?: {
    title?: string;
    subtitle?: string;
    checkSpam?: string;
    verifyButton?: string;
    clearButton?: string;
    errorFullCode?: string;
    errorInvalid?: string;
    successMessage?: string;
  };
}

export function OTPVerification({ 
  email, 
  type = 'signup', 
  onSuccess,
  lang,
  labels 
}: OTPVerificationProps) {
  const [otp, setOtp] = useState<string[]>(new Array(8).fill(""));
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const supabase = createClient();
  const router = useRouter();

  const L = {
    title: labels?.title || "Verify your email",
    subtitle: labels?.subtitle || "We've sent an 8-digit code to",
    checkSpam: labels?.checkSpam || "Don't see it? Please check your spam folder.",
    verifyButton: labels?.verifyButton || "Verify & Continue",
    clearButton: labels?.clearButton || "Clear and try again",
    errorFullCode: labels?.errorFullCode || "Please enter the full 8-digit code.",
    errorInvalid: labels?.errorInvalid || "Invalid or expired code.",
    successMessage: labels?.successMessage || "Identity verified successfully!"
  };

  // Focus the first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false;

    const newOtp = [...otp];
    newOtp[index] = element.value.slice(-1);
    setOtp(newOtp);

    if (element.value && index < 7) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const data = e.clipboardData.getData("text").slice(0, 8);
    if (!/^\d+$/.test(data)) return;

    const newOtp = [...otp];
    data.split("").forEach((char, index) => {
      if (index < 8) newOtp[index] = char;
    });
    setOtp(newOtp);
    
    const nextIndex = data.length < 8 ? data.length : 7;
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const token = otp.join("");
    
    if (token.length !== 8) {
      setError(L.errorFullCode);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: type === 'magiclink' ? 'magiclink' : type as any,
      });

      if (verifyError) throw verifyError;
      
      setIsSuccess(true);
      toast.success(L.successMessage);
      
      // Delay to allow success animation and session sync
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/${lang || 'en'}`);
          router.refresh();
        }
      }, 800);
    } catch (err: any) {
      setError(err.message || L.errorInvalid);
      toast.error(err.message || L.errorInvalid);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (otp.join("").length === 8 && !loading) {
      handleVerify();
    }
  }, [otp]);

  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-white border border-zinc-100 rounded shadow-2xl">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-zinc-900 rounded flex items-center justify-center mx-auto mb-6 shadow-xl shadow-zinc-900/20">
          <ShieldCheck className="w-8 h-8 text-white" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">{L.title}</h2>
        <div className="text-slate-500 text-sm space-y-1">
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success-msg"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-emerald-600 font-bold flex items-center justify-center gap-2 py-2"
              >
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                {L.successMessage}
              </motion.div>
            ) : (
              <motion.div key="info-msg" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p>{L.subtitle}</p>
                <p className="font-semibold text-slate-900 break-all">{email}</p>
                <p className="text-xs text-amber-600 bg-amber-50 py-1 px-3 rounded-full inline-block mt-2 font-medium">
                  {L.checkSpam}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <form onSubmit={handleVerify} className="space-y-8">
        <div className="grid grid-cols-4 gap-2 sm:gap-3" onPaste={handlePaste}>
          {otp.map((data, index) => (
            <input
              key={index}
              type="text"
              inputMode="numeric"
              maxLength={1}
              ref={(el) => { inputRefs.current[index] = el; }}
              value={data}
              onChange={(e) => handleChange(e.target, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`
                w-full h-12 sm:h-14 text-center text-lg font-bold bg-zinc-50 border-2 rounded transition-all duration-200 outline-none
                ${data ? 'border-zinc-900 bg-white ring-4 ring-zinc-900/5' : 'border-zinc-100 text-zinc-300 focus:border-zinc-400 focus:bg-white'}
                ${error ? 'border-red-500 ring-red-500/5' : ''}
              `}
              disabled={loading}
            />
          ))}
        </div>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded text-sm font-medium"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={loading || otp.join("").length !== 8}
          className={`
            w-full py-4 rounded font-bold tracking-tight transition-all active:scale-[0.98]
            flex items-center justify-center gap-2
            ${loading || otp.join("").length !== 8
              ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
              : 'bg-zinc-900 text-white hover:bg-black shadow-lg shadow-zinc-900/10'}
          `}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {L.verifyButton}...
            </>
          ) : (
            L.verifyButton
          )}
        </button>

        <div className="text-center">
          <button 
            type="button"
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            onClick={() => {
              setOtp(new Array(8).fill(""));
              inputRefs.current[0]?.focus();
            }}
          >
            {L.clearButton}
          </button>
        </div>
      </form>
    </div>
  );
}
