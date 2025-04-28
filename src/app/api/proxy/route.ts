import { NextResponse } from 'next/server';
import { getCachedData, setCachedData, CACHE_TTL } from '@/lib/cache';

const SOLANA_BEACH_API = process.env.NEXT_PUBLIC_SOLANA_BEACH_API_URL || 'https://public-api.solanabeach.io';
const API_KEY = process.env.SOLANA_BEACH_API_KEY;

// Simple in-memory cache for validator data
const validatorCache = new Map<string, { data: any; timestamp: number }>();
const VALIDATOR_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Rate limiting configuration
const RATE_LIMIT_REQUESTS = 30; // Increased from 10
const RATE_LIMIT_WINDOW = 1 * 60 * 1000; // Reduced from 5 minutes to 1 minute
const MAX_RETRIES = 3; // Increased from 2
const INITIAL_RETRY_DELAY = 1000; // Reduced from 2000

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
    
    if (response.status === 429 && retries < 3) {
      const delay = 1000 * Math.pow(2, retries);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries + 1);
    }
    
    return response;
  } catch (error) {
    if (retries < 3) {
      const delay = 1000 * Math.pow(2, retries);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries + 1);
    }
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    if (!API_KEY) {
      console.error('SOLANA_BEACH_API_KEY is not set');
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }

    // Get the URL and search params
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    // Check cache for all endpoints
    const cacheKey = `${endpoint}?limit=${limit}&offset=${offset}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    const url = new URL(`${SOLANA_BEACH_API}${endpoint}`);
    if (limit) url.searchParams.append('limit', limit);
    if (offset) url.searchParams.append('offset', offset);

    console.log(`Fetching from: ${url.toString()}`);

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Origin': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      return NextResponse.json(
        { error: `API error: ${response.status} ${response.statusText}`, details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Cache the data
    setCachedData(cacheKey, data, CACHE_TTL.MEDIUM);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in proxy:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
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