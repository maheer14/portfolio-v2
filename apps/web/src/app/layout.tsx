import type { Metadata } from "next";
import { Archivo, Overpass } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
});

const overpass = Overpass({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-overpass",
});

export const metadata: Metadata = {
  title: "Gridlock",
  description: "An intersection you can talk to.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${archivo.variable} ${overpass.variable}`}>
      <body className="bg-ink font-sans text-paper antialiased">
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}