# BetMatch - Solana-Based Prediction Market Platform

## Overview

BetMatch is a prediction market platform built on Solana blockchain technology that allows users to create and participate in betting markets. The platform uses wallet-based authentication where Solana wallet connections serve as user identity and authentication. Users can create custom betting markets, join existing ones, and settle outcomes through a decentralized prediction market system.

## System Architecture

### Frontend Architecture
- **React + TypeScript**: Modern web application built with React 18 and TypeScript
- **Vite**: Build tool and development server for fast development experience
- **Tailwind CSS + shadcn/ui**: Utility-first CSS framework with pre-built component library
- **Wouter**: Lightweight client-side routing for single-page application navigation
- **TanStack Query**: Server state management and data fetching with caching

### Backend Architecture
- **Express.js**: Node.js web framework handling API routes and middleware
- **TypeScript**: Full-stack TypeScript implementation for type safety
- **Drizzle ORM**: Type-safe database operations with PostgreSQL
- **Session-based Architecture**: Traditional session management for user state

### Database Design
- **PostgreSQL**: Primary database using Neon serverless PostgreSQL
- **Drizzle Schema**: Type-safe database schema definitions
- **Tables**:
  - `users`: User profiles with balance tracking and admin flags
  - `markets`: Betting markets with creator, counterparty, and settlement logic
  - `sessions`: Session storage for authentication state

## Key Components

### Authentication System
- **Solana Wallet Integration**: Primary authentication method using Phantom/Solflare wallet connections
- **Dual Authentication**: Hybrid approach combining wallet signatures with traditional session management
- **Wallet Providers**: Support for multiple Solana wallet extensions (Phantom, Solflare)

### Market System
- **Market Creation**: Users can create custom prediction markets with stake amounts
- **Market Joining**: Other users can join open markets as counterparties
- **Market Settlement**: Manual settlement system for determining winners
- **Market States**: Open → Active → Settled workflow with proper state transitions

### Payment Integration
- **Solana Blockchain**: Built for SOL token transactions and smart contract interactions
- **USDC Support**: Infrastructure for stablecoin transactions (@solana/spl-token)
- **Transaction Signing**: Wallet-based transaction signing and verification

### UI/UX Components
- **Responsive Design**: Mobile-first approach with responsive layouts
- **Component Library**: Comprehensive UI component system using Radix UI primitives
- **Modal System**: Payment modals and wallet connection flows
- **Navigation**: Persistent navigation with active state management

## Data Flow

1. **User Authentication**: Users connect Solana wallets → Wallet signatures verify identity → Session created
2. **Market Creation**: Authenticated users create markets → Market stored in database → Available for joining
3. **Market Participation**: Users join open markets → Stake amounts locked → Market becomes active
4. **Settlement Process**: Market outcomes determined → Winners receive payouts → Platform fees collected
5. **Balance Management**: User balances updated → Transaction history tracked → Real-time balance display

## External Dependencies

### Blockchain Integration
- **@solana/web3.js**: Core Solana blockchain interaction library
- **@solana/spl-token**: Token program integration for USDC and other SPL tokens
- **Buffer polyfill**: Browser compatibility for blockchain operations

### Database & Infrastructure
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **drizzle-orm & drizzle-kit**: Database ORM and migration tools

### UI & Development
- **@radix-ui/***: Accessible UI component primitives
- **@tanstack/react-query**: Server state management and caching
- **@hookform/resolvers**: Form validation with Zod schema integration
- **class-variance-authority**: CSS class variance management

## Deployment Strategy

### Development Environment
- **Replit Integration**: Native Replit development environment with hot reloading
- **Local Development**: Vite dev server with Express API proxy
- **Database**: Neon serverless PostgreSQL with connection pooling

### Production Deployment
- **Build Process**: Vite frontend build + ESBuild backend bundling
- **Static Assets**: Frontend served from `/dist/public` directory
- **API Server**: Express server handling `/api/*` routes
- **Environment Variables**: Database URL and session secrets required

### Configuration
- **Port Configuration**: Server runs on port 5000 with external port 80
- **Session Management**: Secure HTTP-only cookies with 7-day expiration
- **Database Migration**: Drizzle migrations in `/migrations` directory

## Changelog

```
Changelog:
- June 16, 2025. Initial setup
- June 16, 2025. Migrated from USDC to SOL payments (0.01 SOL minimum stake)
- June 16, 2025. Switched from devnet to mainnet for real SOL transactions
- June 16, 2025. Implemented wallet-based authentication (removed traditional sessions)
- June 16, 2025. Fixed transaction signing and sending flow for actual SOL transfers
- June 16, 2025. Added balance checking and proper error handling for insufficient funds
- June 16, 2025. Fixed transaction blockhash requirements for Phantom wallet compatibility
- June 16, 2025. Restored mainnet configuration for real SOL transactions with user's actual balance
- June 16, 2025. Updated frontend to display real database market data with SOL amounts instead of USD
- June 16, 2025. Fixed routing to use real home page instead of placeholder version, now displaying actual markets from database
- June 16, 2025. Implemented SOL payment requirement for joining markets - users must send stake amount before join is processed
- June 16, 2025. Updated database schema to track payment signatures for all transactions
- June 16, 2025. Completed settlement system implementation with admin-only access controls
- June 16, 2025. Added admin panel with market overview, payout calculations, and settlement controls
- June 16, 2025. Successfully tested market settlement with real transaction records and status updates
- June 24, 2025. Implemented odds functionality allowing asymmetric stakes between creator and joiner
- June 24, 2025. Added close market feature for creators to cancel open markets with automatic refunds
- June 24, 2025. Enhanced UI with cancelled market status badges and dedicated "Closed" tab filter
- June 24, 2025. Fixed Solana payment system connectivity issues and resolved blockhash fetching errors
- June 24, 2025. Successfully tested payment flow with Phantom wallet integration - system working correctly
- June 24, 2025. Switched back to mainnet for production testing with real SOL transactions
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```