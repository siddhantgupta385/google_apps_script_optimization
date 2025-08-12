# Testing Instructions for Google Apps Script Betting Platform

Follow these step-by-step instructions to test the optimized betting platform:

## Setting Up the Environment

1. **Access Google Sheets**:
   - Go to [Google Sheets](https://sheets.google.com)
   - Create a new spreadsheet or open the reference sheet mentioned in README.md

2. **Open the Apps Script Editor**:
   - In your Google Sheet, go to `Extensions > Apps Script`
   - This will open the Google Apps Script editor in a new tab

3. **Replace the Code**:
   - In the Apps Script editor, replace any existing code with the contents of your `code.gs` file
   - Click the `+` button next to "Files" and select "HTML"
   - Name the file `betSlipV4.html` and paste the contents of your HTML file
   - Save both files (Ctrl+S or ⌘+S)

4. **Set Up Initial Run**:
   - In the Apps Script editor, select the `onOpen` function from the dropdown menu at the top
   - Click the "Run" button (play icon)
   - Follow the authorization prompts to grant permissions

## Testing the Basic Functionality

1. **Verify Menu Creation**:
   - Return to your Google Sheet
   - You should see a new "Betting Actions" menu in the menu bar
   - If it doesn't appear, refresh the page

2. **Load Odds Data**:
   - Click `Betting Actions > Refresh MLB Odds` (or any other sport)
   - This should create or populate the "odds feed" sheet
   - Check that data is being added with proper formatting

3. **Open the Bet Slip**:
   - Click `Betting Actions > Open Bet Slip V4`
   - The sidebar should appear with your updated UI
   - Verify your balance loads and the UI looks correct

## Testing Sport-Specific Features

### Testing MLB Odds

1. Click `Betting Actions > Refresh MLB Odds`
2. Check the "odds feed" sheet to verify MLB data is populated
3. Open the bet slip and select "MLB" from the sports dropdown
4. Verify you can see the available markets and games

### Testing F1 Integration

1. Click `Betting Actions > Refresh F1 Odds`
2. Verify F1 data is properly formatted in the "odds feed" sheet
3. In the bet slip, select "F1" and check that the UI displays correctly
4. Verify the F1 icon appears when adding a selection to your slip

### Testing Horse Racing Integration

1. Click `Betting Actions > Refresh Horse Racing Odds`
2. Check that it creates or populates the "usa_race_ids" sheet
3. Verify horse racing odds appear in the "odds feed" sheet
4. Test the bet slip with horse racing selections

## Testing Betting Functionality

1. **Create a Single Bet**:
   - Open the bet slip
   - Select any sport, market, and outcome
   - Enter a stake amount (e.g., $10)
   - Click "Submit Bet"
   - Verify the bet is added to the "bets" sheet
   - Check that your balance is updated correctly

2. **Create a Parlay Bet**:
   - Open the bet slip
   - Add multiple selections from different sports/games
   - Enter a stake amount
   - Verify the total odds calculation is correct
   - Submit the bet and check the "bets" sheet

3. **Test Error Handling**:
   - Try submitting with no selections (should show error)
   - Try submitting with zero stake (should show error)
   - Try submitting with a stake higher than your balance (should show error)

## Testing Settlement

1. **Fetch Recent Scores**:
   - Click `Betting Actions > Fetch Scores (Last 2 Days)`
   - Verify the "Scores" sheet is created and populated
   - Check that completed games have proper winner information

2. **Settle Bets**:
   - Click `Betting Actions > Settle Bets V4`
   - Check the "bets" sheet to see if any bets were settled
   - Verify your balance is updated if you had winning bets

3. **Check Leaderboard**:
   - Click `Betting Actions > Update Leaderboard`
   - Verify the "Leaderboard" sheet is created/updated
   - Check that your ranking and statistics are accurate

## Troubleshooting Common Issues

### "Script function not found" Error:
- This means the function referenced in the menu doesn't exist in your code
- Check that all functions referenced in `onOpen()` exist in your code
- Make sure you saved your code after pasting

### API Key Issues:
- If you see "Error fetching odds" in the logs, the API key might be invalid
- The provided API keys might have usage limits or expiration dates
- Consider getting your own API keys if necessary

### Sheet Structure Issues:
- If functions fail, verify the expected sheets exist
- Check column names in the sheets match what the code expects

## Advanced Testing

### Testing Responsive Design:
- Open the web app on different devices or use Chrome's device emulation
- Verify the UI adjusts appropriately to different screen sizes

### Performance Testing:
- Load a large number of odds and bets
- Monitor execution time in the Apps Script logs
- Check if any operations hit quota limits

## Getting Help

If you encounter issues:
1. Check the execution logs in Apps Script (View > Logs)
2. Review the code for any syntax errors
3. Verify all required sheets and columns exist

For API-related issues:
- Visit [The Odds API](https://the-odds-api.com) for documentation
- Visit [RapidAPI](https://rapidapi.com) for horse racing API documentation

Happy testing!
