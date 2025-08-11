# Google Apps Script Betting Sandbox

A Google Sheets betting sandbox for simulated sports betting, featuring live odds from DraftKings (NHL, NBA, MLB, UFC, MLS), F1 via web scraper, and USA horse racing. Users can build single or parlay slips in a sidebar UI, track balances, and auto-settle bets from recent scores. Includes a live leaderboard ranking system.

## Reference Google Sheet

To get started quickly, use this reference Google Sheet (view-only):  
https://docs.google.com/spreadsheets/d/1gKUuET6Ujky-uFDxN0W9indhitnqNFDavIZKE9nKucU/edit?gid=836368327#gid=836368327

**It is strongly recommended that you make your own copy of the sheet for development and testing.**  
Go to `File > Make a copy` in Google Sheets to create your own editable version.

## Features

- **Live Odds Ingestion**: DraftKings odds via The Odds API for major sports
- **F1 Betting**: Custom web scraper integration for Formula 1 markets
- **Horse Racing**: USA racecards and odds via RapidAPI
- **Interactive Bet Slip**: Multi-step sidebar UI for building bets
- **Balance Management**: Per-user balance tracking and risk controls
- **Auto-Settlement**: Automatic bet settlement using recent game scores
- **Live Leaderboard**: Real-time ranking system with tie support

## Getting Started

1. Open your Google Sheet and go to **Extensions > Apps Script** (see image above) to access the code editor.  
   > No need to manually copy code—your codebase will be available there.

2. Make a copy of the [reference Google Sheet](https://docs.google.com/spreadsheets/d/1gKUuET6Ujky-uFDxN0W9indhitnqNFDavIZKE9nKucU/edit?gid=836368327#gid=836368327) to use as your working sheet.

3. Use the custom **"Betting Actions"** menu in your Google Sheet to:
   - Refresh odds for different sports
   - Open the bet slip sidebar
   - Fetch scores and settle bets
   - Update the leaderboard

## Key Components

- **`code.gs.txt`**: Server-side logic for odds fetching, bet processing, and settlement
- **`betSlipV4.html`**: Client-side sidebar UI for bet selection and submission

## Use Cases

Ideal for running private simulated betting leagues, quickly loading markets, placing parlays, and managing live leaderboards—all within Google Sheets, with no external database required.
