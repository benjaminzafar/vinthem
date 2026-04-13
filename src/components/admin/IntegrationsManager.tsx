"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { AdminHeader } from './AdminHeader';
import { Sparkles, ShoppingCart, Truck, DollarSign, Eye, EyeOff, Save, Database, Mail, RefreshCw, CheckCircle2, XCircle, HelpCircle, Users } from 'lucide-react';
import { toast } from 'sonner';
import { DhlLogo } from './DhlLogo';
import { ZohoLogo } from './ZohoLogo';
import { PostNordLogo } from './PostNordLogo';
import { DbSchenkerLogo } from './DbSchenkerLogo';
import { TutorialModal } from './TutorialModal';

const LOGOS: Record<string, string> = {
  'Gemini': 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg',
  'Instagram': 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg',
  'TikTok': 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Tiktok_icon.svg',
  'Reddit': 'https://upload.wikimedia.org/wikipedia/commons/b/b4/Reddit_logo.svg',
  'Facebook': 'https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg',
  'PostNord': 'https://upload.wikimedia.org/wikipedia/commons/7/7b/PostNord_logo.svg',
  'Bring': 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Brings_logo.svg',
  'DBSchenker': 'https://upload.wikimedia.org/wikipedia/commons/0/07/DB_Schenker_Logo.svg',
  'UPS': 'https://upload.wikimedia.org/wikipedia/commons/1/1b/UPS_Logo_Shield_2017.svg',
  'Stripe': 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo,_revised_2016.svg',
  'GoogleShopping': 'https://upload.wikimedia.org/wikipedia/en/a/ab/Google_Shopping_Logo_2025.svg',
};

const TUTORIALS: Record<string, React.ReactNode> = {
  'Gemini': (
    <ol className="list-decimal list-inside space-y-2">
      <li>Go to <a href="https://aistudio.google.com/" target="_blank" className="text-brand-ink underline">Google AI Studio</a>.</li>
      <li>Click "Get API key".</li>
      <li>Create a new API key in a new or existing project.</li>
      <li>Copy the key and paste it into the "Gemini API Key" field.</li>
    </ol>
  ),
  'Stripe': (
    <ol className="list-decimal list-inside space-y-2">
      <li>Log in to your <a href="https://dashboard.stripe.com/" target="_blank" className="text-brand-ink underline">Stripe Dashboard</a>.</li>
      <li>Go to "Developers" &gt; "API keys".</li>
      <li>Copy your "Secret key" and "Publishable key".</li>
      <li>For the Webhook secret, go to "Developers" &gt; "Webhooks" and create a new endpoint.</li>
    </ol>
  ),
  'Email': (
    <ol className="list-decimal list-inside space-y-2">
      <li>Log in to <a href="https://mail.zoho.com/" target="_blank" className="text-brand-ink underline">Zoho Mail</a>.</li>
      <li>Go to "Settings" &gt; "Mail Accounts" &gt; "IMAP/POP/SMTP".</li>
      <li>Enable IMAP/POP access.</li>
      <li>Use your Zoho email address as the user, your password, and the SMTP host/port provided by Zoho.</li>
    </ol>
  ),
  'Instagram': (
    <p>Please contact your Instagram Business account manager or use the Meta for Developers portal to generate your API Key, Catalog ID, and Business Account ID.</p>
  ),
  'TikTok': (
    <p>Please visit the <a href="https://ads.tiktok.com/" target="_blank" className="text-brand-ink underline">TikTok Ads Manager</a> to obtain your API Key, Shop ID, and set your Region.</p>
  ),
  'Reddit': (
    <p>Visit the <a href="https://ads.reddit.com/" target="_blank" className="text-brand-ink underline">Reddit Ads Dashboard</a> to generate your API Key and find your Ad Account ID.</p>
  ),
  'Facebook': (
    <p>Go to your <a href="https://business.facebook.com/" target="_blank" className="text-brand-ink underline">Facebook Business Manager</a> to find your Pixel ID and Catalog ID.</p>
  ),
  'PostNord': (
    <p>Log in to the <a href="https://portal.postnord.com/" target="_blank" className="text-brand-ink underline">PostNord Portal</a> to generate your API Key.</p>
  ),
  'DHL': (
    <p>Visit the <a href="https://developer.dhl.com/" target="_blank" className="text-brand-ink underline">DHL Developer Portal</a> to register your application and get your API Key.</p>
  ),
  'Bring': (
    <p>Log in to <a href="https://developer.bring.com/" target="_blank" className="text-brand-ink underline">Bring Developer Portal</a> to obtain your API credentials.</p>
  ),
  'DBSchenker': (
    <p>Contact your DB Schenker representative or visit their <a href="https://www.dbschenker.com/" target="_blank" className="text-brand-ink underline">official website</a> to request API access.</p>
  ),
  'UPS': (
    <p>Visit the <a href="https://www.ups.com/upsdeveloperkit" target="_blank" className="text-brand-ink underline">UPS Developer Kit</a> to register and obtain your API Key.</p>
  ),
  'GoogleShopping': (
    <ol className="list-decimal list-inside space-y-2">
      <li>Go to <a href="https://merchants.google.com/" target="_blank" className="text-brand-ink underline">Google Merchant Center</a>.</li>
      <li>Find your Merchant ID in the top right corner.</li>
      <li>Go to "Settings" &gt; "API Center" to manage your API keys.</li>
      <li>For OAuth credentials, visit the <a href="https://console.cloud.google.com/" target="_blank" className="text-brand-ink underline">Google Cloud Console</a>.</li>
    </ol>
  ),
};

export function IntegrationsManager() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [tutorial, setTutorial] = useState<{ isOpen: boolean, title: string, content: React.ReactNode } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const res = await fetch('/api/admin/integrations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      setConfig(data);
    } catch (error) {
      toast.error('Failed to load integrations config');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (section: string, keys: string[]) => {
    setSaving(section);
    try {
      const updates = keys.reduce((acc, key) => {
        // Only include if value has changed and is not the placeholder
        if (config[key] && config[key] !== '********') {
          acc[key] = config[key];
        }
        return acc;
      }, {} as Record<string, string>);

      // If no keys to update, just return
      if (Object.keys(updates).length === 0) {
        toast.info('No changes to save');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const res = await fetch('/api/admin/integrations/encrypt', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to encrypt and save settings');
      }

      toast.success(`${section} settings saved securely`);
      fetchConfig(); // Refresh to show connected status
    } catch (error: any) {
      toast.error(error.message || `Failed to save ${section} settings`);
    } finally {
      setSaving(null);
    }
  };

  const handleChange = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const toggleKeyVisibility = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderInput = (key: string, label: string, type: 'text' | 'password' | 'select' = 'text', options?: { value: string, label: string }[]) => {
    const isPassword = type === 'password';
    const show = showKeys[key];
    const inputType = isPassword && !show ? 'password' : 'text';

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-zinc-700 mb-1">{label}</label>
        <div className="relative">
          {type === 'select' ? (
            <select
              value={config[key] || ''}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:ring-brand-ink focus:border-brand-ink sm:text-sm"
            >
              {options?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <input
              type={inputType}
              value={config[key] || ''}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:ring-brand-ink focus:border-brand-ink sm:text-sm pr-10"
              placeholder={config[`${key}_CONNECTED`] ? '••••••••' : `Enter ${label}...`}
            />
          )}
          {isPassword && (
            <button
              type="button"
              onClick={() => toggleKeyVisibility(key)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderToggle = (key: string, label: string) => (
    <div className="flex items-center justify-between mb-4">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <button
        type="button"
        onClick={() => handleChange(key, config[key] === 'true' ? 'false' : 'true')}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-ink focus:ring-offset-2 ${config[key] === 'true' ? 'bg-brand-ink' : 'bg-zinc-200'}`}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${config[key] === 'true' ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Loading integrations...</div>;
  }

  const handleTestStripe = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const res = await fetch('/api/admin/stripe/validate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ secretKey: config['STRIPE_SECRET_KEY'] })
      });
      const data = await res.json();
      if (data.connected) toast.success('Stripe connected successfully');
      else toast.error('Stripe connection failed: ' + data.error);
    } catch (e) {
      toast.error('Failed to test Stripe');
    }
  };

  const handleTestEmail = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const res = await fetch('/api/admin/email/test', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user: config['ZOHO_USER'],
          pass: config['ZOHO_PASS'] === '********' ? undefined : config['ZOHO_PASS'],
          host: config['ZOHO_SMTP_HOST'],
          port: config['ZOHO_SMTP_PORT'],
          sender: config['ZOHO_SENDER_NAME']
        })
      });
      if (res.ok) toast.success('Test email sent successfully');
      else toast.error('Failed to send test email');
    } catch (e) {
      toast.error('Failed to send test email');
    }
  };

  const sections = [
    {
      id: 'Gemini',
      title: 'Gemini',
      icon: Sparkles,
      keys: ['GEMINI_MODEL', 'GEMINI_API_KEY'],
      checkKey: 'GEMINI_API_KEY',
      render: () => (
        <>
          {renderInput('GEMINI_MODEL', 'Model', 'select', [
            { value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro Preview' },
            { value: 'gemini-3.1-flash-lite-preview', label: 'Gemini 3.1 Flash Lite Preview' },
            { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash Preview' }
          ])}
          {renderInput('GEMINI_API_KEY', 'API Key', 'password')}
        </>
      )
    },
    {
        id: 'Instagram',
        title: 'Instagram',
        icon: ShoppingCart,
        keys: ['INSTAGRAM_API_KEY', 'INSTAGRAM_CATALOG_ID', 'INSTAGRAM_BUSINESS_ID'],
        checkKey: 'INSTAGRAM_API_KEY',
        render: () => (
          <>
            {renderInput('INSTAGRAM_API_KEY', 'Instagram API Key', 'password')}
            {renderInput('INSTAGRAM_CATALOG_ID', 'Catalog ID')}
            {renderInput('INSTAGRAM_BUSINESS_ID', 'Business Account ID')}
          </>
        )
      },
      {
        id: 'TikTok',
        title: 'TikTok',
        icon: ShoppingCart,
        keys: ['TIKTOK_API_KEY', 'TIKTOK_SHOP_ID', 'TIKTOK_REGION'],
        checkKey: 'TIKTOK_API_KEY',
        render: () => (
          <>
            {renderInput('TIKTOK_API_KEY', 'TikTok API Key', 'password')}
            {renderInput('TIKTOK_SHOP_ID', 'Shop ID')}
            {renderInput('TIKTOK_REGION', 'Region')}
          </>
        )
      },
      {
        id: 'Reddit',
        title: 'Reddit',
        icon: ShoppingCart,
        keys: ['REDDIT_API_KEY', 'REDDIT_AD_ACCOUNT_ID'],
        checkKey: 'REDDIT_API_KEY',
        render: () => (
          <>
            {renderInput('REDDIT_API_KEY', 'Reddit API Key', 'password')}
            {renderInput('REDDIT_AD_ACCOUNT_ID', 'Ad Account ID')}
          </>
        )
      },
      {
        id: 'Facebook',
        title: 'Facebook',
        icon: ShoppingCart,
        keys: ['FACEBOOK_PIXEL_ID', 'FACEBOOK_CATALOG_ID'],
        checkKey: 'FACEBOOK_PIXEL_ID',
        render: () => (
          <>
            {renderInput('FACEBOOK_PIXEL_ID', 'Facebook Pixel ID')}
            {renderInput('FACEBOOK_CATALOG_ID', 'Facebook Catalog ID')}
          </>
        )
      },
      {
        id: 'PostNord',
        title: 'PostNord',
        icon: Truck,
        keys: ['POSTNORD_API_KEY'],
        checkKey: 'POSTNORD_API_KEY',
        render: () => (
          <>
            {renderInput('POSTNORD_API_KEY', 'PostNord API Key', 'password')}
          </>
        )
      },
      {
        id: 'DHL',
        title: 'DHL',
        icon: Truck,
        keys: ['DHL_API_KEY'],
        checkKey: 'DHL_API_KEY',
        render: () => (
          <>
            {renderInput('DHL_API_KEY', 'DHL API Key', 'password')}
          </>
        )
      },
      {
        id: 'Bring',
        title: 'Bring',
        icon: Truck,
        keys: ['BRING_API_KEY'],
        checkKey: 'BRING_API_KEY',
        render: () => (
          <>
            {renderInput('BRING_API_KEY', 'Bring API Key', 'password')}
          </>
        )
      },
      {
        id: 'DBSchenker',
        title: 'DB Schenker',
        icon: Truck,
        keys: ['DBSCHENKER_API_KEY'],
        checkKey: 'DBSCHENKER_API_KEY',
        render: () => (
          <>
            {renderInput('DBSCHENKER_API_KEY', 'DB Schenker API Key', 'password')}
          </>
        )
      },
      {
        id: 'UPS',
        title: 'UPS',
        icon: Truck,
        keys: ['UPS_API_KEY'],
        checkKey: 'UPS_API_KEY',
        render: () => (
          <>
            {renderInput('UPS_API_KEY', 'UPS API Key', 'password')}
          </>
        )
      },
      {
        id: 'Stripe',
        title: 'Stripe',
        icon: DollarSign,
        keys: ['STRIPE_SECRET_KEY', 'VITE_STRIPE_PUBLIC_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_AUTO_CURRENCY', 'ACTIVE_MARKETS'],
        checkKey: 'STRIPE_SECRET_KEY',
        render: () => (
          <>
            {renderInput('STRIPE_SECRET_KEY', 'Stripe Secret Key', 'password')}
            {renderInput('VITE_STRIPE_PUBLIC_KEY', 'Stripe Public Key', 'password')}
            {renderInput('STRIPE_WEBHOOK_SECRET', 'Webhook Secret', 'password')}
            {renderToggle('STRIPE_AUTO_CURRENCY', 'Auto Currency Conversion')}
            {renderInput('ACTIVE_MARKETS', 'Active Markets (Sweden,Finland,Denmark)')}
            <button onClick={handleTestStripe} className="mt-2 text-sm text-brand-ink hover:underline">Test Stripe Connection</button>
          </>
        )
      },
      {
        id: 'Email',
        title: 'Zoho Mail',
        icon: Mail,
        keys: ['ZOHO_USER', 'ZOHO_PASS', 'ZOHO_SENDER_NAME', 'ZOHO_SMTP_HOST', 'ZOHO_SMTP_PORT'],
        checkKey: 'ZOHO_USER',
        render: () => (
          <>
            {renderInput('ZOHO_USER', 'Zoho User')}
            {renderInput('ZOHO_PASS', 'Zoho Password', 'password')}
            {renderInput('ZOHO_SENDER_NAME', 'Sender Name')}
            {renderInput('ZOHO_SMTP_HOST', 'SMTP Host')}
            {renderInput('ZOHO_SMTP_PORT', 'SMTP Port')}
            <button onClick={handleTestEmail} className="mt-2 text-sm text-brand-ink hover:underline">Send Test Email</button>
          </>
        )
      },
      {
        id: 'GoogleShopping',
        title: 'Google Shopping',
        icon: ShoppingCart,
        keys: ['GOOGLE_SHOPPING_MERCHANT_ID', 'GOOGLE_SHOPPING_API_KEY', 'GOOGLE_SHOPPING_CLIENT_ID', 'GOOGLE_SHOPPING_CLIENT_SECRET'],
        checkKey: 'GOOGLE_SHOPPING_MERCHANT_ID',
        render: () => (
          <>
            {renderInput('GOOGLE_SHOPPING_MERCHANT_ID', 'Merchant ID')}
            {renderInput('GOOGLE_SHOPPING_API_KEY', 'API Key', 'password')}
            {renderInput('GOOGLE_SHOPPING_CLIENT_ID', 'Client ID')}
            {renderInput('GOOGLE_SHOPPING_CLIENT_SECRET', 'Client Secret', 'password')}
          </>
        )
      }
  ];

  return (
    <div className="space-y-6">
      <AdminHeader 
        title="Integrations & Settings"
        description="Manage all third-party services and core configurations in one place."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.map(section => {
          const isConnected = config[`${section.checkKey}_CONNECTED`] === 'true';
          const logo = LOGOS[section.id];
          
          const renderLogo = () => {
            if (section.id === 'DHL') return <DhlLogo />;
            if (section.id === 'Email') return <ZohoLogo />;
            if (section.id === 'PostNord') return <PostNordLogo />;
            if (section.id === 'DBSchenker') return <DbSchenkerLogo />;
            if (logo) return <img src={logo} alt={section.title} referrerPolicy="no-referrer" className="w-full h-full object-contain" />;
            return <section.icon className="w-5 h-5 text-zinc-600" />;
          };

          return (
            <div key={section.id} className="bg-white border border-zinc-200 rounded-xl overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-white border border-zinc-200 flex items-center justify-center p-1">
                    {renderLogo()}
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900">{section.title}</h3>
                </div>
                <div className="flex items-center gap-3">
                  {TUTORIALS[section.id] && (
                    <button onClick={() => setTutorial({ isOpen: true, title: section.title, content: TUTORIALS[section.id] })} className="text-zinc-400 hover:text-brand-ink">
                      <HelpCircle className="w-5 h-5" />
                    </button>
                  )}
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-zinc-100 text-zinc-600 border border-zinc-200'}`}>
                    {isConnected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {isConnected ? 'Connected' : 'Not Connected'}
                  </div>
                </div>
              </div>
              
              <div className="p-6 flex-1">
                {section.render()}
              </div>
              
              <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 flex justify-end">
                <button
                  onClick={() => handleSave(section.id, section.keys)}
                  disabled={saving === section.id}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving === section.id ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {tutorial && (
        <TutorialModal
          isOpen={tutorial.isOpen}
          onClose={() => setTutorial(null)}
          title={tutorial.title}
          content={tutorial.content}
        />
      )}
    </div>
  );
}
