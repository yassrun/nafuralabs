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
  title: "MBS Studio — Branding Agency Casablanca",
  description:
    "Ideas and power branding for pioneering founders and bold marketing teams. Casablanca based. Open to the world.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={instrumentSans.variable}
      suppressHydrationWarning
    >
      <body className="antialiased" suppressHydrationWarning>
        <ClientProviders />
        {children}
      </body>
    </html>
  );
}
