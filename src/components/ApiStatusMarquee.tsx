import React from 'react';

export const ApiStatusMarquee: React.FC = () => {
  return (
    <div className="bg-red-500 text-white py-2">
      <div className="animate-marquee whitespace-nowrap">
        ⚠️ Solana Beach API is currently down. Please wait for it to be fixed. ⚠️
      </div>
    </div>
  );
}; 