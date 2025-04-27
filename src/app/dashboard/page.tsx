import { MarketDataCard } from '@/components/MarketData';

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MarketDataCard />
      </div>
    </div>
  );
} 