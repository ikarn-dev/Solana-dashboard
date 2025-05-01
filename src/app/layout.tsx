import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { Footer } from '@/components/Footer';
import { ApiStatusMarquee } from '@/components/ApiStatusMarquee';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Solana Dashboard',
  description: 'A dashboard for monitoring Solana network',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-y-auto ml-0 lg:ml-64">
            <div className="min-h-screen bg-gradient-to-b from-lime-50 to-white">
              <ApiStatusMarquee />
              {children}
              <Footer />
            </div>
          </main>
        </div>
      </body>
    </html>
  );
} 