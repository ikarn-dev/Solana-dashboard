'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Coins, TrendingUp, Award } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { SupplyBreakdown, GeneralInfo } from '@/lib/api/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// Helper function to format lamports to SOL in millions
const formatToMillions = (lamports: number): string => {
  const sol = lamports / 1e9; // Convert lamports to SOL
  return `${(sol / 1e6).toFixed(2)}M`; // Convert to millions and format
};

// Helper function to format lamports to SOL
const formatToSol = (lamports: number): string => {
  const sol = lamports / 1e9; // Convert lamports to SOL
  return sol.toLocaleString('en-US', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Helper function to convert lamports to SOL
const lamportsToSol = (lamports: number): number => {
  return lamports / 1e9;
};

// Helper function to format SOL value for display with 3 digits and 1 decimal (without M)
const formatSolValueNoSuffix = (value: number): string => {
  // Ensure we have exactly 3 digits before decimal and 1 after
  const formattedValue = value.toFixed(1);
  const [whole, decimal] = formattedValue.split('.');
  
  // Pad with underscores to ensure 3 digits
  let paddedWhole = whole;
  if (whole.length < 3) {
    paddedWhole = '_'.repeat(3 - whole.length) + whole;
  }
  
  return `${paddedWhole}.${decimal}`;
};

export function StakingDetails() {
  const [supplyData, setSupplyData] = useState<SupplyBreakdown | null>(null);
  const [generalInfo, setGeneralInfo] = useState<GeneralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const lastFetchTime = useRef<number>(0);
  const fetchInterval = useRef<NodeJS.Timeout>();

  // Define colors for pie charts
  const chartColors = {
    circulating: '#10B981', // Green
    nonCirculating: '#6366F1', // Indigo
    effective: '#F59E0B', // Amber
    activating: '#EF4444', // Red
    deactivating: '#8B5CF6' // Purple
  };

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      const now = Date.now();
      if (now - lastFetchTime.current < 30000 && supplyData && !showLoading) {
        return;
      }
      
      const [supplyResponse, generalInfoResponse] = await Promise.all([
        fetch('/api/supply-breakdown'),
        fetch('/api/general-info')
      ]);

      if (!supplyResponse.ok || !generalInfoResponse.ok) {
        throw new Error(`HTTP error! status: ${supplyResponse.status || generalInfoResponse.status}`);
      }
      
      const [supplyResult, generalInfoResult] = await Promise.all([
        supplyResponse.json(),
        generalInfoResponse.json()
      ]);

      if (!supplyResult.data || !generalInfoResult.data) {
        throw new Error('No data received from API');
      }

      setSupplyData(supplyResult.data);
      setGeneralInfo(generalInfoResult.data);
      setError(null);
      setLastUpdated(new Date());
      lastFetchTime.current = now;
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchInterval.current = setInterval(() => fetchData(false), 30000);
    return () => {
      if (fetchInterval.current) {
        clearInterval(fetchInterval.current);
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

  if (!supplyData || !generalInfo) {
    return null;
  }

  const stakeRatio = (supplyData.stake.effective / supplyData.supply.total) * 100;

  // Prepare data for pie charts with values in SOL
  const supplyChartData = [
    { name: 'Circulating', value: lamportsToSol(supplyData.supply.circulating), color: chartColors.circulating },
    { name: 'Non-Circulating', value: lamportsToSol(supplyData.supply.nonCirculating), color: chartColors.nonCirculating }
  ];

  const stakeChartData = [
    { name: 'Effective Stake', value: lamportsToSol(supplyData.stake.effective), color: chartColors.effective },
    { name: 'Activating', value: lamportsToSol(supplyData.stake.activating), color: chartColors.activating },
    { name: 'Deactivating', value: lamportsToSol(supplyData.stake.deactivating), color: chartColors.deactivating }
  ];

  // Custom tooltip component for consistent formatting
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: data.color }}
            />
            <p className="text-sm font-medium text-gray-700">{data.name}</p>
          </div>
          <p className="text-sm text-gray-600 mt-1">{formatSolValueNoSuffix(data.value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="dashboard-card bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg"
      >
        <h2 className="text-xl font-semibold text-lime-600 mb-6 flex items-center">
          <Coins className="w-5 h-5 mr-2" />
          Staking Details
          {lastUpdated && (
            <span className="text-xs text-gray-500 ml-auto">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Supply Information */}
          <div className="glass-card p-4 rounded-lg bg-lime-50/50 border border-lime-100">
            <h3 className="text-lg font-semibold text-lime-600 mb-4">Supply Information</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <small className="text-gray-500 mr-2">Total Supply</small>
                  </div>
                  <div className="text-2xl font-mono">
                    {formatToMillions(supplyData.supply.total)}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <small className="text-gray-500 mr-2">Circulating</small>
                  </div>
                  <div className="text-2xl font-mono">
                    {formatToMillions(supplyData.supply.circulating)}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <small className="text-gray-500 mr-2">Non-Circulating</small>
                  </div>
                  <div className="text-2xl font-mono">
                    {formatToMillions(supplyData.supply.nonCirculating)}
                  </div>
                </div>
              </div>

              {/* Supply Distribution Pie Chart */}
              <div className="h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={supplyChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                      animationBegin={0}
                      animationDuration={1000}
                      animationEasing="ease-out"
                    >
                      {supplyChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          strokeWidth={0}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            {/* Supply Chart Legend */}
            <div className="flex justify-center gap-4 mt-4">
              {supplyChartData.map((entry, index) => (
                <div key={`legend-${index}`} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Staking Information */}
          <div className="glass-card p-4 rounded-lg bg-lime-50/50 border border-lime-100">
            <h3 className="text-lg font-semibold text-lime-600 mb-4">Staking Status</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <small className="text-gray-500 mr-2">Activating</small>
                    </div>
                    <div className="text-2xl font-mono">
                      {formatToMillions(supplyData.stake.activating)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <small className="text-gray-500 mr-2">Deactivating</small>
                    </div>
                    <div className="text-2xl font-mono">
                      {formatToMillions(supplyData.stake.deactivating)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <small className="text-gray-500 mr-2">Effective Stake</small>
                    </div>
                    <div className="text-2xl font-mono">
                      {formatToMillions(supplyData.stake.effective)}
                    </div>
                  </div>

                  {/* APY Information */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <small className="text-gray-500 mr-2">Current APY</small>
                      <div className="flex items-center">
                        <TrendingUp className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                    <div className="text-2xl font-mono text-lime-600">
                      {(generalInfo.stakingYield || 0).toFixed(2)}%
                    </div>
                  </div>

                  {/* Rewards Information */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <small className="text-gray-500 mr-2">Daily Rewards</small>
                      <div className="flex items-center">
                        <Award className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                    <div className="text-2xl font-mono text-lime-600">
                      {formatToSol(generalInfo.dailyRewards || 0)} SOL
                    </div>
                  </div>
                </div>

                {/* Staking Status Pie Chart */}
            <div className="h-64 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stakeChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                        animationBegin={0}
                        animationDuration={1000}
                        animationEasing="ease-out"
                      >
                        {stakeChartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color}
                            strokeWidth={0}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
            {/* Staking Chart Legend */}
            <div className="flex justify-center gap-4 mt-4">
              {stakeChartData.map((entry, index) => (
                <div key={`legend-${index}`} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600">{entry.name}</span>
              </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </ErrorBoundary>
  );
} 