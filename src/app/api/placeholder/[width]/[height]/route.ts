import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { width: string; height: string } }
) {
  const width = parseInt(params.width, 10);
  const height = parseInt(params.height, 10);
  
  // Create a simple SVG placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text x="50%" y="50%" font-family="Arial" font-size="12" fill="#999" text-anchor="middle" dominant-baseline="middle">
        ${width}x${height}
      </text>
    </svg>
  `;
  
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
} 