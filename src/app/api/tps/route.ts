import { NextResponse } from 'next/server';
import { ApiResponse, TPSData } from '@/lib/api/types';

// Mock data for development/testing
const mockData: TPSData = {
  voteTransactionsPerSecond: 0,
  userTransactionsPerSecond: 0,
  totalTransactionsPerSecond: 0
};

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const apiKey = process.env.SOLANA_BEACH_API_KEY;
    const apiUrl = process.env.NEXT_PUBLIC_SOLANA_BEACH_API_URL || 'https://public-api.solanabeach.io';

    if (!apiKey) {
      console.error('API key not configured');
      return NextResponse.json({ 
        data: mockData,
        timestamp: Date.now()
      }, { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    const response = await fetch(`${apiUrl}/v2/transactions-per-second`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error('API response not ok:', response.status, response.statusText);
      
      // Handle 403 Forbidden specifically
      if (response.status === 403) {
        return NextResponse.json(
          { error: 'API key is invalid or has insufficient permissions' },
          { 
            status: 403,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
          }
        );
      }

      // For other errors, return mock data with appropriate status
      return NextResponse.json({ 
        data: mockData,
        timestamp: Date.now()
      }, { 
        status: response.status,
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    const rawData = await response.json();

    // Calculate total TPS by adding vote and user transactions
    const voteTPS = Number(rawData.voteTransactionsPerSecond) || 0;
    const userTPS = Number(rawData.userTransactionsPerSecond) || 0;
    const totalTPS = voteTPS + userTPS;

    const data: TPSData = {
      voteTransactionsPerSecond: voteTPS,
      userTransactionsPerSecond: userTPS,
      totalTransactionsPerSecond: totalTPS
    };

    return NextResponse.json({ 
      data,
      timestamp: Date.now()
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    console.error('Error in TPS route:', error);
    return NextResponse.json({ 
      data: mockData,
      timestamp: Date.now()
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
} 