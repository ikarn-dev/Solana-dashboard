import { NextRequest, NextResponse } from 'next/server';
import { getRecentBlocks } from '@/lib/api/solana';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const response = await getRecentBlocks(limit, offset);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in recent blocks route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch recent blocks' },
      { status: 500 }
    );
  }
} 