import { NextRequest, NextResponse } from 'next/server';
import { getTopValidators } from '@/lib/api/solana';
import { TopValidator } from '@/lib/api/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { votePubkey: string } }
) {
  try {
    const response = await getTopValidators(100);
    const validator = response.data.find(v => v.votePubkey === params.votePubkey);

    if (!validator) {
      return NextResponse.json(
        { error: 'Validator not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: validator,
      timestamp: Date.now(),
      success: true
    });
  } catch (error) {
    console.error('Error fetching validator details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch validator details' },
      { status: 500 }
    );
  }
} 