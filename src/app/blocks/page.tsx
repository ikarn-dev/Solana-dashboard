'use client';

import { useEffect, useState } from 'react';
import AllBlocks from '@/components/AllBlocks';
import { BlocksOverview } from '@/components/BlocksOverview';
import Reloading from '@/components/Reloading';

export default function BlocksPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <Reloading />;
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold text-lime-600">Blocks Overview</h1>
      </div>
      <BlocksOverview />
      <AllBlocks />
    </div>
  );
} 