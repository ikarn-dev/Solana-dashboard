# Solana Staking Dashboard

## Project Overview

The Solana Staking Dashboard is a web-based application that aggregates and displays real-time data on Solana staking. It provides insights into the health and performance of the Solana blockchain's staking ecosystem, making it easier for users to monitor key metrics and make informed decisions.

![Dashboard Screenshot]
Screenshot 2025-04-29 120531.png
Screenshot 2025-04-29 120546.png
Screenshot 2025-04-29 120606.png
Screenshot 2025-04-29 120621.png
Screenshot 2025-04-29 120645.png
Screenshot 2025-04-29 120703.png
Screenshot 2025-04-29 120715.png
Screenshot 2025-04-29 120731.png
Screenshot 2025-04-29 120746.png
## Features

- Real-time data on top validators, including stake, commission, version, and more.
- Network health metrics such as total validators, skip rates, and staking APY.
- Supply breakdown showing circulating, non-circulating, and total supply.
- Responsive design for seamless use across devices.
- Automatic data refresh every 5 minutes with manual refresh options.

## Setup Instructions

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/solana-staking-dashboard.git
   cd solana-staking-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory and add your Solana Beach API key:
   ```
   NEXT_PUBLIC_SOLANA_API_URL=https://public-api.solanabeach.io
   SOLANA_BEACH_API_KEY=your_api_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to view the dashboard.

### Deployment

The dashboard can be deployed on Vercel, Netlify, or any other platform that supports Next.js applications.

## API Key Setup

To use the Solana Beach API, you need to obtain an API key from [Solana Beach](https://public-api.solanabeach.io/). Add your API key to the `.env.local` file as shown in the setup instructions.

## Data Sources

- [Solana Beach Public API](https://public-api.solanabeach.io/)
- [Solana Official Documentation](https://docs.solana.com/)

## Attribution

- All data is sourced from Solana Beach, with full attribution in the dashboard footer and documentation.
- Open-source libraries and APIs are credited in the project's README.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 