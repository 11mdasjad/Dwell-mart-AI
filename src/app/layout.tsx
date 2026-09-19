import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://dwellmart.in'),
  title: "Dwell Mart AI — Shopping & Wholesale Assistant",
  description:
    "Official AI shopping and wholesale assistant for Dwell Mart (dwellmart.in). Search catalog, compare prices, check live inventory, and generate wholesale quotes.",
  keywords: [
    "Dwell Mart",
    "Dwell Mart AI",
    "AI shopping assistant",
    "wholesale e-commerce",
    "home decor",
    "kitchen",
    "furniture",
    "dwellmart.in",
  ],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/icon.png',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: "Dwell Mart AI — Shopping & Wholesale Assistant",
    description:
      "Official AI shopping and wholesale assistant for Dwell Mart. Find products, get wholesale pricing, and verify stock availability.",
    type: "website",
    url: "https://dwellmart.in",
    siteName: "Dwell Mart AI",
    images: [
      {
        url: "/logo.png",
        width: 857,
        height: 296,
        alt: "Dwell Mart Official Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dwell Mart AI — Shopping & Wholesale Assistant",
    description: "Official AI shopping and wholesale assistant for Dwell Mart.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-neutral-50 text-neutral-800 antialiased`}>
        {children}
      </body>
    </html>
  );
}

