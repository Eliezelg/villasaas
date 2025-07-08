import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Villa Hub AI - Trouvez votre séjour parfait avec l'IA",
  description: "Plateforme intelligente de recherche de locations de vacances. Décrivez votre voyage idéal et laissez notre IA trouver les meilleures propriétés pour vous.",
  keywords: "location vacances, villa, AI, intelligence artificielle, voyage, réservation",
  openGraph: {
    title: "Villa Hub AI",
    description: "Trouvez votre séjour parfait avec l'IA",
    type: "website",
  },
};

export default function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className={inter.className}>
        {children}
      </div>
    </div>
  );
}
