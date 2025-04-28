'use client';

import { useEffect, useState } from 'react';
import { Menu, ArrowUp } from 'lucide-react';
import NetworkStatus from '@/components/NetworkStatus';
import { StakingDetails } from '@/components/StakingDetails';
import TPSDisplay from '@/components/TPSDisplay';
import { MarketDataCard } from '@/components/MarketData';
import { RecentBlocks } from '@/components/RecentBlocks';
import { HomeValidators } from '@/components/HomeValidators';
import { RecentTransactions } from '@/components/RecentTransactions';
import { motion, AnimatePresence } from 'framer-motion';
import Reloading from '@/components/Reloading';

export default function Home() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return <Reloading />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-lime-50 to-white relative overflow-hidden">
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