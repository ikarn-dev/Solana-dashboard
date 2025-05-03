import { NextResponse } from 'next/server';
import { getCachedData, setCachedData, CACHE_TTL } from '@/lib/cache';

const SOLANA_VIEW_API = 'https://api.solanaview.com';
const API_KEY = process.env.SOLANA_BEACH_API_KEY;

// Rate limiting configuration
const RATE_LIMIT_REQUESTS = 30;
const RATE_LIMIT_WINDOW = 1 * 60 * 1000; // 1 minute
const MAX_RETRIES = 5; // Increased from 3 to 5
const INITIAL_RETRY_DELAY = 2000; // Increased from 1000 to 2000

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
      console.log(`Rate limited, retrying in ${delay}ms (attempt ${retries + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries + 1);
    }
    
    if (!response.ok && retries < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retries);
      console.log(`Request failed, retrying in ${delay}ms (attempt ${retries + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries + 1);
    }
    
    return response;
  } catch (error) {
    if (retries < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retries);
      console.log(`Request error, retrying in ${delay}ms (attempt ${retries + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries + 1);
    }
    throw error;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  if (!endpoint) {
    return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
  }

  try {
    const response = await fetch(`${SOLANA_VIEW_API}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${process.env.SOLANA_BEACH_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in proxy route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 