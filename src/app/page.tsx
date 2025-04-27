'use client';

import { useEffect, useState } from 'react';
import { Search, Menu, ArrowUp } from 'lucide-react';
import NetworkStatus from '@/components/NetworkStatus';
import { StakingDetails } from '@/components/StakingDetails';
import TPSDisplay from '@/components/TPSDisplay';
import { MarketDataCard } from '@/components/MarketData';
import { RecentBlocks } from '@/components/RecentBlocks';
import { HomeValidators } from '@/components/HomeValidators';
import { RecentTransactions } from '@/components/RecentTransactions';
import { SearchBar } from '@/components/SearchBar';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Preserve scroll position on reload
  useEffect(() => {
    const scrollPosition = sessionStorage.getItem('scrollPosition');
    if (scrollPosition) {
      window.scrollTo(0, parseInt(scrollPosition));
    }

    const handleScroll = () => {
      // Save scroll position
      sessionStorage.setItem('scrollPosition', window.scrollY.toString());
      
      // Show/hide scroll to top button
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-lime-50 to-white relative overflow-hidden font-sans">
      {/* Gradient Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="blob w-[800px] h-[800px] rounded-[999px] absolute top-0 right-0 blur-3xl bg-opacity-60 bg-gradient-to-r from-lime-200 via-lime-100 to-gray-200"></div>
        <div className="blob w-[1000px] h-[1000px] rounded-[999px] absolute bottom-0 left-0 blur-3xl bg-opacity-60 bg-gradient-to-r from-gray-300 via-lime-100 to-gray-100"></div>
        <div className="blob w-[600px] h-[600px] rounded-[999px] absolute bottom-0 left-0 blur-3xl bg-opacity-60 bg-gradient-to-r from-gray-200 via-lime-100 to-gray-100"></div>
        <div className="blob w-[300px] h-[300px] rounded-[999px] absolute bottom-[-10px] left-0 blur-3xl bg-opacity-60 bg-gradient-to-r from-lime-300 via-lime-200 to-gray-300"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto p-8">
        {/* Header/Navbar */}
        <header className="z-10">
          <nav className="navbar bg-transparent flex items-center justify-center py-6 relative">
            <h1 className="text-3xl text-lime-600 font-semibold text-center w-full">Solana Staking Dashboard</h1>
            <button className="md:hidden cursor-pointer p-2 rounded-full hover:bg-lime-100 transition-colors absolute right-0">
              <Menu className="w-6 h-6 text-lime-600" />
            </button>
          </nav>
        </header>
        
        {/* Search Bar */}
        <div className="mt-8 mb-12">
          <SearchBar />
        </div>
        
        {/* Market Data */}
        <div className="mb-8">
          <MarketDataCard />
        </div>

        {/* Staking Details */}
        <div className="mb-8">
          <StakingDetails />
        </div>

        {/* Top Validators */}
        <div className="mb-8">
          <HomeValidators />
        </div>

        {/* Network Status */}
        <div className="mb-8">
          <NetworkStatus />
        </div>
        
        {/* TPS Display */}
        <div className="mb-8">
          <TPSDisplay />
        </div>

        {/* Recent Blocks */}
        <div className="mb-8">
          <RecentBlocks />
        </div>

        {/* Recent Transactions */}
        <div className="mb-8">
          <RecentTransactions />
        </div>
      </div>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 p-3 rounded-full bg-lime-500 text-white shadow-lg hover:bg-lime-600 transition-colors duration-200 z-50"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </main>
  );
}