import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = "https://casi-creativos.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Casi Creativos — Packs de Fichas | Compra 100% segura",
  description:
    "Comprá tu pack de fichas con total seguridad. Pago por transferencia, entrega garantizada y atención por WhatsApp. Packs desde 10.000 hasta 200.000 fichas.",
  keywords: [
    "packs de fichas",
    "comprar fichas",
    "fichas online",
    "pago seguro",
    "transferencia",
    "casi creativos",
    "publicidad creativa",
  ],
  authors: [{ name: "Casi Creativos" }],
  alternates: { canonical: SITE_URL },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Casi Creativos",
    url: SITE_URL,
    title: "Casi Creativos — Packs de Fichas",
    description:
      "Elegí tu pack de fichas y recibilo sin complicaciones. Compra 100% segura, entrega garantizada.",
    images: [
      {
        url: `${SITE_URL}/logo.png`,
        width: 1024,
        height: 1024,
        alt: "Logo Casi Creativos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Casi Creativos — Packs de Fichas",
    description: "Comprá tu pack de fichas con total seguridad. Entrega garantizada.",
    images: [`${SITE_URL}/logo.png`],
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#06070d",
  width: "device-width",
  initialScale: 1,
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Casi Creativos",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+54-9-2944-23-9107",
    contactType: "customer service",
    areaServed: "AR",
    availableLanguage: ["Spanish"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
