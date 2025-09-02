# Huballas User Test - Static Site

This is a static site for user testing the visualization of electricity market data, designed to be deployed on GitHub Pages.

## Technology Stack

- **Package manager**: pnpm
- **Framework**: Next.js (with static export)
- **Graphs**: ECharts
- **Styles**: Tailwind CSS
- **Data**: CSV files (served as static files)
- **Hosting**: GitHub Pages

## Data Sources

The application fetches data from static CSV files located in `/public/data/`:

- `generic_usage_statistics.csv` - Main usage statistics data
- `public_channel_descriptions.csv` - Channel descriptions
- `public_marketrolecode_descriptions.csv` - Market role descriptions  
- `public_eventID_descriptions.csv` - Event descriptions
- `response_times.csv` - Response time data (optional, generated if missing)
- `error_statistics.csv` - Error statistics (optional, generated if missing)

## Fallback Data Generation

If any CSV files are missing, the application will automatically generate synthetic data to ensure the site remains functional. This makes it resilient and easy to demo even without real data files.

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

## Deployment to GitHub Pages

### Option 1: Manual Deployment

```bash
# Build and export static files
pnpm build

# The static files will be in the 'out' directory
# Upload the contents of 'out' to your GitHub Pages repository
```

### Option 2: GitHub Actions (Recommended)

1. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: latest
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Build
        run: pnpm build
        
      - name: Setup Pages
        uses: actions/configure-pages@v4
        
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./out

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

2. Enable GitHub Pages in your repository settings
3. Select "GitHub Actions" as the source
4. Push to main branch to trigger deployment

## Features

- **Monthly Reports**: Interactive charts showing monthly statistics with grouping options
- **Annual Statistics**: Yearly overview with breakdown tables
- **Response Time Analysis**: Confidence charts showing mean ± standard deviation
- **Error Statistics**: System and validation error tracking
- **Responsive Design**: Works on desktop and mobile devices
- **Static Export**: No server required, works on any static hosting

## Data Customization

To use your own data:

1. Replace the CSV files in `/public/data/` with your data
2. Ensure the CSV format matches the expected structure
3. Rebuild the application with `pnpm build`

The application is designed to be resilient - if any data files are missing, it will generate realistic synthetic data for demonstration purposes.
