import { resolveMarket } from '@/lib/markets';

const BASE_STORE_CURRENCY = 'SEK';

export function formatPrice(
  price: number,
  lang: string = 'sv',
  prices?: Record<string, number>,
  overrideCurrency?: string,
) {
  const market = resolveMarket(lang);
  const targetCurrency = (overrideCurrency?.toUpperCase() || market.currency) as string;
  const localizedPrice = prices?.[targetCurrency];
  const amount = typeof localizedPrice === 'number' ? localizedPrice : price;
  const formatterCurrency = typeof localizedPrice === 'number' || overrideCurrency
    ? targetCurrency
    : BASE_STORE_CURRENCY;

  return new Intl.NumberFormat(market.locale, {
    style: 'currency',
    currency: formatterCurrency,
    maximumFractionDigits: 2,
  }).format(amount);
}
