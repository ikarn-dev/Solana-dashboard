"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

interface NetworkStatusData {
  lastSyncedSlot: number;
  lastNetworkSlot: number;
  networkLag: number;
  laggingBehind: boolean;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

export default function NetworkStatus() {
  const [data, setData] = useState<NetworkStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/network-status');
        const result = await response.json();
        
        if (!response.ok) {
          const errorResponse = result as ErrorResponse;
          throw new Error(errorResponse.details || errorResponse.error || 'Failed to fetch network status');
        }
        
        setData(result);
        setError(null);
      } catch (err) {
        console.error('Error fetching network status:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 1000); // Update every second

    return () => clearInterval(interval);
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
        <div className="flex items-center space-x-2 text-red-600">
          <Activity className="w-5 h-5" />
          <p>Error: {error}</p>
        </div>
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
        <h2 className="text-xl font-semibold text-lime-600 mb-6 flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          Network Status
        </h2>
        
        <div className="flex flex-col space-y-6">
          {/* Slot Information */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <small className="text-gray-500">Last Synced Slot</small>
              <div className="text-xl font-mono">{data.lastSyncedSlot.toLocaleString()}</div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <small className="text-gray-500">Last Network Slot</small>
              <div className="text-xl font-mono">{data.lastNetworkSlot.toLocaleString()}</div>
            </div>
          </div>
          
          {/* Network Lag Section */}
          <div className="flex items-center justify-between">
            <small className="text-gray-500">Network Lag</small>
            <div className="flex items-center">
              <div className={`text-xl font-mono ${data.laggingBehind ? 'text-red-500' : 'text-lime-500'}`}>
                {data.networkLag.toFixed(2)}
              </div>
              <small className="text-gray-500 ml-1">s</small>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center justify-between">
            <small className="text-gray-500">Status</small>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              data.laggingBehind 
                ? 'bg-red-100 text-red-700' 
                : 'bg-lime-100 text-lime-700'
            }`}>
              {data.laggingBehind ? 'Lagging' : 'Synced'}
            </div>
          </div>
        </div>
      </motion.div>
    </ErrorBoundary>
  );
}