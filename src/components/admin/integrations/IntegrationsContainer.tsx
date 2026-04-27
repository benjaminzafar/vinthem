"use client";

import React, { useState, useTransition } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Megaphone, Truck, Settings2, 
  ShieldCheck, Loader2, Search, Globe, Activity 
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminHeader } from '../AdminHeader';
import { IntegrationCard } from './IntegrationCard';
import { CredentialInput } from './CredentialInput';
import { SUPPORTED_LOCALES } from '@/lib/locales';
import { 
  saveIntegrationAction, 
  testStripeConnectionAction, 
  testBrevoApiAction 
} from '@/app/actions/integrations';

// Category Definitions - Sharp Styling
const CATEGORIES = [
  { id: 'ai', name: 'Intelligence', icon: Sparkles, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'marketing', name: 'Growth & Ads', icon: Megaphone, color: 'text-rose-600', bg: 'bg-rose-50' },
  { id: 'shipping', name: 'Logistics', icon: Truck, color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 'system', name: 'Core Infrastructure', icon: Settings2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
];

export function IntegrationsContainer({ 
  initialConfig,
  activeLanguages 
}: { 
  initialConfig: Record<string, string>;
  activeLanguages?: string[];
}) {
  const [activeCategory, setActiveCategory] = useState('ai');
  const [config, setConfig] = useState<Record<string, string>>(initialConfig || {});
  const [, startTransition] = useTransition();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isLoading] = useState(false);

  // Use dynamic languages from prop or fallback to core locales
  const locales = activeLanguages || SUPPORTED_LOCALES;

  const handleUpdate = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (sectionId: string, keys: string[]) => {
    const updates = keys.reduce((acc, key) => {
      if (config[key] && config[key] !== '********') {
        acc[key] = config[key];
      }
      return acc;
    }, {} as Record<string, string>);

    if (Object.keys(updates).length === 0) {
      toast.info('No new changes to synchronize');
      return;
    }

    setSavingId(sectionId);
    startTransition(async () => {
      const result = await saveIntegrationAction(updates);
      if (result.success) {
        toast.success(`${sectionId} settings synchronized and encrypted`);
        const maskedUpdates = keys.reduce((acc, key) => {
           acc[key] = '********';
           acc[`${key}_CONNECTED`] = 'true';
           return acc;
        }, {} as Record<string, string>);
        setConfig(prev => ({ ...prev, ...maskedUpdates }));
      } else {
        toast.error(result.message);
      }
      setSavingId(null);
    });
  };

  const handleTestStripe = async () => {
    const toastId = toast.loading('Establishing secure connection to Stripe...');
    const result = await testStripeConnectionAction(config['STRIPE_SECRET_KEY']);
    if (result.success) toast.success(result.message, { id: toastId });
    else toast.error(result.message, { id: toastId });
  };

  const handleTestBrevo = async () => {
    const toastId = toast.loading('Pinging Brevo API v3...');
    const result = await testBrevoApiAction(config['BREVO_API_KEY']);
    if (result.success) toast.success(result.message, { id: toastId });
    else toast.error(result.message, { id: toastId });
  };

  const getIntegrationIdsByCategory = (catId: string) => {
    switch (catId) {
      case 'ai': return ['Groq'];
      case 'marketing': return ['Clarity', 'Instagram', 'TikTok', 'Reddit', 'Facebook'];
      case 'shipping': return ['PostNord', 'DHL', 'Bring', 'DBSchenker', 'UPS'];
      case 'system': return ['Stripe', 'BrevoAPI', 'R2', 'GoogleShopping'];
      default: return [];
    }
  };

  // Generate dynamic keys for Brevo templates to ensure all LIVE locales are saved
  const getEmailTemplateKeys = () => {
    const baseKeys = ['BREVO_API_KEY', 'BREVO_LIST_ID', 'BREVO_ORDER_TEMPLATE_ID'];
    const statusPrefixes = ['BREVO_TPL_SIGNUP', 'BREVO_TPL_ORDER', 'BREVO_TPL_RETURN_APPROVE', 'BREVO_TPL_RETURN_RECEIVED', 'BREVO_TPL_REFUND_DONE'];
    
    statusPrefixes.forEach(prefix => {
      locales.forEach(lang => {
        baseKeys.push(`${prefix}_${lang.toUpperCase()}`);
      });
    });
    
    return baseKeys;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-md border border-zinc-100">
        <Loader2 className="w-10 h-10 animate-spin text-zinc-300 mb-4" />
        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Waking Up Infrastructure...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AdminHeader 
        title="Integrations & Settings"
        description="Manage the neural network of your e-commerce ecosystem."
        statsLabel={`${Object.keys(config).filter(k => k.includes('_CONNECTED')).length} SERVICES LIVE`}
      />

      {/* Category Tabs - Sharp Style */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-zinc-100 mb-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 text-[13px] font-bold transition-all whitespace-nowrap rounded-md ${activeCategory === cat.id ? `${cat.bg} ${cat.color} ring-1 ring-inset ring-current/10` : 'text-zinc-500 hover:bg-zinc-100'}`}
          >
            <cat.icon className="w-4 h-4" />
            {cat.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <AnimatePresence mode="wait">
           {getIntegrationIdsByCategory(activeCategory).map(id => (
             <motion.div
               key={`${activeCategory}-${id}`}
               initial={{ opacity: 0, y: 5 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -5 }}
               transition={{ duration: 0.2 }}
             >
               {id === 'Clarity' && (
                 <IntegrationCard
                    id="Clarity"
                    title="Microsoft Clarity (Recordings)"
                    logo={<Activity className="text-blue-600" />}
                    isConnected={config['CLARITY_ID_CONNECTED'] === 'true'}
                    isSaving={savingId === 'Clarity'}
                    onSave={() => handleSave('Clarity', ['CLARITY_ID'])}
                  >
                    <CredentialInput label="Clarity Project ID" value={config['CLARITY_ID']} onChange={v => handleUpdate('CLARITY_ID', v)} placeholder="wcb4auvfrs" />
                  </IntegrationCard>
               )}
               {id === 'Groq' && (
                 <IntegrationCard
                    id="Groq"
                    title="Groq AI (LPU High-Speed)"
                    logo={<Sparkles className="text-indigo-600" />}
                    isConnected={config['GROQ_API_KEY_CONNECTED'] === 'true'}
                    isSaving={savingId === 'Groq'}
                    onSave={() => handleSave('Groq', ['GROQ_MODEL', 'GROQ_API_KEY'])}
                    tutorial={<p>Get your API key at console.groq.com. Use Llama 3.3 for the best balance of speed and power.</p>}
                  >
                    <CredentialInput 
                      label="Model Selection" 
                      value={config['GROQ_MODEL']} 
                      onChange={v => handleUpdate('GROQ_MODEL', v)} 
                      type="select"
                      options={[
                        { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (Versatile/Fast)' },
                        { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B (Instant Speed)' },
                        { value: 'llama-3.2-11b-vision-preview', label: 'Llama 3.2 11B Vision (Image Analysis)' }
                      ]}
                    />
                    <CredentialInput 
                      label="Groq API Key" 
                      value={config['GROQ_API_KEY']} 
                      onChange={v => handleUpdate('GROQ_API_KEY', v)} 
                      type="password"
                      placeholder="gsk_..."
                    />
                  </IntegrationCard>
               )}
               {id === 'Instagram' && (
                 <IntegrationCard
                    id="Instagram"
                    title="Instagram Business"
                    logo={<Image src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg" alt="Instagram" width={32} height={32} className="w-full h-full object-contain" />}
                    isConnected={config['INSTAGRAM_API_KEY_CONNECTED'] === 'true'}
                    isSaving={savingId === 'Instagram'}
                    onSave={() => handleSave('Instagram', ['INSTAGRAM_API_KEY', 'INSTAGRAM_CATALOG_ID', 'INSTAGRAM_BUSINESS_ID'])}
                  >
                    <CredentialInput label="API Key" value={config['INSTAGRAM_API_KEY']} onChange={v => handleUpdate('INSTAGRAM_API_KEY', v)} type="password" />
                    <CredentialInput label="Catalog ID" value={config['INSTAGRAM_CATALOG_ID']} onChange={v => handleUpdate('INSTAGRAM_CATALOG_ID', v)} />
                    <CredentialInput label="Business Account ID" value={config['INSTAGRAM_BUSINESS_ID']} onChange={v => handleUpdate('INSTAGRAM_BUSINESS_ID', v)} />
                  </IntegrationCard>
               )}
               {id === 'TikTok' && (
                 <IntegrationCard
                    id="TikTok"
                    title="TikTok Shop"
                    logo={<Image src="https://upload.wikimedia.org/wikipedia/commons/a/a6/Tiktok_icon.svg" alt="TikTok" width={32} height={32} className="w-full h-full object-contain" />}
                    isConnected={config['TIKTOK_API_KEY_CONNECTED'] === 'true'}
                    isSaving={savingId === 'TikTok'}
                    onSave={() => handleSave('TikTok', ['TIKTOK_API_KEY', 'TIKTOK_SHOP_ID', 'TIKTOK_REGION'])}
                  >
                    <CredentialInput label="TikTok API Key" value={config['TIKTOK_API_KEY']} onChange={v => handleUpdate('TIKTOK_API_KEY', v)} type="password" />
                    <CredentialInput label="Shop ID" value={config['TIKTOK_SHOP_ID']} onChange={v => handleUpdate('TIKTOK_SHOP_ID', v)} />
                    <CredentialInput label="Region" value={config['TIKTOK_REGION']} onChange={v => handleUpdate('TIKTOK_REGION', v)} />
                  </IntegrationCard>
               )}
               {id === 'Reddit' && (
                 <IntegrationCard
                    id="Reddit"
                    title="Reddit Ads"
                    logo={<Image src="https://upload.wikimedia.org/wikipedia/commons/b/b4/Reddit_logo.svg" alt="Reddit" width={32} height={32} className="w-full h-full object-contain" />}
                    isConnected={config['REDDIT_API_KEY_CONNECTED'] === 'true'}
                    isSaving={savingId === 'Reddit'}
                    onSave={() => handleSave('Reddit', ['REDDIT_API_KEY', 'REDDIT_AD_ACCOUNT_ID'])}
                  >
                    <CredentialInput label="Reddit API Key" value={config['REDDIT_API_KEY']} onChange={v => handleUpdate('REDDIT_API_KEY', v)} type="password" />
                    <CredentialInput label="Ad Account ID" value={config['REDDIT_AD_ACCOUNT_ID']} onChange={v => handleUpdate('REDDIT_AD_ACCOUNT_ID', v)} />
                  </IntegrationCard>
               )}
               {id === 'Facebook' && (
                 <IntegrationCard
                    id="Facebook"
                    title="Facebook Marketing"
                    logo={<Image src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" alt="Facebook" width={32} height={32} className="w-full h-full object-contain" />}
                    isConnected={config['FACEBOOK_PIXEL_ID_CONNECTED'] === 'true'}
                    isSaving={savingId === 'Facebook'}
                    onSave={() => handleSave('Facebook', ['FACEBOOK_PIXEL_ID', 'FACEBOOK_CATALOG_ID'])}
                  >
                    <CredentialInput label="Pixel ID" value={config['FACEBOOK_PIXEL_ID']} onChange={v => handleUpdate('FACEBOOK_PIXEL_ID', v)} />
                    <CredentialInput label="Catalog ID" value={config['FACEBOOK_CATALOG_ID']} onChange={v => handleUpdate('FACEBOOK_CATALOG_ID', v)} />
                  </IntegrationCard>
               )}
               {id === 'PostNord' && (
                 <IntegrationCard
                    id="PostNord"
                    title="PostNord Logistics"
                    logo={<Image src="https://upload.wikimedia.org/wikipedia/commons/7/7b/PostNord_logo.svg" alt="PostNord" width={32} height={32} className="w-full h-full object-contain" />}
                    isConnected={config['POSTNORD_API_KEY_CONNECTED'] === 'true'}
                    isSaving={savingId === 'PostNord'}
                    onSave={() => handleSave('PostNord', ['POSTNORD_API_KEY'])}
                  >
                    <CredentialInput label="PostNord API Key" value={config['POSTNORD_API_KEY']} onChange={v => handleUpdate('POSTNORD_API_KEY', v)} type="password" />
                  </IntegrationCard>
               )}
               {id === 'DHL' && (
                 <IntegrationCard
                    id="DHL"
                    title="DHL Express"
                    logo={<div className="bg-[#fc0] w-full h-full flex items-center justify-center font-black text-rose-600 italic leading-none text-xs">DHL</div>}
                    isConnected={config['DHL_API_KEY_CONNECTED'] === 'true'}
                    isSaving={savingId === 'DHL'}
                    onSave={() => handleSave('DHL', ['DHL_API_KEY'])}
                  >
                    <CredentialInput label="DHL API Key" value={config['DHL_API_KEY']} onChange={v => handleUpdate('DHL_API_KEY', v)} type="password" />
                  </IntegrationCard>
               )}
               {id === 'Bring' && (
                 <IntegrationCard
                    id="Bring"
                    title="Bring (Norway/Nordic)"
                    logo={<Image src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Brings_logo.svg" alt="Bring" width={32} height={32} className="w-full h-full object-contain" />}
                    isConnected={config['BRING_API_KEY_CONNECTED'] === 'true'}
                    isSaving={savingId === 'Bring'}
                    onSave={() => handleSave('Bring', ['BRING_API_KEY'])}
                  >
                    <CredentialInput label="Bring API Key" value={config['BRING_API_KEY']} onChange={v => handleUpdate('BRING_API_KEY', v)} type="password" />
                  </IntegrationCard>
               )}
               {id === 'DBSchenker' && (
                 <IntegrationCard
                    id="DBSchenker"
                    title="DB Schenker"
                    logo={<Image src="https://upload.wikimedia.org/wikipedia/commons/0/07/DB_Schenker_Logo.svg" alt="DB Schenker" width={32} height={32} className="w-full h-full object-contain" />}
                    isConnected={config['DBSCHENKER_API_KEY_CONNECTED'] === 'true'}
                    isSaving={savingId === 'DBSchenker'}
                    onSave={() => handleSave('DBSchenker', ['DBSCHENKER_API_KEY'])}
                  >
                    <CredentialInput label="DB Schenker API Key" value={config['DBSCHENKER_API_KEY']} onChange={v => handleUpdate('DBSCHENKER_API_KEY', v)} type="password" />
                  </IntegrationCard>
               )}
               {id === 'UPS' && (
                 <IntegrationCard
                    id="UPS"
                    title="UPS Global"
                    logo={<Image src="https://upload.wikimedia.org/wikipedia/commons/1/1b/UPS_Logo_Shield_2017.svg" alt="UPS" width={32} height={32} className="w-full h-full object-contain" />}
                    isConnected={config['UPS_API_KEY_CONNECTED'] === 'true'}
                    isSaving={savingId === 'UPS'}
                    onSave={() => handleSave('UPS', ['UPS_API_KEY'])}
                  >
                    <CredentialInput label="UPS API Key" value={config['UPS_API_KEY']} onChange={v => handleUpdate('UPS_API_KEY', v)} type="password" />
                  </IntegrationCard>
               )}
               {id === 'Stripe' && (
                 <IntegrationCard
                    id="Stripe"
                    title="Stripe Payments"
                    logo={<Image src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo,_revised_2016.svg" alt="Stripe" width={48} height={48} className="w-full h-full object-contain" />}
                    isConnected={config['STRIPE_SECRET_KEY_CONNECTED'] === 'true'}
                    isSaving={savingId === 'Stripe'}
                    onSave={() => handleSave('Stripe', ['STRIPE_SECRET_KEY', 'VITE_STRIPE_PUBLIC_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_AUTO_CURRENCY', 'ACTIVE_MARKETS'])}
                  >
                    <CredentialInput label="Stripe Secret Key" value={config['STRIPE_SECRET_KEY']} onChange={v => handleUpdate('STRIPE_SECRET_KEY', v)} type="password" />
                    <CredentialInput label="Stripe Public Key" value={config['VITE_STRIPE_PUBLIC_KEY']} onChange={v => handleUpdate('VITE_STRIPE_PUBLIC_KEY', v)} type="password" />
                    <CredentialInput label="Webhook Secret" value={config['STRIPE_WEBHOOK_SECRET']} onChange={v => handleUpdate('STRIPE_WEBHOOK_SECRET', v)} type="password" />
                    <CredentialInput label="Auto Currency Conversion" value={config['STRIPE_AUTO_CURRENCY']} onChange={v => handleUpdate('STRIPE_AUTO_CURRENCY', v)} type="toggle" />
                    <CredentialInput label="Active Markets" value={config['ACTIVE_MARKETS']} onChange={v => handleUpdate('ACTIVE_MARKETS', v)} placeholder="Sweden,Finland,Denmark" />
                    <button onClick={handleTestStripe} className="text-[11px] font-bold text-zinc-600 hover:text-zinc-900 flex items-center gap-1 mt-2 transition-colors focus:outline-none">
                       <ShieldCheck className="w-3.5 h-3.5" /> Test Gateway Connection
                    </button>
                  </IntegrationCard>
               )}
               {id === 'BrevoAPI' && (
                  <IntegrationCard
                     id="BrevoAPI"
                     title="Brevo API Integration"
                     logo={<div className="bg-sky-600 w-full h-full flex items-center justify-center font-bold text-white leading-none tracking-tighter">BREVO</div>}
                     isConnected={config['BREVO_API_KEY_CONNECTED'] === 'true'}
                     isSaving={savingId === 'BrevoAPI'}
                     onSave={() => handleSave('BrevoAPI', getEmailTemplateKeys())}
                     tutorial={<p>Use the (v3) API Key found in your Brevo SMTP & API settings. All multilingual template mappings are managed here.</p>}
                  >
                     <div className="space-y-4">
                        <CredentialInput 
                           label="Brevo API Key" 
                           value={config['BREVO_API_KEY']} 
                           onChange={v => handleUpdate('BREVO_API_KEY', v)} 
                           type="password"
                           placeholder="xkeysib-..."
                        />
                        <div className="grid grid-cols-2 gap-4">
                           <CredentialInput 
                              label="Add to List ID" 
                              value={config['BREVO_LIST_ID']} 
                              onChange={v => handleUpdate('BREVO_LIST_ID', v)} 
                              placeholder="e.g. 2"
                           />
                           <CredentialInput 
                              label="Confirmation Template ID" 
                              value={config['BREVO_ORDER_TEMPLATE_ID']} 
                              onChange={v => handleUpdate('BREVO_ORDER_TEMPLATE_ID', v)} 
                              placeholder="e.g. 10"
                           />
                        </div>

                        <div className="pt-4 border-t border-zinc-100">
                           <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-4">Multilingual Template IDs</label>
                           
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
                             <TemplateGroup title="Signup" prefix="BREVO_TPL_SIGNUP" config={config} onUpdate={handleUpdate} locales={locales} />
                             <TemplateGroup title="Order Conf" prefix="BREVO_TPL_ORDER" config={config} onUpdate={handleUpdate} locales={locales} />
                             <TemplateGroup title="Return Approve" prefix="BREVO_TPL_RETURN_APPROVE" config={config} onUpdate={handleUpdate} locales={locales} />
                             <TemplateGroup title="Item Received" prefix="BREVO_TPL_RETURN_RECEIVED" config={config} onUpdate={handleUpdate} locales={locales} />
                             <TemplateGroup title="Refund Done" prefix="BREVO_TPL_REFUND_DONE" config={config} onUpdate={handleUpdate} locales={locales} />
                           </div>
                        </div>
                     </div>
                     <button onClick={handleTestBrevo} className="text-[11px] font-bold text-zinc-600 hover:text-zinc-900 flex items-center gap-1 mt-2 transition-colors focus:outline-none">
                        <Activity className="w-3.5 h-3.5" /> Verify API Connection
                     </button>
                  </IntegrationCard>
               )}
               {id === 'R2' && (
                 <IntegrationCard
                    id="R2"
                    title="Cloudflare R2 Storage"
                    logo={<div className="bg-white w-full h-full flex items-center justify-center font-bold text-orange-500 leading-none text-[10px]">R2</div>}
                    isConnected={config['R2_SECRET_ACCESS_KEY_CONNECTED'] === 'true'}
                    isSaving={savingId === 'R2'}
                    onSave={() => handleSave('R2', ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'R2_PUBLIC_URL'])}
                    tutorial={<p>Credentials can be found in your Cloudflare dashboard under R2 &rarr; Manage R2 API Tokens.</p>}
                  >
                    <CredentialInput label="Account ID" value={config['R2_ACCOUNT_ID']} onChange={v => handleUpdate('R2_ACCOUNT_ID', v)} />
                    <CredentialInput label="Access Key ID" value={config['R2_ACCESS_KEY_ID']} onChange={v => handleUpdate('R2_ACCESS_KEY_ID', v)} />
                    <CredentialInput label="Secret Access Key" value={config['R2_SECRET_ACCESS_KEY']} onChange={v => handleUpdate('R2_SECRET_ACCESS_KEY', v)} type="password" />
                    <CredentialInput label="Bucket Name" value={config['R2_BUCKET_NAME']} onChange={v => handleUpdate('R2_BUCKET_NAME', v)} placeholder="e.g. my-shop-assets" />
                    <CredentialInput label="Public URL (Custom Domain or R2.dev)" value={config['R2_PUBLIC_URL']} onChange={v => handleUpdate('R2_PUBLIC_URL', v)} placeholder="https://pub-xyz.r2.dev" />
                  </IntegrationCard>
               )}
               {id === 'GoogleShopping' && (
                 <IntegrationCard
                    id="GoogleShopping"
                    title="Google Shopping"
                    logo={<Image src="https://upload.wikimedia.org/wikipedia/en/a/ab/Google_Shopping_Logo_2025.svg" alt="Google Shopping" width={32} height={32} className="w-full h-full object-contain" />}
                    isConnected={config['GOOGLE_SHOPPING_MERCHANT_ID_CONNECTED'] === 'true'}
                    isSaving={savingId === 'GoogleShopping'}
                    onSave={() => handleSave('GoogleShopping', ['GOOGLE_SHOPPING_MERCHANT_ID', 'GOOGLE_SHOPPING_API_KEY', 'GOOGLE_SHOPPING_CLIENT_ID', 'GOOGLE_SHOPPING_CLIENT_SECRET'])}
                  >
                    <CredentialInput label="Merchant ID" value={config['GOOGLE_SHOPPING_MERCHANT_ID']} onChange={v => handleUpdate('GOOGLE_SHOPPING_MERCHANT_ID', v)} />
                    <CredentialInput label="API Key" value={config['GOOGLE_SHOPPING_API_KEY']} onChange={v => handleUpdate('GOOGLE_SHOPPING_API_KEY', v)} type="password" />
                    <CredentialInput label="Client ID" value={config['GOOGLE_SHOPPING_CLIENT_ID']} onChange={v => handleUpdate('GOOGLE_SHOPPING_CLIENT_ID', v)} />
                    <CredentialInput label="Client Secret" value={config['GOOGLE_SHOPPING_CLIENT_SECRET']} onChange={v => handleUpdate('GOOGLE_SHOPPING_CLIENT_SECRET', v)} type="password" />
                  </IntegrationCard>
               )}
             </motion.div>
           ))}
        </AnimatePresence>
      </div>

      {/* Trust Message - Flat Style */}
      <div className="flex items-center gap-3 p-4 bg-zinc-50 border border-zinc-100 rounded-md mt-6">
         <div className="p-2 bg-white border border-zinc-100 rounded-md">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
         </div>
         <div className="flex-1">
            <p className="text-[11px] font-bold text-zinc-900 uppercase tracking-widest leading-none">Zero-Visibility Security Policy</p>
            <p className="text-[12px] text-zinc-500 font-medium mt-1">All API keys are AES-256 encrypted. Original values are permanently masked from browser view after synchronization.</p>
         </div>
      </div>
    </div>
  );
}

// Helper Components for Cleaner Multilingual UI
function TemplateGroup({ title, prefix, config, onUpdate, locales }: { 
  title: string, 
  prefix: string, 
  config: Record<string, string>, 
  onUpdate: (k: string, v: string) => void,
  locales: string[] | readonly string[]
}) {
  return (
    <div className="space-y-2">
      <h5 className="text-[11px] font-bold text-zinc-900 border-l-2 border-rose-500 pl-2 uppercase tracking-wider">{title}</h5>
      <div className="space-y-1">
        {locales.map(lang => (
          <LanguageInput 
            key={lang} 
            label={lang.toUpperCase()} 
            name={`${prefix}_${lang.toUpperCase()}`} 
            value={config[`${prefix}_${lang.toUpperCase()}`]} 
            onChange={onUpdate} 
          />
        ))}
      </div>
    </div>
  );
}

function LanguageInput({ label, name, value, onChange }: { 
  label: string, 
  name: string, 
  value: string | undefined, 
  onChange: (k: string, v: string) => void 
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-5 text-[9px] font-bold text-zinc-500">{label}</span>
      <input 
        type="text"
        value={value || ''}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder="ID"
        className="flex-1 bg-zinc-50 border border-zinc-100 rounded px-2 py-1 text-[11px] font-mono focus:outline-none focus:border-rose-300 transition-all font-bold"
      />
    </div>
  );
}
