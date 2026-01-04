
export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  RESCHEDULED = 'RESCHEDULED',
  CANCELLED = 'CANCELLED'
}

export interface Service {
  id: string;
  name: string;
  duration: number; // in minutes
  price: number;
  category: string;
  image: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  rating: number;
  avatar: string;
}

export interface Appointment {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceId: string;
  staffId: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  paymentMethod: 'GCASH' | 'BANK_TRANSFER' | 'CASH';
  referenceCode?: string;
  paymentProof?: string; // base64 string
  totalAmount: number;
  createdAt: string;
  notified?: boolean;
}

export interface SiteSettings {
  siteName: string;
  heroTitle: string;
  heroSubtitle: string;
  aboutTitle: string;
  aboutContent: string;
  footerText: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string; // Business WhatsApp
  bookingButtonText: string;
  footerTreatments: string; // Newline separated
  footerBookings: string;   // Newline separated
  gcashQr?: string; 
  bankQr?: string;  
  gcashName?: string;
  bankName?: string;
  adminUsername?: string;
  adminPassword?: string;
}

export interface DashboardStats {
  totalBookings: number;
  revenue: number;
  pendingActions: number;
  customerSatisfaction: number;
}
