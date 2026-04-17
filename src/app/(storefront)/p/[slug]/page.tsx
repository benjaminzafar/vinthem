import { getPolicyPageMetadata, renderPolicyPage } from '@/app/(storefront)/policy-page';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return getPolicyPageMetadata(slug);
}

export default async function StaticPageDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return renderPolicyPage(slug);
}
