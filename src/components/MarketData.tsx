"use client";

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, RefreshCw } from 'lucide-react';
import { MarketData as MarketDataType } from '@/lib/api/types';
import { getMarketData } from '@/lib/api/solana';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine
} from 'recharts';

export function MarketDataCard() {
  const [data, setData] = useState<MarketDataType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isAutoReloading, setIsAutoReloading] = useState(true);
  const fetchInterval = useRef<NodeJS.Timeout>();
  const retryCount = useRef<number>(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 5000; // 5 seconds
  const UPDATE_INTERVAL = 1000; // Changed from 60000 to 1000 for 1-second updates

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const response = await getMarketData();
      console.log('Market data response:', response);
      
      if (response.data) {
        setData(response.data);
        setLastUpdated(new Date());
        setError(null);
        retryCount.current = 0;
      } else {
        throw new Error('Failed to fetch market data');
      }
    } catch (err) {
      console.error('Error fetching market data:', err);
      if (err instanceof Error && err.message.includes('Rate limit exceeded')) {
        if (retryCount.current < MAX_RETRIES) {
          retryCount.current++;
          setTimeout(() => fetchData(false), RETRY_DELAY);
        } else {
          setError('Rate limit exceeded. Please try again later.');
          setIsAutoReloading(false);
        }
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch initial data
    fetchData();
    
    // Update every minute if auto-reload is enabled
    if (isAutoReloading) {
      // Clear any existing interval
      if (fetchInterval.current) {
        clearInterval(fetchInterval.current);
      }
      // Set new interval
      fetchInterval.current = setInterval(() => {
        console.log('Fetching market data update...');
        fetchData(false);
      }, UPDATE_INTERVAL);
    }

    return () => {
      if (fetchInterval.current) {
        clearInterval(fetchInterval.current);
      }
    };
  }, [isAutoReloading]);

  const toggleAutoReload = () => {
    setIsAutoReloading(prev => !prev);
    
    if (!isAutoReloading) {
      // Start auto-reload
      fetchInterval.current = setInterval(() => fetchData(false), UPDATE_INTERVAL);
    } else {
      // Stop auto-reload
      if (fetchInterval.current) {
        clearInterval(fetchInterval.current);
      }
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatLargeNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(num);
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
      </div>
    );
  }

  if (!data) return null;

  // Transform history data for the chart
  const chartData = data.history?.map(item => {
    const date = new Date(item.timestamp * 1000);
    return {
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      price: item.price,
      volume: item.volume24h
    };
  }) || [];

  console.log('Chart data:', chartData);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-700">{data.date} {data.time}</p>
          <p className="text-sm text-lime-600 font-semibold">
            ${data.price.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500">
            Volume: {formatLargeNumber(data.volume)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Helper function to safely format percentage
  const formatPercentage = (value: number | undefined) => {
    if (value === undefined) return '0.00';
    return value.toFixed(2);
  };

  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="dashboard-card bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-lime-600 flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Market Data
          </h2>
          <div className="flex items-center space-x-4">
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            <button 
              onClick={toggleAutoReload}
              className="flex items-center text-sm text-lime-600 hover:text-lime-700 transition-colors"
            >
              {isAutoReloading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="ml-1">Auto-updating</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span className="ml-1">Manual update</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass-card p-4 rounded-lg bg-lime-50/50 border border-lime-100"
          >
            <div className="flex flex-col">
              <p className="text-sm text-gray-600">Price</p>
              <div className="text-2xl font-bold text-lime-600">
                {formatNumber(data.price || 0)}
              </div>
              <div className="flex items-center mt-1">
                {(data.percentChange24h || 0) >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={(data.percentChange24h || 0) >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {formatPercentage(data.percentChange24h)}%
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass-card p-4 rounded-lg bg-lime-50/50 border border-lime-100"
          >
            <div className="flex flex-col">
              <p className="text-sm text-gray-600">24h Volume</p>
              <div className="text-2xl font-bold text-lime-600">
                {formatLargeNumber(data.volume24h || 0)}
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass-card p-4 rounded-lg bg-lime-50/50 border border-lime-100"
          >
            <div className="flex flex-col">
              <p className="text-sm text-gray-600">Market Cap</p>
              <div className="text-2xl font-bold text-lime-600">
                {formatLargeNumber(data.marketCap || 0)}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Price Chart */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-lime-600 mb-4">24-Hour Price History</h3>
          <div className="h-80 bg-white/50 rounded-lg p-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#f0f0f0" 
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="time" 
                    stroke="#666"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    minTickGap={50}
                  />
                  <YAxis 
                    stroke="#666"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                    domain={['auto', 'auto']}
                    padding={{ top: 10, bottom: 10 }}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ stroke: '#10B981', strokeWidth: 1 }}
                  />
                  <ReferenceLine 
                    y={data.price} 
                    stroke="#10B981" 
                    strokeDasharray="3 3"
                    label={{ 
                      value: 'Current Price', 
                      position: 'right',
                      fill: '#10B981',
                      fontSize: 12
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPrice)"
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No price history data available
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </ErrorBoundary>
  );
} 