"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
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

  const L = {
    title: labels?.title || "Verification Required",
    subtitle: labels?.subtitle || "Enter the 8-digit code sent to",
    checkSpam: labels?.checkSpam || "Check your spam folder if missing.",
    verifyButton: labels?.verifyButton || "Confirm & Proceed",
    clearButton: labels?.clearButton || "Reset Code",
    errorFullCode: labels?.errorFullCode || "8 digits required.",
    errorInvalid: labels?.errorInvalid || "Invalid or expired code.",
    successMessage: labels?.successMessage || "Identity verified."
  };

  useEffect(() => {
    if (inputRefs.current[0]) inputRefs.current[0].focus();
  }, []);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;
    const newOtp = [...otp];
    newOtp[index] = element.value.slice(-1);
    setOtp(newOtp);
    if (element.value && index < 7) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleVerify = async () => {
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
      setTimeout(() => { if (onSuccess) onSuccess(); }, 500);
    } catch (err: any) {
      setError(err.message || L.errorInvalid);
      toast.error(err.message || L.errorInvalid);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (otp.join("").length === 8 && !loading) handleVerify();
  }, [otp]);

  return (
    <div className="w-full bg-white border border-zinc-100 p-8 shadow-2xl rounded">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-zinc-900 flex items-center justify-center mx-auto mb-6 rounded">
          <ShieldCheck className="w-6 h-6 text-white" strokeWidth={1} />
        </div>
        <h2 className="text-xl font-black uppercase tracking-widest text-zinc-900 mb-2">{L.title}</h2>
        <div className="text-zinc-500 text-[10px] space-y-1 uppercase font-bold tracking-tight">
          <p>{L.subtitle}</p>
          <p className="text-zinc-900 break-all">{email}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-8">
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
            className="w-full h-12 text-center text-lg font-bold bg-zinc-50 border border-zinc-200 focus:border-zinc-900 transition-all outline-none rounded disabled:opacity-50"
            disabled={loading}
          />
        ))}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mb-6 text-red-600 text-[10px] font-bold uppercase tracking-widest">
            <AlertCircle className="w-3 h-3" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={handleVerify}
        disabled={loading || otp.join("").length !== 8}
        className="w-full py-4 bg-zinc-900 text-white text-[11px] font-black uppercase tracking-[0.25em] transition-all hover:bg-black disabled:opacity-50 rounded flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : L.verifyButton}
      </button>

      <div className="mt-6 text-center">
        <button onClick={() => setOtp(new Array(8).fill(""))} className="text-[10px] font-bold text-zinc-400 hover:text-zinc-900 uppercase tracking-widest">
          {L.clearButton}
        </button>
      </div>
    </div>
  );
}
