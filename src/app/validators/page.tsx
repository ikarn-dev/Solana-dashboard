"use client";

import { useState, useEffect } from 'react';
import Reloading from '@/components/Reloading';
import { ValidatorStats } from '@/components/ValidatorStats';
import TopValidators from '@/components/TopValidators';

export default function ValidatorsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [validatorStats, setValidatorStats] = useState({
    totalValidators: 1314,
    superminority: 20,
    skipRate: 0.26,
    weightedSkipRate: 0.26,
    nominalStakingAPY: 7.11,
    nodeVersions: [
      { version: '2.1.20', percentage: 39.9 },
      { version: '2.1.21', percentage: 36.0 },
      { version: '2.2.12', percentage: 8.6 },
      { version: '2.2.7', percentage: 6.1 },
      { version: 'others', percentage: 5.2 },
      { version: '0.411.20121', percentage: 4.2 }
    ]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Remove unused API calls
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching validators:', error);
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-100 via-purple-50 to-indigo-50 text-gray-800 relative overflow-hidden font-sans">
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="blob w-[800px] h-[800px] rounded-[999px] absolute top-0 right-0 blur-3xl bg-opacity-60 bg-gradient-to-r from-indigo-200 via-purple-100 to-gray-200"></div>
          <div className="blob w-[1000px] h-[1000px] rounded-[999px] absolute bottom-0 left-0 blur-3xl bg-opacity-60 bg-gradient-to-r from-gray-300 via-purple-100 to-indigo-100"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto p-8">
          <Reloading />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-lime-50 to-white relative overflow-hidden font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="blob w-[800px] h-[800px] rounded-[999px] absolute top-0 right-0 blur-3xl bg-opacity-60 bg-gradient-to-r from-lime-200 via-lime-100 to-gray-200"></div>
        <div className="blob w-[1000px] h-[1000px] rounded-[999px] absolute bottom-0 left-0 blur-3xl bg-opacity-60 bg-gradient-to-r from-gray-300 via-lime-100 to-gray-100"></div>
        <div className="blob w-[600px] h-[600px] rounded-[999px] absolute bottom-0 left-0 blur-3xl bg-opacity-60 bg-gradient-to-r from-gray-200 via-lime-100 to-gray-100"></div>
        <div className="blob w-[300px] h-[300px] rounded-[999px] absolute bottom-[-10px] left-0 blur-3xl bg-opacity-60 bg-gradient-to-r from-lime-300 via-lime-200 to-gray-300"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto p-8">
        <header className="mb-8">
          <h1 className="text-3xl text-lime-600 font-semibold text-center">Validators Overview</h1>
        </header>

        <div className="mb-8">
          <ValidatorStats {...validatorStats} />
        </div>

        <div className="mb-8">
          <TopValidators />
        </div>
      </div>
    </main>
  );
} 