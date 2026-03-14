// Integration test for Smart Slot Suggestions Enhancement
console.log('\n=== Smart Slot Suggestions Enhancement - Integration Test ===\n');

// Test 1: Check compiled files exist
const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, 'dist/services');
const requiredFiles = [
  'ClientHistoryAnalyzer.js',
  'GapFillOptimizer.js', 
  'SmartSlotRanker.js',
  'ABTestingService.js',
  'MetricsCollector.js',
  'SlotGenerator.js'
];

console.log('1. Checking compiled service files:');
let allFilesExist = true;
for (const file of requiredFiles) {
  const exists = fs.existsSync(path.join(servicesDir, file));
  console.log(`   ${file}: ${exists ? '✓' : '✗'}`);
  if (!exists) allFilesExist = false;
}

// Test 2: Check migration file exists
console.log('\n2. Checking migration file:');
const migrationFile = path.join(__dirname, '../db/migrations/20260314_smart_slot_suggestions.sql');
const migrationExists = fs.existsSync(migrationFile);
console.log(`   20260314_smart_slot_suggestions.sql: ${migrationExists ? '✓' : '✗'}`);

// Test 3: Import and verify services
console.log('\n3. Verifying service exports:');
try {
  const { ClientHistoryAnalyzer } = require('./dist/services/ClientHistoryAnalyzer');
  console.log('   ClientHistoryAnalyzer: ✓');
  console.log('     - getClientPreferences:', typeof ClientHistoryAnalyzer.getClientPreferences === 'function' ? '✓' : '✗');
  console.log('     - calculateRebookingInterval:', typeof ClientHistoryAnalyzer.calculateRebookingInterval === 'function' ? '✓' : '✗');
  console.log('     - getClientPreferenceScore:', typeof ClientHistoryAnalyzer.getClientPreferenceScore === 'function' ? '✓' : '✗');
} catch (e) {
  console.log('   ClientHistoryAnalyzer: ✗', e.message);
}

try {
  const { GapFillOptimizer } = require('./dist/services/GapFillOptimizer');
  console.log('   GapFillOptimizer: ✓');
  console.log('     - identifyScheduleGaps:', typeof GapFillOptimizer.identifyScheduleGaps === 'function' ? '✓' : '✗');
  console.log('     - calculateGapFillScore:', typeof GapFillOptimizer.calculateGapFillScore === 'function' ? '✓' : '✗');
  console.log('     - prioritizeGapFillingSlots:', typeof GapFillOptimizer.prioritizeGapFillingSlots === 'function' ? '✓' : '✗');
} catch (e) {
  console.log('   GapFillOptimizer: ✗', e.message);
}

try {
  const { SmartSlotRanker } = require('./dist/services/SmartSlotRanker');
  console.log('   SmartSlotRanker: ✓');
  console.log('     - rankSlots:', typeof SmartSlotRanker.rankSlots === 'function' ? '✓' : '✗');
  console.log('     - calculateClientPreferenceScore:', typeof SmartSlotRanker.calculateClientPreferenceScore === 'function' ? '✓' : '✗');
  console.log('     - calculateScheduleOptimizationScore:', typeof SmartSlotRanker.calculateScheduleOptimizationScore === 'function' ? '✓' : '✗');
} catch (e) {
  console.log('   SmartSlotRanker: ✗', e.message);
}

try {
  const { ABTestingService } = require('./dist/services/ABTestingService');
  console.log('   ABTestingService: ✓');
  console.log('     - createExperiment:', typeof ABTestingService.createExperiment === 'function' ? '✓' : '✗');
  console.log('     - getAlgorithmForRequest:', typeof ABTestingService.getAlgorithmForRequest === 'function' ? '✓' : '✗');
  console.log('     - logSuggestionEvent:', typeof ABTestingService.logSuggestionEvent === 'function' ? '✓' : '✗');
} catch (e) {
  console.log('   ABTestingService: ✗', e.message);
}

try {
  const { MetricsCollector } = require('./dist/services/MetricsCollector');
  console.log('   MetricsCollector: ✓');
  console.log('     - logSuggestion:', typeof MetricsCollector.logSuggestion === 'function' ? '✓' : '✗');
  console.log('     - logAcceptance:', typeof MetricsCollector.logAcceptance === 'function' ? '✓' : '✗');
  console.log('     - generateAnalyticsReport:', typeof MetricsCollector.generateAnalyticsReport === 'function' ? '✓' : '✗');
} catch (e) {
  console.log('   MetricsCollector: ✗', e.message);
}

try {
  const { SlotGenerator } = require('./dist/services/SlotGenerator');
  console.log('   SlotGenerator (updated): ✓');
  console.log('     - getAvailableSlots:', typeof SlotGenerator.getAvailableSlots === 'function' ? '✓' : '✗');
  console.log('     - getRankedSlots:', typeof SlotGenerator.getRankedSlots === 'function' ? '✓' : '✗');
  console.log('     - getTopRankedSlots:', typeof SlotGenerator.getTopRankedSlots === 'function' ? '✓' : '✗');
  console.log('     - getBestSlot:', typeof SlotGenerator.getBestSlot === 'function' ? '✓' : '✗');
} catch (e) {
  console.log('   SlotGenerator: ✗', e.message);
}

console.log('\n=== Test Summary ===');
console.log(`All compiled files exist: ${allFilesExist ? '✓' : '✗'}`);
console.log(`Migration file exists: ${migrationExists ? '✓' : '✗'}`);
console.log('\n=== Integration Test Complete ===\n');
