'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { TopValidator } from '@/lib/api/types';

// Custom number formatter to display exact values
const formatExactNumber = (num: number): string => {
  return num.toLocaleString('en-US', {
    maximumFractionDigits: 0,
    useGrouping: true
  });
};

export function TopValidators() {
  const [validators, setValidators] = useState<TopValidator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchValidators = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/proxy?endpoint=/v1/validators/top&limit=100`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch validators');
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format');
      }
      
      setValidators(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching validators:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch validators');
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, [isRefreshing]);

  useEffect(() => {
    fetchValidators();
    const interval = setInterval(fetchValidators, 5 * 60 * 1000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, [fetchValidators]);

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
        <div className="flex flex-col items-center justify-center space-y-4">
          <p className="text-red-600">Error: {error}</p>
          <button
            onClick={fetchValidators}
            className="px-4 py-2 bg-lime-100 text-lime-600 rounded-lg hover:bg-lime-200 transition-colors"
          >
            Retry
          </button>
        </div>
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
            <h2 className="text-xl font-semibold text-lime-600">Top Validators</h2>
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                <th className="pb-3">Validator</th>
                <th className="pb-3">Stake</th>
                <th className="pb-3">Delegators</th>
                <th className="pb-3">Commission</th>
                <th className="pb-3">Version</th>
                <th className="pb-3">Last Vote</th>
              </tr>
            </thead>
            <tbody>
              {validators.map((validator) => (
                <tr 
                  key={validator.votePubkey}
                  className="border-b border-gray-100 hover:bg-lime-50/50 transition-colors"
                >
                  <td className="py-3">
                    <a 
                      href={`/validator/${validator.votePubkey}`}
                      className="flex items-center space-x-2 text-lime-600 hover:text-lime-700"
                    >
                      {validator.pictureURL ? (
                        <img 
                          src={validator.pictureURL} 
                          alt={validator.moniker} 
                          className="w-4 h-4 rounded-full"
                        />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-lime-100"></div>
                      )}
                      <span className="font-mono">
                        {validator.moniker || validator.votePubkey.slice(0, 8) + '...' + validator.votePubkey.slice(-8)}
                      </span>
                    </a>
                  </td>
                  <td className="py-3 font-mono">{formatExactNumber(validator.activatedStake)} SOL</td>
                  <td className="py-3 font-mono">{formatExactNumber(validator.delegatorCount)}</td>
                  <td className="py-3 font-mono">{validator.commission}%</td>
                  <td className="py-3 font-mono">{validator.version}</td>
                  <td className="py-3 text-gray-500">
                    {new Date(validator.lastVote * 1000).toLocaleTimeString()}
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