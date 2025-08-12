/**
 * Simple function to return test odds data without relying on sheet data
 * This function bypasses all sheet operations to help debug frontend issues
 */
function getHardcodedTestOdds() {
  // Return a simple array of hardcoded test data
  return [
    {
      gameDesc: 'TEST - Yankees vs Red Sox',
      sport: 'MLB',
      type: 'Moneyline',
      team: 'Yankees',
      odds: 1.75,
      gameId: 'test-mlb-123',
      home_team: 'Yankees',
      away_team: 'Red Sox',
      betType: 'Moneyline',
      side: 'Yankees',
      line: '',
      dateTime: 'Aug 12, 2025 15:00'
    },
    {
      gameDesc: 'TEST - Yankees vs Red Sox',
      sport: 'MLB',
      type: 'Moneyline',
      team: 'Red Sox',
      odds: 2.10,
      gameId: 'test-mlb-123',
      home_team: 'Yankees',
      away_team: 'Red Sox',
      betType: 'Moneyline',
      side: 'Red Sox',
      line: '',
      dateTime: 'Aug 12, 2025 15:00'
    },
    {
      gameDesc: 'TEST - Lakers vs Celtics',
      sport: 'NBA',
      type: 'Moneyline',
      team: 'Lakers',
      odds: 1.90,
      gameId: 'test-nba-123',
      home_team: 'Lakers',
      away_team: 'Celtics',
      betType: 'Moneyline',
      side: 'Lakers',
      line: '',
      dateTime: 'Aug 12, 2025 19:30'
    },
    {
      gameDesc: 'TEST - Lakers vs Celtics',
      sport: 'NBA',
      type: 'Moneyline',
      team: 'Celtics',
      odds: 1.90,
      gameId: 'test-nba-123',
      home_team: 'Lakers',
      away_team: 'Celtics',
      betType: 'Moneyline',
      side: 'Celtics',
      line: '',
      dateTime: 'Aug 12, 2025 19:30'
    }
  ];
}

/**
 * Direct test function that will log the results of getStructuredOdds to check if it's returning data
 */
function testOddsRetrieval() {
  Logger.log("Testing getStructuredOdds()...");
  
  try {
    const odds = getStructuredOdds();
    
    if (!odds || odds.length === 0) {
      Logger.log("WARNING: getStructuredOdds returned no data");
      Logger.log("Received data from getStructuredOdds: " + JSON.stringify({
        length: 0,
        sample: "No data"
      }));
      
      Logger.log("Testing hardcoded data fallback directly...");
      const hardcodedData = getHardcodedTestOdds();
      Logger.log("Hardcoded data test: " + JSON.stringify({
        count: hardcodedData.length,
        sample: hardcodedData.slice(0, 2)
      }));
      
      return "No data from getStructuredOdds. Check Apps Script logs for details.";
    }
    
    Logger.log("SUCCESS: getStructuredOdds returned data!");
    Logger.log("Received data from getStructuredOdds: " + JSON.stringify({
      count: odds.length,
      sample: odds.slice(0, 2)
    }));
    
    return "Data successfully retrieved! Check Apps Script logs for details.";
  } catch (e) {
    Logger.log("ERROR in testOddsRetrieval: " + e.toString());
    return "Error testing odds. Check Apps Script logs for details.";
  }
}
