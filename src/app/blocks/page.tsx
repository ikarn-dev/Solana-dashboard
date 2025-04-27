'use client';

import { AllBlocks } from '@/components/AllBlocks';
import { BlocksOverview } from '@/components/BlocksOverview';

export default function BlocksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-lime-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-6">
          <BlocksOverview />
          <AllBlocks />
        </div>
      </div>
    </div>
  );
} 