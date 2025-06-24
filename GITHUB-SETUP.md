# GitHub Repository Setup for BetMatch

## Step 1: Create GitHub Repository

1. Go to [github.com](https://github.com) and sign in
2. Click the "+" icon → "New repository"
3. Repository settings:
   - **Name**: `betmatch-solana` (or your preferred name)
   - **Description**: `Solana-based prediction market platform with SOL payments`
   - **Visibility**: Public (recommended) or Private
   - **Initialize**: Leave unchecked (we have existing code)
4. Click "Create repository"

## Step 2: Connect Local Repository

After creating the GitHub repo, you'll see setup instructions. Use these commands:

```bash
# Remove any git lock files
rm -f .git/index.lock

# Add all files to git
git add .

# Create initial commit
git commit -m "Initial commit: BetMatch Solana prediction market platform"

# Add GitHub remote (replace USERNAME/REPO with your details)
git remote add origin https://github.com/USERNAME/REPO.git

# Push to GitHub
git push -u origin main
```

## Step 3: Verify Upload

Check your GitHub repository to ensure all files uploaded:
- ✅ Source code (client/, server/, shared/)
- ✅ Configuration files (vercel.json, README.md, .gitignore)
- ✅ Package files and dependencies

## Step 4: Deploy to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure environment variables as listed in README-VERCEL.md
5. Deploy

Your BetMatch platform will be live with full Solana functionality!