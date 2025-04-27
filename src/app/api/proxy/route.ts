import { NextResponse } from 'next/server';
import { SOLANA_BEACH_API } from '@/lib/api/solana';

const API_KEY = process.env.SOLANA_BEACH_API_KEY;

// Simple in-memory cache for validator data
const validatorCache = new Map<string, { data: any; timestamp: number }>();
const VALIDATOR_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Rate limiting configuration
const RATE_LIMIT_REQUESTS = 10;
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 2;
const INITIAL_RETRY_DELAY = 2000; // Increased from 1 second

const requestCounts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(endpoint: string): boolean {
  const now = Date.now();
  const key = `${endpoint}:${Math.floor(now / RATE_LIMIT_WINDOW)}`;
  
  const current = requestCounts.get(key) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
  
  if (now > current.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (current.count >= RATE_LIMIT_REQUESTS) {
    return false;
  }
  
  current.count++;
  requestCounts.set(key, current);
  return true;
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 0): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    if (response.status === 429 && retries < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retries);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries + 1);
    }
    
    return response;
  } catch (error) {
    if (retries < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retries);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries + 1);
    }
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    
    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint parameter is required' }, { status: 400 });
    }

    // Special handling for validator endpoints
    if (endpoint.includes('/validators/')) {
      const cacheKey = `${endpoint}?limit=${limit}&offset=${offset}`;
      const cached = validatorCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < VALIDATOR_CACHE_TTL) {
        return NextResponse.json(cached.data);
      }

      // Check rate limit before making the request
      if (!checkRateLimit(endpoint)) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }

      const url = new URL(`${SOLANA_BEACH_API}${endpoint}`);
      if (limit) url.searchParams.append('limit', limit);
      if (offset) url.searchParams.append('offset', offset);

      const response = await fetchWithRetry(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        }
      });

      if (!response.ok) {
        if (response.status === 429) {
          return NextResponse.json(
            { error: 'Rate limit exceeded. Please try again later.' },
            { status: 429 }
          );
        }
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache the validator data
      validatorCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return NextResponse.json(data);
    }

    // For non-validator endpoints, proceed with normal proxy logic
    const url = new URL(`${SOLANA_BEACH_API}${endpoint}`);
    if (limit) url.searchParams.append('limit', limit);
    if (offset) url.searchParams.append('offset', offset);

    const response = await fetchWithRetry(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
} 