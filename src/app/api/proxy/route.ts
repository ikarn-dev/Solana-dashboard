import { NextResponse } from 'next/server';

const SOLANA_BEACH_API = process.env.NEXT_PUBLIC_SOLANA_API_URL || 'https://api.solanaview.com';
const API_KEY = process.env.SOLANA_BEACH_API_KEY;

if (!API_KEY) {
  throw new Error('SOLANA_BEACH_API_KEY environment variable is required');
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window
const REQUEST_TIMEOUT = 10000; // 10 seconds

// Common headers for API requests
const headers = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_KEY}`
};

// Rate limiting state
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const lastRequestTime = new Map<string, number>();

function checkRateLimit(endpoint: string): boolean {
  const now = Date.now();
  const key = `${endpoint}:${Math.floor(now / RATE_LIMIT_WINDOW)}`;
  
  const current = requestCounts.get(key) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
  
  if (now > current.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (current.count >= 1) {
    return false;
  }
  
  current.count++;
  requestCounts.set(key, current);
  return true;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    // Check rate limit
    if (!checkRateLimit(endpoint)) {
      const lastTime = lastRequestTime.get(endpoint) || 0;
      const timeToWait = Math.max(0, RATE_LIMIT_WINDOW - (Date.now() - lastTime));
      
      if (timeToWait > 0) {
        await new Promise(resolve => setTimeout(resolve, timeToWait));
      }
    }

    const url = new URL(`${SOLANA_BEACH_API}${endpoint}`);
    
    // Optimize fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    const response = await fetch(url.toString(), {
      headers,
      cache: 'no-store',
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('retry-after') || '5', 10) * 1000;
      await new Promise(resolve => setTimeout(resolve, retryAfter));
      return GET(request);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: `API error: ${response.status} ${response.statusText}`, details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    lastRequestTime.set(endpoint, Date.now());

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout' },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
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