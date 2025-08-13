# Project Review & Proposal — el mouataz benmanssour
Email: moatazbanmansour@gmail.com | Date: 13 Aug 2025

## Understanding
This is a Google Apps Script betting platform using
Google Sheets as the database and a mobile HTML/CSS
interface.
It currently supports 4 sports (MLB, NBA, UFC, NHL)
with live odds, bet slips, balance tracking, and autosettlement.
s

## Problems Found 
1) Different names for columns: The horse racing sheet uses different column names than the main sports, which makes it so the bet slip can't read them correctly.

2) Date format not the same: Dates were saved in different formats which could not save correctly or duplicate incorrect time.

3) Slow updating: Odds update one by one instead of all at once, so the time it takes to view the odds prolongs.

4) API keys in code: The keys for APIs are written inside the code, which is not safe.

5)No saving of results: The script is able to grab an API every time, instead of keeping the last time for just a short period of time.

6) Repeated code: Same repeated code is duplicated for each sport instead of one function that can be reused for all sports.
7) Errors break the script: Some errors where alerts are displayed, and the alerts block the script forcing someone to
have to click “OK”

## Proposed Solutions
1) Use same column names: Make all sports use the same sheet layout so bet slip works for all.

2) Fix date format: Choose one date style (e.g., YYYY-MM-DD) and use it everywhere.

3) .Update in batches: Pull all odds at once and write them together to the sheet to make it faster.


4) Hide API keys: Use a Google Apps Script Properties to repository for keys instead of writing them in the code.


5) Cache results: Store latest API data for a short period of time so you don't make too many calls to the API at once.

6) Make one function for all sports: Have the same
"shared" code in one function and take the sport name as input.

7) Better error handling: Use try…catch and write errors to a log sheet instead of stopping the script.


## EXPECTED RESULTS

- Easier integration of new sports.
- Faster data fetching and processing.
- Better security and stability.
- Cleaner, maintainable codebase.
