import { getPolicyPageMetadata, renderPolicyPage } from '@/app/(storefront)/policy-page';

export async function generateMetadata() {
  return getPolicyPageMetadata('cookie-policy');
}

export default async function CookiePolicyPage() {
  return renderPolicyPage('cookie-policy');
}
