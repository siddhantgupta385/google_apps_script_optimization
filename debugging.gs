// ============================== DEBUGGING HELPERS ==============================

/**
 * Debug the getStructuredOdds function to identify why it might be returning empty data
 * This function outputs detailed information about each step of the odds retrieval process
 * @returns {Object} Debug information about the process
 */
function debugOddsData() {
  // First, write to logs that we're starting the debug process
  Logger.log("==== ODDS DEBUG: Starting odds debugging process ====");
  const ui = SpreadsheetApp.getUi();
  let debug = { steps: [] };
  
  try {
    debug.steps.push("Starting debug process");
    
    // Step 1: Check spreadsheet access
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      debug.steps.push("❌ ERROR: Could not access active spreadsheet");
      showDebugResults(debug);
      return debug;
    }
    debug.steps.push("✅ Successfully accessed spreadsheet");
    
    // Step 2: Check if 'odds feed' sheet exists
    const sheet = ss.getSheetByName('odds feed');
    if (!sheet) {
      debug.steps.push("❌ ERROR: 'odds feed' sheet not found");
      debug.steps.push("🔧 Creating 'odds feed' sheet with sample data...");
      
      const result = loadSampleOddsData();
      debug.steps.push(result);
      
      showDebugResults(debug);
      return debug;
    }
    debug.steps.push("✅ Found 'odds feed' sheet");
    
    // Step 3: Check if sheet has data
    const data = sheet.getDataRange().getValues();
    debug.totalRows = data.length;
    
    if (data.length <= 1) {
      debug.steps.push(`❌ ERROR: Only ${data.length} rows found (header only or empty)`);
      debug.steps.push("🔧 Adding sample data to 'odds feed' sheet...");
      
      const result = loadSampleOddsData();
      debug.steps.push(result);
      
      showDebugResults(debug);
      return debug;
    }
    debug.steps.push(`✅ Found ${data.length} rows of data (including header)`);
    
    // Step 4: Check header structure
    const header = data[0];
    debug.header = header;
    
    const requiredColumns = ['Game Description', 'League', 'Type', 'Team', 'Odds'];
    const missingColumns = [];
    
    requiredColumns.forEach(col => {
      if (header.indexOf(col) === -1) {
        missingColumns.push(col);
      }
    });
    
    if (missingColumns.length > 0) {
      debug.steps.push(`❌ ERROR: Missing columns: ${missingColumns.join(', ')}`);
      debug.steps.push("🔧 Recreating 'odds feed' sheet with correct columns...");
      
      const result = loadSampleOddsData();
      debug.steps.push(result);
      
      showDebugResults(debug);
      return debug;
    }
    debug.steps.push("✅ All required columns present in header");
    
    // Step 5: Try to process the data
    try {
      const odds = getStructuredOdds();
      debug.processedOdds = odds.length;
      debug.firstFewOdds = odds.slice(0, 3);
      
      if (odds.length === 0) {
        debug.steps.push("❌ ERROR: getStructuredOdds returned empty array despite data in sheet");
      } else {
        debug.steps.push(`✅ Successfully processed ${odds.length} odds entries`);
      }
    } catch (e) {
      debug.steps.push(`❌ ERROR processing odds: ${e.toString()}`);
    }
    
    showDebugResults(debug);
    return debug;
    
  } catch (e) {
    debug.steps.push(`❌ FATAL ERROR: ${e.toString()}`);
    showDebugResults(debug);
    return debug;
  }
}

/**
 * Display debug results in a modal dialog
 */
function showDebugResults(debug) {
  const ui = SpreadsheetApp.getUi();
  
  let htmlOutput = '<html><body style="font-family: Arial, sans-serif; padding: 20px;">';
  htmlOutput += '<h2>Odds Data Debug Results</h2>';
  
  // Steps list
  htmlOutput += '<h3>Process Steps:</h3>';
  htmlOutput += '<ul>';
  debug.steps.forEach(step => {
    htmlOutput += `<li>${step}</li>`;
  });
  htmlOutput += '</ul>';
  
  // Additional details
  if (debug.totalRows) {
    htmlOutput += `<p><strong>Total rows in sheet:</strong> ${debug.totalRows}</p>`;
  }
  
  if (debug.processedOdds !== undefined) {
    htmlOutput += `<p><strong>Processed odds entries:</strong> ${debug.processedOdds}</p>`;
  }
  
  if (debug.firstFewOdds) {
    htmlOutput += '<h3>Sample of Processed Odds:</h3>';
    htmlOutput += '<pre style="background-color: #f5f5f5; padding: 10px; overflow: auto;">';
    htmlOutput += JSON.stringify(debug.firstFewOdds, null, 2);
    htmlOutput += '</pre>';
  }
  
  htmlOutput += '<p>See DEBUGGING.md for more troubleshooting steps.</p>';
  htmlOutput += '</body></html>';
  
  const htmlDialogOutput = HtmlService.createHtmlOutput(htmlOutput)
    .setWidth(600)
    .setHeight(500);
    
  ui.showModalDialog(htmlDialogOutput, 'Odds Data Debug Results');
}
