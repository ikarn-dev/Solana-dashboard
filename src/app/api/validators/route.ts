import { NextResponse } from 'next/server';
import { getTopValidators } from '@/lib/api/solana';
import { ApiResponse, Validator } from '@/lib/api/types';

// Simple in-memory cache
const cache = new Map<string, { data: ApiResponse<Validator[]>; timestamp: number }>();
const CACHE_TTL = 30 * 1000; // 30 seconds

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Check cache first
    const cacheKey = `validators:${limit}:${offset}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    const response = await getTopValidators(limit, offset);
    
    // Update cache
    cache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in validators route:', error);
    if (error instanceof Error && error.message.includes('RATE_LIMIT_EXCEEDED')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch validators' },
      { status: 500 }
    );
  }
} 