import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/app/components/Navbar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'Sistem Manajemen Gudang',
  description: 'Manajemen inventori, transaksi, dan restock gudang',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}>
        <Navbar />
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </body>
    </html>
  );
}