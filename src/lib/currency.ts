export const formatPrice = (price: number, lang: string = 'sv', prices?: Record<string, number>, overrideCurrency?: string) => {
  const currency = overrideCurrency?.toUpperCase() || (lang === 'en' ? 'USD' : (lang === 'fi' ? 'EUR' : (lang === 'da' ? 'DKK' : 'SEK')));
  
  const displayPrice = (prices && prices[currency]) ? prices[currency] : price;

  if (currency === 'USD') return `$${displayPrice}`;
  if (currency === 'EUR') return `€${displayPrice}`;
  if (currency === 'DKK') return `kr ${displayPrice} DKK`;
  
  return `kr ${displayPrice}`;
};
