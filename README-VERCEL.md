# BetMatch - Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **Database**: Set up a PostgreSQL database (Neon recommended)

## Environment Variables

In Vercel dashboard, add these environment variables:

### Required Database Variables
```
DATABASE_URL=your_postgresql_connection_string
PGHOST=your_db_host
PGDATABASE=your_db_name
PGUSER=your_db_user
PGPASSWORD=your_db_password
PGPORT=5432
```

### Required Auth Variables
```
SESSION_SECRET=your_secure_session_secret_here
REPL_ID=your_vercel_deployment_id
ISSUER_URL=https://replit.com/oidc
REPLIT_DOMAINS=your-vercel-app.vercel.app
```

## Deployment Steps

1. **Prepare Repository**:
   ```bash
   # Add all files to git
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will detect the configuration automatically

3. **Configure Environment Variables**:
   In Vercel project settings → Environment Variables, add:
   ```
   DATABASE_URL=postgresql://username:password@host:5432/database
   SESSION_SECRET=your-random-secret-key-here
   REPL_ID=your-app-name
   REPLIT_DOMAINS=your-app.vercel.app
   ISSUER_URL=https://replit.com/oidc
   ```

4. **Deploy**:
   - Click "Deploy" 
   - Build will run automatically using vercel.json configuration
   - SOL payments will work on Vercel infrastructure

## Post-Deployment

1. **Database Setup**:
   ```bash
   npm run db:push
   ```

2. **Test SOL Payments**:
   - Connect your Phantom wallet
   - Try creating a market
   - SOL transactions should work properly

## Notes

- The application will have full Solana functionality on Vercel
- Real SOL transfers will be processed through mainnet
- All wallet authentication and market features will work
- Database operations will persist properly

## Support

If you encounter issues:
1. Check Vercel function logs
2. Verify environment variables are set
3. Ensure database connection is working
4. Test Phantom wallet connection