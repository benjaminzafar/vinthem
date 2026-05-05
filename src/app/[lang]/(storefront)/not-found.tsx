import Link from 'next/link';
import { getServerLocale } from '@/lib/server-locale';
import { getSettings } from '@/lib/data';

export default async function NotFound() {
  const lang = await getServerLocale();
  const settings = await getSettings();

  const labels = {
    title: {
      en: 'Page Not Found',
      sv: 'Sidan hittades inte',
      fi: 'Sivua ei löytynyt',
      da: 'Siden blev ikke fundet',
      de: 'Seite nicht gefunden'
    },
    description: {
      en: 'The page you are looking for doesn\'t exist or has been moved.',
      sv: 'Sidan du letar efter finns inte eller har flyttats.',
      fi: 'Etsimääsi sivua ei ole olemassa tai se on siirretty.',
      da: 'Siden, du leder efter, findes ikke eller er blevet flyttet.',
      de: 'Die gesuchte Seite existiert nicht oder wurde verschoben.'
    },
    button: {
      en: 'Return Home',
      sv: 'Tillbaka hem',
      fi: 'Palaa kotiin',
      da: 'Gå tilbage til forsiden',
      de: 'Zurück zur Startseite'
    }
  };

  const localizedLabels = {
    title: labels.title[lang as keyof typeof labels.title] || labels.title.en,
    description: labels.description[lang as keyof typeof labels.description] || labels.description.en,
    button: labels.button[lang as keyof typeof labels.button] || labels.button.en
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center bg-white py-24">
      <h1 className="text-8xl md:text-9xl font-black text-brand-ink mb-6 tracking-tighter italic uppercase opacity-10">404</h1>
      <h2 className="text-3xl font-bold text-brand-ink mb-6 tracking-tight">{localizedLabels.title}</h2>
      <p className="text-slate-500 max-w-md mx-auto mb-12 text-[15px] leading-relaxed">
        {localizedLabels.description}
      </p>
      <Link 
        href={`/${lang}`}
        className="px-10 py-5 bg-brand-ink text-white text-[13px] font-bold uppercase tracking-widest hover:bg-brand-muted transition-all rounded-none"
      >
        {localizedLabels.button}
      </Link>
    </div>
  );
}
