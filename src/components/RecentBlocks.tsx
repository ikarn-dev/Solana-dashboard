"use client";

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { RecentBlock } from '@/lib/api/types';

export function RecentBlocks() {
  const [blocks, setBlocks] = useState<RecentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const limit = 10;

  const fetchBlocks = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);

    try {
      const response = await fetch(`/api/recent-blocks?limit=${limit}`, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch recent blocks');
      }
      
      const data = await response.json();
      
      if (!data.data || !data.data.blocks) {
        throw new Error('Invalid response format');
      }
      
      setBlocks(data.data.blocks);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching recent blocks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch recent blocks');
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, [isRefreshing]);

  // Initial load and auto-refresh
  useEffect(() => {
    fetchBlocks();
    const interval = setInterval(fetchBlocks, 1000);
    return () => clearInterval(interval);
  }, [fetchBlocks]);

  const handleRefresh = () => {
    fetchBlocks();
  };

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
        <button 
          onClick={handleRefresh}
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
        className="dashboard-card bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-semibold text-lime-600">Recent Blocks</h2>
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 hover:bg-lime-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-lime-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                <th className="pb-3">Block</th>
                <th className="pb-3">Validator</th>
                <th className="pb-3">Txs</th>
                <th className="pb-3">Total Fees</th>
                <th className="pb-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((block) => (
                <tr 
                  key={block.slot}
                  className="border-b border-gray-100 hover:bg-lime-50/50 transition-colors"
                >
                  <td className="py-3">
                    <a 
                      href={`/block/${block.slot}`}
                      className="text-lime-600 hover:text-lime-700 font-mono"
                    >
                      {block.slot}
                    </a>
                  </td>
                  <td className="py-3">
                    <a 
                      href={`/validator/${block.votePubkey}`}
                      className="flex items-center space-x-2 text-lime-600 hover:text-lime-700"
                    >
                      {block.iconUrl ? (
                        <img 
                          src={block.iconUrl} 
                          alt={block.name || 'Validator'} 
                          className="w-4 h-4 rounded-full"
                        />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-lime-100"></div>
                      )}
                      <span className="font-mono">
                        {block.name || block.votePubkey.slice(0, 8) + '...' + block.votePubkey.slice(-8)}
                      </span>
                    </a>
                  </td>
                  <td className="py-3 font-mono">{block.voteTransactions + block.userTransactions}</td>
                  <td className="py-3 font-mono">
                    {(parseInt(block.fees) / 1e9).toFixed(4)} SOL
                  </td>
                  <td className="py-3 text-gray-500">
                    {new Date(parseInt(block.blockTime) * 1000).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </ErrorBoundary>
  );
} 