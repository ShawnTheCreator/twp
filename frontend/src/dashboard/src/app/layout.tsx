import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TW Publishers | Dashboard",
  description: "Sales and Traffic Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50">
        {children}
      </body>
    </html>
  );
}
