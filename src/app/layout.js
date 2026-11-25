import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/app/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Perpustakaan Kampus",
  description: "Sistem manajemen perpustakaan",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}