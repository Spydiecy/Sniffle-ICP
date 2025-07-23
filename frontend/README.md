# Sniffle Frontend

Advanced Memecoin Intelligence System for Internet Computer with modern wallet integration.

## Features

- Real-time chat with AI assistant
- Internet Computer memecoin tracking and analytics
- Internet Computer wallet connection (Internet Identity, Plug, Stoic, etc.)
- Memecoin explorer and tracking
- Responsive UI using Tailwind CSS
- Dashboard with multiple windows interface

## Development Network

For development and testing purposes, the application connects to:

**Internet Computer:**
- Network: Internet Computer Mainnet
- Canister ID: [Your Canister ID]
- Block Explorer: https://dashboard.internetcomputer.org/

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Build the application:

```bash
npm run build
```

3. Start the production server:

```bash
npm start
```

Or run in development mode:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Wallet Integration

The frontend uses RainbowKit for wallet connectivity, supporting:
- MetaMask
- WalletConnect
- And other popular Ethereum wallets

Make sure your wallet is configured for the Avalanche Fuji testnet.

## Configuration

- `next.config.cjs`: Next.js configuration
- `tailwind.config.js`: Tailwind CSS configuration
- `postcss.config.js`: PostCSS configuration
- `src/wagmi.ts`: Wagmi and RainbowKit configuration for Avalanche Fuji

## Running the Server

Sniffle uses Next.js with nginx for HTTPS and WebSocket proxying:

1. **Start the Next.js server:**
   ```bash
   # Build and start the server
   pnpm run build
   pnpm start
   ```
   This will start Next.js on port 3000.

2. **Access the app:**
   The application is available at https://sniffle.duckdns.org

## Nginx Configuration

The application runs behind nginx which:
- Handles HTTPS/SSL encryption
- Proxies HTTP requests to the Next.js server on port 3000
- Proxies WebSocket connections at `/ws` to the backend WebSocket server on port 8080

```nginx
# Main configuration at /etc/nginx/sites-enabled/sniffle.conf
server {
    listen 443 ssl;
    server_name sniffle.duckdns.org;

    # Frontend proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    # WebSocket proxy
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```