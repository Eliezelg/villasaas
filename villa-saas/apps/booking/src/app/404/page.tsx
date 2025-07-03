import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
        <h2 className="mb-4 text-2xl font-semibold">Site non trouvé</h2>
        <p className="mb-8 text-muted-foreground">
          Désolé, nous ne trouvons pas le site que vous cherchez.
        </p>
        <Link
          href="/"
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  )
}