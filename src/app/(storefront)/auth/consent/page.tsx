import Image from 'next/image';
import { getSettings } from '@/lib/data';
import { ConsentForm } from '@/components/auth/ConsentForm';

export default async function ConsentPage({ params }: { params: { lang: string } }) {
  const settings = await getSettings();
  const lang = params.lang || 'en';

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-white overflow-hidden">
      {settings.authBackgroundImage && settings.authBackgroundImage.length > 5 && settings.authBackgroundImage.startsWith('h') && (
        <div className="absolute inset-0 z-0">
          <Image 
            src={settings.authBackgroundImage} 
            alt="Background" 
            fill
            className="object-cover opacity-100"
            priority
          />
        </div>
      )}
      <div className="relative z-10 w-full max-w-md">
        <ConsentForm lang={lang} />
      </div>
    </div>
  );
}
