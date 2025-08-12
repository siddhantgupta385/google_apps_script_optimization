/**
 * This file ensures that test data is properly integrated with the main app
 * It provides enhanced integration between hardcoded test data and the main application
 */

/**
 * Helper function to check if the hardcoded test data is available and working
 * This will be used by the UI to verify if fallback data is working
 */
function verifyHardcodedTestData() {
  try {
    const testData = getHardcodedTestOdds();
    return {
      success: true,
      count: testData.length,
      message: `Found ${testData.length} test data entries`
    };
  } catch (e) {
    return {
      success: false,
      count: 0,
      message: `Error accessing test data: ${e.toString()}`
    };
  }
}

/**
 * Function to add a testing menu to the spreadsheet
 * This helps with debugging and verifying data flows
 */
function addTestingMenuItems() {
  SpreadsheetApp.getUi()
    .createMenu('Testing Tools')
    .addItem('Verify Test Data', 'showTestDataStatus')
    .addItem('Reset Sheet Data', 'loadSampleOddsData')
    .addItem('Clear Logs', 'clearLogs')
    .addToUi();
}

/**
 * Shows the status of test data in a dialog
 */
function showTestDataStatus() {
  const status = verifyHardcodedTestData();
  const ui = SpreadsheetApp.getUi();
  
  if (status.success) {
    ui.alert('Test Data Status', 
      `✅ Test data is working correctly!\n\n${status.message}\n\nThe bet slip should be able to fall back to test data if needed.`, 
      ui.ButtonSet.OK);
  } else {
    ui.alert('Test Data Status', 
      `❌ Problem with test data!\n\n${status.message}\n\nCheck the implementation of getHardcodedTestOdds().`, 
      ui.ButtonSet.OK);
  }
}

/**
 * Helper function to clear logs
 */
function clearLogs() {
  console.clear();
  Logger.log("Logs cleared");
  SpreadsheetApp.getUi().alert('Logs have been cleared');
}
