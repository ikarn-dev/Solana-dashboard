import { NextResponse } from 'next/server';
import { MarketData } from '@/lib/api/types';

// Mock data for development/testing
const mockData: MarketData = {
  timestamp: Date.now(),
  price: 0,
  percentChange1h: 0,
  percentChange24h: 0,
  volume24h: 0,
  marketCap: 0,
  fullyDilutedMarketCap: 0,
  history: []
};

export async function GET() {
  try {
    const apiKey = process.env.SOLANA_BEACH_API_KEY;
    const apiUrl = process.env.NEXT_PUBLIC_SOLANA_BEACH_API_URL || 'https://public-api.solanabeach.io';

    if (!apiKey) {
      console.error('API key not configured');
      return NextResponse.json({ data: mockData }, { status: 200 });
    }

    const response = await fetch(`${apiUrl}/v2/market-data`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error('API response not ok:', response.status, response.statusText);
      return NextResponse.json({ data: mockData }, { status: 200 });
    }

    const rawData = await response.json();

    // Transform the data to match our MarketData interface
    const transformedData: MarketData = {
      timestamp: rawData.timestamp || Date.now(),
      price: Number(rawData.price) || 0,
      percentChange1h: Number(rawData.percentChange1h) || 0,
      percentChange24h: Number(rawData.percentChange24h) || 0,
      volume24h: Number(rawData.volume24h) || 0,
      marketCap: Number(rawData.marketCap) || 0,
      fullyDilutedMarketCap: Number(rawData.fullyDilutedMarketCap) || 0,
      history: (rawData.history || []).map((item: any) => ({
        timestamp: item.timestamp || Date.now(),
        price: Number(item.price) || 0,
        volume24h: Number(item.volume24h) || 0
      }))
    };

    return NextResponse.json({ 
      data: transformedData,
      timestamp: Date.now()
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.error('Error fetching market data:', error);
    return NextResponse.json({ data: mockData }, { status: 200 });
  }
} 