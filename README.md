# Google Apps Script Betting Sandbox (Optimized)

An enhanced Google Sheets betting sandbox for simulated sports betting, featuring live odds from DraftKings (NHL, NBA, MLB, UFC, MLS), F1 via custom web scraper, and USA horse racing through RapidAPI. Users can build single or parlay slips in an improved responsive sidebar UI, track balances, and auto-settle bets from recent scores. Features a live leaderboard ranking system and improved error handling.

## Reference Google Sheet

To get started quickly, use this reference Google Sheet (view-only):  
https://docs.google.com/spreadsheets/d/1gKUuET6Ujky-uFDxN0W9indhitnqNFDavIZKE9nKucU/edit?gid=836368327#gid=836368327

**It is strongly recommended that you make your own copy of the sheet for development and testing.**  
Go to `File > Make a copy` in Google Sheets to create your own editable version.

## Features

- **Live Odds Ingestion**: DraftKings odds via The Odds API for major sports (MLB, NBA, UFC, NHL, MLS)
- **F1 Betting**: Enhanced custom web scraper integration for Formula 1 markets
- **Horse Racing**: Improved USA racecards and odds integration via RapidAPI
- **Interactive Bet Slip**: Responsive multi-step sidebar UI for building bets with sport-specific formatting
- **Balance Management**: Enhanced per-user balance tracking and improved validation
- **Auto-Settlement**: Optimized automatic bet settlement using recent game scores
- **Live Leaderboard**: Real-time ranking system with tie support
- **Error Handling**: Improved error handling and user feedback throughout the application
- **Responsive Design**: Mobile-friendly UI that works well across different device sizes

## Getting Started

1. Open your Google Sheet and go to **Extensions > Apps Script** (see image above) to access the code editor.  
   > No need to manually copy code—your codebase will be available there.

2. Make a copy of the [reference Google Sheet](https://docs.google.com/spreadsheets/d/1gKUuET6Ujky-uFDxN0W9indhitnqNFDavIZKE9nKucU/edit?gid=836368327#gid=836368327) to use as your working sheet.

3. Use the custom **"Betting Actions"** menu in your Google Sheet to:
   - Refresh odds for different sports
   - Open the bet slip sidebar
   - Fetch scores and settle bets
   - Update the leaderboard

## Testing the Application

1. **Start with loading test data**:
   - From the "Betting Actions" menu, select "Load Test Data"
   - This will populate the odds feed with sample data for testing
   - If you encounter a "No odds data available" error, click "Use Test Data" to use hardcoded odds

2. **Open the bet slip**:
   - From the "Betting Actions" menu, select "Open Bet Slip V4"
   - You should see your balance and the sports selection screen
   - The system will automatically fall back to hardcoded test data if spreadsheet data is unavailable

3. **Place a test bet**:
   - Select a sport (e.g., MLB, NBA, F1)
   - Follow the step-by-step process to select a market and team

## Troubleshooting "No odds data available" Error

If you encounter issues with odds data not loading:

1. **Use the debug tools**:
   - From the "Betting Actions" menu, select "Debug Odds Data"
   - This will analyze the odds data system and show detailed results

2. **Try hardcoded test data**:
   - From the "Odds Testing" menu, select "Test getStructuredOdds" or "Load Hardcoded Test Data"
   - These options bypass spreadsheet dependencies and use static test data

3. **Check the data source**:
   - Verify the 'odds feed' sheet exists and has data
   - If empty, use "Load Test Data" from the "Betting Actions" menu

4. **Review Apps Script logs**:
   - Go to Extensions → Apps Script → View → Logs
   - Look for error messages related to data retrieval
   - Enter a stake amount
   - Submit your bet

4. **Troubleshooting**:
   - If you see "No odds data available", use the "Test Get Odds" or "Use Hardcoded Odds" buttons in the debug console
   - For detailed troubleshooting steps, refer to the DEBUGGING.md file

See the [TESTING.md](TESTING.md) file for comprehensive testing instructions.

## Key Components

- **`code.gs.txt`**: Server-side logic for odds fetching, bet processing, and settlement
- **`betSlipV4.html`**: Client-side sidebar UI for bet selection and submission

## Use Cases

Ideal for running private simulated betting leagues, quickly loading markets, placing parlays, and managing live leaderboards—all within Google Sheets, with no external database required.
