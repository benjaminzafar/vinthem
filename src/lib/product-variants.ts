import type { ProductOption, ProductVariant } from '@/store/useCartStore';

function createVariantId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2, 10);
}

export function buildVariantsFromOptions(
  options: ProductOption[],
  existingVariants: ProductVariant[],
  basePrice: number,
  baseSku: string
): ProductVariant[] {
  const validOptions = options.filter((option) => option.name && option.values.length > 0);
  if (validOptions.length === 0) {
    return [];
  }

  const combinations: Record<string, string>[] = [{}];

  for (const option of validOptions) {
    const currentCombinations = [...combinations];
    combinations.length = 0;

    for (const combination of currentCombinations) {
      for (const value of option.values) {
        combinations.push({ ...combination, [option.name]: value });
      }
    }
  }

  return combinations.map((combination) => {
    const existingVariant = existingVariants.find((variant) => {
      if (!variant.options) {
        return false;
      }

      return Object.keys(combination).every((key) => variant.options?.[key] === combination[key])
        && Object.keys(variant.options).every((key) => variant.options?.[key] === combination[key]);
    });

    if (existingVariant) {
      return existingVariant;
    }

    const suffix = Object.values(combination).join('-');

    return {
      id: createVariantId(),
      options: combination,
      stock: 0,
      price: basePrice,
      sku: baseSku ? `${baseSku}-${suffix}`.toUpperCase() : '',
      imageUrl: '',
    };
  });
}

export function normalizeOptionValues(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) => String(value).trim())
    .filter(Boolean);
}

export function normalizeProductOptions(rawOptions: unknown): ProductOption[] {
  if (!Array.isArray(rawOptions)) {
    return [];
  }

  return rawOptions
    .map((option) => {
      if (!option || typeof option !== 'object') {
        return null;
      }

      const optionRecord = option as { name?: unknown; values?: unknown };
      const name = String(optionRecord.name ?? '').trim();
      const values = normalizeOptionValues(optionRecord.values);

      if (!name || values.length === 0) {
        return null;
      }

      return { name, values };
    })
    .filter((option): option is ProductOption => Boolean(option));
}

export function inferOptionsFromLegacyArrays(data: {
  colors?: unknown;
  sizes?: unknown;
  material?: unknown;
}): ProductOption[] {
  const options: ProductOption[] = [];
  const colors = normalizeOptionValues(data.colors);
  const sizes = normalizeOptionValues(data.sizes);
  const material = normalizeOptionValues(data.material);

  if (colors.length > 0) {
    options.push({ name: 'Color', values: colors });
  }

  if (sizes.length > 0) {
    options.push({ name: 'Size', values: sizes });
  }

  if (material.length > 0) {
    options.push({ name: 'Material', values: material });
  }

  return options;
}

export function normalizeGeneratedVariants(
  rawVariants: unknown,
  basePrice: number,
  baseSku: string
): ProductVariant[] {
  if (!Array.isArray(rawVariants)) {
    return [];
  }

  const mappedVariants = rawVariants
    .map((variant): ProductVariant | null => {
      if (!variant || typeof variant !== 'object') {
        return null;
      }

      const variantRecord = variant as {
        options?: unknown;
        price?: unknown;
        stock?: unknown;
        sku?: unknown;
        imageUrl?: unknown;
      };

      if (!variantRecord.options || typeof variantRecord.options !== 'object') {
        return null;
      }

      const options = Object.fromEntries(
        Object.entries(variantRecord.options as Record<string, unknown>)
          .map(([key, value]) => [key, String(value ?? '').trim()])
          .filter(([, value]) => Boolean(value))
      );

      if (Object.keys(options).length === 0) {
        return null;
      }

      const rawPrice = Number(variantRecord.price);
      const rawStock = Number(variantRecord.stock);

      return {
        id: createVariantId(),
        options,
        price: Number.isFinite(rawPrice) ? rawPrice : basePrice,
        stock: Number.isFinite(rawStock) ? rawStock : 0,
        sku: String(variantRecord.sku ?? baseSku ?? '').trim(),
        imageUrl: String(variantRecord.imageUrl ?? '').trim(),
      };
    })
    .filter((variant): variant is ProductVariant => variant !== null);

  return mappedVariants;
}
