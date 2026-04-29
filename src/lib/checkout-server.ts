import 'server-only';

import Stripe from 'stripe';

import { ALLOWED_SHIPPING_COUNTRIES, resolveMarket, resolveStripeCheckoutLocale } from '@/lib/markets';
import { getStripeClient } from '@/lib/stripe-server';
import { createAdminClient, createClient } from '@/utils/supabase/server';
import { getSettings } from '@/lib/data';

const BASE_CURRENCY = 'sek';
const SHIPPING_TAX_CODE = 'txcd_92010001';
const GENERAL_GOODS_TAX_CODE = 'txcd_99999999';
const DIGITAL_SERVICES_TAX_CODE = 'txcd_10000000';

const SHIPPING_RATES: Record<string, number> = {
  SE: 49,
  FI: 59,
  DK: 59,
  NO: 79,
  IS: 149,
};

export interface CheckoutItemInput {
  id: string;
  quantity: number;
}

export interface CheckoutShippingInput {
  name?: string;
  email?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export interface CheckoutEstimate {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  displayCurrency: string;
  marketLocale: string;
  taxBreakdown: Array<{ amount: number; rate?: number; jurisdiction?: string }>;
}

interface CategoryRow {
  id: string;
  name: string | null;
  slug: string | null;
}

interface ValidatedItem {
  id: string;
  title: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  categoryId: string | null;
  shippingClass: string | null;
  stripeTaxCode: string | null;
}

function sanitizeText(value: string | undefined, maxLength = 300): string {
  return (value || '').replace(/[<>]/g, '').trim().slice(0, maxLength);
}

export function sanitizeShippingDetails(input?: CheckoutShippingInput) {
  return {
    name: sanitizeText(input?.name, 120),
    email: sanitizeText(input?.email, 180),
    address: sanitizeText(input?.address, 240),
    city: sanitizeText(input?.city, 120),
    postalCode: sanitizeText(input?.postalCode, 32),
    country: sanitizeText(input?.country, 2).toUpperCase() || 'SE',
  };
}

function getShippingCost(country: string) {
  return SHIPPING_RATES[country] ?? SHIPPING_RATES.SE;
}

function resolveProductTaxCode(category?: CategoryRow, shippingClass?: string | null, explicitTaxCode?: string | null) {
  if (explicitTaxCode) {
    return explicitTaxCode;
  }

  const fingerprint = `${category?.slug || ''} ${category?.name || ''} ${shippingClass || ''}`.toLowerCase();

  if (fingerprint.includes('digital') || fingerprint.includes('download') || fingerprint.includes('software')) {
    return DIGITAL_SERVICES_TAX_CODE;
  }

  return GENERAL_GOODS_TAX_CODE;
}

async function loadValidatedItems(items: CheckoutItemInput[]) {
  const adminClient = createAdminClient();
  const productIds = [...new Set(items.map((item) => item.id))];
  const { data: products, error } = await adminClient
    .from('products')
    .select('id, title, price, sale_price, is_sale, category_id, shipping_class, stripe_tax_code')
    .in('id', productIds);

  if (error) {
    throw new Error(`Failed to load products: ${error.message}`);
  }

  const productsById = new Map<string, (typeof products extends Array<infer T> ? T : never)>(
    (products ?? []).map((product) => [product.id, product] as const),
  );
  const categoryIds = [...new Set((products ?? []).map((product) => product.category_id).filter(Boolean))];

  const categories = categoryIds.length > 0
    ? await adminClient.from('categories').select('id, name, slug').in('id', categoryIds)
    : { data: [], error: null };

  if (categories.error) {
    throw new Error(`Failed to load categories: ${categories.error.message}`);
  }

  const categoriesById = new Map<string, CategoryRow>(
    (categories.data ?? []).map((category) => [category.id, category as CategoryRow] as const),
  );
  const validatedItems: ValidatedItem[] = [];
  let subtotal = 0;

  for (const item of items) {
    const product = productsById.get(item.id);

    if (!product) {
      throw new Error(`Product not found: ${item.id}`);
    }

    const unitPrice = product.is_sale && product.sale_price
      ? Number(product.sale_price)
      : Number(product.price);
    const quantity = Math.max(1, Number.parseInt(String(item.quantity), 10) || 1);
    const lineSubtotal = unitPrice * quantity;

    subtotal += lineSubtotal;
    validatedItems.push({
      id: product.id,
      title: product.title,
      quantity,
      unitPrice,
      subtotal: lineSubtotal,
      categoryId: product.category_id,
      shippingClass: product.shipping_class,
      stripeTaxCode: product.stripe_tax_code,
    });
  }

  return {
    validatedItems,
    subtotal,
    categoriesById,
  };
}

async function createTaxEstimate(
  stripe: Stripe | null,
  shippingDetails: ReturnType<typeof sanitizeShippingDetails>,
  validatedItems: ValidatedItem[],
  categoriesById: Map<string, CategoryRow>,
  shippingCost: number,
) {
  if (!stripe) {
    return null;
  }

  const calculation = await stripe.tax.calculations.create({
    currency: BASE_CURRENCY,
    line_items: validatedItems.map((item) => ({
      amount: Math.round(item.subtotal * 100),
      quantity: item.quantity,
      reference: item.id,
      tax_behavior: 'exclusive',
      tax_code: resolveProductTaxCode(
        item.categoryId ? categoriesById.get(item.categoryId) : undefined,
        item.shippingClass,
        item.stripeTaxCode,
      ),
    })),
    customer_details: {
      address: {
        country: shippingDetails.country,
        postal_code: shippingDetails.postalCode || undefined,
        city: shippingDetails.city || undefined,
        line1: shippingDetails.address || undefined,
      },
      address_source: 'shipping',
      taxability_override: 'none',
    },
    shipping_cost: {
      amount: Math.round(shippingCost * 100),
      tax_behavior: 'exclusive',
      tax_code: SHIPPING_TAX_CODE,
    },
    ship_from_details: {
      address: {
        country: 'SE',
      },
    },
  });

  return calculation;
}

export async function estimateCheckout(
  items: CheckoutItemInput[],
  shippingInput?: CheckoutShippingInput,
  locale?: string,
): Promise<CheckoutEstimate> {
  const shippingDetails = sanitizeShippingDetails(shippingInput);
  const { validatedItems, subtotal, categoriesById } = await loadValidatedItems(items);
  const shipping = getShippingCost(shippingDetails.country);
  const market = resolveMarket(locale || shippingDetails.country);
  const stripe = await getStripeClient();
  const taxCalculation = await createTaxEstimate(stripe, shippingDetails, validatedItems, categoriesById, shipping);
  const tax = taxCalculation ? taxCalculation.amount_total / 100 - subtotal - shipping : 0;
  const total = subtotal + shipping + tax;
  const taxBreakdown = taxCalculation?.tax_breakdown?.map((entry) => ({
    amount: entry.amount / 100,
    rate: typeof entry.tax_rate_details?.percentage_decimal === 'string'
      ? Number(entry.tax_rate_details.percentage_decimal)
      : undefined,
  })) ?? [];

  return {
    subtotal,
    shipping,
    tax,
    total,
    currency: BASE_CURRENCY.toUpperCase(),
    displayCurrency: market.currency,
    marketLocale: market.locale,
    taxBreakdown,
  };
}

export async function startCheckout(
  items: CheckoutItemInput[],
  shippingInput?: CheckoutShippingInput,
  locale?: string,
) {
  const shippingDetails = sanitizeShippingDetails(shippingInput);
  const estimate = await estimateCheckout(items, shippingDetails, locale);
  const { validatedItems, categoriesById } = await loadValidatedItems(items);
  const market = resolveMarket(locale || shippingDetails.country);
  const stripe = await getStripeClient();
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: orderData, error: orderError } = await adminClient
    .from('orders')
    .insert({
      user_id: user?.id ?? null,
      customer_email: shippingDetails.email || null,
      items: validatedItems,
      total: estimate.total,
      currency: BASE_CURRENCY,
      status: 'Pending',
    })
    .select('id')
    .single();

  if (orderError || !orderData) {
    throw orderError || new Error('Failed to create order.');
  }

  if (!stripe) {
    return {
      success: true,
      mock: true,
      orderId: orderData.id,
      estimate,
    };
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    automatic_tax: { enabled: true },
    billing_address_collection: 'required',
    customer_creation: 'always',
    customer_email: shippingDetails.email || undefined,
    locale: resolveStripeCheckoutLocale(market.locale),
    metadata: {
      orderId: orderData.id,
      userId: user?.id ?? '',
    },
    shipping_address_collection: {
      allowed_countries: (await getSettings()).shippingCountries?.map(c => c.code.toUpperCase() as (typeof ALLOWED_SHIPPING_COUNTRIES)[number]) || [...ALLOWED_SHIPPING_COUNTRIES],
    },
    shipping_options: [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          display_name: 'PostNord',
          fixed_amount: {
            amount: Math.round(estimate.shipping * 100),
            currency: BASE_CURRENCY,
          },
          tax_behavior: 'exclusive',
          tax_code: SHIPPING_TAX_CODE,
        },
      },
    ],
    phone_number_collection: { enabled: true },
    line_items: validatedItems.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: BASE_CURRENCY,
        unit_amount: Math.round(item.unitPrice * 100),
        tax_behavior: 'exclusive',
        product_data: {
          name: item.title,
          tax_code: resolveProductTaxCode(
            item.categoryId ? categoriesById.get(item.categoryId) : undefined,
            item.shippingClass,
            item.stripeTaxCode,
          ),
        },
      },
    })),
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}${locale ? `/${locale}` : ''}/profile?checkout=success&order=${orderData.id}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}${locale ? `/${locale}` : ''}/payment?checkout=cancelled`,
  });

  return {
    success: true,
    mock: false,
    orderId: orderData.id,
    checkoutUrl: session.url,
    estimate,
  };
}
