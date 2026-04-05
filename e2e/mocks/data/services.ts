export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
  is_active: boolean;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
}

export const services: Service[] = [
  { id: "svc-001", name: "Haircut", category: "Hair", price: 35, duration: 30, is_active: true },
  { id: "svc-002", name: "Hair Coloring", category: "Hair", price: 120, duration: 120, is_active: true },
  { id: "svc-003", name: "Blowout", category: "Hair", price: 45, duration: 45, is_active: true },
  { id: "svc-004", name: "Manicure", category: "Nails", price: 30, duration: 30, is_active: true },
  { id: "svc-005", name: "Pedicure", category: "Nails", price: 50, duration: 45, is_active: true },
  { id: "svc-006", name: "Facial", category: "Skin", price: 85, duration: 60, is_active: true },
  { id: "svc-007", name: "Massage", category: "Body", price: 100, duration: 60, is_active: true },
  { id: "svc-008", name: "Beard Trim", category: "Hair", price: 25, duration: 15, is_active: true },
  { id: "svc-009", name: "Deep Conditioning", category: "Hair", price: 55, duration: 30, is_active: true },
  { id: "svc-010", name: "Updo", category: "Hair", price: 90, duration: 60, is_active: true },
  { id: "svc-011", name: "Keratin Treatment", category: "Hair", price: 150, duration: 90, is_active: true },
  { id: "svc-012", name: "Eyebrow Shaping", category: "Nails", price: 25, duration: 15, is_active: true },
];

export const serviceCategories: ServiceCategory[] = [
  { id: "cat-hair", name: "Hair", description: "Hair cutting, coloring, and styling services" },
  { id: "cat-nails", name: "Nails", description: "Manicure, pedicure, and nail art" },
  { id: "cat-skin", name: "Skin", description: "Facial treatments and skincare" },
  { id: "cat-body", name: "Body", description: "Massage and body treatments" },
];
