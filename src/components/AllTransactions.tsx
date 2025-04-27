'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Transaction } from '@/lib/api/types';

// Custom number formatter to display exact values
const formatExactNumber = (num: number): string => {
  return num.toLocaleString('en-US', {
    maximumFractionDigits: 0,
    useGrouping: true
  });
};

export function AllTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchTransactions = useCallback(async (pageNum: number = 1) => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/recent-transactions?page=${pageNum}`, {
        cache: 'no-store'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      const { data } = await response.json();
      if (pageNum === 1) {
        setTransactions(data.transactions);
      } else {
        setTransactions(prev => [...prev, ...data.transactions]);
      }
      setHasMore(data.transactions.length === 100);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, [isRefreshing]);

  useEffect(() => {
    fetchTransactions(page);
  }, [page, fetchTransactions]);

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  if (loading && transactions.length === 0) {
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
            <h2 className="text-xl font-semibold text-lime-600">All Transactions</h2>
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => fetchTransactions(1)}
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
                <th className="pb-3">Transaction</th>
                <th className="pb-3">Block</th>
                <th className="pb-3">Signatures</th>
                <th className="pb-3">Programs</th>
                <th className="pb-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr 
                  key={tx.transactionHash}
                  className="border-b border-gray-100 hover:bg-lime-50/50 transition-colors"
                >
                  <td className="py-3">
                    <a 
                      href={`/transaction/${tx.transactionHash}`}
                      className="text-lime-600 hover:text-lime-700 font-mono"
                    >
                      {tx.transactionHash.slice(0, 8)}...{tx.transactionHash.slice(-8)}
                    </a>
                  </td>
                  <td className="py-3 font-mono">{formatExactNumber(tx.blockNumber)}</td>
                  <td className="py-3 font-mono">{formatExactNumber(tx.header.numRequiredSignatures)}</td>
                  <td className="py-3 font-mono">{formatExactNumber(tx.instructions.length)}</td>
                  <td className="py-3 text-gray-500">
                    {new Date().toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hasMore && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleLoadMore}
              disabled={isRefreshing}
              className="px-4 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700 transition-colors disabled:opacity-50"
            >
              {isRefreshing ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </motion.div>
    </ErrorBoundary>
  );
} 