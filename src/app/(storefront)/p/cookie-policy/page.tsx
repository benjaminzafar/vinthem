import { getPolicyPageMetadata, renderPolicyPage } from '@/app/(storefront)/policy-page';

export async function generateMetadata() {
  return getPolicyPageMetadata('cookie-policy');
}

export default async function LegacyCookiePolicyRoute() {
  return renderPolicyPage('cookie-policy');
}
