export interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  specialties: string[];
  commission_rate: number;
  is_active: boolean;
  created_at: string;
}

export const staff: StaffMember[] = [
  {
    id: "staff-001",
    first_name: "Maria",
    last_name: "Gonzalez",
    email: "maria.gonzalez@salon.com",
    phone: "+1-555-0101",
    role: "Senior Stylist",
    specialties: ["Haircut", "Hair Coloring", "Blowout", "Updo", "Keratin Treatment"],
    commission_rate: 0.45,
    is_active: true,
    created_at: "2025-06-15T09:00:00Z",
  },
  {
    id: "staff-002",
    first_name: "James",
    last_name: "Carter",
    email: "james.carter@salon.com",
    phone: "+1-555-0102",
    role: "Stylist",
    specialties: ["Haircut", "Beard Trim", "Blowout"],
    commission_rate: 0.40,
    is_active: true,
    created_at: "2025-07-20T09:00:00Z",
  },
  {
    id: "staff-003",
    first_name: "Sophia",
    last_name: "Nguyen",
    email: "sophia.nguyen@salon.com",
    phone: "+1-555-0103",
    role: "Colorist",
    specialties: ["Hair Coloring", "Keratin Treatment", "Deep Conditioning"],
    commission_rate: 0.42,
    is_active: true,
    created_at: "2025-08-10T09:00:00Z",
  },
  {
    id: "staff-004",
    first_name: "Emily",
    last_name: "Rivera",
    email: "emily.rivera@salon.com",
    phone: "+1-555-0104",
    role: "Nail Technician",
    specialties: ["Manicure", "Pedicure", "Eyebrow Shaping"],
    commission_rate: 0.38,
    is_active: true,
    created_at: "2025-09-01T09:00:00Z",
  },
  {
    id: "staff-005",
    first_name: "Olivia",
    last_name: "Patel",
    email: "olivia.patel@salon.com",
    phone: "+1-555-0105",
    role: "Esthetician",
    specialties: ["Facial", "Eyebrow Shaping"],
    commission_rate: 0.40,
    is_active: true,
    created_at: "2025-09-15T09:00:00Z",
  },
  {
    id: "staff-006",
    first_name: "Daniel",
    last_name: "Kim",
    email: "daniel.kim@salon.com",
    phone: "+1-555-0106",
    role: "Massage Therapist",
    specialties: ["Massage"],
    commission_rate: 0.35,
    is_active: true,
    created_at: "2025-10-01T09:00:00Z",
  },
];
