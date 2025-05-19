import { NextResponse } from 'next/server';
import { TPSData } from '@/lib/api/types';

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
    const apiUrl = process.env.NEXT_PUBLIC_SOLANA_API_URL || 'https://api.solanaview.com';

    if (!apiKey) {
      console.error('API key not configured');
      return NextResponse.json({ 
        success: false,
        error: 'API key not configured',
        data: mockData,
        timestamp: Date.now()
      }, { 
        status: 500,
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
      
        return NextResponse.json(
        { 
          success: false,
          error: response.status === 403 ? 'API key is invalid or has insufficient permissions' : 'Failed to fetch TPS data',
          data: mockData,
          timestamp: Date.now()
        },
          { 
          status: response.status,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
          }
        );
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
      success: true,
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
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      data: mockData,
      timestamp: Date.now()
    }, { 
      status: 500,
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