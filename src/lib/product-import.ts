import type { ProductOption, ProductVariant } from '@/store/useCartStore';

type ParsedCatalogDraft = {
  title?: string;
  description?: string;
  stock?: number;
  sku?: string;
  tags?: string[];
  colors?: string[];
  sizes?: string[];
  options?: ProductOption[];
  variants?: ProductVariant[];
};

type ParsedRow = {
  sourceTitle: string;
  sku: string;
  stock: number;
  size?: string;
  material?: string;
  color?: string;
};

const COLOR_STOPWORDS = new Set([
  'student',
  'presentsnore',
  'presentsnore.',
  'pasar',
  'snoren',
  'etiketter',
  'alla',
  'hjartans',
  'dag',
]);

function repairMojibake(value: string) {
  return value
    .replace(/Ã¥/g, 'å')
    .replace(/Ã¤/g, 'ä')
    .replace(/Ã¶/g, 'ö')
    .replace(/Ã…/g, 'Å')
    .replace(/Ã„/g, 'Ä')
    .replace(/Ã–/g, 'Ö');
}

function normalizeWhitespace(value: string) {
  return repairMojibake(value).replace(/\s+/g, ' ').trim();
}

function foldText(value: string) {
  return normalizeWhitespace(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function extractField(block: string, labels: string[]) {
  const lines = block.split(/\s+(?=[A-ZÅÄÖa-zåäö-]+:)/);

  for (const line of lines) {
    const [rawLabel, ...rest] = line.split(':');
    if (!rawLabel || rest.length === 0) {
      continue;
    }

    const foldedLabel = foldText(rawLabel);
    if (labels.includes(foldedLabel)) {
      return normalizeWhitespace(rest.join(':'));
    }
  }

  return '';
}

function extractColor(sourceTitle: string) {
  const cleaned = foldText(sourceTitle)
    .replace(/\bstudent\b/g, '')
    .replace(/\bpresentsnore\b/g, '')
    .replace(/\b\d+\s*m\b/g, '')
    .replace(/\b\d+\s*mm\b/g, '')
    .trim();

  const candidate = cleaned
    .split(/\s+/)
    .filter((token) => token && !COLOR_STOPWORDS.has(token))
    .join(' ');

  return candidate ? titleCase(candidate) : undefined;
}

function splitIntoBlocks(input: string) {
  const repaired = normalizeWhitespace(input);
  if (!repaired) {
    return [];
  }

  const blocks = repaired
    .split(/(?=Artnr:\s*[A-Za-z0-9-]+)/i)
    .map((block) => normalizeWhitespace(block))
    .filter(Boolean);

  return blocks.length > 0 ? blocks : [repaired];
}

function parseRows(input: string): ParsedRow[] {
  const parsedRows = splitIntoBlocks(input)
    .map((block): ParsedRow | null => {
      const skuMatch = block.match(/Artnr:\s*([A-Za-z0-9-]+)/i);
      if (!skuMatch) {
        return null;
      }

      const sourceTitle = extractField(block, ['benamning']) || normalizeWhitespace(block.split('Artnr:')[0] || '');
      const size = extractField(block, ['storlek']);
      const material = extractField(block, ['material']);
      const stockText = extractField(block, ['antal i ytterforpackning']);
      const stock = stockText ? Number(stockText.replace(/[^\d]/g, '')) : 0;
      const color = extractColor(sourceTitle);

      return {
        sourceTitle,
        sku: skuMatch[1],
        stock,
        size: size || undefined,
        material: material || undefined,
        color,
      };
    })
    .filter((row): row is ParsedRow => row !== null);

  return parsedRows;
}

export function parseCatalogPrompt(input: string): ParsedCatalogDraft {
  const rows = parseRows(input);
  if (rows.length === 0) {
    return {};
  }

  const colors = Array.from(new Set(rows.map((row) => row.color).filter(Boolean))) as string[];
  const sizes = Array.from(new Set(rows.map((row) => row.size).filter(Boolean))) as string[];
  const materials = Array.from(new Set(rows.map((row) => row.material).filter(Boolean))) as string[];

  const options: ProductOption[] = [];
  if (colors.length > 0) {
    options.push({ name: 'Color', values: colors });
  }
  if (sizes.length > 0) {
    options.push({ name: 'Size', values: sizes });
  }
  if (materials.length > 0) {
    options.push({ name: 'Material', values: materials });
  }

  const variants: ProductVariant[] = rows.map((row) => {
    const variantOptions = Object.fromEntries(
      [
        row.color ? ['Color', row.color] : null,
        row.size ? ['Size', row.size] : null,
        row.material ? ['Material', row.material] : null,
      ].filter((entry): entry is [string, string] => Boolean(entry))
    );

    return {
      id: `${row.sku}-${Object.values(variantOptions).join('-')}`.replace(/\s+/g, '-'),
      options: variantOptions,
      stock: row.stock,
      sku: row.sku,
      imageUrl: '',
    };
  });

  const baseTitle = rows[0].sourceTitle
    .replace(/\b[A-ZÅÄÖa-zåäö-]+\s+\d+M\s*X\s*\d+MM\b/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  const titleParts = [
    baseTitle || rows[0].sourceTitle || 'Product',
    colors.length > 1 ? colors.join(' / ') : undefined,
    sizes.length === 1 ? sizes[0] : undefined,
  ].filter(Boolean);

  const descriptionParts = [
    `${baseTitle || rows[0].sourceTitle || 'This product'} is available${colors.length > 0 ? ` in ${colors.join(' and ')}` : ''}.`,
    sizes.length > 0 ? `Size: ${sizes.join(', ')}.` : '',
    materials.length > 0 ? `Material: ${materials.join(', ')}.` : '',
    rows[0].stock > 0 ? `Packed ${rows[0].stock} units per outer carton.` : '',
  ].filter(Boolean);

  return {
    title: titleParts.join(', '),
    description: descriptionParts.join(' '),
    stock: rows[0].stock,
    sku: rows[0].sku,
    tags: ['Gift Wrapping', 'Student', 'Ribbon'],
    colors,
    sizes,
    options,
    variants,
  };
}
