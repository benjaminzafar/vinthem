import { createAdminClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Package } from 'lucide-react';

interface LabelPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderLabelPage({ params }: LabelPageProps) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !order) {
    notFound();
  }

  // Generate a mock barcode or use order ID
  const barcodeValue = order.order_id || order.id.slice(0, 12).toUpperCase();

  return (
    <div className="min-h-screen bg-white p-0 sm:p-8 flex justify-center items-start print:p-0">
      <div className="w-[4in] h-[6in] border-2 border-black p-6 flex flex-col justify-between bg-white overflow-hidden relative print:border-0 print:shadow-none print:m-0">
        
        {/* Header */}
        <div className="border-b-4 border-black pb-4 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">VINTHEM</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-1">Stockholm, Sweden</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest">PostNord Priority</p>
            <p className="text-xs font-black mt-1">1:1</p>
          </div>
        </div>

        {/* Shipping To */}
        <div className="mt-6 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Deliver To:</p>
          <div className="text-lg font-black uppercase leading-tight">
            <p>{order.shipping_details?.name || 'Customer'}</p>
            <p>{order.shipping_details?.address?.line1}</p>
            {order.shipping_details?.address?.line2 && <p>{order.shipping_details.address.line2}</p>}
            <p>{order.shipping_details?.address?.postal_code} {order.shipping_details?.address?.city}</p>
            <p>{order.shipping_details?.address?.country}</p>
          </div>
          
          <div className="mt-8 pt-4 border-t-2 border-black border-dotted">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Order Reference:</p>
            <p className="text-sm font-black">#{barcodeValue}</p>
          </div>
        </div>

        {/* Barcode Area */}
        <div className="mt-auto pt-6 border-t-4 border-black">
          <div className="flex flex-col items-center justify-center space-y-2">
            {/* Simple CSS Barcode Mockup */}
            <div className="flex h-16 w-full items-end gap-[1px] px-2">
              {Array.from({ length: 60 }).map((_, i) => {
                // Deterministic "random" look without Math.random()
                const pseudoRandom = (i * 13 + id.charCodeAt(i % id.length)) % 100;
                return (
                  <div 
                    key={i} 
                    className="bg-black" 
                    style={{ 
                      width: pseudoRandom > 50 ? '2px' : '4px',
                      height: `${40 + (pseudoRandom % 60)}%` 
                    }} 
                  />
                );
              })}
            </div>
            <p className="text-xs font-black tracking-[0.3em] uppercase">{barcodeValue}</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute top-1/2 -right-16 -rotate-90 origin-center text-[8px] font-bold uppercase tracking-[0.5em] text-slate-300">
          SCAN AT HUB • VINTHEM LOGISTICS
        </div>

        {/* Print Instruction (Hidden in Print) */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 print:hidden">
          <button 
            onClick={() => window.print()}
            className="bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
          >
            Confirm & Print Label
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; }
          @page { size: 4in 6in; margin: 0; }
          .print-hidden { display: none !important; }
        }
      `}} />
    </div>
  );
}
