import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import ReactQueryProvider from "@/components/providers/ReactQueryProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "E-Krishi | ಇ-ಕೃಷಿ — Karnataka Farm-to-Buyer Marketplace",
  description: "Karnataka's premier agricultural marketplace connecting farmers directly with buyers. Get the best prices for fresh produce, real-time market data, and seamless transactions.",
  keywords: ["farmer", "krishi", "Karnataka", "agriculture", "marketplace", "e-krishi", "buy produce", "farm fresh", "mandi prices"],
  openGraph: {
    title: "E-Krishi — Karnataka Agricultural Marketplace",
    description: "Direct farm-to-buyer trading platform for Karnataka farmers and buyers.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="kn" className={`${inter.variable} ${outfit.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <meta name="theme-color" content="#059669" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ReactQueryProvider>
          {children}
        </ReactQueryProvider>
      </body>
    </html>
  );
}
