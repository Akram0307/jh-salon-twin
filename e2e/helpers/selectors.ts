export const login = {
  emailInput: '#email',
  passwordInput: '#password',
  submitButton: 'button:has-text("Sign in")',
  heading: 'text=Welcome back',
  emailError: 'text=/please enter.*email|invalid email/i',
  passwordError: 'text=/password must|too short/i',
};

export const dashboard = {
  heading: 'h1:has-text("Dashboard")',
  kpiCards: {
    todayRevenue: 'text=Today\'s Revenue',
    todayBookings: 'text=Today\'s Bookings',
    activeClients: 'text=Active Clients',
    staffUtilization: 'text=Staff Utilization',
  },
  scheduleSection: 'h3:has-text("Today\'s Schedule")',
  alertsSection: 'h3:has-text("Alerts")',
  quickActions: 'text=Quick Actions',
  weeklyRevenue: 'text=Weekly Revenue',
};

export const sidebar = {
  navLinks: {
    dashboard: 'nav a:has-text("Dashboard")',
    schedule: 'nav a:has-text("Schedule")',
    clients: 'nav a:has-text("Clients")',
    staff: 'nav a:has-text("Staff")',
    services: 'nav a:has-text("Services")',
    reports: 'nav a:has-text("Reports")',
    settings: 'nav a:has-text("Settings")',
  },
};

export const pos = {
  clientSelector: 'text=/client|customer/i',
  staffSelector: 'text=/staff|stylist|select staff/i',
  serviceSelection: 'text=/service|treatment/i',
  cart: 'text=/cart|order|basket/i',
  paymentSection: 'text=/payment|pay|checkout/i',
};

export const clientChat = {
  chatInterface: '[class*="chat"], [role="log"]',
  greetingMessage: 'text=/hi|hello|welcome/i',
  quickReplyBook: 'button:has-text("Book an appointment")',
  quickReplyServices: 'button:has-text("View services")',
  quickReplyHours: 'button:has-text("Opening hours")',
  chatInput: 'input[type="text"], textarea',
  sendButton: 'button:has-text("Send")',
};
