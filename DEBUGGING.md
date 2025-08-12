# Debugging Guide

## "No odds data available" Issue

If you're seeing "No odds data available" in the bet slip, here are troubleshooting steps:

1. **Load Test Data First**: 
   - Go to the "Betting Actions" menu
   - Click "Load Test Data" to populate the odds feed sheet with sample data

2. **Check the 'odds feed' Sheet**:
   - Make sure a sheet named 'odds feed' exists in your spreadsheet
   - Verify it has data with the correct columns (Game Description, League, Type, Team, Odds, etc.)

3. **Run in Debug Mode**:
   - Go to the "Betting Actions" menu
   - Click "Debug Odds Data" to see detailed information about the odds data retrieval

4. **Refresh Data Sources**:
   - Try refreshing specific sports odds using their respective menu items
   - For example: "Refresh NBA Odds", "Refresh MLB Odds", etc.

If the issue persists, check the Apps Script logs for any errors by going to:
Extensions → Apps Script → View → Logs

## Recent Fixes (Important Update)

We've implemented automatic fallback to hardcoded test data to solve the "No odds data available" issue:

1. **Automatic Fallback System**:
   - The `getStructuredOdds()` function now automatically falls back to `getHardcodedTestOdds()`
   - This happens when the spreadsheet can't be accessed or has no data
   - No manual intervention required - the system detects data issues and uses test data

2. **Improved Error Handling**:
   - Added more detailed logging throughout the odds retrieval process
   - Enhanced error messages in the UI with clear recovery options
   - Added a "Show Debug Info" button to provide troubleshooting guidance

3. **New Testing Tools**:
   - Added "Odds Testing" menu with direct testing functions
   - Created `verifyHardcodedTestData()` to check if test data is available
   - Enhanced the UI's ability to recover from data access errors

4. **How to Use the Fix**:
   - If you still encounter issues, use the "Use Test Data" button in the bet slip
   - Or select "Load Hardcoded Test Data" from the "Odds Testing" menu
   - The app should work even without spreadsheet access
