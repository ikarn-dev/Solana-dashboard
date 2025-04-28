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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-lime-50/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-lime-600 mb-4">Transaction Volume</h3>
            <div className="h-64 relative">
              <div className="h-full flex items-end gap-2">
                {transactions.slice(0, 10).map((tx, index) => {
                  const maxInstructions = Math.max(...transactions.slice(0, 10).map(t => t.instructions.length));
                  const height = (tx.instructions.length / maxInstructions) * 100;
                  return (
                    <div
                      key={tx.transactionHash}
                      className="flex-1 bg-lime-400 hover:bg-lime-500 transition-colors rounded-t"
                      style={{ 
                        height: `${height}%`,
                        minHeight: '10px'
                      }}
                      title={`${tx.instructions.length} instructions`}
                    />
                  );
                })}
              </div>
              <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
                {transactions.slice(0, 10).map((tx, index) => (
                  <div
                    key={tx.transactionHash}
                    className="text-xs text-gray-500"
                    style={{
                      transform: `translateX(${index % 2 === 0 ? '0' : '10px'})`
                    }}
                  >
                    {tx.instructions.length}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-lime-50/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-lime-600 mb-4">Transaction Heat Map</h3>
            <div className="h-64 relative">
              <div className="grid grid-cols-5 gap-1 h-full">
                {transactions.slice(0, 20).map((tx, index) => {
                  const maxInstructions = Math.max(...transactions.slice(0, 20).map(t => t.instructions.length));
                  const intensity = (tx.instructions.length / maxInstructions) * 100;
                  return (
                    <div
                      key={tx.transactionHash}
                      className="rounded hover:scale-105 transition-transform"
                      style={{
                        backgroundColor: `rgba(101, 163, 13, ${0.2 + (intensity / 100) * 0.8})`,
                        gridColumn: `${(index % 5) + 1}`,
                        gridRow: `${Math.floor(index / 5) + 1}`
                      }}
                      title={`${tx.instructions.length} instructions`}
                    />
                  );
                })}
              </div>
              <div className="absolute bottom-0 left-0 right-0 text-center text-xs text-gray-500">
                Last 20 Transactions
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-lime-50/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-lime-600 mb-4">Instructions Distribution</h3>
            <div className="h-64 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 rounded-full relative">
                  {transactions.slice(0, 10).map((tx, index) => {
                    const total = transactions.slice(0, 10).reduce((sum, t) => sum + t.instructions.length, 0);
                    const percentage = (tx.instructions.length / total) * 100;
                    const startAngle = transactions.slice(0, index).reduce((sum, t) => sum + (t.instructions.length / total) * 360, 0);
                    return (
                      <div
                        key={tx.transactionHash}
                        className="absolute inset-0"
                        style={{
                          background: `conic-gradient(
                            from ${startAngle}deg,
                            rgba(101, 163, 13, ${0.3 + (index * 0.1)}) ${percentage}%,
                            transparent ${percentage}%
                          )`
                        }}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-lime-600">
                    {transactions.slice(0, 10).reduce((sum, t) => sum + t.instructions.length, 0)}
                  </div>
                  <div className="text-sm text-gray-500">Total Instructions (Last 10)</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-lime-50/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-lime-600 mb-4">Transaction Timeline</h3>
            <div className="h-64 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-1 bg-lime-200 relative">
                  {transactions.slice(0, 10).map((tx, index) => (
                    <div
                      key={tx.transactionHash}
                      className="absolute -top-2 w-4 h-4 rounded-full bg-lime-400 hover:bg-lime-500 transition-colors"
                      style={{
                        left: `${(index / 9) * 100}%`,
                        transform: 'translateX(-50%)'
                      }}
                      title={`${tx.instructions.length} instructions`}
                    />
                  ))}
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-between px-4">
                {transactions.slice(0, 10).map((tx, index) => (
                  <div
                    key={tx.transactionHash}
                    className="text-xs text-gray-500"
                    style={{
                      transform: `translateY(${index % 2 === 0 ? '20px' : '-20px'})`
                    }}
                  >
                    {tx.instructions.length}
                  </div>
                ))}
              </div>
            </div>
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
                      href={`https://solscan.io/tx/${tx.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lime-600 hover:text-lime-700 font-mono group flex items-center gap-2"
                    >
                      {tx.transactionHash.slice(0, 8)}...{tx.transactionHash.slice(-8)}
                      <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
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

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-lime-600 mb-4">Transaction Volume (Last 10)</h3>
          <div className="h-64 bg-lime-50/50 rounded-lg p-4">
            <div className="h-full flex items-end gap-2">
              {transactions.map((tx, index) => (
                <div 
                  key={tx.transactionHash}
                  className="flex-1 bg-lime-400 hover:bg-lime-500 transition-colors rounded-t"
                  style={{ 
                    height: `${(tx.instructions.length / Math.max(...transactions.map(t => t.instructions.length))) * 100}%`,
                    minHeight: '10px'
                  }}
                  title={`${tx.instructions.length} instructions`}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </ErrorBoundary>
  );
} 