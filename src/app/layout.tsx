import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dwell Mart AI — Shopping & Wholesale Assistant",
  description:
    "Intelligent AI-powered shopping and wholesale assistant for Dwell Mart. Find products, get wholesale pricing, and manage bulk orders with ease.",
  keywords: [
    "Dwell Mart",
    "AI shopping assistant",
    "wholesale",
    "home decor",
    "kitchen",
    "furniture",
  ],
  openGraph: {
    title: "Dwell Mart AI — Shopping & Wholesale Assistant",
    description:
      "Intelligent AI-powered shopping and wholesale assistant for Dwell Mart.",
    type: "website",
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

