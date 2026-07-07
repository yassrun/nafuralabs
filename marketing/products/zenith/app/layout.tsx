import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import ClientProviders from "@/components/ClientProviders";
import "@/styles/globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-instrument-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Zénith — Architecture, Ingénierie & Aménagement haut de gamme",
  description:
    "Zénith réunit architecture et ingénierie dans une structure intégrée où conception et exécution ne font qu'un. Studio, Coordination et Aménagement clé en main. Une vision. Une maîtrise. Un résultat.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={instrumentSans.variable} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <div className="paper-grain-overlay" aria-hidden />
        <ClientProviders />
        {children}
      </body>
    </html>
  );
}
