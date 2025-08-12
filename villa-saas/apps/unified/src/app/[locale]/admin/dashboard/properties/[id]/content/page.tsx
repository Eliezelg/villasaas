import { redirect } from 'next/navigation';

export default function PropertyContentPage({ params }: { params: { id: string, locale: string } }) {
  redirect(`/${params.locale}/admin/dashboard/properties/${params.id}/content/settings`);
}