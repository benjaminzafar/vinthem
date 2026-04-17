import { getPolicyPageMetadata, renderPolicyPage } from '@/app/(storefront)/policy-page';

export async function generateMetadata() {
  return getPolicyPageMetadata('privacy-policy');
}

export default async function PrivacyPolicyPage() {
  return renderPolicyPage('privacy-policy');
}
