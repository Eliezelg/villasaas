import { redirect } from 'next/navigation';

export default function PropertyDetailPage({ params }: { params: { id: string; locale: string } }) {
  redirect(`/${params.locale}/admin/dashboard/properties/${params.id}/general`);
}