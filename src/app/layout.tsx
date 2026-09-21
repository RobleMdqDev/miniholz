import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { SITE_DESCRIPTION, SITE_NAME, siteUrl, socialMetadata } from "@/lib/site";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  // Sin `metadataBase`, toda URL relativa de OpenGraph o canónica se emite
  // relativa y los validadores de las redes la descartan.
  metadataBase: new URL(siteUrl()),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  ...socialMetadata({ title: SITE_NAME, description: SITE_DESCRIPTION }),
  // Acá **no** va `alternates.canonical`. La metadata se hereda hacia abajo y
  // se mezcla de forma superficial, así que una canónica en la raíz haría que
  // todas las páginas sin canónica propia apunten al inicio — que es peor que
  // no tener canónica. Cada página indexable declara la suya.
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
