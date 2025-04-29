# Solana Staking Dashboard

## Project Overview

The Solana Staking Dashboard is a web-based application that aggregates and displays real-time data on Solana staking. It provides insights into the health and performance of the Solana blockchain's staking ecosystem, making it easier for users to monitor key metrics and make informed decisions.

![Dashboard Screenshot]
![Screenshot 2025-04-29 120746](https://github.com/user-attachments/assets/b8bf01a3-5045-4462-ade8-d3d860cbe47c)
![Screenshot 2025-04-29 120731](https://github.com/user-attachments/assets/834dd362-9622-4d9b-9730-f141eb228a6b)
![Screenshot 2025-04-29 120715](https://github.com/user-attachments/assets/e753e178-172a-4230-a1a9-1d51b0f6d45e)
![Screenshot 2025-04-29 120703](https://github.com/user-attachments/assets/26b6264f-5965-4677-8fe0-4b97629292db)
![Screenshot 2025-04-29 120645](https://github.com/user-attachments/assets/b2ba8bc4-a964-4596-98f6-69c5a38c4bfb)
![Screenshot 2025-04-29 120621](https://github.com/user-attachments/assets/db3b68f8-b905-4382-b29c-1fed3c135270)
![Screenshot 2025-04-29 120606](https://github.com/user-attachments/assets/c8ad729c-fb4c-4a75-9f3e-c043dd3ffe81)
![Screenshot 2025-04-29 120546](https://github.com/user-attachments/assets/8f3ce1e8-20a8-4a1d-8f67-bbe6478dc68a)
![Screenshot 2025-04-29 120531](https://github.com/user-attachments/assets/16044bb7-afc2-4717-8a28-39a2a133ae13)

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
