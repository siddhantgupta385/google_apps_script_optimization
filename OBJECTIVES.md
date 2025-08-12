# Project Objectives: Google Apps Script Betting Platform Expansion

## Project Overview

We have a comprehensive Google Apps Script betting platform with live odds integration, bet slip functionality, and mobile web app UI. Currently supporting MLB, NBA, UFC, and NHL. We need to expand to include solo sports (F1, horse racing, e-sports) and optimize the overall platform.

## Current State

✅ **Existing Sports**: MLB, NBA, UFC, NHL  
✅ **Core Features**: Live odds, bet slip, balance management, auto-settlement  
✅ **Infrastructure**: Google Apps Script backend, HTML/CSS mobile interface  
✅ **APIs**: The Odds API (DraftKings), RapidAPI (horse racing), custom F1 scraper  

## Primary Objectives

### 1. **Sport Expansion** 🏁
- **F1 Racing**: Complete integration with reliable odds API
- **Horse Racing**: Enhance existing USA racing system
- **E-Sports**: Research and integrate popular e-sports markets
- **Additional Sports**: Explore and add 2-3 more sports

### 2. **Platform Optimization** ⚡
- Debug and optimize existing Google Apps Script code
- Improve API reliability and error handling
- Enhance data flow between sheets and UI components
- Optimize bet settlement logic and parlay handling

### 3. **UI/UX Enhancement** 🎨
- Polish mobile betting interface
- Improve responsiveness across devices
- Enhance visual design and usability
- Fix any UI/UX issues

## Technical Requirements

### **Phase 1: Core Infrastructure (Milestone 1)**
- [x] **F1 Integration POC**: Added fetchF1OddsFromWebScraper function that pulls data from a custom scraper API
- [x] **Horse Racing Enhancement**: Completed importUSAHorseOdds function with improved error handling and date filtering
- [x] **Bet Slip Interface**: Enhanced UI to properly handle F1 and Horse Racing bets
- [x] **Balance Management**: Added improved validation and error handling for all sport types
- [x] **Data Flow**: Ensured proper data structure for all sports in the odds feed sheet

### **Phase 2: Platform Optimization**
- [x] **Code Cleanup**: Added comprehensive comments and organized Google Apps Script code
- [x] **API Reliability**: Implemented improved error handling and validation for API responses
- [x] **Settlement Logic**: Enhanced bet resolution for F1 and Horse Racing
- [x] **Performance**: Optimized data processing and UI responsiveness with better error handling

### **Phase 3: UI Enhancement**
- [x] **Mobile Interface**: Polished HTML/CSS for better usability with improved styling
- [x] **Responsiveness**: Added media queries and flexible layouts for cross-device compatibility
- [x] **Visual Design**: Added sport icons and improved overall aesthetics and user experience
- [x] **Testing**: Implemented responsive design principles for different screen sizes

## Deliverables

### **Required Deliverables**
1. **Cleaned & Commented Codebase**: Optimized Google Apps Script with clear documentation
2. **New Sport Integration**: At least one new sport with full functionality
3. **Enhanced Mobile Interface**: Improved UI/UX with better responsiveness

### **Bonus Deliverables**
- Additional sports beyond the minimum requirement
- Advanced betting features (live odds updates, bet tracking)
- Performance optimizations and analytics

## Success Criteria

### **Milestone 1 Success Metrics**
- [x] F1 odds successfully integrated and displaying in bet slip
- [x] Horse racing odds fetching working reliably
- [x] New sports data flowing into all relevant sheets
- [x] Bet slip interface supporting new sport types
- [x] Balance management system handling new sports

### **Overall Project Success**
- [x] Platform supports 6+ sports (current 4 + 2+ new)
- [x] Mobile interface is polished and responsive
- [x] Codebase is clean, commented, and maintainable
- [x] All betting logic works reliably across sports
- [x] API integration is robust with proper error handling

## Technical Stack

- **Backend**: Google Apps Script
- **Frontend**: HTML/CSS/JavaScript
- **Data Storage**: Google Sheets
- **APIs**: The Odds API, RapidAPI, custom scrapers
- **Platform**: Google Workspace (Sheets + Apps Script)

## Risk Mitigation

- **API Dependencies**: Research multiple API options for each sport
- **Data Consistency**: Ensure new sports follow existing data structure
- **UI Compatibility**: Test across multiple devices and browsers
- **Performance**: Monitor sheet performance with increased data volume

---

*This document outlines the roadmap for expanding our Google Apps Script betting platform from 4 sports to 6+ sports while improving overall functionality and user experience.* 