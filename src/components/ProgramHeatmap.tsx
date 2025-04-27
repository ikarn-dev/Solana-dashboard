'use client';

import { useEffect, useRef, useState } from 'react';

interface ProgramData {
  name: string;
  count: number;
  color: string;
}

export function ProgramHeatmap() {
  const [data, setData] = useState<ProgramData[]>([
    { name: 'Vote', count: 1291666, color: 'oklch(91.7% 0.08 205.041)' },
    { name: 'Token', count: 887692, color: 'oklch(86.5% 0.127 207.078)' },
    { name: 'Compute Budget', count: 720167, color: 'oklch(78.9% 0.154 211.53)' },
    { name: 'Unknown', count: 388597, color: 'oklch(71.5% 0.143 215.221)' },
    { name: 'System', count: 351163, color: 'oklch(60.9% 0.126 221.723)' },
    { name: 'Jupiter V6', count: 124625, color: 'oklch(52% 0.105 223.128)' },
    { name: 'Pump Fun AMM', count: 121509, color: 'oklch(45% 0.085 224.283)' },
    { name: 'Meteora DLMM', count: 104807, color: 'oklch(39.8% 0.07 227.392)' },
    { name: 'Kamino Lending', count: 77272, color: 'oklch(30.2% 0.056 229.695)' },
  ]);

  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1066, height: 200 });

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const containerWidth = svgRef.current.parentElement?.clientWidth || 1066;
        setDimensions({
          width: containerWidth,
          height: 200,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const total = data.reduce((sum, item) => sum + item.count, 0);
  const barHeight = 150;
  const titleHeight = 50;
  const padding = 10;
  const textPadding = 5;
  const minBarWidth = 80; // Minimum width for a bar to show text
  return (
    <div className="dashboard-card bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-lime-100">
      <div className="overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox={`0.5,-${titleHeight + 0.5},${dimensions.width},${dimensions.height}`}
          style={{ font: '10px Inter' }}
          className="w-full"
        >
          <g>
            {/* Title */}
            <g transform={`translate(0,-${titleHeight})`}>
              <rect
                fill="#313131"
                width={dimensions.width}
                height={titleHeight}
              />
              <text
                fill="#888888"
                fontWeight="bold"
                fontSize="1.6em"
                x={padding}
                y={titleHeight / 2 + 8}
              >
                Top Programs
              </text>
            </g>

            {/* Bars */}
            {data.map((item, index) => {
              const width = (item.count / total) * (dimensions.width - padding * 2);
              const x = index === 0 ? padding : data.slice(0, index).reduce((sum, d) => 
                sum + (d.count / total) * (dimensions.width - padding * 2), padding
              );

              const showText = width >= minBarWidth;
              const words = item.name.split(' ');
              const maxWordsPerLine = 2;
              const lines = [];
              
              for (let i = 0; i < words.length; i += maxWordsPerLine) {
                lines.push(words.slice(i, i + maxWordsPerLine).join(' '));
              }

              return (
                <g key={item.name} cursor="pointer" transform={`translate(${x},0)`}>
                  <title>{`Top Programs / ${item.name}\n${item.count.toLocaleString()}`}</title>
                  <rect
                    fill={item.color}
                    width={width}
                    height={barHeight}
                  />
                  {showText && (
                    <text
                      fill="#888888"
                      fontSize="1em"
                      fontWeight="bold"
                      x={textPadding}
                      y={20}
                    >
                      {lines.map((line, i) => (
                        <tspan
                          key={i}
                          x={textPadding}
                          y={20 + i * 12}
                          style={{ display: 'block' }}
                        >
                          {line}
                        </tspan>
                      ))}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
} 