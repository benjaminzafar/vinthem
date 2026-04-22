import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from './lib/locales';

const resources = {
  en: {
    translation: {
      "welcome": "Welcome to Nordic Webshop",
      "shop": "Shop",
      "admin": "Admin Dashboard",
      "cart": "Cart",
      "payment": "Payment",
      "products": "Products",
      "add_product": "Add Product",
      "generate_ai": "Generate with AI",
      "login": "Login",
      "logout": "Logout",
      "nordic_only": "Delivery only available for Nordic countries.",
      "language": "Language"
    }
  },
  sv: {
    translation: {
      "welcome": "Välkommen till Nordic Webshop",
      "shop": "Butik",
      "admin": "Adminpanel",
      "cart": "Kundvagn",
      "payment": "Betalning",
      "products": "Produkter",
      "add_product": "Lägg till produkt",
      "generate_ai": "Generera med AI",
      "login": "Logga in",
      "logout": "Logga ut",
      "nordic_only": "Leverans endast tillgänglig för nordiska länder.",
      "language": "Språk"
    }
  },
  fi: {
    translation: {
      "welcome": "Tervetuloa Nordic Webshopiin",
      "shop": "Kauppa",
      "admin": "Hallintapaneeli",
      "cart": "Ostoskori",
      "payment": "Maksu",
      "products": "Tuotteet",
      "add_product": "Lisää tuote",
      "generate_ai": "Luo tekoälyllä",
      "login": "Kirjaudu sisään",
      "logout": "Kirjaudu ulos",
      "nordic_only": "Toimitus vain Pohjoismaihin.",
      "language": "Kieli"
    }
  },
  da: {
    translation: {
      "welcome": "Velkommen til Nordic Webshop",
      "shop": "Butik",
      "admin": "Admin Dashboard",
      "cart": "Indkøbskurv",
      "payment": "Betaling",
      "products": "Produkter",
      "add_product": "Tilføj produkt",
      "generate_ai": "Generer med AI",
      "login": "Log ind",
      "logout": "Log ud",
      "nordic_only": "Levering kun tilgänglich for nordiske lande.",
      "language": "Sprog"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: DEFAULT_LOCALE,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: undefined, // Allow any language to be initialized
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
