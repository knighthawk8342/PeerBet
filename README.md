# BetMatch - Solana Prediction Markets

A decentralized prediction market platform built on Solana blockchain where users can create and participate in 1v1 betting markets with SOL payments.

## Features

- **Wallet Authentication**: Connect with Phantom, Solflare, or other Solana wallets
- **Market Creation**: Create custom prediction markets with flexible odds
- **Asymmetric Betting**: Set different stake amounts for creator vs joiner
- **Real SOL Payments**: Automatic SOL transfers through Solana mainnet
- **Market Settlement**: Admin-controlled outcome determination
- **Comprehensive Dashboard**: Track your markets, earnings, and transaction history
- **Admin Panel**: Market overview and settlement controls

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Blockchain**: Solana Web3.js for SOL transactions
- **UI**: Tailwind CSS + shadcn/ui components
- **Deployment**: Vercel-ready configuration

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Solana wallet (Phantom recommended)

### Environment Variables

```bash
DATABASE_URL=postgresql://username:password@host:5432/database
SESSION_SECRET=your-secure-random-secret
REPL_ID=your-app-name
REPLIT_DOMAINS=your-domain.com
```

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/betmatch.git
cd betmatch

# Install dependencies
npm install

# Set up database
npm run db:push

# Start development server
npm run dev
```

### Deployment

The application is configured for Vercel deployment with full Solana functionality:

```bash
# Deploy to Vercel
vercel --prod
```

See `README-VERCEL.md` for detailed deployment instructions.

## Architecture

- **Authentication**: Wallet-based authentication with session management
- **Markets**: Create, join, and settle prediction markets
- **Payments**: Real SOL transfers with transaction verification
- **Database**: Persistent storage for markets, users, and transactions

## Market Workflow

1. **Create Market**: User pays stake amount in SOL to create market
2. **Join Market**: Another user pays to join as counterparty
3. **Settlement**: Admin determines outcome and distributes winnings
4. **Platform Fee**: 2% fee collected on settled markets

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see LICENSE file for details