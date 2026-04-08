import { test, expect, devices } from '@playwright/test';

/**
 * Client PWA Booking Flow E2E Tests
 * Validates: Service Selection -> Time Slot Picking -> Booking Confirmation
 * Tech: Playwright with inline API route interception (no external MSW required)
 */

// ==========================================
// Mock Data Fixtures
// ==========================================

const MOCK_SERVICES = {
  success: true,
  data: {
    Haircuts: [
      {
        id: 'svc-001',
        name: "Men's Classic Cut",
        description: 'Standard haircut with wash and style',
        duration_minutes: 30,
        price: 45.00,
        category: 'Haircuts'
      },
      {
        id: 'svc-002',
        name: "Women's Blowout",
        description: 'Wash, cut, and blow dry styling',
        duration_minutes: 45,
        price: 75.00,
        category: 'Haircuts'
      }
    ]
  },
  meta: { salon_id: 'test-salon', count: 2 }
};

const MOCK_SLOTS = {
  success: true,
  data: {
    date: '2026-04-06',
    service_id: 'svc-001',
    stylist_id: null,
    slots: [
      { time: '2026-04-06T09:00:00Z', staff_id: 'staff-1' },
      { time: '2026-04-06T10:00:00Z', staff_id: 'staff-2' },
      { time: '2026-04-06T14:30:00Z', staff_id: 'staff-1' }
    ],
    count: 3
  }
};

const MOCK_EMPTY_SLOTS = {
  success: true,
  data: {
    date: '2026-12-25',
    service_id: 'svc-001',
    stylist_id: null,
    slots: [],
    count: 0
  }
};

// ==========================================
// Test Suite
// ==========================================

test.describe('Client PWA Booking Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Intercept GET /api/client/services
    await page.route('/api/client/services*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SERVICES)
      });
    });

    // Intercept GET /api/client/availability
    await page.route('/api/client/availability*', async route => {
      // Check if specific date is requested to return empty slots
      if (route.request().url().includes('date=2026-12-25')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_EMPTY_SLOTS)
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_SLOTS)
        });
      }
    });
  });

  test('TC1: Happy Path - Select Service -> Pick Time -> Confirm Booking', async ({ page }) => {
    // Intercept POST /api/client/book for success
    await page.route('/api/client/book', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            booking_id: 'bk-12345',
            confirmation: 'CONF-ABCDE'
          },
          meta: { message: 'Booking created successfully' }
        })
      });
    });

    await page.goto('/client/booking');

    // Step 1: Verify & Select Service
    await expect(page.getByRole('heading', { name: 'Select a Service' })).toBeVisible();
    await page.getByRole('button', { name: /Men's Classic Cut/i }).click();

    // Step 2: Verify & Select Time Slot
    await expect(page.getByRole('heading', { name: 'Available Time Slots' })).toBeVisible();
    await expect(page.getByRole('button', { name: '09:00 AM' })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: '09:00 AM' }).click();

    // Step 3: Verify Confirmation
    await expect(page.locator('h2', { hasText: 'Booking Confirmed!' })).toBeVisible();
    await expect(page.getByText('You have successfully booked your appointment.')).toBeVisible();
  });

  test('TC2: Error Handling - Booking fails gracefully with 409 Conflict', async ({ page }) => {
    let dialogMessage = '';
    page.on('dialog', async dialog => {
      dialogMessage = dialog.message();
      await dialog.accept();
    });

    // Intercept POST /api/client/book for failure
    await page.route('/api/client/book', async route => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'SLOT_UNAVAILABLE',
          message: 'Time slot unavailable'
        })
      });
    });

    await page.goto('/client/booking');

    // Execute booking flow
    await page.getByRole('button', { name: /Men's Classic Cut/i }).click();
    await expect(page.getByRole('button', { name: '09:00 AM' })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: '09:00 AM' }).click();

    // Verify error handling via alert
    await expect(() => {
      expect(dialogMessage).toContain('Failed to book');
    }).toPass({ timeout: 5000 });

    // Ensure user remains on time selection step (not navigated away)
    await expect(page.getByRole('heading', { name: 'Available Time Slots' })).toBeVisible();
  });

  test('TC3: Empty State - No slots available for selected date', async ({ page }) => {
    await page.goto('/client/booking');

    // Select Service
    await page.getByRole('button', { name: /Men's Classic Cut/i }).click();
    await expect(page.getByRole('heading', { name: 'Available Time Slots' })).toBeVisible();

    // Change date to one that returns empty slots
    await page.locator('input[type="date"]').fill('2026-12-25');
    await page.locator('input[type="date"]').dispatchEvent('change');

    // Verify empty state message
    await expect(page.getByText('No slots available for this date.')).toBeVisible({ timeout: 5000 });
  });

  test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('TC4: Booking flow adapts to iPhone 14 viewport', async ({ page }) => {
      await page.route('/api/client/book', async route => {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { booking_id: 'mob-1', confirmation: 'MOB-TEST' },
            meta: { message: 'OK' }
          })
        });
      });

      await page.goto('/client/booking');

      // Verify layout elements are visible and tappable on mobile
      await expect(page.getByRole('heading', { name: 'Select a Service' })).toBeVisible();
      
      const serviceBtn = page.getByRole('button', { name: /Men's Classic Cut/i });
      await expect(serviceBtn).toBeVisible();
      await serviceBtn.click();

      await expect(page.getByRole('heading', { name: 'Available Time Slots' })).toBeVisible();
      await expect(page.getByRole('button', { name: '09:00 AM' })).toBeVisible({ timeout: 5000 });
      
      // Verify date input is accessible
      const dateInput = page.locator('input[type="date"]');
      await expect(dateInput).toBeVisible();
      
      // Verify touch targets are reasonably sized (Playwright checks visibility, but we can check bounding box)
      const box = await serviceBtn.boundingBox();
      expect(box?.height).toBeGreaterThan(30); // Minimum comfortable touch target
    });
  });
});
