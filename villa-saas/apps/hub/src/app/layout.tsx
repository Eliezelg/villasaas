import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
