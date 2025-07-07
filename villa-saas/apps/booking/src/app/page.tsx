import { redirect } from 'next/navigation';

export default function RootPage() {
  // Rediriger vers la locale par défaut (français)
  redirect('/fr');
}