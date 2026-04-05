/**
 * E2E Test Data Seed Script
 * Uses fetch() to call the mock server (port 3100) to create
 * test appointments, clients, and services for E2E tests.
 *
 * Import and call from test setup or individual tests:
 *   import { seedClients, seedAppointments, seedServices, seedAll } from '../helpers/seed-data';
 *   await seedAll();
 */

const MOCK_API_BASE = process.env.MOCK_API_URL || "http://localhost:3100";

// ============================================
// Types (matching e2e/mocks/data/ shapes)
// ============================================

interface ClientInput {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

interface ServiceInput {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
  is_active: boolean;
}

interface AppointmentInput {
  id: string;
  client_id: string;
  client_name: string;
  staff_id: string;
  staff_name: string;
  appointment_time: string;
  end_time: string;
  status: string;
  services: { id: string; name: string; price: number; duration: number }[];
  notes?: string;
}

interface SeedResult {
  success: boolean;
  count: number;
  errors: string[];
}

// ============================================
// Seed Data (from e2e/mocks/data/)
// ============================================

const CLIENTS: ClientInput[] = [
  { id: "client-001", first_name: "Sarah", last_name: "Johnson", email: "sarah.johnson@email.com", phone: "+1-555-1001" },
  { id: "client-002", first_name: "Michael", last_name: "Chen", email: "michael.chen@email.com", phone: "+1-555-1002" },
  { id: "client-003", first_name: "Jessica", last_name: "Williams", email: "jessica.w@email.com", phone: "+1-555-1003" },
  { id: "client-004", first_name: "David", last_name: "Martinez", email: "david.m@email.com", phone: "+1-555-1004" },
  { id: "client-005", first_name: "Ashley", last_name: "Brown", email: "ashley.b@email.com", phone: "+1-555-1005" },
];

const SERVICES: ServiceInput[] = [
  { id: "svc-001", name: "Haircut", category: "Hair", price: 35, duration: 30, is_active: true },
  { id: "svc-002", name: "Hair Coloring", category: "Hair", price: 120, duration: 120, is_active: true },
  { id: "svc-003", name: "Blowout", category: "Hair", price: 45, duration: 45, is_active: true },
  { id: "svc-004", name: "Manicure", category: "Nails", price: 30, duration: 30, is_active: true },
  { id: "svc-005", name: "Pedicure", category: "Nails", price: 50, duration: 45, is_active: true },
  { id: "svc-006", name: "Facial", category: "Skin", price: 85, duration: 60, is_active: true },
];

const APPOINTMENTS: AppointmentInput[] = [
  {
    id: "appt-001",
    client_id: "client-001",
    client_name: "Sarah Johnson",
    staff_id: "staff-001",
    staff_name: "Maria Gonzalez",
    appointment_time: "2026-03-18T09:00:00",
    end_time: "2026-03-18T09:30:00",
    status: "confirmed",
    services: [{ id: "svc-001", name: "Haircut", price: 35, duration: 30 }],
  },
  {
    id: "appt-002",
    client_id: "client-002",
    client_name: "Michael Chen",
    staff_id: "staff-002",
    staff_name: "James Carter",
    appointment_time: "2026-03-18T09:00:00",
    end_time: "2026-03-18T09:15:00",
    status: "confirmed",
    services: [{ id: "svc-008", name: "Beard Trim", price: 25, duration: 15 }],
  },
  {
    id: "appt-003",
    client_id: "client-003",
    client_name: "Jessica Williams",
    staff_id: "staff-001",
    staff_name: "Maria Gonzalez",
    appointment_time: "2026-03-18T10:00:00",
    end_time: "2026-03-18T11:00:00",
    status: "confirmed",
    services: [{ id: "svc-002", name: "Hair Coloring", price: 120, duration: 120 }],
  },
  {
    id: "appt-004",
    client_id: "client-004",
    client_name: "David Martinez",
    staff_id: "staff-001",
    staff_name: "Maria Gonzalez",
    appointment_time: "2026-03-18T10:30:00",
    end_time: "2026-03-18T11:30:00",
    status: "confirmed",
    services: [{ id: "svc-003", name: "Blowout", price: 45, duration: 45 }],
    notes: "Overlapping with appt-003 for same staff",
  },
  {
    id: "appt-005",
    client_id: "client-005",
    client_name: "Ashley Brown",
    staff_id: "staff-003",
    staff_name: "Sophia Nguyen",
    appointment_time: "2026-03-18T11:00:00",
    end_time: "2026-03-18T12:30:00",
    status: "confirmed",
    services: [{ id: "svc-011", name: "Keratin Treatment", price: 150, duration: 90 }],
  },
];

// ============================================
// Seed Functions
// ============================================

/**
 * Seed clients into the mock server via POST /api/clients.
 */
export async function seedClients(): Promise<SeedResult> {
  const errors: string[] = [];
  let count = 0;

  for (const client of CLIENTS) {
    try {
      const res = await fetch(`${MOCK_API_BASE}/api/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(client),
      });
      if (res.ok || res.status === 409) {
        count++;
      } else {
        errors.push(`Client ${client.id}: ${res.status} ${res.statusText}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Client ${client.id}: ${msg}`);
    }
  }

  return { success: errors.length === 0, count, errors };
}

/**
 * Seed services into the mock server via POST /api/services.
 */
export async function seedServices(): Promise<SeedResult> {
  const errors: string[] = [];
  let count = 0;

  for (const service of SERVICES) {
    try {
      const res = await fetch(`${MOCK_API_BASE}/api/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(service),
      });
      if (res.ok || res.status === 409) {
        count++;
      } else {
        errors.push(`Service ${service.id}: ${res.status} ${res.statusText}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Service ${service.id}: ${msg}`);
    }
  }

  return { success: errors.length === 0, count, errors };
}

/**
 * Seed appointments into the mock server via POST /api/appointments.
 */
export async function seedAppointments(): Promise<SeedResult> {
  const errors: string[] = [];
  let count = 0;

  for (const appointment of APPOINTMENTS) {
    try {
      const res = await fetch(`${MOCK_API_BASE}/api/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointment),
      });
      if (res.ok || res.status === 409) {
        count++;
      } else {
        errors.push(`Appointment ${appointment.id}: ${res.status} ${res.statusText}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Appointment ${appointment.id}: ${msg}`);
    }
  }

  return { success: errors.length === 0, count, errors };
}

/**
 * Seed all test data (services, clients, appointments) in dependency order.
 */
export async function seedAll(): Promise<Record<string, SeedResult>> {
  const servicesResult = await seedServices();
  const clientsResult = await seedClients();
  const appointmentsResult = await seedAppointments();

  return {
    services: servicesResult,
    clients: clientsResult,
    appointments: appointmentsResult,
  };
}

/**
 * Verify the mock server is reachable.
 */
export async function checkMockServerHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${MOCK_API_BASE}/api/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}
