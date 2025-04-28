import { NextResponse } from 'next/server';
import { getTopValidators } from '@/lib/api/solana';
import { ApiResponse, Validator } from '@/lib/api/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Remove the limit parameter to get all validators
    const validators = await getTopValidators(offset);
    
    return NextResponse.json({
      data: validators.data,
      timestamp: Date.now(),
      success: true
    } as ApiResponse<Validator[]>);
  } catch (error) {
    console.error('Error fetching validators:', error);
    return NextResponse.json(
      {
        data: [],
        timestamp: Date.now(),
        success: false
      } as ApiResponse<Validator[]>,
      { status: 500 }
    );
  }
} 