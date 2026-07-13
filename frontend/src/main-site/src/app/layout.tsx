import type { Metadata } from "next";
import "./globals.css";
import CustomCursor from "@/components/CustomCursor";

export const metadata: Metadata = {
  title: "T W Publishers | Award-Winning Publishing House",
  description: "T W Publishers is a 2026 African Excellence Award-winning publishing house dedicated to transforming experts, leaders, and entrepreneurs into published authorities.",
  keywords: ["publishing house", "book publishing", "hybrid publishing", "assisted publishing", "author", "write a book", "T W Publishers", "African Excellence Awards", "South Africa"],
  authors: [{ name: "T W Publishers" }],
  openGraph: {
    title: "T W Publishers | Award-Winning Publishing House",
    description: "T W Publishers is a 2026 African Excellence Award-winning publishing house dedicated to transforming experts into published authorities.",
    url: "https://twpublishers.co.za",
    siteName: "T W Publishers",
    images: [
      {
        url: "/logotwfront.png",
        width: 800,
        height: 600,
        alt: "T W Publishers Logo",
      },
    ],
    locale: "en_ZA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "T W Publishers | Award-Winning Publishing House",
    description: "T W Publishers is an award-winning publishing house dedicated to transforming experts into published authorities.",
    images: ["/logotwfront.png"],
  },
  icons: {
    icon: "/logotwfront.png",
    shortcut: "/logotwfront.png",
    apple: "/logotwfront.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
