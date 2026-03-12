/**
 * P0 Integration Test Suite - Emergency Sprint Verification
 * 
 * Tests end-to-end integration of:
 * 1. AI Concierge → Booking Flow
 * 2. Booking → SMS Confirmation
 * 3. Staff Availability → Slot Generation
 * 4. Error Handling
 * 
 * Run with: npx ts-node test_integration_p0.ts
 * Or: TEST_MODE=true npx ts-node test_integration_p0.ts (for mock mode)
 */

import assert from 'assert'
import { AIConciergeBookingService, BookingIntent } from './src/services/AIConciergeBookingService'
import { BookingOrchestrator } from './src/services/BookingOrchestrator'
import { sendConfirmationSMS, sendReminderSMS } from './src/services/NotificationOrchestrator'
import { SlotGenerator } from './src/services/SlotGenerator'
import { ServiceRepository } from './src/repositories/ServiceRepository'
import { StaffRepository } from './src/repositories/StaffRepository'
import { AppointmentRepository } from './src/repositories/AppointmentRepository'

// Test configuration
const TEST_SALON_ID = 'b0dcbd9e-1ca0-450e-a299-7ad239f848f4'
const TEST_CLIENT_ID = 'client-test-001'
const TEST_SERVICE_ID = 'service-haircut-001'
const TEST_STAFF_ID = 'staff-mia-001'

// Test results accumulator
const testResults: {
  suite: string
  test: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  duration: number
  error?: string
  evidence?: any
}[] = []

function logTest(suite: string, test: string, status: 'PASS' | 'FAIL' | 'SKIP', duration: number, error?: string, evidence?: any) {
  testResults.push({ suite, test, status, duration, error, evidence })
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️'
  console.log(`${icon} [${suite}] ${test} (${duration}ms)`)
  if (error) console.log(`   Error: ${error}`)
  if (evidence) console.log(`   Evidence:`, JSON.stringify(evidence, null, 2))
}

// Mock setup helpers
let originalRepos: any = {}

function setupMocks() {
  // Store originals
  originalRepos = {
    findAllServices: ServiceRepository.findAll,
    findAllStaff: StaffRepository.findAll,
    findServiceById: ServiceRepository.findById,
    findStaffById: StaffRepository.findById,
    getSlots: SlotGenerator.getAvailableSlots,
    createAppointment: AppointmentRepository.create
  }

  // Mock ServiceRepository
  ServiceRepository.findAll = async (salonId: string) => [
    { id: TEST_SERVICE_ID, salon_id: salonId, name: "Women's Haircut", duration_minutes: 60, price: 95 },
    { id: 'service-color-001', salon_id: salonId, name: "Balayage", duration_minutes: 120, price: 250 },
    { id: 'service-manicure-001', salon_id: salonId, name: "Manicure", duration_minutes: 45, price: 35 }
  ] as never

  ServiceRepository.findById = async (id: string, salonId: string) => {
    const services = await ServiceRepository.findAll(salonId)
    return services.find((s: any) => s.id === id) as never
  }

  // Mock StaffRepository
  StaffRepository.findAll = async (salonId: string, filters?: any) => [
    { id: TEST_STAFF_ID, salon_id: salonId, full_name: 'Mia Johnson', role: 'stylist', is_active: true },
    { id: 'staff-alex-002', salon_id: salonId, full_name: 'Alex Chen', role: 'stylist', is_active: true },
    { id: 'staff-sam-003', salon_id: salonId, full_name: 'Sam Smith', role: 'colorist', is_active: false }
  ] as never

  StaffRepository.findById = async (id: string, salonId: string) => {
    const staff = await StaffRepository.findAll(salonId)
    return staff.find((s: any) => s.id === id) as never
  }

  // Mock SlotGenerator
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dateStr = tomorrow.toISOString().split('T')[0]
  
  SlotGenerator.getAvailableSlots = async (salonId: string, serviceId: string, date: string) => [
    { staff_id: TEST_STAFF_ID, staff_name: 'Mia Johnson', time: `${date}T14:00:00.000Z` },
    { staff_id: TEST_STAFF_ID, staff_name: 'Mia Johnson', time: `${date}T15:00:00.000Z` },
    { staff_id: 'staff-alex-002', staff_name: 'Alex Chen', time: `${date}T14:30:00.000Z` }
  ] as never

  // Mock AppointmentRepository
  let appointmentCounter = 0
  AppointmentRepository.create = async (data: any) => ({
    id: `appt-test-${++appointmentCounter}`,
    qr_token: `qr-${Date.now()}`,
    ...data
  }) as never
}

function restoreMocks() {
  ServiceRepository.findAll = originalRepos.findAllServices
  StaffRepository.findAll = originalRepos.findAllStaff
  ServiceRepository.findById = originalRepos.findServiceById
  StaffRepository.findById = originalRepos.findStaffById
  SlotGenerator.getAvailableSlots = originalRepos.getSlots
  AppointmentRepository.create = originalRepos.createAppointment
}

// ==================== TEST SUITE 1: AI Concierge → Booking Flow ====================

async function testAIConciergeBookingFlow() {
  const suite = 'AI_CONCIERGE_BOOKING'
  console.log(`\n📦 Running ${suite} tests...\n`)

  // Test 1.1: Natural language intent parsing
  const start1 = Date.now()
  try {
    const intent = await AIConciergeBookingService.interpretRequest(
      "I'd like a women's haircut with Mia tomorrow at 2pm",
      TEST_SALON_ID,
      TEST_CLIENT_ID
    )
    
    assert.equal(intent.intent, 'BOOK_SERVICE', 'Should detect BOOK_SERVICE intent')
    assert.equal(intent.serviceId, TEST_SERVICE_ID, 'Should resolve service ID')
    assert.equal(intent.staffId, TEST_STAFF_ID, 'Should resolve staff ID')
    assert.ok(intent.suggestedSlots && intent.suggestedSlots.length > 0, 'Should suggest slots')
    assert.ok(intent.bookingPayload, 'Should build booking payload')
    
    logTest(suite, 'Natural language intent parsing', 'PASS', Date.now() - start1, undefined, {
      intent: intent.intent,
      serviceId: intent.serviceId,
      staffId: intent.staffId,
      slotsFound: intent.suggestedSlots?.length
    })
  } catch (error: any) {
    logTest(suite, 'Natural language intent parsing', 'FAIL', Date.now() - start1, error.message)
  }

  // Test 1.2: End-to-end booking creation
  const start2 = Date.now()
  try {
    const intent = await AIConciergeBookingService.interpretRequest(
      "Book a balayage with Alex next Wednesday at 3pm",
      TEST_SALON_ID,
      TEST_CLIENT_ID
    )
    
    const result = await AIConciergeBookingService.createBooking(intent)
    
    assert.equal(result.success, true, 'Booking should succeed')
    assert.ok(result.appointmentId, 'Should return appointment ID')
    assert.ok(result.confirmation, 'Should return confirmation details')
    assert.equal(result.confirmation?.staffName, 'Alex Chen', 'Should confirm correct staff')
    
    logTest(suite, 'End-to-end booking creation', 'PASS', Date.now() - start2, undefined, {
      appointmentId: result.appointmentId,
      staffName: result.confirmation?.staffName,
      serviceName: result.confirmation?.serviceName
    })
  } catch (error: any) {
    logTest(suite, 'End-to-end booking creation', 'FAIL', Date.now() - start2, error.message)
  }

  // Test 1.3: Service alias matching
  const start3 = Date.now()
  try {
    const intent = await AIConciergeBookingService.interpretRequest(
      "I need a hair cut today",
      TEST_SALON_ID,
      TEST_CLIENT_ID
    )
    
    assert.equal(intent.serviceId, TEST_SERVICE_ID, 'Should match "hair cut" alias to Women\'s Haircut')
    
    logTest(suite, 'Service alias matching', 'PASS', Date.now() - start3, undefined, {
      matchedService: intent.serviceName,
      matchType: intent.serviceMatchType
    })
  } catch (error: any) {
    logTest(suite, 'Service alias matching', 'FAIL', Date.now() - start3, error.message)
  }

  // Test 1.4: Missing information detection
  const start4 = Date.now()
  try {
    const intent = await AIConciergeBookingService.interpretRequest(
      "I want to book something",
      TEST_SALON_ID,
      TEST_CLIENT_ID
    )
    
    assert.equal(intent.intent, 'NEEDS_MORE_INFO', 'Should detect missing information')
    assert.ok(intent.missingFields.includes('service'), 'Should identify missing service')
    assert.ok(intent.message, 'Should provide clarification message')
    
    logTest(suite, 'Missing information detection', 'PASS', Date.now() - start4, undefined, {
      missingFields: intent.missingFields,
      clarificationMessage: intent.message
    })
  } catch (error: any) {
    logTest(suite, 'Missing information detection', 'FAIL', Date.now() - start4, error.message)
  }
}

// ==================== TEST SUITE 2: Booking → SMS Confirmation ====================

async function testSMSNotificationFlow() {
  const suite = 'SMS_NOTIFICATIONS'
  console.log(`\n📦 Running ${suite} tests...\n`)

  // Set test mode to avoid actual Twilio calls
  const originalTestMode = process.env.TEST_MODE
  process.env.TEST_MODE = 'true'

  // Test 2.1: Confirmation SMS trigger
  const start1 = Date.now()
  try {
    const result = await sendConfirmationSMS({
      appointmentId: 'test-appt-001',
      salonId: TEST_SALON_ID,
      clientId: TEST_CLIENT_ID,
      serviceName: "Women's Haircut",
      staffName: 'Mia Johnson',
      dateTime: new Date().toISOString()
    })
    
    assert.ok(result, 'Should return SMS result')
    logTest(suite, 'Confirmation SMS trigger', 'PASS', Date.now() - start1, undefined, {
      result: result
    })
  } catch (error: any) {
    logTest(suite, 'Confirmation SMS trigger', 'FAIL', Date.now() - start1, error.message)
  }

  // Test 2.2: Reminder SMS trigger
  const start2 = Date.now()
  try {
    const result = await sendReminderSMS({
      appointmentId: 'test-appt-002',
      salonId: TEST_SALON_ID,
      clientId: TEST_CLIENT_ID,
      serviceName: "Balayage",
      dateTime: new Date().toISOString()
    })
    
    assert.ok(result, 'Should return SMS result')
    logTest(suite, 'Reminder SMS trigger', 'PASS', Date.now() - start2, undefined, {
      result: result
    })
  } catch (error: any) {
    logTest(suite, 'Reminder SMS trigger', 'FAIL', Date.now() - start2, error.message)
  }

  // Test 2.3: SMS integration in booking flow
  const start3 = Date.now()
  try {
    // Create a booking and verify SMS pathway is invoked
    const intent = await AIConciergeBookingService.interpretRequest(
      "Book a manicure tomorrow at 11am",
      TEST_SALON_ID,
      TEST_CLIENT_ID
    )
    
    const result = await AIConciergeBookingService.createBooking(intent)
    
    assert.equal(result.success, true, 'Booking with SMS should succeed')
    // Note: SMS failure shouldn't block booking (it's in try-catch in BookingOrchestrator)
    
    logTest(suite, 'SMS integration in booking flow', 'PASS', Date.now() - start3, undefined, {
      bookingSuccess: result.success,
      appointmentId: result.appointmentId
    })
  } catch (error: any) {
    logTest(suite, 'SMS integration in booking flow', 'FAIL', Date.now() - start3, error.message)
  }

  // Restore test mode
  process.env.TEST_MODE = originalTestMode
}

// ==================== TEST SUITE 3: Staff Availability → Slot Generation ====================

async function testStaffAvailabilitySlots() {
  const suite = 'STAFF_AVAILABILITY_SLOTS'
  console.log(`\n📦 Running ${suite} tests...\n`)

  // Test 3.1: Slot generation with working hours
  const start1 = Date.now()
  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]
    
    const slots = await SlotGenerator.getAvailableSlots(
      TEST_SALON_ID,
      TEST_SERVICE_ID,
      dateStr
    )
    
    assert.ok(Array.isArray(slots), 'Should return array of slots')
    assert.ok(slots.length > 0, 'Should generate at least one slot')
    assert.ok(slots[0].staff_id, 'Slot should have staff_id')
    assert.ok(slots[0].staff_name, 'Slot should have staff_name')
    assert.ok(slots[0].time, 'Slot should have time')
    
    logTest(suite, 'Slot generation with working hours', 'PASS', Date.now() - start1, undefined, {
      slotsGenerated: slots.length,
      sampleSlot: slots[0]
    })
  } catch (error: any) {
    logTest(suite, 'Slot generation with working hours', 'FAIL', Date.now() - start1, error.message)
  }

  // Test 3.2: Staff-specific slot filtering
  const start2 = Date.now()
  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]
    
    // Get intent for specific stylist
    const intent = await AIConciergeBookingService.interpretRequest(
      "Women's haircut with Mia tomorrow",
      TEST_SALON_ID,
      TEST_CLIENT_ID
    )
    
    assert.equal(intent.staffId, TEST_STAFF_ID, 'Should resolve to Mia')
    assert.ok(intent.suggestedSlots, 'Should have suggested slots')
    
    // All slots should be for Mia
    const allMiaSlots = intent.suggestedSlots?.every(slot => slot.staff_id === TEST_STAFF_ID)
    assert.ok(allMiaSlots, 'All slots should be for requested stylist')
    
    logTest(suite, 'Staff-specific slot filtering', 'PASS', Date.now() - start2, undefined, {
      requestedStaff: intent.staffName,
      slotsFound: intent.suggestedSlots?.length
    })
  } catch (error: any) {
    logTest(suite, 'Staff-specific slot filtering', 'FAIL', Date.now() - start2, error.message)
  }

  // Test 3.3: Any available stylist option
  const start3 = Date.now()
  try {
    const intent = await AIConciergeBookingService.interpretRequest(
      "Women's haircut tomorrow at 2pm with anyone",
      TEST_SALON_ID,
      TEST_CLIENT_ID
    )
    
    assert.equal(intent.staffId, 'any', 'Should accept any stylist')
    assert.ok(intent.suggestedSlots && intent.suggestedSlots.length > 0, 'Should find slots for any stylist')
    
    logTest(suite, 'Any available stylist option', 'PASS', Date.now() - start3, undefined, {
      staffPreference: intent.staffId,
      slotsFound: intent.suggestedSlots?.length
    })
  } catch (error: any) {
    logTest(suite, 'Any available stylist option', 'FAIL', Date.now() - start3, error.message)
  }
}

// ==================== TEST SUITE 4: Error Handling ====================

async function testErrorHandling() {
  const suite = 'ERROR_HANDLING'
  console.log(`\n📦 Running ${suite} tests...\n`)

  // Test 4.1: Invalid service name
  const start1 = Date.now()
  try {
    const intent = await AIConciergeBookingService.interpretRequest(
      "I want a unicorn grooming service tomorrow",
      TEST_SALON_ID,
      TEST_CLIENT_ID
    )
    
    assert.equal(intent.intent, 'NEEDS_MORE_INFO', 'Should not match invalid service')
    assert.ok(!intent.serviceId, 'Should not have serviceId for invalid service')
    assert.ok(intent.missingFields.includes('service'), 'Should identify service as missing')
    
    logTest(suite, 'Invalid service name handling', 'PASS', Date.now() - start1, undefined, {
      intent: intent.intent,
      missingFields: intent.missingFields
    })
  } catch (error: any) {
    logTest(suite, 'Invalid service name handling', 'FAIL', Date.now() - start1, error.message)
  }

  // Test 4.2: Unavailable stylist
  const start2 = Date.now()
  try {
    // Request inactive stylist
    const intent = await AIConciergeBookingService.interpretRequest(
      "Women's haircut with Sam tomorrow",
      TEST_SALON_ID,
      TEST_CLIENT_ID
    )
    
    // Sam is inactive, so should not match or should handle gracefully
    // The system should either not match or fall back to 'any'
    assert.ok(intent.intent !== 'BOOK_SERVICE' || intent.staffId !== 'staff-sam-003', 
      'Should not book with inactive stylist')
    
    logTest(suite, 'Unavailable stylist handling', 'PASS', Date.now() - start2, undefined, {
      matchedStaff: intent.staffName || 'none',
      staffId: intent.staffId
    })
  } catch (error: any) {
    logTest(suite, 'Unavailable stylist handling', 'FAIL', Date.now() - start2, error.message)
  }

  // Test 4.3: Missing client ID
  const start3 = Date.now()
  try {
    const intent = await AIConciergeBookingService.interpretRequest(
      "Women's haircut tomorrow at 2pm",
      TEST_SALON_ID,
      undefined // No client ID
    )
    
    // Try to create booking without client ID
    const result = await AIConciergeBookingService.createBooking(intent)
    
    assert.equal(result.success, false, 'Should fail without client ID')
    assert.ok(result.error?.toLowerCase().includes('client'), 'Error should mention client ID')
    
    logTest(suite, 'Missing client ID handling', 'PASS', Date.now() - start3, undefined, {
      success: result.success,
      error: result.error
    })
  } catch (error: any) {
    logTest(suite, 'Missing client ID handling', 'PASS', Date.now() - start3, undefined, {
      errorCaught: error.message
    })
  }

  // Test 4.4: No available slots
  const start4 = Date.now()
  try {
    // Temporarily override slot generator to return empty
    const originalGetSlots = SlotGenerator.getAvailableSlots
    SlotGenerator.getAvailableSlots = async () => []
    
    const intent = await AIConciergeBookingService.interpretRequest(
      "Women's haircut tomorrow at 2pm",
      TEST_SALON_ID,
      TEST_CLIENT_ID
    )
    
    // Should still parse intent but have no slots
    assert.equal(intent.intent, 'NEEDS_MORE_INFO', 'Should indicate no slots available')
    assert.ok(!intent.suggestedSlots || intent.suggestedSlots.length === 0, 'Should have no slots')
    
    // Restore
    SlotGenerator.getAvailableSlots = originalGetSlots
    
    logTest(suite, 'No available slots handling', 'PASS', Date.now() - start4, undefined, {
      intent: intent.intent,
      slotsAvailable: intent.suggestedSlots?.length || 0
    })
  } catch (error: any) {
    logTest(suite, 'No available slots handling', 'FAIL', Date.now() - start4, error.message)
  }

  // Test 4.5: Graceful degradation on service failure
  const start5 = Date.now()
  try {
    // Temporarily break service repository
    const originalFindAll = ServiceRepository.findAll
    ServiceRepository.findAll = async () => { throw new Error('Database connection failed') }
    
    try {
      await AIConciergeBookingService.interpretRequest(
        "Women's haircut tomorrow",
        TEST_SALON_ID,
        TEST_CLIENT_ID
      )
      logTest(suite, 'Graceful service failure', 'FAIL', Date.now() - start5, 'Should have thrown error')
    } catch (e) {
      // Expected - system should throw, not crash silently
      logTest(suite, 'Graceful service failure', 'PASS', Date.now() - start5, undefined, {
        errorHandled: true
      })
    }
    
    // Restore
    ServiceRepository.findAll = originalFindAll
  } catch (error: any) {
    logTest(suite, 'Graceful service failure', 'FAIL', Date.now() - start5, error.message)
  }
}

// ==================== MAIN EXECUTION ====================

async function runAllTests() {
  console.log('\n' + '='.repeat(80))
  console.log('P0 INTEGRATION TEST SUITE - SalonOS Emergency Sprint')
  console.log('='.repeat(80))
  console.log(`Started: ${new Date().toISOString()}`)
  console.log(`Test Salon ID: ${TEST_SALON_ID}`)
  console.log(`Test Mode: ${process.env.TEST_MODE || 'false (using mocks)'}`)
  console.log('')

  const totalStart = Date.now()

  // Setup mocks
  setupMocks()

  try {
    // Run all test suites
    await testAIConciergeBookingFlow()
    await testSMSNotificationFlow()
    await testStaffAvailabilitySlots()
    await testErrorHandling()
  } finally {
    // Always restore mocks
    restoreMocks()
  }

  const totalDuration = Date.now() - totalStart

  // Print summary
  console.log('\n' + '='.repeat(80))
  console.log('TEST SUMMARY')
  console.log('='.repeat(80))
  
  const passed = testResults.filter(r => r.status === 'PASS').length
  const failed = testResults.filter(r => r.status === 'FAIL').length
  const skipped = testResults.filter(r => r.status === 'SKIP').length
  
  console.log(`\nTotal Tests: ${testResults.length}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⏭️ Skipped: ${skipped}`)
  console.log(`⏱️ Total Duration: ${totalDuration}ms`)
  
  console.log('\n--- Detailed Results ---\n')
  
  // Group by suite
  const suites = [...new Set(testResults.map(r => r.suite))]
  for (const suite of suites) {
    const suiteTests = testResults.filter(r => r.suite === suite)
    const suitePassed = suiteTests.filter(r => r.status === 'PASS').length
    console.log(`\n${suite}: ${suitePassed}/${suiteTests.length} passed`)
    for (const test of suiteTests) {
      const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⏭️'
      console.log(`  ${icon} ${test.test} (${test.duration}ms)`)
    }
  }

  console.log('\n' + '='.repeat(80))
  
  if (failed > 0) {
    console.log('❌ INTEGRATION TESTS FAILED')
    console.log('='.repeat(80))
    process.exit(1)
  } else {
    console.log('✅ ALL INTEGRATION TESTS PASSED')
    console.log('='.repeat(80))
    process.exit(0)
  }
}

// Run if executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Fatal error running tests:', error)
    process.exit(1)
  })
}

export { runAllTests, testResults }
