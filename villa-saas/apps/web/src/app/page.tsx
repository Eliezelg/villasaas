import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Villa SaaS
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Plateforme de gestion de locations de vacances
        </p>
        <div className="flex gap-4 items-center justify-center">
          <Link
            href="/login"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  )
}