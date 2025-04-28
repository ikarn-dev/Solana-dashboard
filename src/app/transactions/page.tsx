'use client';

import { useEffect, useState } from 'react';
import { AllTransactions } from '@/components/AllTransactions';
import Reloading from '@/components/Reloading';

export default function TransactionsPage() {
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
        <h1 className="text-3xl font-bold text-lime-600">Transactions</h1>
      </div>
      <AllTransactions />
    </div>
  );
} 