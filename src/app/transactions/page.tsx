'use client';

import { AllTransactions } from '@/components/AllTransactions';

export default function TransactionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 via-white to-lime-50">
      <div className="container mx-auto px-4 py-8">
        <AllTransactions />
      </div>
    </div>
  );
} 