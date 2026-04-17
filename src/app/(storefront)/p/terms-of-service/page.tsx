import { getPolicyPageMetadata, renderPolicyPage } from '@/app/(storefront)/policy-page';

export async function generateMetadata() {
  return getPolicyPageMetadata('terms-of-service');
}

export default async function LegacyTermsOfServiceRoute() {
  return renderPolicyPage('terms-of-service');
}
