'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const Navigation = () => {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Validators', path: '/validators' },
    { name: 'Blocks', path: '/blocks' }
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-lg border-b border-lime-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-2xl font-semibold text-lime-600">
                Solana Dashboard
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    pathname === item.path
                      ? 'text-lime-600 border-b-2 border-lime-500'
                      : 'text-gray-500 hover:text-lime-600 hover:border-lime-300'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 