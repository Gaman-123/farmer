import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ReactQueryProvider from "@/components/providers/ReactQueryProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "E-Krishi Farmer Portal | ಇ-ಕೃಷಿ",
  description: "Karnataka Agricultural Marketplace — Direct farm-to-buyer trading platform",
  keywords: ["farmer", "krishi", "Karnataka", "agriculture", "marketplace", "e-krishi"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="kn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ReactQueryProvider>
          {children}
        </ReactQueryProvider>
      </body>
    </html>
  );
}
