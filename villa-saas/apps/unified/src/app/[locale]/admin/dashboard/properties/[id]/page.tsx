import { redirect } from 'next/navigation';

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  redirect(`/admin/dashboard/properties/${params.id}/general`);
}