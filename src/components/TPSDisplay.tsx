"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, RefreshCw } from 'lucide-react';
import { TPSData } from '@/lib/api/types';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { getTPS } from '@/lib/api/solana';

// Component for animated digit display
const AnimatedDigit = ({ digit }: { digit: string }) => {
  return (
    <div className="relative h-8 w-6 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={digit}
          initial={{ y: -40 }}
          animate={{ y: 0 }}
          exit={{ y: 40 }}
          transition={{ duration: 0.2 }}
          className="absolute w-full text-center font-mono"
        >
          {digit}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// Component for animated number display without decimal
const AnimatedNumber = ({ value }: { value: number }) => {
  const [formattedValue, setFormattedValue] = useState(Math.round(value).toString());
  
  useEffect(() => {
    setFormattedValue(Math.round(value).toString());
  }, [value]);

  const digits = formattedValue.split('');
  
  return (
    <div className="flex items-center">
      {digits.map((digit, index) => (
        <AnimatedDigit key={`${value}-${index}-${digit}`} digit={digit} />
      ))}
    </div>
  );
};

// Auto-reload indicator component
const AutoReloadIndicator = () => {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, ease: "linear", repeat: Infinity }}
      className="inline-block"
    >
      <RefreshCw className="w-4 h-4 text-lime-500" />
    </motion.div>
  );
};

export default function TPSDisplay() {
  const [data, setData] = useState<TPSData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchTime = useRef<number>(0);
  const fetchInterval = useRef<NodeJS.Timeout>();
  const animationFrameRef = useRef<number>();
  const isInitialized = useRef<boolean>(false);
  const baseTPS = useRef<number>(0);
  const baseTime = useRef<number>(0);
  const lastValidTPS = useRef<number>(0);

  // Calculate current TPS based on time elapsed
  const calculateCurrentTPS = () => {
    if (!isInitialized.current) return lastValidTPS.current;
    
    const now = Date.now();
    const timeElapsed = (now - baseTime.current) / 1000; // in seconds
    
    // If less than 1 second has passed since last API update, use the API value
    if (timeElapsed < 1) {
      return baseTPS.current;
    }
    
    // Otherwise, use the last valid TPS value
    return lastValidTPS.current;
  };

  // Update TPS continuously using requestAnimationFrame
  const updateValues = () => {
    if (!isInitialized.current) {
      animationFrameRef.current = requestAnimationFrame(updateValues);
      return;
    }
    
    const currentTPS = calculateCurrentTPS();
    
    if (data) {
      setData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          totalTransactionsPerSecond: currentTPS,
          voteTransactionsPerSecond: prev.voteTransactionsPerSecond,
          userTransactionsPerSecond: prev.userTransactionsPerSecond
        };
      });
    }
    
    animationFrameRef.current = requestAnimationFrame(updateValues);
  };

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      const now = Date.now();
      if (now - lastFetchTime.current < 1000 && data && !showLoading) {
        return;
      }
      
      const result = await getTPS();
      if (result.data) {
        const newData = {
          ...result.data,
          totalTransactionsPerSecond: result.data.totalTransactionsPerSecond || lastValidTPS.current
        };
        
        setData(newData);
        setError(null);
        lastFetchTime.current = now;
        
        // Update base values for smooth animation
        if (!isInitialized.current) {
          isInitialized.current = true;
        }
        baseTPS.current = newData.totalTransactionsPerSecond;
        baseTime.current = now;
        lastValidTPS.current = newData.totalTransactionsPerSecond;
      } else {
        throw new Error('Failed to fetch TPS data');
      }
    } catch (err) {
      console.error('Error fetching TPS data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Start the animation frame first to ensure it's always running
    animationFrameRef.current = requestAnimationFrame(updateValues);

    // Then fetch initial data
    fetchData();
    
    // Update every second
    fetchInterval.current = setInterval(() => fetchData(false), 1000);

    return () => {
      if (fetchInterval.current) {
        clearInterval(fetchInterval.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="dashboard-card bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-lime-200/50 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-lime-200/50 rounded w-1/2"></div>
            <div className="h-4 bg-lime-200/50 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-card bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="dashboard-card bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-lime-600 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Transactions Per Second
          </h2>
          <div className="flex items-center">
            <AutoReloadIndicator />
            <span className="ml-1 text-sm text-lime-600">Auto-updating</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass-card p-4 rounded-lg bg-lime-50/50 border border-lime-100"
          >
            <div className="flex flex-col">
              <p className="text-sm text-gray-600">Total TPS</p>
              <div className="text-2xl font-bold text-lime-600">
                <AnimatedNumber value={data.totalTransactionsPerSecond || lastValidTPS.current} />
              </div>
            </div>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass-card p-4 rounded-lg bg-lime-50/50 border border-lime-100"
          >
            <div className="flex flex-col">
              <p className="text-sm text-gray-600">Vote TPS</p>
              <div className="text-2xl font-bold text-lime-600">
                <AnimatedNumber value={data.voteTransactionsPerSecond} />
              </div>
            </div>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass-card p-4 rounded-lg bg-lime-50/50 border border-lime-100"
          >
            <div className="flex flex-col">
              <p className="text-sm text-gray-600">User TPS</p>
              <div className="text-2xl font-bold text-lime-600">
                <AnimatedNumber value={data.userTransactionsPerSecond} />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </ErrorBoundary>
  );
} 