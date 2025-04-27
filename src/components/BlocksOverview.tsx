'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

interface BlockStats {
  totalBlocks: number;
  averageBlockTime: number;
  averageTransactionsPerBlock: number;
  totalTransactions: number;
  averageSlotTime: number;
}

export function BlocksOverview() {
  const [stats, setStats] = useState<BlockStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchBlockStats = async () => {
    try {
      const response = await fetch('/api/block-stats', {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch block statistics');
      }

      const data = await response.json();
      setStats(data.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching block statistics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch block statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockStats();
    const interval = setInterval(fetchBlockStats, 1000); // Refresh every 1 second
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="dashboard-card bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-lime-100">
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
      <div className="dashboard-card bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-lime-100">
        <p className="text-red-600">Error: {error}</p>
        <button 
          onClick={fetchBlockStats}
          className="mt-4 px-4 py-2 bg-lime-100 text-lime-600 rounded-lg hover:bg-lime-200 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="dashboard-card bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-lime-100"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-4 bg-lime-50/50 rounded-lg">
            <h3 className="text-sm text-gray-500 mb-1">Total Blocks</h3>
            <p className="text-2xl font-semibold text-lime-600">
              {stats?.totalBlocks.toLocaleString()}
            </p>
          </div>
          
          <div className="p-4 bg-lime-50/50 rounded-lg">
            <h3 className="text-sm text-gray-500 mb-1">Avg Block Time</h3>
            <p className="text-2xl font-semibold text-lime-600">
              {stats?.averageBlockTime.toFixed(2)}s
            </p>
          </div>
          
          <div className="p-4 bg-lime-50/50 rounded-lg">
            <h3 className="text-sm text-gray-500 mb-1">Avg Tx/Block</h3>
            <p className="text-2xl font-semibold text-lime-600">
              {stats?.averageTransactionsPerBlock.toLocaleString()}
            </p>
          </div>
          
          <div className="p-4 bg-lime-50/50 rounded-lg">
            <h3 className="text-sm text-gray-500 mb-1">Total Transactions</h3>
            <p className="text-2xl font-semibold text-lime-600">
              {stats?.totalTransactions.toLocaleString()}
            </p>
          </div>
        </div>

        {lastUpdated && (
          <div className="mt-4 text-xs text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </motion.div>
    </ErrorBoundary>
  );
} 