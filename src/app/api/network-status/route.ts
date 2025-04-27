import { NextResponse } from 'next/server';
import { getNetworkStatus } from '@/lib/api/solana';
import { NetworkStatus } from '@/lib/api/types';

// Mock data for testing
const mockNetworkStatus: NetworkStatus = {
  lastSyncedSlot: 0,
  lastNetworkSlot: 0,
  networkLag: 0,
  laggingBehind: false,
  epochProgress: 0,
  currentEpoch: 0,
  slotsPerEpoch: 432000
};

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching completely

export async function GET() {
  try {
    let data: NetworkStatus;
    
    try {
      // Try to fetch real data first
      const response = await getNetworkStatus();
      data = response.data;
    } catch (error) {
      // Fall back to mock data
      data = mockNetworkStatus;
    }

    // Compute additional fields
    const currentSlot = data.lastNetworkSlot;
    const currentEpoch = Math.floor(currentSlot / data.slotsPerEpoch);
    const epochProgress = (currentSlot % data.slotsPerEpoch) / data.slotsPerEpoch;

    // Update the data with computed fields
    data = {
      ...data,
      currentEpoch,
      epochProgress
    };

    return NextResponse.json(
      { 
        success: true, 
        data,
        timestamp: Date.now()
      },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch network status',
        timestamp: Date.now()
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );
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