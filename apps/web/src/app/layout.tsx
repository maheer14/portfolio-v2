import type { Metadata } from "next";
import localFont from "next/font/local";
import { Overpass } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

const overpass = Overpass({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-overpass",
});

const chillax = localFont({
  src: "../fonts/Chillax-Variable.woff2",
  weight: "200 700",
  variable: "--font-chillax",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gridlock",
  description: "An intersection you can talk to.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${chillax.variable} ${overpass.variable}`}>
      <body className="bg-ink font-sans text-paper antialiased">
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}