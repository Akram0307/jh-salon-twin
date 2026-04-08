import { http, HttpResponse } from 'msw';

/**
 * MSW Handlers for Client Booking Flow
 * Stubs /api/client/services, /api/client/availability, and /api/client/book
 */

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
        category: 'Haircuts',
      },
      {
        id: 'svc-002',
        name: "Women's Blowout",
        description: 'Wash, cut, and blow dry styling',
        duration_minutes: 45,
        price: 75.00,
        category: 'Haircuts',
      },
    ],
  },
  meta: { salon_id: 'test-salon', count: 2 },
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
      { time: '2026-04-06T14:30:00Z', staff_id: 'staff-1' },
    ],
    count: 3,
  },
};

const MOCK_EMPTY_SLOTS = {
  success: true,
  data: {
    date: '2026-12-25',
    service_id: 'svc-001',
    stylist_id: null,
    slots: [],
    count: 0,
  },
};

const MOCK_BOOKING_SUCCESS = {
  success: true,
  data: {
    booking_id: 'bk-msw-12345',
    confirmation: 'CONF-MSW-TEST',
  },
  meta: { message: 'Booking created successfully' },
};

const MOCK_BOOKING_CONFLICT = {
  success: false,
  error: 'SLOT_UNAVAILABLE',
  message: 'Time slot unavailable',
};

export const clientBookingHandlers = [
  // GET /api/client/services
  http.get('**/api/client/services', () => {
    return HttpResponse.json(MOCK_SERVICES);
  }),

  // GET /api/client/availability
  http.get('**/api/client/availability', ({ request }) => {
    const url = new URL(request.url);
    const dateParam = url.searchParams.get('date');
    
    if (dateParam === '2026-12-25') {
      return HttpResponse.json(MOCK_EMPTY_SLOTS);
    }
    return HttpResponse.json(MOCK_SLOTS);
  }),

  // POST /api/client/book
  http.post('**/api/client/book', () => {
    // Simulate random conflicts or default success
    // In real MSW usage we might return success by default and override in test if needed
    return HttpResponse.json(MOCK_BOOKING_SUCCESS, { status: 201 });
  }),
];
