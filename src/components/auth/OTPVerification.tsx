
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
}

export function OTPVerification({ email, type = 'signup', onSuccess }: OTPVerificationProps) {
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const supabase = createClient();
  const router = useRouter();

  // Focus the first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false;

    const newOtp = [...otp];
    newOtp[index] = element.value.slice(-1); // Only take the last character
    setOtp(newOtp);

    // Move to next input if value is entered
    if (element.value && index < 5) {
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
    const data = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(data)) return;

    const newOtp = [...otp];
    data.split("").forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });
    setOtp(newOtp);
    
    // Focus the last input or the next empty one
    const nextIndex = data.length < 6 ? data.length : 5;
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const token = otp.join("");
    
    if (token.length !== 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: type === 'magiclink' ? 'magiclink' : type as any,
      });

      if (verifyError) throw verifyError;

      toast.success("Identity verified successfully!");
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Invalid or expired code.");
      toast.error(err.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-verify when OTP is complete
  useEffect(() => {
    if (otp.join("").length === 6 && !loading) {
      handleVerify();
    }
  }, [otp]);

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white border border-slate-100 rounded-3xl shadow-2xl shadow-slate-200/50">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-900/20">
          <ShieldCheck className="w-8 h-8 text-white" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Verify your email</h2>
        <p className="text-slate-500 text-sm">
          We've sent a 6-digit code to <br />
          <span className="font-semibold text-slate-900">{email}</span>
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-8">
        <div className="flex justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
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
                w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-bold bg-slate-50 border-2 rounded-xl transition-all duration-200 outline-none
                ${data ? 'border-slate-900 bg-white ring-4 ring-slate-900/5' : 'border-slate-100 text-slate-300 focus:border-slate-400 focus:bg-white'}
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
              className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={loading || otp.join("").length !== 6}
          className={`
            w-full py-4 rounded-xl font-bold tracking-tight transition-all active:scale-[0.98]
            flex items-center justify-center gap-2
            ${loading || otp.join("").length !== 6
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-slate-900 text-white hover:bg-black shadow-lg shadow-slate-900/10'}
          `}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify & Continue"
          )}
        </button>

        <div className="text-center">
          <button 
            type="button"
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            onClick={() => {
              setOtp(new Array(6).fill(""));
              inputRefs.current[0]?.focus();
            }}
          >
            Clear and try again
          </button>
        </div>
      </form>
    </div>
  );
}
