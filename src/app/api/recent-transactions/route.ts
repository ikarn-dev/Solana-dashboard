import { NextRequest, NextResponse } from 'next/server';
import { getRecentTransactions } from '@/lib/api/solana';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const response = await getRecentTransactions(limit, offset);
    
    if (!response || !response.data) {
      return NextResponse.json(
        { error: 'Invalid response from Solana Beach API' },
        { status: 500 }
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch recent transactions' },
      { status: 500 }
    );
  }
} 