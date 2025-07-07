export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-lg text-muted-foreground mb-8">Page non trouvée</p>
        <a href="/" className="text-primary hover:underline">
          Retour à l'accueil
        </a>
      </div>
    </div>
  );
}