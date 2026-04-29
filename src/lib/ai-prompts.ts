export type AIPromptProfile =
  | 'default'
  | 'product'
  | 'collection'
  | 'blog'
  | 'page'
  | 'storefront'
  | 'review'
  | 'post';

export type AIPromptDefinition = {
  profile: AIPromptProfile;
  key: string;
  label: string;
  description: string;
  placeholder: string;
  defaultValue: string;
};

export const AI_PROMPT_DEFINITIONS: readonly AIPromptDefinition[] = [
  {
    profile: 'default',
    key: 'AI_DEFAULT_PROMPT',
    label: 'Global AI Instruction',
    description: 'Applied to every admin AI request before module-specific instructions.',
    placeholder: 'Describe your brand voice, tone, product rules, forbidden claims, and writing standards.',
    defaultValue:
      'You are the internal AI assistant for a premium ecommerce admin team. Write with calm confidence, commercial clarity, and professional taste. Stay factual, avoid invented claims, avoid exaggerated promises, and never mention that content was AI-generated. Keep output publishable, brand-safe, structured, and useful for a modern design-led online store.',
  },
  {
    profile: 'product',
    key: 'AI_PRODUCT_PROMPT',
    label: 'Product AI Prompt',
    description: 'Extra guidance for product drafting, translation, variants, and descriptions.',
    placeholder: 'Example: Always emphasize materials, dimensions, Nordic tone, and SEO-ready product copy.',
    defaultValue:
      'When generating product content, prioritize clear product naming, materials, dimensions, finish, use-case, care notes, and practical value. Keep descriptions persuasive but precise. For variants, preserve option structure cleanly and never invent technical specs unless they are strongly implied by the source. For translation, keep catalog language natural, concise, and ecommerce-ready.',
  },
  {
    profile: 'collection',
    key: 'AI_COLLECTION_PROMPT',
    label: 'Collection AI Prompt',
    description: 'Extra guidance for category banners, collection descriptions, and translations.',
    placeholder: 'Example: Keep collection names short, premium, and suitable for storefront navigation.',
    defaultValue:
      'When generating collection content, keep names short, elegant, and easy to scan in navigation. Write descriptions that explain the style, mood, and product grouping without sounding generic. Favor premium retail language over marketing hype, and keep translations polished and storefront-friendly.',
  },
  {
    profile: 'blog',
    key: 'AI_BLOG_PROMPT',
    label: 'Journal AI Prompt',
    description: 'Extra guidance for blog drafting and blog translation.',
    placeholder: 'Example: Write editorial long-form content with calm luxury tone and practical styling advice.',
    defaultValue:
      'When generating journal content, write in an editorial, high-trust voice with strong structure and readable flow. Use meaningful headings, practical insights, and tasteful storytelling. Avoid fluff, clickbait, and repetitive intros. Keep translations culturally natural and publication-ready.',
  },
  {
    profile: 'page',
    key: 'AI_PAGE_PROMPT',
    label: 'Static Page AI Prompt',
    description: 'Extra guidance for policy pages, informational pages, and translations.',
    placeholder: 'Example: Keep policy copy clear, compliant, and easy to skim without legal overstatement.',
    defaultValue:
      'When generating static page content, optimize for clarity, scannability, and professional trust. Use structured sections, concise paragraphs, and plain language. Avoid legal overstatement, fabricated policy details, or vague filler. Translations should stay accurate, direct, and easy to read.',
  },
  {
    profile: 'storefront',
    key: 'AI_STOREFRONT_PROMPT',
    label: 'Storefront Copy AI Prompt',
    description: 'Extra guidance for hero copy, labels, navigation language, and storefront text.',
    placeholder: 'Example: Use concise premium ecommerce copy and avoid filler adjectives.',
    defaultValue:
      'When generating storefront copy, prefer concise premium ecommerce language that is easy to scan. Headlines should be clean and confident. Labels should be short and functional. Avoid clutter, filler adjectives, and overlong sentences. Keep copy conversion-aware without sounding pushy.',
  },
  {
    profile: 'review',
    key: 'AI_REVIEW_PROMPT',
    label: 'Review AI Prompt',
    description: 'Extra guidance for admin-generated review drafts.',
    placeholder: 'Example: Keep reviews believable, concise, and grounded in product attributes.',
    defaultValue:
      'When generating review drafts, keep them believable, specific, and human-sounding. Mention product qualities such as comfort, finish, sizing, delivery experience, or material feel when relevant. Avoid repetitive praise, exaggerated enthusiasm, or identical sentence rhythm across reviews.',
  },
  {
    profile: 'post',
    key: 'AI_POST_PROMPT',
    label: 'Post Maker AI Prompt',
    description: 'Extra guidance for the quick AI blog-post maker.',
    placeholder: 'Example: Return publishable article structure with hook, insight, and subtle brand relevance.',
    defaultValue:
      'When generating quick posts, return a publishable article structure with a strong opening, useful body, and clean ending. Keep the piece on-topic, readable, and professionally branded. Avoid vague filler and make the output ready for an editor to review with minimal cleanup.',
  },
] as const;

export const AI_PROMPT_INTEGRATION_KEYS = AI_PROMPT_DEFINITIONS.map(
  (definition) => definition.key,
);

export const AI_PROMPT_DEFAULTS = Object.fromEntries(
  AI_PROMPT_DEFINITIONS.map((definition) => [definition.key, definition.defaultValue]),
) as Record<string, string>;

export function getPromptKeyForProfile(profile?: AIPromptProfile | null): string | null {
  if (!profile || profile === 'default') {
    return null;
  }

  const definition = AI_PROMPT_DEFINITIONS.find((entry) => entry.profile === profile);
  return definition?.key ?? null;
}

export function buildSystemInstruction(parts: Array<string | null | undefined>): string | undefined {
  const instruction = parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join('\n\n');

  return instruction || undefined;
}

export function getDefaultPromptValue(key: string): string {
  return AI_PROMPT_DEFAULTS[key] || '';
}
