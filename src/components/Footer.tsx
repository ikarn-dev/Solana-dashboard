'use client';

import Link from 'next/link';
import { Github, X } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white/30 backdrop-blur-[2px] border-t border-lime-100/50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex space-x-6">
            <Link 
              href="https://github.com/ikarn-dev" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-lime-600 transition-colors duration-200"
            >
              <Github className="w-5 h-5" />
            </Link>
            <Link 
              href="https://x.com/iKK6600" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-lime-600 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </Link>
          </div>
          <p className="text-sm text-gray-600">
            Made with 💚 by Karan
          </p>
        </div>
      </div>
    </footer>
  );
} 