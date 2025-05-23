import { NetworkStatus, SupplyBreakdown, ApiResponse, TPSData, MarketData, RecentBlocksResponse, RecentTransactionsResponse, Validator, GeneralInfo, TopValidator, ValidatorDetails, Marker } from './types';
import { getCachedData, setCachedData, CACHE_TTL } from '../cache';

// Base URL for Solana Beach API
export const SOLANA_BEACH_API = process.env.NEXT_PUBLIC_SOLANA_API_URL || 'https://api.solanaview.com';
const API_KEY = process.env.SOLANA_BEACH_API_KEY;

// Base URL for SolanaView API
export const SOLANA_VIEW_API = 'https://api.solanaview.com/v1';

// Rate limiting configuration
const RATE_LIMIT_REQUESTS = parseInt(process.env.RATE_LIMIT_REQUESTS || '20', 10);
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || '120', 10); // 120 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Common headers for API requests
const headers = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  ...(API_KEY ? { 'Authorization': `Bearer ${API_KEY}` } : {}),
};

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

// Rate limiting implementation
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(endpoint: string): boolean {
  const now = Date.now();
  const key = `${endpoint}:${Math.floor(now / 1000 / RATE_LIMIT_WINDOW)}`;
  
  const current = requestCounts.get(key) || { count: 0, resetTime: now + (RATE_LIMIT_WINDOW * 1000) };
  
  if (now > current.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + (RATE_LIMIT_WINDOW * 1000) });
    return true;
  }
  
  if (current.count >= RATE_LIMIT_REQUESTS) {
    return false;
  }
  
  current.count++;
  requestCounts.set(key, current);
  return true;
}

// Generic fetch function with caching, rate limiting, and error handling
async function fetchWithCache<T>(
  endpoint: string, 
  cacheKey: string, 
  ttl: number = CACHE_TTL.MEDIUM
): Promise<ApiResponse<T>> {
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
  try {
    // Check rate limit
    if (!checkRateLimit(endpoint)) {
      throw new SolanaApiError(
        'RATE_LIMIT_EXCEEDED',
        'Rate limit exceeded. Please try again later.'
      );
    }

    // Check cache first
    const cachedData = await getCachedData<ApiResponse<T>>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Use proxy for all external API calls
    const response = await fetch(`/api/proxy?endpoint=${endpoint}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });
      
      if (response.status === 429) {
        // Rate limit hit, wait and retry
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, retries)));
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
    const apiResponse: ApiResponse<T> = {
      data,
      timestamp: Date.now(),
      success: true
    };
    
    // Cache the response
    await setCachedData(cacheKey, apiResponse, ttl);
    return apiResponse;
  } catch (error) {
      if (retries < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, retries)));
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

// Supply Breakdown
export async function getSupplyBreakdown(): Promise<ApiResponse<SupplyBreakdown>> {
  try {
    const response = await fetchWithCache<any>(
      '/v2/supply-breakdown',
      'solana:supply-breakdown',
      CACHE_TTL.MEDIUM
    );

    // Log the raw response for debugging
    console.log('Raw supply breakdown response:', response);

    // Transform the data to match the expected structure
    const transformedData: SupplyBreakdown = {
      supply: {
        circulating: Number(response.data.supply.circulating) || 0,
        nonCirculating: Number(response.data.supply.nonCirculating) || 0,
        total: Number(response.data.supply.total) || 0
      },
      stake: {
        effective: Number(response.data.stake.effective) || 0,
        activating: Number(response.data.stake.activating) || 0,
        deactivating: Number(response.data.stake.deactivating) || 0
      }
    };

    // Validate the transformed data
    if (!isValidSupplyData(transformedData)) {
      throw new SolanaApiError(
        'INVALID_DATA',
        'Invalid supply data structure received from API',
        transformedData
      );
    }

    return {
      data: transformedData,
      timestamp: Date.now(),
      success: true
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

// Helper function to validate supply data
function isValidSupplyData(data: any): data is SupplyBreakdown {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.supply === 'object' &&
    typeof data.supply.circulating === 'number' &&
    typeof data.supply.nonCirculating === 'number' &&
    typeof data.supply.total === 'number' &&
    typeof data.stake === 'object' &&
    typeof data.stake.effective === 'number' &&
    typeof data.stake.activating === 'number' &&
    typeof data.stake.deactivating === 'number'
  );
}

// TPS
export async function getTPS(): Promise<ApiResponse<TPSData>> {
  try {
    // Direct fetch without caching for TPS to ensure real-time data
    const response = await fetch('/api/tps', {
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
    
    const data = await response.json();
    
    return data;
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
  try {
    const response = await fetch('/api/market-data', {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new SolanaApiError(
        'API_ERROR',
        `API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    
    if (!data || !data.data) {
      throw new SolanaApiError(
        'INVALID_DATA',
        'Invalid market data response'
      );
    }

    return {
      data: data.data,
      timestamp: data.timestamp || Date.now(),
      success: true
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

// Recent Blocks
export async function getRecentBlocks(limit: number = 50, offset: number = 0): Promise<ApiResponse<RecentBlocksResponse>> {
  try {
    if (!API_KEY) {
      throw new SolanaApiError(
        'API_KEY_MISSING',
        'Solana Beach API key is required'
      );
    }

    const response = await fetch(`${SOLANA_BEACH_API}/v2/recent-blocks?limit=${limit}&offset=${offset}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
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

    const data = await response.json();
    
    // Validate the response data
    if (!data || !Array.isArray(data.blocks)) {
      throw new SolanaApiError(
        'INVALID_DATA',
        'Invalid response format from API',
        data
      );
    }

    return {
      data: {
        blocks: data.blocks,
        pagination: {
          total: data.pagination?.total || data.blocks.length,
          offset: data.pagination?.offset || offset,
          limit: data.pagination?.limit || limit
        }
      },
      timestamp: Date.now(),
      success: true
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

// Recent Transactions
export async function getRecentTransactions(limit: number = 50, offset: number = 0): Promise<ApiResponse<RecentTransactionsResponse>> {
  try {
    const API_KEY = process.env.SOLANA_BEACH_API_KEY;
    
    if (!API_KEY) {
      throw new SolanaApiError(
        'API_KEY_MISSING',
        'Solana Beach API key is required'
      );
    }

    const response = await fetch(`${SOLANA_BEACH_API}/v1/latest-transactions?limit=${limit}&offset=${offset}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
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

    const data = await response.json();
    
    // Validate the response data
    if (!data || !Array.isArray(data)) {
      throw new SolanaApiError(
        'INVALID_DATA',
        'Invalid response format from API',
        data
      );
    }

    return {
      data: {
        transactions: data,
        pagination: {
          total: data.length,
          offset: offset,
          limit: limit
        }
      },
      timestamp: Date.now(),
      success: true
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

// Get top validators
export async function getTopValidators(limit: number = 10, offset: number = 0): Promise<ApiResponse<TopValidator[]>> {
  try {
    const response = await fetch(`/api/validators?limit=${limit}&offset=${offset}`, {
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

    const data = await response.json();
    console.log('Received data in getTopValidators:', JSON.stringify(data, null, 2));
    
    if (!data || !data.validators) {
      console.error('Invalid data format:', data);
      throw new SolanaApiError(
        'INVALID_DATA',
        'Invalid response format from API',
        data
      );
    }

    // Transform the data to match TopValidator interface
    const validators = data.validators.map((validator: any) => ({
      votePubkey: validator.votePubkey,
      name: validator.name,
      version: validator.version,
      activatedStake: Number(validator.activatedStake) || 0,
      commission: Number(validator.commission) || 0,
      lastVote: Number(validator.lastVote) || 0,
      pictureURL: validator.pictureURL || '',
      delegatorCount: Number(validator.delegatorCount) || 0,
      delinquent: validator.delinquent || false,
      ll: [0, 0] // Default value since it's not in the API response
    }));

    return {
      data: validators,
      timestamp: Date.now(),
      success: true,
      pagination: data.pagination || {
        total: validators.length,
        offset: offset,
        limit: limit
      }
    };
  } catch (error) {
    console.error('Error fetching top validators:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch validators',
      data: [],
      timestamp: Date.now()
    };
  }
}

// Get General Info
export async function getGeneralInfo(): Promise<ApiResponse<GeneralInfo>> {
  try {
    if (!API_KEY) {
      throw new SolanaApiError(
        'API_KEY_MISSING',
        'Solana Beach API key is required'
      );
    }

    const response = await fetch('/api/proxy?endpoint=/v1/general-info', {
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

    const data = await response.json();
    
    // Validate the response data
    if (!data) {
      throw new SolanaApiError(
        'INVALID_DATA',
        'Invalid response format from API',
        data
      );
    }

    return {
      data,
      timestamp: Date.now(),
      success: true
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

export async function getValidatorDetails(votePubkey: string): Promise<ApiResponse<ValidatorDetails>> {
  try {
    const response = await fetch(`/api/proxy?endpoint=/v2/validator-list?limit=100&offset=0`, {
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

    const data = await response.json();
    
    // Find the specific validator in the response
    const validator = data.validatorList.find((v: any) => v.votePubkey === votePubkey);
    if (!validator) {
      return {
        success: false,
        error: 'Validator not found',
        timestamp: Date.now()
      };
    }

    // Transform the validator data
    const transformedValidator: ValidatorDetails = {
      votePubkey: validator.votePubkey,
      name: validator.name,
      version: validator.version,
      activatedStake: validator.activatedStake,
      commission: validator.commission,
      lastVote: validator.lastVote,
      pictureURL: validator.iconUrl,
      delegatorCount: validator.stakeAccounts,
      delinquent: validator.delinquent,
      ll: [0, 0], // Default value since it's not in the API response
      skipRate: validator.skipRate || 0,
      uptime: validator.uptime || 100
    };

    return {
      success: true,
      data: transformedValidator,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Error fetching validator details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch validator details',
      timestamp: Date.now()
    };
  }
}

export async function getValidatorMarkers(): Promise<ApiResponse<Marker[]>> {
  try {
    const response = await fetchWithCache<Marker[]>(
      `/v1/markers`,
      'solana:markers',
      CACHE_TTL.MEDIUM
    );

    return {
      ...response,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Error fetching validator markers:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch validator markers',
      timestamp: Date.now()
    };
  }
}

// Get all validators
export async function getAllValidators(): Promise<ApiResponse<Validator[]>> {
  try {
    const response = await fetchWithCache<Validator[]>(
      '/validators/all',
      'solana:all-validators',
      CACHE_TTL.MEDIUM
    );
    return response;
  } catch (error) {
    console.error('Error fetching all validators:', error);
    return {
      success: false,
      data: [],
      timestamp: Date.now()
    };
  }
}
