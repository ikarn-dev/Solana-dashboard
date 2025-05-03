import { NextResponse } from 'next/server';
import { NetworkStatus } from '@/lib/api/types';

// Add CORS headers to all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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

export async function GET() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_SOLANA_API_URL || 'https://api.solanaview.com';
    const apiKey = process.env.SOLANA_BEACH_API_KEY;
    
    if (!apiKey) {
      throw new Error('Solana Beach API key is not configured');
    }

    const response = await fetch(`${apiUrl}/v1/network-status`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API responded with status: ${response.status} - ${errorText}`);
    }
    
    const responseData = await response.json();
    
    // Transform the response data to match our NetworkStatus type
    const data: NetworkStatus = {
      lastSyncedSlot: responseData.lastSyncedSlot,
      lastNetworkSlot: responseData.lastNetworkSlot,
      networkLag: responseData.networkLag,
      laggingBehind: responseData.laggingBehind,
      epochProgress: 0, // Calculate this if needed
      currentEpoch: 0, // Calculate this if needed
      slotsPerEpoch: 432000 // Standard Solana slots per epoch
    };

    return NextResponse.json(data, {
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Error in network-status route:', error);
    // Return mock data in case of error
    return NextResponse.json(mockNetworkStatus, {
      headers: corsHeaders
    });
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: corsHeaders
  });
} 