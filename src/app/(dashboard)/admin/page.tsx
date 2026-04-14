import { redirect } from 'next/navigation';

export default function AdminPage() {
  // Authentication and Authorization are now handled by the parent layout.tsx
  // We simply redirect users to the default overview dashboard
  redirect('/admin/overview');
}
