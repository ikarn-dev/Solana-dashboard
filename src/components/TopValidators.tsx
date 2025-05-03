'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { TopValidator } from '@/lib/api/types';
import { formatExactNumber } from '@/lib/utils';

const ITEMS_PER_PAGE = 10;
const INITIAL_LIMIT = 20; // Fetch 20 initially to have some buffer for pagination

export default function TopValidators() {
  const [validators, setValidators] = useState<TopValidator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/validators');
        if (!response.ok) throw new Error('Failed to fetch validators');
        
        const result = await response.json();
        if (!Array.isArray(result)) {
          throw new Error('Invalid response format');
        }
        
        // Ensure we have an array of TopValidator
        const validatorsData: TopValidator[] = result.map(validator => ({
          votePubkey: validator.votePubkey,
          moniker: validator.moniker || 'Unnamed Validator',
          version: validator.version || 'Unknown',
          activatedStake: validator.activatedStake,
          commission: validator.commission,
          lastVote: validator.lastVote,
          ll: validator.ll || [0, 0],
          pictureURL: validator.pictureURL || '',
          delegatorCount: validator.delegatorCount || 0
        }));
        
        setValidators(validatorsData);
        setLastUpdated(new Date());
        setError(null);
        setRetryCount(0);
      } catch (err) {
        console.error('Error fetching validators:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        
        // Implement exponential backoff for retries
        if (retryCount < 3) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, delay);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [retryCount]);

  const totalPages = Math.ceil(validators.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentValidators = validators.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
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
        <div className="flex flex-col items-center justify-center space-y-4">
          <p className="text-red-600">Error: {error}</p>
          {retryCount < 3 ? (
            <p className="text-sm text-gray-500">Retrying in {Math.min(1000 * Math.pow(2, retryCount), 10000) / 1000} seconds...</p>
          ) : (
            <button
              onClick={() => {
                setRetryCount(0);
              }}
              className="px-4 py-2 bg-lime-100 text-lime-600 rounded-lg hover:bg-lime-200 transition-colors"
            >
              Retry
            </button>
          )}
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
              {currentValidators.map((validator) => (
                <tr 
                  key={validator.votePubkey}
                  className="border-b border-gray-100 hover:bg-lime-50/50 transition-colors"
                >
                  <td className="py-3">
                    <a 
                      href={`/validators/${validator.votePubkey}`}
                      className="flex items-center space-x-2 text-lime-600 hover:text-lime-700"
                    >
                      {validator.pictureURL ? (
                        <img 
                          src={validator.pictureURL} 
                          alt={validator.moniker || 'Validator'} 
                          className="w-8 h-8 rounded-full object-cover border border-lime-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lime-100 to-lime-200 flex items-center justify-center border border-lime-200 overflow-hidden">
                          <span className="text-xs font-bold text-lime-600 truncate max-w-[90%]">
                            {(validator.moniker || validator.votePubkey.slice(0, 1)).toUpperCase()}
                          </span>
                        </div>
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-lg bg-lime-100 text-lime-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-lime-200 transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-lg bg-lime-100 text-lime-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-lime-200 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </motion.div>
    </ErrorBoundary>
  );
} 