'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Transaction } from '@/lib/api/types';

// Helper function to format timestamp
const formatTime = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleTimeString();
};

// Helper function to format signature
const formatSignature = (signature: string): string => {
  return `${signature.slice(0, 8)}...${signature.slice(-8)}`;
};

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/proxy?endpoint=/v1/latest-transactions', {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid response format');
      }
      
      // Transform the data to match our Transaction type
      const formattedTransactions = data.map((tx: any) => ({
        signature: tx.signature,
        block: tx.block,
        fee: tx.fee,
        programs: tx.programs || [],
        timestamp: tx.timestamp,
        status: tx.status,
        time: new Date(tx.timestamp * 1000).toISOString()
      }));
      
      const transactionsWithTime = formattedTransactions.map(tx => ({
        ...tx,
        time: formatTime(tx.timestamp)
      }));
      
      setTransactions(transactionsWithTime.slice(0, 10)); // Get top 10 transactions
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, [isRefreshing]);

  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [fetchTransactions]);

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
            <h2 className="text-xl font-semibold text-lime-600">Recent Transactions</h2>
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={fetchTransactions}
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
                <th className="pb-3">Fee</th>
                <th className="pb-3">Programs</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr 
                  key={tx.signature}
                  className="border-b border-gray-100 hover:bg-lime-50/50 transition-colors"
                >
                  <td className="py-3">
                    <a 
                      href={`https://solscan.io/tx/${tx.signature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lime-600 hover:text-lime-700 font-mono group flex items-center gap-2"
                    >
                      {formatSignature(tx.signature)}
                      <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </td>
                  <td className="py-3 font-mono">{tx.block}</td>
                  <td className="py-3 font-mono">{tx.fee} SOL</td>
                  <td className="py-3 font-mono">{tx.programs.length}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      tx.status === 'success' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">
                    {formatTime(tx.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-lime-600 mb-4">Transaction Volume (Last 10)</h3>
          <div className="h-64 bg-lime-50/50 rounded-lg p-4">
            <div className="h-full flex items-end gap-2">
              {transactions.map((tx) => (
                <div 
                  key={tx.signature}
                  className="flex-1 bg-lime-400 hover:bg-lime-500 transition-colors rounded-t"
                  style={{ 
                    height: `${(tx.programs.length / Math.max(...transactions.map(t => t.programs.length))) * 100}%`,
                    minHeight: '10px'
                  }}
                  title={`${tx.programs.length} programs`}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </ErrorBoundary>
  );
} 