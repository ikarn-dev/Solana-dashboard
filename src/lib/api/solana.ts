import { NetworkStatus, SupplyBreakdown, ApiResponse, TPSData, MarketData, RecentBlocksResponse, RecentTransactionsResponse, Validator, GeneralInfo, TopValidator } from './types';

// Base URL for Solana Beach API
export const SOLANA_BEACH_API = process.env.NEXT_PUBLIC_SOLANA_API_URL || 'https://api.solanaview.com';
const API_KEY = process.env.SOLANA_BEACH_API_KEY;

if (!API_KEY) {
  throw new Error('SOLANA_BEACH_API_KEY environment variable is required');
}

// Common headers for API requests
const headers = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_KEY}`
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds
const REQUEST_TIMEOUT = 10000; // 10 seconds

// Error handling
class SolanaApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'SolanaApiError';
  }
}

// Rate limiting state
const rateLimitState = new Map<string, {
  lastRequestTime: number;
  isWaiting: boolean;
}>();

function checkRateLimit(endpoint: string): boolean {
  const now = Date.now();
  const state = rateLimitState.get(endpoint) || { lastRequestTime: 0, isWaiting: false };
  
  if (state.isWaiting) {
    return false;
  }
  
  const timeSinceLastRequest = now - state.lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_WINDOW) {
    return false;
  }
  
  rateLimitState.set(endpoint, { lastRequestTime: now, isWaiting: false });
  return true;
}

// Generic fetch function with rate limiting and error handling
async function fetchWithRetry<T>(
  endpoint: string
): Promise<ApiResponse<T>> {
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      // Check rate limit
      if (!checkRateLimit(endpoint)) {
        const state = rateLimitState.get(endpoint) || { lastRequestTime: 0, isWaiting: false };
        const timeToWait = Math.max(0, RATE_LIMIT_WINDOW - (Date.now() - state.lastRequestTime));
        
        if (timeToWait > 0 && !state.isWaiting) {
          rateLimitState.set(endpoint, { ...state, isWaiting: true });
          await new Promise(resolve => setTimeout(resolve, timeToWait));
          rateLimitState.set(endpoint, { ...state, isWaiting: false });
        }
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const proxyUrl = new URL('/api/proxy', baseUrl);
      proxyUrl.searchParams.append('endpoint', endpoint);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
      
      const response = await fetch(proxyUrl.toString(), {
        headers,
        cache: 'no-store',
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));
      
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '5', 10) * 1000;
        await new Promise(resolve => setTimeout(resolve, retryAfter));
        retries++;
        continue;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new SolanaApiError(
          'API_ERROR',
          `API error: ${response.status} ${response.statusText}`,
          errorData
        );
      }
      
      const data = await response.json();
      return {
        data,
        timestamp: Date.now(),
        success: true
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`Request timeout for ${endpoint}, retrying...`);
      } else {
        console.error(`Error fetching ${endpoint}:`, error);
      }
      
      if (retries < MAX_RETRIES - 1) {
        const delay = RETRY_DELAY * Math.pow(2, retries);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
        continue;
      }
      throw error;
    }
  }
  
  throw new SolanaApiError(
    'MAX_RETRIES_EXCEEDED',
    'Maximum number of retries exceeded'
  );
}

// Network Status
export async function getNetworkStatus(): Promise<ApiResponse<NetworkStatus>> {
  return fetchWithRetry<NetworkStatus>('/v1/network-status');
}

// Supply Breakdown
export async function getSupplyBreakdown(): Promise<ApiResponse<SupplyBreakdown>> {
  return fetchWithRetry<SupplyBreakdown>('/v2/supply-breakdown');
}

// TPS
export async function getTPS(): Promise<ApiResponse<TPSData>> {
  try {
    const response = await fetchWithRetry<TPSData>('/v2/transactions-per-second');

    if (!response.success) {
      throw new SolanaApiError(
        'API_ERROR',
        'Failed to fetch TPS data'
      );
    }

    // Calculate total transactions per second as sum of vote and user transactions
    const totalTransactionsPerSecond = 
      (response.data.voteTransactionsPerSecond || 0) + 
      (response.data.userTransactionsPerSecond || 0);
    
    return {
      ...response,
      data: {
        ...response.data,
        totalTransactionsPerSecond
      }
    };
  } catch (error) {
    if (error instanceof SolanaApiError) {
      throw error;
    }
    throw new SolanaApiError(
      'FETCH_ERROR',
      error instanceof Error ? error.message : 'Unknown error occurred',
      error
    );
  }
}

// Market Data
export async function getMarketData(): Promise<ApiResponse<MarketData>> {
  return fetchWithRetry<MarketData>('/v2/market-data');
}

// Recent Blocks
export async function getRecentBlocks(limit: number = 50, offset: number = 0): Promise<ApiResponse<RecentBlocksResponse>> {
  return fetchWithRetry<RecentBlocksResponse>(`/v2/recent-blocks?limit=${limit}&offset=${offset}`);
}

// Recent Transactions
export async function getRecentTransactions(limit: number = 50, offset: number = 0): Promise<ApiResponse<RecentTransactionsResponse>> {
  try {
    const response = await fetchWithRetry<RecentTransactionsResponse>(`/v1/latest-transactions?limit=${limit}&offset=${offset}`);

    if (!response.success) {
      throw new SolanaApiError(
        'API_ERROR',
        'Failed to fetch recent transactions'
      );
    }

    // Ensure transactions array exists and is properly formatted
    const transactions = Array.isArray(response.data?.transactions) 
      ? response.data.transactions.map(tx => ({
          signature: tx.signature || '',
          timestamp: Number(tx.timestamp) || 0,
          fee: Number(tx.fee) || 0,
          status: tx.status || 'unknown',
          block: tx.block || 0,
          programs: tx.programs || [],
          time: tx.time || new Date().toISOString()
        }))
      : [];

    return {
      ...response,
      data: {
        transactions,
        total: response.data?.total || 0
      }
    };
  } catch (error) {
    if (error instanceof SolanaApiError) {
      throw error;
    }
    throw new SolanaApiError(
      'FETCH_ERROR',
      error instanceof Error ? error.message : 'Unknown error occurred',
      error
    );
  }
}

// Get All Validators
export async function getAllValidators(offset: number = 0, limit: number = 200): Promise<ApiResponse<Validator[]>> {
  return fetchWithRetry<Validator[]>(`/v1/validators/all?offset=${offset}&limit=${limit}`);
}

// Get Top Validators
export async function getTopValidators(offset: number = 0): Promise<ApiResponse<TopValidator[]>> {
  return fetchWithRetry<TopValidator[]>(`/v1/validators/top?offset=${offset}`);
}

// Get General Info
export async function getGeneralInfo(): Promise<ApiResponse<GeneralInfo>> {
  try {
    const response = await fetchWithRetry<GeneralInfo>('/v1/general-info');

    if (!response.success) {
      throw new SolanaApiError(
        'API_ERROR',
        'Failed to fetch general info'
      );
    }

    // Calculate daily rewards based on total stake and APY
    const totalStake = response.data.activatedStake || 0;
    const stakingYield = response.data.stakingYield || 0;
    const dailyRewards = (totalStake * (stakingYield / 100)) / 365;

    // Ensure all numeric values are properly formatted
    const formattedData = {
      ...response.data,
      dailyRewards: dailyRewards,
      activatedStake: Number(response.data.activatedStake) || 0,
      stakingYield: Number(response.data.stakingYield) || 0,
      totalSupply: Number(response.data.totalSupply) || 0,
      circulatingSupply: Number(response.data.circulatingSupply) || 0,
      tokenPrice: Number(response.data.tokenPrice) || 0,
      dailyVolume: Number(response.data.dailyVolume) || 0,
      dailyPriceChange: Number(response.data.dailyPriceChange) || 0,
      avgTPS: Number(response.data.avgTPS) || 0,
      totalTransactionCount: Number(response.data.totalTransactionCount) || 0,
      nrValidators: Number(response.data.nrValidators) || 0,
      nrNonValidators: Number(response.data.nrNonValidators) || 0,
      delinquentStake: Number(response.data.delinquentStake) || 0,
      totalDelegatedStake: Number(response.data.totalDelegatedStake) || 0,
      avgBlockTime_24h: Number(response.data.avgBlockTime_24h) || 0,
      avgBlockTime_1h: Number(response.data.avgBlockTime_1h) || 0,
      avgBlockTime_1min: Number(response.data.avgBlockTime_1min) || 0,
      avgLastVote: Number(response.data.avgLastVote) || 0,
      epoch: Number(response.data.epoch) || 0,
      stakingYieldAdjusted: Number(response.data.stakingYieldAdjusted) || 0,
      skipRate: {
        skipRate: Number(response.data.skipRate?.skipRate) || 0,
        stakeWeightedSkipRate: Number(response.data.skipRate?.stakeWeightedSkipRate) || 0,
      },
      superminority: {
        stake: Number(response.data.superminority?.stake) || 0,
        nr: Number(response.data.superminority?.nr) || 0,
      },
      epochInfo: {
        absoluteEpochStartSlot: Number(response.data.epochInfo?.absoluteEpochStartSlot) || 0,
        absoluteSlot: Number(response.data.epochInfo?.absoluteSlot) || 0,
        blockHeight: Number(response.data.epochInfo?.blockHeight) || 0,
        epoch: Number(response.data.epochInfo?.epoch) || 0,
        slotIndex: Number(response.data.epochInfo?.slotIndex) || 0,
        slotsInEpoch: Number(response.data.epochInfo?.slotsInEpoch) || 0,
        epochStartTime: Number(response.data.epochInfo?.epochStartTime) || 0,
      },
      stakeWeightedNodeVersions: (response.data.stakeWeightedNodeVersions || []).map((item: any) => ({
        index: Number(item.index) || 0,
        version: item.version || '',
        value: Number(item.value) || 0,
      })),
    };

    return {
      ...response,
      data: formattedData
    };
  } catch (error) {
    if (error instanceof SolanaApiError) {
      throw error;
    }
    throw new SolanaApiError(
      'FETCH_ERROR',
      error instanceof Error ? error.message : 'Unknown error occurred',
      error
    );
  }
}

// Staking APY
export async function getStakingAPY(): Promise<ApiResponse<{ apy: number }>> {
  return fetchWithRetry<{ apy: number }>('/v1/staking-apy');
}

export async function getValidatorDetails(votePubkey: string): Promise<Validator> {
  try {
    if (!API_KEY) {
      throw new SolanaApiError(
        'API_KEY_MISSING',
        'Solana Beach API key is required'
      );
    }

    // Get the validator details directly using the votePubkey
    const response = await fetch(`/api/proxy?endpoint=/v1/validators/all&votePubkey=${votePubkey}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new SolanaApiError(
        'API_ERROR',
        `API error: ${response.status} ${response.statusText}`,
        errorData
      );
    }

    const validators = await response.json();
    
    if (!validators || !Array.isArray(validators)) {
      throw new SolanaApiError(
        'INVALID_DATA',
        'Invalid response format from API',
        validators
      );
    }

    const validator = validators.find(v => v.votePubkey === votePubkey);

    if (!validator) {
      return {
        votePubkey: votePubkey,
        name: 'Unknown Validator',
        version: 'Unknown',
        activatedStake: 0,
        commission: 0,
        skipRate: 0,
        lastVote: Math.floor(Date.now() / 1000),
        voteDistance: 0,
        ll: [0, 0],
        pictureURL: '',
        rank: undefined,
        website: undefined
      };
    }

    return {
      votePubkey: validator.votePubkey,
      name: validator.moniker || validator.name || 'Unnamed Validator',
      version: validator.version || 'Unknown',
      activatedStake: typeof validator.activatedStake === 'number' ? validator.activatedStake : 0,
      commission: typeof validator.commission === 'number' ? validator.commission : 0,
      skipRate: typeof validator.skipRate === 'number' ? validator.skipRate : 0,
      lastVote: typeof validator.lastVote === 'number' ? validator.lastVote : Math.floor(Date.now() / 1000),
      voteDistance: typeof validator.voteDistance === 'number' ? validator.voteDistance : 0,
      ll: validator.ll || [0, 0],
      pictureURL: validator.pictureURL || '',
      rank: undefined,
      website: validator.website || undefined
    };
  } catch (error) {
    if (error instanceof SolanaApiError) {
      throw error;
    }
    throw new SolanaApiError(
      'FETCH_ERROR',
      'Failed to fetch validator details',
      error
    );
  }
}
