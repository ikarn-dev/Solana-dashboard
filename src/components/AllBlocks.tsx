'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { RecentBlock } from '@/lib/api/types';


export default function AllBlocks() {
  const [blocks, setBlocks] = useState<RecentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchBlocks = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);

    try {
      const response = await fetch('/api/recent-blocks?limit=1000', {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch blocks');
      }
      
      const data = await response.json();
      
      if (!data.data || !data.data.blocks) {
        throw new Error('Invalid response format');
      }
      
      setBlocks(data.data.blocks);
      setError(null);
    } catch (err) {
      console.error('Error fetching blocks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch blocks');
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, [isRefreshing]);

  useEffect(() => {
    fetchBlocks();
    const interval = setInterval(fetchBlocks, 1000);
    return () => clearInterval(interval);
  }, [fetchBlocks]);

  const handleRefresh = () => {
    fetchBlocks();
  };

  const totalTransactions = blocks.reduce((sum, block) => sum + block.voteTransactions + block.userTransactions, 0);
  const totalVoteTransactions = blocks.reduce((sum, block) => sum + block.voteTransactions, 0);

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
        className="dashboard-card bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-lime-100"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-lime-600">Block Activity</h2>
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-lime-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-lime-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Transaction Distribution</h3>
              <div className="relative w-48 h-48 mx-auto">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(from 0deg, #84cc16 ${(totalVoteTransactions / totalTransactions) * 100}%, #1f2937 ${(totalVoteTransactions / totalTransactions) * 100}% 100%)`,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{totalTransactions}</div>
                    <div className="text-sm text-gray-400">Total Transactions</div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-lime-500" />
                  <span className="text-sm">Vote Transactions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-600" />
                  <span className="text-sm">User Transactions</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Block Timeline</h3>
              <div className="relative h-48 overflow-x-auto">
                <div className="absolute inset-0 flex items-end gap-1">
                  {blocks.slice(0, 100).map((block, index) => {
                    const totalTx = block.voteTransactions + block.userTransactions;
                    const maxTx = Math.max(...blocks.map(b => b.voteTransactions + b.userTransactions));
                    const height = (totalTx / maxTx) * 100;
                    
                    return (
                      <div
                        key={block.slot}
                        className="flex-1 group relative"
                        style={{ height: `${height}%` }}
                      >
                        <div className="absolute inset-0 bg-lime-500/20 rounded-t hover:bg-lime-500/30 transition-colors" />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-lime-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {totalTx} transactions
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-lime-100">
                  <tr className="text-left text-sm text-gray-500">
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
                      className="border-b border-lime-100 hover:bg-lime-50/50 transition-colors"
                    >
                      <td className="py-3">
                        <a 
                          href={`https://solscan.io/block/${block.slot}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-lime-600 hover:text-lime-700 font-mono group flex items-center gap-2"
                        >
                          {block.slot}
                          <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </td>
                      <td className="py-3">
                        <a 
                          href={`/validators/${block.votePubkey}`}
                          className="flex items-center space-x-2 text-lime-600 hover:text-lime-700"
                        >
                          {block.iconUrl ? (
                            <img 
                              src={block.iconUrl} 
                              alt={block.name || 'Validator'} 
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-lime-100 flex items-center justify-center">
                              <span className="text-xs font-bold text-lime-600">
                                {(block.name || block.votePubkey).charAt(0).toUpperCase()}
                              </span>
                            </div>
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
          </div>
        </div>
      </motion.div>
    </ErrorBoundary>
  );
} 