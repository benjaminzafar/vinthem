import { resolveMarket } from '@/lib/markets';

const BASE_STORE_CURRENCY = 'SEK';

export function formatPrice(
  price: number,
  lang: string = 'sv',
  prices?: Record<string, number>,
  overrideCurrency?: string,
) {
  const market = resolveMarket(lang);
  const formatterCurrency = overrideCurrency?.toUpperCase() || BASE_STORE_CURRENCY;
  const amount = price;

  return new Intl.NumberFormat(market.locale, {
    style: 'currency',
    currency: formatterCurrency,
    maximumFractionDigits: 2,
  }).format(amount);
}
