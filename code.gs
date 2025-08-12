// ============================== ON OPEN MENU ==============================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Betting Actions')
    .addItem('Refresh MLS Odds', 'fetchDraftKingsMLSodds')
    .addItem('Refresh MLB Odds','fetchDraftKingsMLBOdds')
    .addItem('Refresh NHL Odds', 'fetchDraftKingsNHLOdds')
    .addItem('Refresh F1 Odds', 'fetchF1OddsFromWebScraper')
    .addItem('Refresh Horse Racing Odds', 'importUSAHorseOdds') // Changed to the correct function
    .addItem('Refresh NBA Odds', 'fetchDraftKingsNBAOdds')
    .addItem('Refresh UFC Odds', 'fetchDraftKingsUFCOdds')
    .addItem('Fetch Scores (Last 2 Days)', 'fetchScores')
    .addItem('Settle Bets V4', 'settlePendingBetsV4')
    .addItem('Open Bet Slip V4', 'showBetSlipV4')
    .addItem('Update Leaderboard', 'updateLeaderboard')
    .addSeparator()
    .addItem('Load Test Data', 'loadSampleOddsData')
    .addItem('Debug Odds Data', 'debugOddsData')
    .addToUi();
    
  // Create a testing menu specifically for the odds issue
  SpreadsheetApp.getUi()
    .createMenu('Odds Testing')
    .addItem('Test getStructuredOdds', 'testOddsRetrieval')
    .addItem('Load Hardcoded Test Data', 'getHardcodedTestOdds')
    .addToUi();
  
  // Also add the general testing menu
  addTestingMenuItems();
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile('betSlipV4')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); // Allow iframe embedding
}

// ============================== HORSE RACING FUNCTIONS ==============================
function importUSAHorseOdds() {
  const raceSheet = getOrCreateSheet('usa_race_ids', ['id_race', 'course', 'date', 'distance', 'age', 'status']);
  const oddsSheet = getOrCreateSheet('odds feed', ['Game Description', 'League', 'Type', 'Team', 'Odds', 'Source', 'Timestamp']);
  const debugSheet = getOrCreateSheet('usa_debug', [
    'Race ID', 'Horse', 'SP', 'Number', 'Trainer', 'Form', 'Odds Object'
  ]);
  const apiKey = 'bcb793a4a1mshb23b6362ecb7290p12bfbfjsn1efc8d22367e';

  const data = raceSheet.getDataRange().getValues();
  const header = data[0];
  const rows = data.slice(1);

  let reqCount = 0;
  let successCount = 0;
  const today = new Date();

  // First, clear existing horse racing odds
  const allOddsData = oddsSheet.getDataRange().getValues();
  const gameDescIdx = allOddsData[0].indexOf('Game Description');
  const leagueIdx = allOddsData[0].indexOf('League');
  
  for (let i = allOddsData.length - 1; i > 0; i--) {
    if (allOddsData[i][leagueIdx] === 'Horse Racing') {
      oddsSheet.deleteRow(i + 1);
    }
  }

  rows.forEach((row, i) => {
    const id_race = row[0];
    const status = row[5];
    const raceDate = new Date(row[2]);
    
    // Only process races for today or future
    if (raceDate < today) return;
    
    // Skip races that have already been processed
    if (status !== 'NEW' && status !== '') return;

    const url = `https://horse-racing-usa.p.rapidapi.com/race/${id_race}`;
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'horse-racing-usa.p.rapidapi.com',
        'x-rapidapi-key': apiKey
      },
      muteHttpExceptions: true
    };

    try {
      const response = UrlFetchApp.fetch(url, options);
      const code = response.getResponseCode();
      
      if (code !== 200) {
        Logger.log(`Error fetching race ${id_race}: HTTP ${code}`);
        return;
      }

      const raceDetails = JSON.parse(response.getContentText());
      const course = row[1];
      const distance = row[3];
      const gameDesc = `${course} - ${distance}`;

      // Add each horse as a betting option
      raceDetails.runners.forEach(horse => {
        if (!horse.name || !horse.odds || horse.odds === '0' || horse.odds === 'n/a') return;
        
        const teamName = horse.name;
        const odds = parseFloat(horse.odds);
        if (isNaN(odds)) return;
        
        const timestamp = new Date();
        
        oddsSheet.appendRow([
          false, // Checkbox
          gameDesc,
          'Horse Racing',
          'Win',
          teamName,
          odds,
          'RapidAPI',
          timestamp,
          id_race, // Game ID
          course, // Home Team
          '', // Away Team
          'Win', // Bet Type
          teamName, // Side
          '', // Line
          odds // American odds
        ]);

        successCount++;
        
        // Log for debugging
        debugSheet.appendRow([
          id_race,
          horse.name,
          horse.sp || '',
          horse.number || '',
          horse.trainer || '',
          horse.form || '',
          JSON.stringify(horse)
        ]);
      });
      
      // Mark race as processed
      raceSheet.getRange(i + 2, 6).setValue('PROCESSED');
      
      reqCount++;
      
      // API rate limiting - pause every few requests
      if (reqCount % 5 === 0) {
        Utilities.sleep(1000);
      }
      
    } catch (e) {
      Logger.log(`Error processing race ${id_race}: ${e.toString()}`);
    }
  });

  // Format the newly added rows with checkboxes
  const lastRow = oddsSheet.getLastRow();
  if (lastRow > 1) {
    oddsSheet.getRange(`A2:A${lastRow}`).insertCheckboxes();
  }

  Logger.log(`✅ Imported ${successCount} horses from ${reqCount} races.`);
  
  // Fetch new racecards for tomorrow
  fetchUSARacecards();
  
  return successCount;
}

function getOrCreateSheet(name, headers = null) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (headers && sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }
  return sheet;
}

function fetchUSARacecards() {
  const sheetName = 'usa_race_ids';
  const apiKey = 'bcb793a4a1mshb23b6362ecb7290p12bfbfjsn1efc8d22367e';
  
  // Get today and tomorrow's dates
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dates = [
    Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
    Utilities.formatDate(tomorrow, Session.getScriptTimeZone(), 'yyyy-MM-dd')
  ];
  
  const sheet = getOrCreateSheet(sheetName, ['id_race', 'course', 'date', 'distance', 'age', 'status']);
  const lastRow = sheet.getLastRow();

  let existingIds = [];
  if (lastRow > 1) {
    const existingData = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    existingIds = existingData.map(row => row[0]);
  }
  
  let totalImported = 0;
  
  dates.forEach(dateStr => {
    const url = `https://horse-racing-usa.p.rapidapi.com/racecards?date=${dateStr}`;
    
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'horse-racing-usa.p.rapidapi.com',
        'x-rapidapi-key': apiKey
      },
      muteHttpExceptions: true
    };

    try {
      const response = UrlFetchApp.fetch(url, options);
      const code = response.getResponseCode();
      
      if (code !== 200) {
        Logger.log(`Error fetching racecards for ${dateStr}: HTTP ${code}`);
        return;
      }
      
      const text = response.getContentText();
      let races;
      
      try {
        races = JSON.parse(text);
        if (!Array.isArray(races)) {
          Logger.log(`❌ Unexpected response format for ${dateStr}:`);
          Logger.log(text);
          return;
        }
      } catch (e) {
        Logger.log(`❌ JSON parse failed for ${dateStr}:`);
        Logger.log(text);
        return;
      }
      
      // Filter out races that already exist in the sheet
      const newRaces = races.filter(r => !existingIds.includes(r.id_race));
      
      // Add new races to the sheet
      newRaces.forEach(r => {
        sheet.appendRow([
          r.id_race,
          r.course,
          r.date,
          r.distance,
          r.age,
          'NEW' // Mark as new so we know to fetch odds for it
        ]);
        totalImported++;
      });
      
      Logger.log(`✅ Imported ${newRaces.length} USA racecards for ${dateStr}`);
      
    } catch (e) {
      Logger.log(`Error processing racecards for ${dateStr}: ${e.toString()}`);
    }
  });
  
  return totalImported;
}

// ============================== F1 INTEGRATION ==============================
function fetchF1OddsFromWebScraper() {
  const sheet = getOrCreateSheet('odds feed', ['Game Description', 'League', 'Type', 'Team', 'Odds', 'Source', 'Timestamp']);
  
  // Remove existing F1 odds
  const data = sheet.getDataRange().getValues();
  const leagueIdx = data[0].indexOf('League');
  
  for (let i = data.length - 1; i > 0; i--) {
    if (data[i][leagueIdx] === 'F1') {
      sheet.deleteRow(i + 1);
    }
  }
  
  // Attempt to fetch from our custom F1 scraper API
  const scraperEndpoint = "https://f1odds-scraper.vercel.app/api/odds";
  
  try {
    const response = UrlFetchApp.fetch(scraperEndpoint, { muteHttpExceptions: true });
    const code = response.getResponseCode();
    
    if (code !== 200) {
      Logger.log(`Error fetching F1 odds: HTTP ${code}`);
      return 0;
    }
    
    const f1Data = JSON.parse(response.getContentText());
    
    if (!f1Data || !f1Data.nextRace || !f1Data.driverOdds || !Array.isArray(f1Data.driverOdds)) {
      Logger.log("Invalid F1 data format received");
      return 0;
    }
    
    const nextRace = f1Data.nextRace;
    const timestamp = new Date();
    let addedCount = 0;
    
    // Add driver win odds
    f1Data.driverOdds.forEach(driver => {
      if (!driver.name || !driver.odds) return;
      
      const odds = parseFloat(driver.odds);
      if (isNaN(odds)) return;
      
      sheet.appendRow([
        false, // Checkbox
        nextRace.name, // Game Description
        'F1', // League
        'Race Winner', // Type
        driver.name, // Team
        odds, // Odds
        'F1Scraper', // Source
        timestamp, // Timestamp
        nextRace.id, // Game ID
        nextRace.name, // Home Team (race name)
        '', // Away Team (empty for F1)
        'Race Winner', // Bet Type
        driver.name, // Side
        '', // Line
        odds // American odds
      ]);
      
      addedCount++;
    });
    
    // Add constructor championship odds if available
    if (f1Data.constructorOdds && Array.isArray(f1Data.constructorOdds)) {
      f1Data.constructorOdds.forEach(team => {
        if (!team.name || !team.odds) return;
        
        const odds = parseFloat(team.odds);
        if (isNaN(odds)) return;
        
        sheet.appendRow([
          false, // Checkbox
          "F1 2025 Season", // Game Description
          'F1', // League
          'Constructor Champion', // Type
          team.name, // Team
          odds, // Odds
          'F1Scraper', // Source
          timestamp, // Timestamp
          'f1-constructor-2025', // Game ID
          "F1 2025 Season", // Home Team
          '', // Away Team
          'Constructor Champion', // Bet Type
          team.name, // Side
          '', // Line
          odds // American odds
        ]);
        
        addedCount++;
      });
    }
    
    // Format checkboxes
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(`A2:A${lastRow}`).insertCheckboxes();
    }
    
    Logger.log(`✅ Imported ${addedCount} F1 odds`);
    return addedCount;
    
  } catch (e) {
    Logger.log(`Error in F1 odds import: ${e.toString()}`);
    return 0;
  }
}

// ============================== BET SLIP UI ==============================
function showBetSlipV4() {
  const html = HtmlService.createHtmlOutputFromFile('betSlipV4')
    .setTitle('Bet Slip V4')
    .setWidth(350);
  SpreadsheetApp.getUi().showSidebar(html);
}

function getStructuredOdds() {
  try {
    Logger.log("==== getStructuredOdds: Starting function ====");
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      Logger.log("Error: Could not access active spreadsheet");
      Logger.log("Falling back to hardcoded test data");
      return getHardcodedTestOdds();
    }
    Logger.log("Successfully accessed spreadsheet");
    
    // Use helper to get or create the odds feed sheet
    const sheet = getOrCreateOddsFeedSheet();
    Logger.log("Using odds feed sheet: " + sheet.getName());
    
    let data = sheet.getDataRange().getValues();
    Logger.log("Retrieved data rows: " + data.length + " (including header)");
    
    if (data.length <= 1) {
      Logger.log("Error: No odds data found in 'odds feed' sheet");
      // Try to add sample data automatically
      loadSampleOddsData();
      Logger.log("Attempted to load sample data");
      
      // Try again
      data = sheet.getDataRange().getValues();
      if (data.length <= 1) {
        Logger.log("Still no data after loading samples, using hardcoded test data");
        return getHardcodedTestOdds();
      }
      Logger.log("Now have " + data.length + " rows after loading samples");
    }
    
    const header = data[0];
  
    // Get column indices
    const gameDescIdx = header.indexOf('Game Description');
    const leagueIdx = header.indexOf('League');
    const typeIdx = header.indexOf('Type');
    const teamIdx = header.indexOf('Team');
    const oddsIdx = header.indexOf('Odds');
    const gameIdIdx = header.indexOf('Game ID');
    const homeTeamIdx = header.indexOf('Home Team');
    const awayTeamIdx = header.indexOf('Away Team');
    const betTypeIdx = header.indexOf('Bet Type');
    const sideIdx = header.indexOf('Side');
    const lineIdx = header.indexOf('Line');
    const timestampIdx = header.indexOf('Timestamp');
    
    // Format date for display
    const formatDate = (date) => {
      if (!date) return '';
      try {
        if (typeof date === 'string') {
          date = new Date(date);
        }
        return Utilities.formatDate(date, Session.getScriptTimeZone(), 'MMM dd, yyyy HH:mm');
      } catch (e) {
        return '';
      }
    };

    return data.slice(1).map(r => ({
      gameDesc: r[gameDescIdx] || '',
      sport: r[leagueIdx] || '',
      type: r[typeIdx] || '',
      team: r[teamIdx] || '',
      odds: r[oddsIdx] || '',
      gameId: r[gameIdIdx] || generateBetID(),
      home_team: r[homeTeamIdx] || r[gameDescIdx] || '',
      away_team: r[awayTeamIdx] || '',
      betType: r[betTypeIdx] || r[typeIdx] || '',
      side: r[sideIdx] || r[teamIdx] || '',
      line: r[lineIdx] || '',
      dateTime: formatDate(r[timestampIdx])
    }));
  } catch (e) {
    Logger.log("Error in getStructuredOdds: " + e.toString());
    Logger.log("Falling back to hardcoded test data due to error");
    return getHardcodedTestOdds();
  }
}

// ============================== BALANCE HELPER ==============================
function getUserBalanceV4() {
  const user = Session.getActiveUser().getEmail();
  const balancesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('balances');
  
  if (!balancesSheet) {
    // Create balances sheet if it doesn't exist
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.insertSheet('balances');
    sheet.appendRow(['User', 'Balance']);
    sheet.appendRow([user, 1000]); // Default starting balance
    return 1000;
  }
  
  const data = balancesSheet.getDataRange().getValues();
  const row = data.find(r => r[0] === user);
  
  if (!row) {
    // Add user to balances sheet with default balance
    balancesSheet.appendRow([user, 1000]);
    return 1000;
  }
  
  return parseFloat(row[1]) || 0;
}

// ============================== ODDS FETCHING ==============================

function fetchDraftKingsMLBOdds() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('odds feed');
  
  // If sheet doesn't exist, create it
  if (!sheet) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ss.insertSheet('odds feed');
    sheet.appendRow([
      'Selected', 'Game Description', 'League', 'Type', 'Team', 'Odds', 'Source', 
      'Timestamp', 'Game ID', 'Home Team', 'Away Team', 'Bet Type', 'Side', 'Line', 'American Odds'
    ]);
  }

  const apiKey = '06e5b9c919eac89cafa5f4bd4e8a3cea';
  const sportKey = 'baseball_mlb';
  const sportLabel = 'MLB';

  // Remove previous MLB rows
  const data = sheet.getDataRange().getValues();
  const leagueIdx = data[0].indexOf('League');
  
  for (let i = data.length - 1; i > 0; i--) {
    if (data[i][leagueIdx] === sportLabel) {
      sheet.deleteRow(i + 1);
    }
  }

  const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?regions=us&markets=h2h,spreads&bookmakers=draftkings&apiKey=${apiKey}&oddsFormat=decimal`;
  
  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const code = response.getResponseCode();
    
    if (code !== 200) {
      Logger.log(`Error fetching ${sportLabel} odds: HTTP ${code}`);
      return 0;
    }

    const dataObj = JSON.parse(response.getContentText());
    const timestamp = new Date();
    let addedCount = 0;

    dataObj.forEach(event => {
      const homeTeam = event.home_team;
      const awayTeam = event.away_team;
      const gameId = event.id;
      const gameDesc = `${homeTeam} vs ${awayTeam}`;
      const commenceTime = new Date(event.commence_time);
      
      // Only add events that haven't started yet
      if (commenceTime < new Date()) return;

      // Find bookmaker (DraftKings)
      const bookmaker = event.bookmakers.find(b => b.key === 'draftkings');
      if (!bookmaker) return;

      // Process H2H (Moneyline) markets
      const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
      if (h2hMarket) {
        h2hMarket.outcomes.forEach(outcome => {
          sheet.appendRow([
            false, // Checkbox
            gameDesc, // Game Description
            sportLabel, // League
            'Moneyline', // Type
            outcome.name, // Team
            outcome.price, // Odds
            'DraftKings', // Source
            timestamp, // Timestamp
            gameId, // Game ID
            homeTeam, // Home Team
            awayTeam, // Away Team
            'Moneyline', // Bet Type
            outcome.name, // Side
            '', // Line
            outcome.price // American odds
          ]);
          addedCount++;
        });
      }

      // Process spreads markets
      const spreadsMarket = bookmaker.markets.find(m => m.key === 'spreads');
      if (spreadsMarket) {
        spreadsMarket.outcomes.forEach(outcome => {
          sheet.appendRow([
            false, // Checkbox
            gameDesc, // Game Description
            sportLabel, // League
            'Spread', // Type
            outcome.name, // Team
            outcome.price, // Odds
            'DraftKings', // Source
            timestamp, // Timestamp
            gameId, // Game ID
            homeTeam, // Home Team
            awayTeam, // Away Team
            'Spread', // Bet Type
            outcome.name, // Side
            outcome.point, // Line
            outcome.price // American odds
          ]);
          addedCount++;
        });
      }
    });

    // Format checkboxes
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(`A2:A${lastRow}`).insertCheckboxes();
    }

    Logger.log(`✅ Imported ${addedCount} ${sportLabel} odds`);
    return addedCount;
    
  } catch (e) {
    Logger.log(`Error in ${sportLabel} odds import: ${e.toString()}`);
    return 0;
  }
}

function fetchDraftKingsNBAOdds() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('odds feed');
  
  // If sheet doesn't exist, create it
  if (!sheet) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ss.insertSheet('odds feed');
    sheet.appendRow([
      'Selected', 'Game Description', 'League', 'Type', 'Team', 'Odds', 'Source', 
      'Timestamp', 'Game ID', 'Home Team', 'Away Team', 'Bet Type', 'Side', 'Line', 'American Odds'
    ]);
  }

  const apiKey = '06e5b9c919eac89cafa5f4bd4e8a3cea';
  const sportKey = 'basketball_nba';
  const sportLabel = 'NBA';

  // Remove previous NBA rows
  const data = sheet.getDataRange().getValues();
  const leagueIdx = data[0].indexOf('League');
  
  for (let i = data.length - 1; i > 0; i--) {
    if (data[i][leagueIdx] === sportLabel) {
      sheet.deleteRow(i + 1);
    }
  }

  const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?regions=us&markets=h2h,spreads&bookmakers=draftkings&apiKey=${apiKey}&oddsFormat=decimal`;
  
  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const code = response.getResponseCode();
    
    if (code !== 200) {
      Logger.log(`Error fetching ${sportLabel} odds: HTTP ${code}`);
      return 0;
    }

    const dataObj = JSON.parse(response.getContentText());
    const timestamp = new Date();
    let addedCount = 0;

    dataObj.forEach(event => {
      const homeTeam = event.home_team;
      const awayTeam = event.away_team;
      const gameId = event.id;
      const gameDesc = `${homeTeam} vs ${awayTeam}`;
      const commenceTime = new Date(event.commence_time);
      
      // Only add events that haven't started yet
      if (commenceTime < new Date()) return;

      // Find bookmaker (DraftKings)
      const bookmaker = event.bookmakers.find(b => b.key === 'draftkings');
      if (!bookmaker) return;

      // Process H2H (Moneyline) markets
      const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
      if (h2hMarket) {
        h2hMarket.outcomes.forEach(outcome => {
          sheet.appendRow([
            false, // Checkbox
            gameDesc, // Game Description
            sportLabel, // League
            'Moneyline', // Type
            outcome.name, // Team
            outcome.price, // Odds
            'DraftKings', // Source
            timestamp, // Timestamp
            gameId, // Game ID
            homeTeam, // Home Team
            awayTeam, // Away Team
            'Moneyline', // Bet Type
            outcome.name, // Side
            '', // Line
            outcome.price // American odds
          ]);
          addedCount++;
        });
      }

      // Process spreads markets
      const spreadsMarket = bookmaker.markets.find(m => m.key === 'spreads');
      if (spreadsMarket) {
        spreadsMarket.outcomes.forEach(outcome => {
          sheet.appendRow([
            false, // Checkbox
            gameDesc, // Game Description
            sportLabel, // League
            'Spread', // Type
            outcome.name, // Team
            outcome.price, // Odds
            'DraftKings', // Source
            timestamp, // Timestamp
            gameId, // Game ID
            homeTeam, // Home Team
            awayTeam, // Away Team
            'Spread', // Bet Type
            outcome.name, // Side
            outcome.point, // Line
            outcome.price // American odds
          ]);
          addedCount++;
        });
      }
    });

    // Format checkboxes
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(`A2:A${lastRow}`).insertCheckboxes();
    }

    Logger.log(`✅ Imported ${addedCount} ${sportLabel} odds`);
    return addedCount;
    
  } catch (e) {
    Logger.log(`Error in ${sportLabel} odds import: ${e.toString()}`);
    return 0;
  }
}

function fetchDraftKingsNHLOdds() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('odds feed');
  
  // If sheet doesn't exist, create it
  if (!sheet) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ss.insertSheet('odds feed');
    sheet.appendRow([
      'Selected', 'Game Description', 'League', 'Type', 'Team', 'Odds', 'Source', 
      'Timestamp', 'Game ID', 'Home Team', 'Away Team', 'Bet Type', 'Side', 'Line', 'American Odds'
    ]);
  }

  const apiKey = '06e5b9c919eac89cafa5f4bd4e8a3cea';
  const sportKey = 'icehockey_nhl';
  const sportLabel = 'NHL';

  // Remove previous NHL rows
  const data = sheet.getDataRange().getValues();
  const leagueIdx = data[0].indexOf('League');
  
  for (let i = data.length - 1; i > 0; i--) {
    if (data[i][leagueIdx] === sportLabel) {
      sheet.deleteRow(i + 1);
    }
  }

  const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?regions=us&markets=h2h,spreads&bookmakers=draftkings&apiKey=${apiKey}&oddsFormat=decimal`;
  
  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const code = response.getResponseCode();
    
    if (code !== 200) {
      Logger.log(`Error fetching ${sportLabel} odds: HTTP ${code}`);
      return 0;
    }

    const dataObj = JSON.parse(response.getContentText());
    const timestamp = new Date();
    let addedCount = 0;

    dataObj.forEach(event => {
      const homeTeam = event.home_team;
      const awayTeam = event.away_team;
      const gameId = event.id;
      const gameDesc = `${homeTeam} vs ${awayTeam}`;
      const commenceTime = new Date(event.commence_time);
      
      // Only add events that haven't started yet
      if (commenceTime < new Date()) return;

      // Find bookmaker (DraftKings)
      const bookmaker = event.bookmakers.find(b => b.key === 'draftkings');
      if (!bookmaker) return;

      // Process H2H (Moneyline) markets
      const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
      if (h2hMarket) {
        h2hMarket.outcomes.forEach(outcome => {
          sheet.appendRow([
            false, // Checkbox
            gameDesc, // Game Description
            sportLabel, // League
            'Moneyline', // Type
            outcome.name, // Team
            outcome.price, // Odds
            'DraftKings', // Source
            timestamp, // Timestamp
            gameId, // Game ID
            homeTeam, // Home Team
            awayTeam, // Away Team
            'Moneyline', // Bet Type
            outcome.name, // Side
            '', // Line
            outcome.price // American odds
          ]);
          addedCount++;
        });
      }

      // Process spreads markets
      const spreadsMarket = bookmaker.markets.find(m => m.key === 'spreads');
      if (spreadsMarket) {
        spreadsMarket.outcomes.forEach(outcome => {
          sheet.appendRow([
            false, // Checkbox
            gameDesc, // Game Description
            sportLabel, // League
            'Spread', // Type
            outcome.name, // Team
            outcome.price, // Odds
            'DraftKings', // Source
            timestamp, // Timestamp
            gameId, // Game ID
            homeTeam, // Home Team
            awayTeam, // Away Team
            'Spread', // Bet Type
            outcome.name, // Side
            outcome.point, // Line
            outcome.price // American odds
          ]);
          addedCount++;
        });
      }
    });

    // Format checkboxes
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(`A2:A${lastRow}`).insertCheckboxes();
    }

    Logger.log(`✅ Imported ${addedCount} ${sportLabel} odds`);
    return addedCount;
    
  } catch (e) {
    Logger.log(`Error in ${sportLabel} odds import: ${e.toString()}`);
    return 0;
  }
}

function fetchDraftKingsMLSodds() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('odds feed');
  
  // If sheet doesn't exist, create it
  if (!sheet) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ss.insertSheet('odds feed');
    sheet.appendRow([
      'Selected', 'Game Description', 'League', 'Type', 'Team', 'Odds', 'Source', 
      'Timestamp', 'Game ID', 'Home Team', 'Away Team', 'Bet Type', 'Side', 'Line', 'American Odds'
    ]);
  }

  const apiKey = '06e5b9c919eac89cafa5f4bd4e8a3cea';
  const sportKey = 'soccer_usa_mls';
  const sportLabel = 'MLS';

  // Remove previous MLS rows
  const data = sheet.getDataRange().getValues();
  const leagueIdx = data[0].indexOf('League');
  
  for (let i = data.length - 1; i > 0; i--) {
    if (data[i][leagueIdx] === sportLabel) {
      sheet.deleteRow(i + 1);
    }
  }

  const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?regions=us&markets=h2h&bookmakers=draftkings&apiKey=${apiKey}&oddsFormat=decimal`;
  
  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const code = response.getResponseCode();
    
    if (code !== 200) {
      Logger.log(`Error fetching ${sportLabel} odds: HTTP ${code}`);
      return 0;
    }

    const dataObj = JSON.parse(response.getContentText());
    const timestamp = new Date();
    let addedCount = 0;

    dataObj.forEach(event => {
      const homeTeam = event.home_team;
      const awayTeam = event.away_team;
      const gameId = event.id;
      const gameDesc = `${homeTeam} vs ${awayTeam}`;
      const commenceTime = new Date(event.commence_time);
      
      // Only add events that haven't started yet
      if (commenceTime < new Date()) return;

      // Find bookmaker (DraftKings)
      const bookmaker = event.bookmakers.find(b => b.key === 'draftkings');
      if (!bookmaker) return;

      // Process H2H (Moneyline) markets
      const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
      if (h2hMarket) {
        h2hMarket.outcomes.forEach(outcome => {
          sheet.appendRow([
            false, // Checkbox
            gameDesc, // Game Description
            sportLabel, // League
            'Moneyline', // Type
            outcome.name, // Team
            outcome.price, // Odds
            'DraftKings', // Source
            timestamp, // Timestamp
            gameId, // Game ID
            homeTeam, // Home Team
            awayTeam, // Away Team
            'Moneyline', // Bet Type
            outcome.name, // Side
            '', // Line
            outcome.price // American odds
          ]);
          addedCount++;
        });
      }
    });

    // Format checkboxes
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(`A2:A${lastRow}`).insertCheckboxes();
    }

    Logger.log(`✅ Imported ${addedCount} ${sportLabel} odds`);
    return addedCount;
    
  } catch (e) {
    Logger.log(`Error in ${sportLabel} odds import: ${e.toString()}`);
    return 0;
  }
}

function fetchDraftKingsUFCOdds() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('odds feed');
  
  // If sheet doesn't exist, create it
  if (!sheet) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ss.insertSheet('odds feed');
    sheet.appendRow([
      'Selected', 'Game Description', 'League', 'Type', 'Team', 'Odds', 'Source', 
      'Timestamp', 'Game ID', 'Home Team', 'Away Team', 'Bet Type', 'Side', 'Line', 'American Odds'
    ]);
  }

  const apiKey = '06e5b9c919eac89cafa5f4bd4e8a3cea';
  const sportKey = 'mma_mixed_martial_arts';
  const sportLabel = 'UFC';

  // Remove previous UFC rows
  const data = sheet.getDataRange().getValues();
  const leagueIdx = data[0].indexOf('League');
  
  for (let i = data.length - 1; i > 0; i--) {
    if (data[i][leagueIdx] === sportLabel) {
      sheet.deleteRow(i + 1);
    }
  }

  const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?regions=us&markets=h2h&bookmakers=draftkings&apiKey=${apiKey}&oddsFormat=decimal`;
  
  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const code = response.getResponseCode();
    
    if (code !== 200) {
      Logger.log(`Error fetching ${sportLabel} odds: HTTP ${code}`);
      return 0;
    }

    const dataObj = JSON.parse(response.getContentText());
    const timestamp = new Date();
    const now = new Date();
    const cutoff = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000); // 6 days from now
    let addedCount = 0;

    dataObj.forEach(event => {
      const homeTeam = event.home_team || event.bookmakers[0].markets[0].outcomes[0].name;
      const awayTeam = event.away_team || event.bookmakers[0].markets[0].outcomes[1].name;
      const gameId = event.id;
      const gameDesc = `${homeTeam} vs ${awayTeam}`;
      const commenceTime = new Date(event.commence_time);
      
      // Only add events coming up in next 6 days
      if (commenceTime > cutoff || commenceTime < now) return;

      // Find bookmaker (DraftKings)
      const bookmaker = event.bookmakers.find(b => b.key === 'draftkings');
      if (!bookmaker) return;

      // Process H2H (Moneyline) markets
      const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
      if (h2hMarket) {
        h2hMarket.outcomes.forEach(outcome => {
          sheet.appendRow([
            false, // Checkbox
            gameDesc, // Game Description
            sportLabel, // League
            'Moneyline', // Type
            outcome.name, // Team
            outcome.price, // Odds
            'DraftKings', // Source
            timestamp, // Timestamp
            gameId, // Game ID
            homeTeam, // Home Team
            awayTeam, // Away Team
            'Moneyline', // Bet Type
            outcome.name, // Side
            '', // Line
            outcome.price // American odds
          ]);
          addedCount++;
        });
      }
    });

    // Format checkboxes
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(`A2:A${lastRow}`).insertCheckboxes();
    }

    Logger.log(`✅ Imported ${addedCount} ${sportLabel} odds`);
    return addedCount;
    
  } catch (e) {
    Logger.log(`Error in ${sportLabel} odds import: ${e.toString()}`);
    return 0;
  }
}

// ============================== BET ID ==============================
function generateBetID() {
  return `BET-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
}

// ============================== PLACE BET V4 ==============================
function submitV4Bet(betSlip, stake) {
  if (!betSlip || betSlip.length === 0) {
    return "Error: Invalid bet slip";
  }
  
  if (!stake || stake <= 0) {
    return "Error: Invalid stake amount";
  }
  
  const user = Session.getActiveUser().getEmail();
  const betId = generateBetID();
  const timestamp = new Date();
  
  // Get current balance
  const balance = getUserBalanceV4();
  
  if (stake > balance) {
    return `Insufficient funds. Your current balance is $${balance.toFixed(2)}`;
  }
  
  // Calculate total odds
  const totalOdds = betSlip.reduce((total, leg) => total * parseFloat(leg.odds), 1);
  const potentialWinnings = stake * totalOdds;
  
  // Update balance
  const balancesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('balances');
  const balanceData = balancesSheet.getDataRange().getValues();
  const userRowIdx = balanceData.findIndex(r => r[0] === user);
  
  if (userRowIdx >= 0) {
    const newBalance = balance - stake;
    balancesSheet.getRange(userRowIdx + 1, 2).setValue(newBalance);
  } else {
    return "Error: User not found in balances sheet";
  }
  
  // Add bet to bets sheet
  const betsSheet = getOrCreateSheet('bets', [
    'Bet ID', 'User', 'Stake', 'Potential Winnings', 'Status', 
    'Legs', 'Timestamp', 'Settlement Date', 'Final Outcome', 'Payout'
  ]);
  
  betsSheet.appendRow([
    betId,
    user,
    stake,
    potentialWinnings,
    'PENDING',
    JSON.stringify(betSlip),
    timestamp,
    '',
    '',
    0
  ]);
  
  return `Bet placed successfully! Bet ID: ${betId}`;
}

// ============================== SCORE FETCHING ==============================
function fetchScores() {
  const sheetName = 'Scores';
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  sheet.clearContents();

  const headers = ['Game ID', 'Sport', 'Date', 'Home Team', 'Away Team', 'Home Score', 'Away Score', 'Winner', 'Status'];
  sheet.appendRow(headers);

  const apiKey = '06e5b9c919eac89cafa5f4bd4e8a3cea';
  const sports = [
    { key: 'basketball_nba', label: 'NBA' },
    { key: 'baseball_mlb', label: 'MLB' },
    { key: 'icehockey_nhl', label: 'NHL' },
    { key: 'soccer_usa_mls', label: 'MLS' }
  ];
  
  // Get dates for last 2 days
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const dates = [
    Utilities.formatDate(yesterday, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
    Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy-MM-dd')
  ];
  
  let fetchedScores = 0;

  sports.forEach(sport => {
    dates.forEach(date => {
      const url = `https://api.the-odds-api.com/v4/sports/${sport.key}/scores/?daysFrom=1&apiKey=${apiKey}`;
      
      try {
        const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
        const code = response.getResponseCode();
        
        if (code !== 200) {
          Logger.log(`Error fetching ${sport.label} scores: HTTP ${code}`);
          return;
        }
        
        const data = JSON.parse(response.getContentText());
        
        data.forEach(game => {
          if (!game.completed) return; // Only process completed games
          
          const homeTeam = game.home_team;
          const awayTeam = game.away_team;
          const gameId = game.id;
          const gameDate = new Date(game.commence_time);
          
          // Get scores
          const homeScore = game.scores && game.scores.find(s => s.name === homeTeam)?.score || 0;
          const awayScore = game.scores && game.scores.find(s => s.name === awayTeam)?.score || 0;
          
          // Determine winner
          let winner = '';
          if (homeScore > awayScore) {
            winner = homeTeam;
          } else if (awayScore > homeScore) {
            winner = awayTeam;
          } else {
            winner = 'DRAW';
          }
          
          sheet.appendRow([
            gameId,
            sport.label,
            Utilities.formatDate(gameDate, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
            homeTeam,
            awayTeam,
            homeScore,
            awayScore,
            winner,
            'COMPLETE'
          ]);
          
          fetchedScores++;
        });
      } catch (e) {
        Logger.log(`Error processing ${sport.label} scores: ${e.toString()}`);
      }
    });
  });
  
  Logger.log(`✅ Fetched ${fetchedScores} scores`);
  return fetchedScores;
}

// ============================== SETTLE BETS ==============================
function settlePendingBetsV4() {
  const betsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('bets');
  const scoresSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Scores');
  
  if (!betsSheet) {
    Logger.log("No bets sheet found");
    return 0;
  }
  
  if (!scoresSheet) {
    Logger.log("No scores sheet found. Please fetch scores first.");
    return 0;
  }
  
  const betsData = betsSheet.getDataRange().getValues();
  const betsHeader = betsData[0];
  const scoresData = scoresSheet.getDataRange().getValues();
  
  // Find column indexes
  const betIdIdx = betsHeader.indexOf('Bet ID');
  const userIdx = betsHeader.indexOf('User');
  const stakeIdx = betsHeader.indexOf('Stake');
  const statusIdx = betsHeader.indexOf('Status');
  const legsIdx = betsHeader.indexOf('Legs');
  const settleDateIdx = betsHeader.indexOf('Settlement Date');
  const outcomeIdx = betsHeader.indexOf('Final Outcome');
  const payoutIdx = betsHeader.indexOf('Payout');
  
  let settledCount = 0;
  
  // Process each bet row
  for (let i = 1; i < betsData.length; i++) {
    const row = betsData[i];
    
    // Only process pending bets
    if (row[statusIdx] !== 'PENDING') continue;
    
    const betId = row[betIdIdx];
    const user = row[userIdx];
    const stake = parseFloat(row[stakeIdx]);
    const legsJson = row[legsIdx];
    
    // Parse legs JSON
    let legs;
    try {
      legs = JSON.parse(legsJson);
      if (!Array.isArray(legs)) throw new Error("Legs is not an array");
    } catch (e) {
      Logger.log(`Error parsing legs for bet ${betId}: ${e.toString()}`);
      continue;
    }
    
    // Evaluate each leg
    let allLegsWon = true;
    let anyLegLost = false;
    
    for (const leg of legs) {
      const result = evaluateLegV4(leg, scoresData);
      
      if (result === 'LOSE') {
        allLegsWon = false;
        anyLegLost = true;
        break; // One loss means the whole parlay loses
      } else if (result === 'VOID' || result === 'PENDING') {
        allLegsWon = false; // Can't be a full win if any are void or pending
      }
    }
    
    // If all legs are settled and at least one lost, the bet is a loss
    if (anyLegLost) {
      // Update bet as lost
      betsSheet.getRange(i + 1, statusIdx + 1).setValue('LOST');
      betsSheet.getRange(i + 1, settleDateIdx + 1).setValue(new Date());
      betsSheet.getRange(i + 1, outcomeIdx + 1).setValue('LOST');
      betsSheet.getRange(i + 1, payoutIdx + 1).setValue(0);
      settledCount++;
    } 
    // If all legs won, the bet is a win
    else if (allLegsWon) {
      const winnings = stake * legs.reduce((total, leg) => total * parseFloat(leg.odds), 1);
      
      // Update bet as won
      betsSheet.getRange(i + 1, statusIdx + 1).setValue('WON');
      betsSheet.getRange(i + 1, settleDateIdx + 1).setValue(new Date());
      betsSheet.getRange(i + 1, outcomeIdx + 1).setValue('WON');
      betsSheet.getRange(i + 1, payoutIdx + 1).setValue(winnings);
      
      // Credit user balance
      creditBalance(user, winnings);
      settledCount++;
    }
  }
  
  if (settledCount > 0) {
    updateLeaderboard();
  }
  
  Logger.log(`✅ Settled ${settledCount} bets`);
  return settledCount;
}

// Evaluate a single leg of a bet
function evaluateLegV4(leg, scoresData) {
  const scoresHeader = scoresData[0];
  const gameIdIdx = scoresHeader.indexOf('Game ID');
  const homeTeamIdx = scoresHeader.indexOf('Home Team');
  const awayTeamIdx = scoresHeader.indexOf('Away Team');
  const homeScoreIdx = scoresHeader.indexOf('Home Score');
  const awayScoreIdx = scoresHeader.indexOf('Away Score');
  const winnerIdx = scoresHeader.indexOf('Winner');
  const statusIdx = scoresHeader.indexOf('Status');
  
  // For F1 and Horse Racing, we need manual settlement
  if (leg.sport === 'F1' || leg.sport === 'Horse Racing') {
    return 'PENDING'; // These sports need to be settled manually
  }
  
  // Find the game in scores
  const gameRows = scoresData.filter(r => r[gameIdIdx] === leg.gameId && r[statusIdx] === 'COMPLETE');
  
  if (gameRows.length === 0) {
    return 'PENDING'; // Game not found or not complete
  }
  
  const game = gameRows[0];
  const homeTeam = game[homeTeamIdx];
  const awayTeam = game[awayTeamIdx];
  const homeScore = parseFloat(game[homeScoreIdx]);
  const awayScore = parseFloat(game[awayScoreIdx]);
  const winner = game[winnerIdx];
  
  // Moneyline bet
  if (leg.betType === 'Moneyline') {
    if (leg.side === homeTeam) {
      return homeScore > awayScore ? 'WIN' : 'LOSE';
    } else if (leg.side === awayTeam) {
      return awayScore > homeScore ? 'WIN' : 'LOSE';
    } else if (leg.side === 'Draw' && winner === 'DRAW') {
      return 'WIN';
    }
    return 'LOSE';
  }
  
  // Spread bet
  if (leg.betType === 'Spread') {
    const line = parseFloat(leg.line);
    
    if (leg.side === homeTeam) {
      const adjustedHomeScore = homeScore + line;
      return adjustedHomeScore > awayScore ? 'WIN' : (adjustedHomeScore === awayScore ? 'VOID' : 'LOSE');
    } else if (leg.side === awayTeam) {
      const adjustedAwayScore = awayScore + line;
      return adjustedAwayScore > homeScore ? 'WIN' : (adjustedAwayScore === homeScore ? 'VOID' : 'LOSE');
    }
  }
  
  return 'PENDING'; // Unknown bet type
}

// Credit user's balance
function creditBalance(user, amount) {
  const balancesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('balances');
  
  if (!balancesSheet) return false;
  
  const data = balancesSheet.getDataRange().getValues();
  const userRowIdx = data.findIndex(r => r[0] === user);
  
  if (userRowIdx >= 0) {
    const currentBalance = parseFloat(data[userRowIdx][1]);
    const newBalance = currentBalance + amount;
    balancesSheet.getRange(userRowIdx + 1, 2).setValue(newBalance);
    return true;
  }
  
  return false;
}

// ============================== UPDATE LEADERBOARD ==============================
function updateLeaderboard() {
  const betsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('bets');
  const balancesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('balances');
  
  if (!betsSheet || !balancesSheet) {
    Logger.log("Missing required sheets");
    return 0;
  }
  
  // Create or get leaderboard sheet
  const leaderboardSheet = getOrCreateSheet('Leaderboard', [
    'Rank', 'User', 'Current Balance', 'Bets Placed', 'Wins', 'Losses', 'Win Rate', 'Profit/Loss', 'Last Bet'
  ]);
  
  // Clear existing data
  if (leaderboardSheet.getLastRow() > 1) {
    leaderboardSheet.getRange(2, 1, leaderboardSheet.getLastRow() - 1, leaderboardSheet.getLastColumn()).clear();
  }
  
  // Get all bets
  const betsData = betsSheet.getDataRange().getValues();
  const betsHeader = betsData[0];
  const userIdx = betsHeader.indexOf('User');
  const stakeIdx = betsHeader.indexOf('Stake');
  const statusIdx = betsHeader.indexOf('Status');
  const payoutIdx = betsHeader.indexOf('Payout');
  const timestampIdx = betsHeader.indexOf('Timestamp');
  
  // Get all balances
  const balancesData = balancesSheet.getDataRange().getValues();
  
  // Process each user
  const userStats = {};
  
  // Initial balances (starting at $1000)
  balancesData.slice(1).forEach(row => {
    const user = row[0];
    const balance = parseFloat(row[1]);
    
    userStats[user] = {
      user: user,
      balance: balance,
      betsPlaced: 0,
      wins: 0,
      losses: 0,
      profitLoss: balance - 1000, // Assuming starting balance of $1000
      lastBet: null
    };
  });
  
  // Process bets
  betsData.slice(1).forEach(row => {
    const user = row[userIdx];
    const status = row[statusIdx];
    const stake = parseFloat(row[stakeIdx]);
    const payout = parseFloat(row[payoutIdx] || 0);
    const timestamp = new Date(row[timestampIdx]);
    
    if (!userStats[user]) {
      userStats[user] = {
        user: user,
        balance: 0,
        betsPlaced: 0,
        wins: 0,
        losses: 0,
        profitLoss: 0,
        lastBet: null
      };
    }
    
    userStats[user].betsPlaced++;
    
    if (status === 'WON') {
      userStats[user].wins++;
    } else if (status === 'LOST') {
      userStats[user].losses++;
    }
    
    // Track last bet
    if (!userStats[user].lastBet || timestamp > userStats[user].lastBet) {
      userStats[user].lastBet = timestamp;
    }
  });
  
  // Sort users by balance
  const sortedUsers = Object.values(userStats).sort((a, b) => b.balance - a.balance);
  
  // Add to leaderboard sheet
  sortedUsers.forEach((stats, index) => {
    const winRate = stats.betsPlaced > 0 ? (stats.wins / stats.betsPlaced * 100).toFixed(1) + '%' : '0%';
    const lastBetDate = stats.lastBet ? Utilities.formatDate(stats.lastBet, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm') : 'Never';
    
    leaderboardSheet.appendRow([
      index + 1, // Rank
      stats.user,
      stats.balance,
      stats.betsPlaced,
      stats.wins,
      stats.losses,
      winRate,
      stats.profitLoss,
      lastBetDate
    ]);
  });
  
  // Format the leaderboard
  if (leaderboardSheet.getLastRow() > 1) {
    // Format currency columns
    leaderboardSheet.getRange(2, 3, leaderboardSheet.getLastRow() - 1, 1).setNumberFormat('$#,##0.00');
    leaderboardSheet.getRange(2, 8, leaderboardSheet.getLastRow() - 1, 1).setNumberFormat('$#,##0.00');
    
    // Add conditional formatting for profit/loss
    const range = leaderboardSheet.getRange(2, 8, leaderboardSheet.getLastRow() - 1, 1);
    const rule1 = SpreadsheetApp.newConditionalFormatRule()
      .whenNumberGreaterThan(0)
      .setBackground('#b6d7a8')
      .setRanges([range])
      .build();
    
    const rule2 = SpreadsheetApp.newConditionalFormatRule()
      .whenNumberLessThan(0)
      .setBackground('#f4cccc')
      .setRanges([range])
      .build();
      
    leaderboardSheet.setConditionalFormatRules([rule1, rule2]);
  }
  
  Logger.log(`✅ Updated leaderboard with ${sortedUsers.length} users`);
  return sortedUsers.length;
}

// ============================== TESTING HELPERS ==============================

/**
 * Use this function to load sample data for testing when APIs are unavailable
 * This will populate the odds feed sheet with sample data for all supported sports
 */
function loadSampleOddsData() {
  const sheet = getOrCreateSheet('odds feed', [
    'Selected', 'Game Description', 'League', 'Type', 'Team', 'Odds', 'Source', 
    'Timestamp', 'Game ID', 'Home Team', 'Away Team', 'Bet Type', 'Side', 'Line', 'American Odds'
  ]);
  
  // Clear existing data but keep header
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clear();
  }
  
  const timestamp = new Date();
  const sampleData = [
    // MLB samples
    [false, 'Yankees vs Red Sox', 'MLB', 'Moneyline', 'Yankees', 1.75, 'Sample', timestamp, 'mlb-123', 'Yankees', 'Red Sox', 'Moneyline', 'Yankees', '', 1.75],
    [false, 'Yankees vs Red Sox', 'MLB', 'Moneyline', 'Red Sox', 2.10, 'Sample', timestamp, 'mlb-123', 'Yankees', 'Red Sox', 'Moneyline', 'Red Sox', '', 2.10],
    [false, 'Dodgers vs Giants', 'MLB', 'Moneyline', 'Dodgers', 1.65, 'Sample', timestamp, 'mlb-124', 'Dodgers', 'Giants', 'Moneyline', 'Dodgers', '', 1.65],
    [false, 'Dodgers vs Giants', 'MLB', 'Moneyline', 'Giants', 2.25, 'Sample', timestamp, 'mlb-124', 'Dodgers', 'Giants', 'Moneyline', 'Giants', '', 2.25],
    
    // NBA samples
    [false, 'Lakers vs Celtics', 'NBA', 'Moneyline', 'Lakers', 1.90, 'Sample', timestamp, 'nba-123', 'Lakers', 'Celtics', 'Moneyline', 'Lakers', '', 1.90],
    [false, 'Lakers vs Celtics', 'NBA', 'Moneyline', 'Celtics', 1.90, 'Sample', timestamp, 'nba-123', 'Lakers', 'Celtics', 'Moneyline', 'Celtics', '', 1.90],
    [false, 'Warriors vs Bulls', 'NBA', 'Moneyline', 'Warriors', 1.50, 'Sample', timestamp, 'nba-124', 'Warriors', 'Bulls', 'Moneyline', 'Warriors', '', 1.50],
    [false, 'Warriors vs Bulls', 'NBA', 'Moneyline', 'Bulls', 2.60, 'Sample', timestamp, 'nba-124', 'Warriors', 'Bulls', 'Moneyline', 'Bulls', '', 2.60],
    
    // NHL samples
    [false, 'Bruins vs Rangers', 'NHL', 'Moneyline', 'Bruins', 1.85, 'Sample', timestamp, 'nhl-123', 'Bruins', 'Rangers', 'Moneyline', 'Bruins', '', 1.85],
    [false, 'Bruins vs Rangers', 'NHL', 'Moneyline', 'Rangers', 1.95, 'Sample', timestamp, 'nhl-123', 'Bruins', 'Rangers', 'Moneyline', 'Rangers', '', 1.95],
    
    // UFC samples
    [false, 'Jones vs Miocic', 'UFC', 'Moneyline', 'Jones', 1.55, 'Sample', timestamp, 'ufc-123', 'Jones', 'Miocic', 'Moneyline', 'Jones', '', 1.55],
    [false, 'Jones vs Miocic', 'UFC', 'Moneyline', 'Miocic', 2.45, 'Sample', timestamp, 'ufc-123', 'Jones', 'Miocic', 'Moneyline', 'Miocic', '', 2.45],
    
    // F1 samples
    [false, 'Monaco Grand Prix', 'F1', 'Race Winner', 'Max Verstappen', 1.45, 'Sample', timestamp, 'f1-monaco', 'Monaco Grand Prix', '', 'Race Winner', 'Max Verstappen', '', 1.45],
    [false, 'Monaco Grand Prix', 'F1', 'Race Winner', 'Lewis Hamilton', 3.20, 'Sample', timestamp, 'f1-monaco', 'Monaco Grand Prix', '', 'Race Winner', 'Lewis Hamilton', '', 3.20],
    [false, 'Monaco Grand Prix', 'F1', 'Race Winner', 'Charles Leclerc', 4.50, 'Sample', timestamp, 'f1-monaco', 'Monaco Grand Prix', '', 'Race Winner', 'Charles Leclerc', '', 4.50],
    
    // Horse Racing samples
    [false, 'Kentucky Derby - Churchill Downs', 'Horse Racing', 'Win', 'Essential Quality', 3.20, 'Sample', timestamp, 'hr-123', 'Kentucky Derby - Churchill Downs', '', 'Win', 'Essential Quality', '', 3.20],
    [false, 'Kentucky Derby - Churchill Downs', 'Horse Racing', 'Win', 'Hot Rod Charlie', 4.50, 'Sample', timestamp, 'hr-123', 'Kentucky Derby - Churchill Downs', '', 'Win', 'Hot Rod Charlie', '', 4.50],
    [false, 'Kentucky Derby - Churchill Downs', 'Horse Racing', 'Win', 'Medina Spirit', 5.25, 'Sample', timestamp, 'hr-123', 'Kentucky Derby - Churchill Downs', '', 'Win', 'Medina Spirit', '', 5.25]
  ];
  
  // Add the sample data
  sheet.getRange(2, 1, sampleData.length, sampleData[0].length).setValues(sampleData);
  
  // Add checkboxes to the first column
  sheet.getRange(2, 1, sampleData.length, 1).insertCheckboxes();
  
  return `✅ Added ${sampleData.length} sample odds records for testing`;
}

// Add a menu item for this in onOpen
function addTestingMenuItems() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Testing Tools')
    .addItem('Load Sample Odds Data', 'loadSampleOddsData')
    .addItem('Create Default Sheets', 'createDefaultSheets')
    .addToUi();
}

// Create all default sheets with proper structures
function getOrCreateOddsFeedSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('odds feed');
  
  if (!sheet) {
    Logger.log("Creating new 'odds feed' sheet");
    sheet = ss.insertSheet('odds feed');
    sheet.appendRow([
      'Selected', 'Game Description', 'League', 'Type', 'Team', 'Odds', 'Source', 
      'Timestamp', 'Game ID', 'Home Team', 'Away Team', 'Bet Type', 'Side', 'Line', 'American Odds'
    ]);
    
    // Add some basic test data
    loadSampleOddsData();
  }
  
  return sheet;
}

function createDefaultSheets() {
  getOrCreateSheet('odds feed', [
    'Selected', 'Game Description', 'League', 'Type', 'Team', 'Odds', 'Source', 
    'Timestamp', 'Game ID', 'Home Team', 'Away Team', 'Bet Type', 'Side', 'Line', 'American Odds'
  ]);
  
  getOrCreateSheet('balances', ['User', 'Balance']);
  
  getOrCreateSheet('bets', [
    'Bet ID', 'User', 'Stake', 'Potential Winnings', 'Status', 
    'Legs', 'Timestamp', 'Settlement Date', 'Final Outcome', 'Payout'
  ]);
  
  getOrCreateSheet('Scores', [
    'Game ID', 'Sport', 'Date', 'Home Team', 'Away Team', 'Home Score', 'Away Score', 'Winner', 'Status'
  ]);
  
  getOrCreateSheet('usa_race_ids', [
    'id_race', 'course', 'date', 'distance', 'age', 'status'
  ]);
  
  // Add current user to balances if not exists
  const balancesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('balances');
  const user = Session.getActiveUser().getEmail();
  
  if (balancesSheet.getLastRow() <= 1) {
    // Sheet is empty except header
    balancesSheet.appendRow([user, 1000]);
  } else {
    // Check if user exists
    const data = balancesSheet.getDataRange().getValues();
    const userExists = data.slice(1).some(row => row[0] === user);
    
    if (!userExists) {
      balancesSheet.appendRow([user, 1000]);
    }
  }
  
  return "✅ Created all default sheets with proper structure";
}

// Update onOpen to include testing menu
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Betting Actions')
    .addItem('Refresh MLS Odds', 'fetchDraftKingsMLSodds')
    .addItem('Refresh MLB Odds','fetchDraftKingsMLBOdds')
    .addItem('Refresh NHL Odds', 'fetchDraftKingsNHLOdds')
    .addItem('Refresh F1 Odds', 'fetchF1OddsFromWebScraper')
    .addItem('Refresh Horse Racing Odds', 'importUSAHorseOdds')
    .addItem('Refresh NBA Odds', 'fetchDraftKingsNBAOdds')
    .addItem('Refresh UFC Odds', 'fetchDraftKingsUFCOdds')
    .addItem('Fetch Scores (Last 2 Days)', 'fetchScores')
    .addItem('Settle Bets V4', 'settlePendingBetsV4')
    .addItem('Open Bet Slip V4', 'showBetSlipV4')
    .addItem('Update Leaderboard', 'updateLeaderboard')
    .addToUi();
    
  // Add testing menu
  ui.createMenu('Testing Tools')
    .addItem('Load Sample Odds Data', 'loadSampleOddsData')
    .addItem('Create Default Sheets', 'createDefaultSheets')
    .addToUi();
}
