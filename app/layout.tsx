import type { Metadata } from "next";
import { Brygada_1918, Atkinson_Hyperlegible } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const brygada = Brygada_1918({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const atkinson = Atkinson_Hyperlegible({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "VendorBridge — Procurement ERP",
  description: "Procurement and vendor management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${brygada.variable} ${atkinson.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
