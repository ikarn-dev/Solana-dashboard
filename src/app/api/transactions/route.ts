import { NextResponse } from 'next/server';
import { Connection, PublicKey, ConfirmedSignatureInfo, VersionedTransaction, MessageCompiledInstruction } from '@solana/web3.js';

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC_URL, 'confirmed');

// Enhanced cache with TTL and rate limiting
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

// Rate limiter state
const rateLimiter = {
  lastRequestTime: 0,
  minRequestInterval: 1000, // Minimum time between requests in ms
};

async function getCachedOrFetch(key: string, fetchFn: () => Promise<any>) {
  const cached = cache.get(key);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Rate limiting
  const timeSinceLastRequest = now - rateLimiter.lastRequestTime;
  if (timeSinceLastRequest < rateLimiter.minRequestInterval) {
    await new Promise(resolve => setTimeout(resolve, rateLimiter.minRequestInterval - timeSinceLastRequest));
  }

  let retries = MAX_RETRIES;
  let delay = INITIAL_RETRY_DELAY;

  while (retries > 0) {
    try {
      rateLimiter.lastRequestTime = Date.now();
      const data = await fetchFn();
      cache.set(key, { data, timestamp: now });
      return data;
    } catch (error: any) {
      if (error.message?.includes('429') && retries > 0) {
        retries--;
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      } else {
        throw error;
      }
    }
  }

  throw new Error('Max retries exceeded');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 10;
    const cacheKey = `transactions:${page}`;

    const { data, hasMore } = await getCachedOrFetch(cacheKey, async () => {
      // Fetch recent signatures with retry logic
      let signatures: ConfirmedSignatureInfo[] = [];
      let retries = MAX_RETRIES;
      let delay = INITIAL_RETRY_DELAY;

      while (retries > 0) {
        try {
          signatures = await connection.getSignaturesForAddress(
            new PublicKey('11111111111111111111111111111111'),
            { limit: limit + 1 }
          );
          break;
        } catch (error: any) {
          if (error.message?.includes('429') && retries > 0) {
            retries--;
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
          } else {
            throw error;
          }
        }
      }

      const hasMore = signatures.length > limit;
      const transactions = await Promise.all(
        signatures.slice(0, limit).map(async (sig: ConfirmedSignatureInfo) => {
          try {
            const tx = await connection.getTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0,
            });

            if (!tx) {
              return {
                slot: 0,
                signature: sig.signature,
                instructions: [],
                status: 'Failed',
                fee: 0,
                timestamp: new Date(sig.blockTime! * 1000).toISOString(),
              };
            }

            const instructions = tx.transaction instanceof VersionedTransaction
              ? tx.transaction.message.compiledInstructions.map((i: MessageCompiledInstruction) => i.programIdIndex.toString())
              : tx.transaction.message.compiledInstructions.map((i: MessageCompiledInstruction) => i.programIdIndex.toString());

            return {
              slot: tx.slot,
              signature: sig.signature,
              instructions,
              status: sig.err ? 'Failed' : 'Success',
              fee: tx.meta?.fee ? tx.meta.fee / 1e9 : 0,
              timestamp: new Date(sig.blockTime! * 1000).toISOString(),
            };
          } catch (error) {
            console.error('Error processing transaction:', error);
            return {
              slot: 0,
              signature: sig.signature,
              instructions: [],
              status: 'Failed',
              fee: 0,
              timestamp: new Date(sig.blockTime! * 1000).toISOString(),
            };
          }
        })
      );

      return { data: transactions, hasMore };
    });

    return NextResponse.json({ data, hasMore });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
} 