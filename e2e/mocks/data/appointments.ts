import { services } from "./services";

export interface Appointment {
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
  created_at: string;
}

const svcMap = new Map(services.map((s) => [s.id, s]));

function svc(id: string) {
  const s = svcMap.get(id)!;
  return { id: s.id, name: s.name, price: s.price, duration: s.duration };
}

export const appointments: Appointment[] = [
  {
    id: "appt-001",
    client_id: "client-001",
    client_name: "Sarah Johnson",
    staff_id: "staff-001",
    staff_name: "Maria Gonzalez",
    appointment_time: "2026-03-18T09:00:00",
    end_time: "2026-03-18T09:30:00",
    status: "confirmed",
    services: [svc("svc-001")],
    created_at: "2026-03-17T14:00:00Z",
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
    services: [svc("svc-008")],
    created_at: "2026-03-17T15:00:00Z",
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
    services: [svc("svc-002")],
    created_at: "2026-03-17T16:00:00Z",
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
    services: [svc("svc-003")],
    notes: "Overlapping with appt-003 for same staff",
    created_at: "2026-03-17T17:00:00Z",
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
    services: [svc("svc-011")],
    created_at: "2026-03-17T18:00:00Z",
  },
  {
    id: "appt-006",
    client_id: "client-006",
    client_name: "Robert Taylor",
    staff_id: "staff-004",
    staff_name: "Emily Rivera",
    appointment_time: "2026-03-18T12:00:00",
    end_time: "2026-03-18T12:30:00",
    status: "confirmed",
    services: [svc("svc-004")],
    created_at: "2026-03-18T08:00:00Z",
  },
  {
    id: "appt-007",
    client_id: "client-007",
    client_name: "Amanda Anderson",
    staff_id: "staff-005",
    staff_name: "Olivia Patel",
    appointment_time: "2026-03-18T13:00:00",
    end_time: "2026-03-18T14:00:00",
    status: "confirmed",
    services: [svc("svc-006")],
    created_at: "2026-03-18T08:30:00Z",
  },
  {
    id: "appt-008",
    client_id: "client-008",
    client_name: "Christopher Thomas",
    staff_id: "staff-006",
    staff_name: "Daniel Kim",
    appointment_time: "2026-03-18T14:00:00",
    end_time: "2026-03-18T15:00:00",
    status: "in_progress",
    services: [svc("svc-007")],
    created_at: "2026-03-18T09:00:00Z",
  },
  {
    id: "appt-009",
    client_id: "client-009",
    client_name: "Nicole Jackson",
    staff_id: "staff-002",
    staff_name: "James Carter",
    appointment_time: "2026-03-18T15:00:00",
    end_time: "2026-03-18T15:30:00",
    status: "confirmed",
    services: [svc("svc-001")],
    created_at: "2026-03-18T10:00:00Z",
  },
  {
    id: "appt-010",
    client_id: "client-010",
    client_name: "Brandon White",
    staff_id: "staff-001",
    staff_name: "Maria Gonzalez",
    appointment_time: "2026-03-18T16:00:00",
    end_time: "2026-03-18T17:00:00",
    status: "pending",
    services: [svc("svc-010")],
    created_at: "2026-03-18T11:00:00Z",
  },
];
