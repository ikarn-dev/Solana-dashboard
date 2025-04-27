import { NextResponse } from 'next/server';
import { getRecentBlocks } from '@/lib/api/solana';
import { RecentBlock } from '@/lib/api/types';

export async function GET() {
  try {
    const response = await getRecentBlocks(100); // Get last 100 blocks for statistics

    if (!response || !response.data || !response.data.blocks) {
      throw new Error('Failed to fetch blocks');
    }

    const blocks = response.data.blocks;
    const totalBlocks = blocks.length;
    const totalTransactions = blocks.reduce((sum: number, block: RecentBlock) => 
      sum + block.voteTransactions + block.userTransactions, 0
    );

    const blockTimes = blocks.map((block: RecentBlock) => parseInt(block.blockTime));
    const timeDifferences = blockTimes.slice(1).map((time: number, i: number) => time - blockTimes[i]);
    const averageBlockTime = timeDifferences.reduce((sum: number, diff: number) => sum + diff, 0) / timeDifferences.length;

    const averageTransactionsPerBlock = totalTransactions / totalBlocks;

    return NextResponse.json({
      data: {
        totalBlocks,
        averageBlockTime,
        averageTransactionsPerBlock,
        totalTransactions,
        averageSlotTime: 400, // Standard Solana slot time in milliseconds
      },
    });
  } catch (error) {
    console.error('Error in block-stats route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch block statistics' },
      { status: 500 }
    );
  }
} 