# Google Apps Script Betting Sandbox

A Google Sheets betting sandbox with live odds from DraftKings (NHL, NBA, MLB, UFC, MLS), F1 via web scraper, and USA horse racing. Users build single/parlay slips in a sidebar UI, track balances, and auto-settle bets from recent scores. Features a live leaderboard ranking system.

## Features

- **Live Odds Ingestion**: DraftKings odds via The Odds API for major sports
- **F1 Betting**: Custom web scraper integration for Formula 1 markets
- **Horse Racing**: USA racecards and odds via RapidAPI
- **Interactive Bet Slip**: Multi-step sidebar UI for building bets
- **Balance Management**: Per-user balance tracking and risk controls
- **Auto-Settlement**: Automatic bet settlement using recent game scores
- **Live Leaderboard**: Real-time ranking system with tie support

## Getting Started

1. Copy the code from `code.gs.txt` into your Google Apps Script project
2. Upload `betSlipV4.html` to your Apps Script project
3. Set up the required Google Sheets with the necessary columns
4. Use the custom "Betting Actions" menu to:
   - Refresh odds for different sports
   - Open the bet slip sidebar
   - Fetch scores and settle bets
   - Update the leaderboard

## Key Components

- **`code.gs.txt`**: Server-side logic for odds fetching, bet processing, and settlement
- **`betSlipV4.html`**: Client-side sidebar UI for bet selection and submission

## Use Cases

Perfect for running private simulated betting leagues, quickly loading markets, placing parlays, and managing live leaderboards - all within Google Sheets without external databases.
