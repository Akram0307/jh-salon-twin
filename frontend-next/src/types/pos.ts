// POS TypeScript interfaces

export interface Service {
  id: string;
  name: string;
  price: number;
  category?: string;
  duration?: number;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category?: string;
  description?: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  type: 'service' | 'product';
  quantity?: number;
}

export interface Client {
  id: string;
  name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
}

export interface Staff {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

export type PaymentMethod = 'cash' | 'card' | 'split';

export interface TipOption {
  percentage: number;
  amount: number;
}

export interface Transaction {
  id?: string;
  items: CartItem[];
  subtotal: number;
  tip: number;
  total: number;
  payment_method: PaymentMethod;
  client_id?: string;
  staff_id?: string;
  created_at?: string;
  status?: 'draft' | 'completed' | 'cancelled';
}

export interface POSState {
  cart: CartItem[];
  client: Client | null;
  staff: Staff | null;
  paymentMethod: PaymentMethod;
  tip: number;
  subtotal: number;
  total: number;
}

export interface POSApi {
  createDraft: (data: Partial<Transaction>) => Promise<Transaction>;
  completeTransaction: (data: Transaction) => Promise<Transaction>;
  getRecentTransactions: () => Promise<Transaction[]>;
  getServices: () => Promise<Service[]>;
  getProducts: () => Promise<Product[]>;
  getClients: () => Promise<Client[]>;
  getStaff: () => Promise<Staff[]>;
}
