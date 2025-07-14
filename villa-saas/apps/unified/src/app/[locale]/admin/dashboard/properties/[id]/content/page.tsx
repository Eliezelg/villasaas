import { redirect } from 'next/navigation';

export default function PropertyContentPage({ params }: { params: { id: string } }) {
  redirect(`/admin/dashboard/properties/${params.id}/content/settings`);
}