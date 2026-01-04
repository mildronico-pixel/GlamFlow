
import { Service, Staff, Appointment, AppointmentStatus } from './types';

export const SERVICES: Service[] = [
  {
    id: 's1',
    name: 'Signature Haircut',
    duration: 45,
    price: 850,
    category: 'Hair',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 's2',
    name: 'Deep Tissue Massage',
    duration: 60,
    price: 1200,
    category: 'Spa',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 's3',
    name: 'Facial Rejuvenation',
    duration: 50,
    price: 1500,
    category: 'Skincare',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 's4',
    name: 'Luxury Manicure',
    duration: 30,
    price: 600,
    category: 'Nails',
    image: 'https://images.unsplash.com/photo-1604654894610-df4906821603?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 's5',
    name: 'Balayage & Color',
    duration: 180,
    price: 4500,
    category: 'Hair',
    image: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 's6',
    name: 'Lash Extension',
    duration: 90,
    price: 1800,
    category: 'Skincare',
    image: 'https://images.unsplash.com/photo-1583001931036-6433ff85503d?auto=format&fit=crop&q=80&w=400'
  }
];

export const SERVICE_ADDONS = [
  { id: 'a1', name: 'Aromatherapy Oil', price: 250, icon: '🌿' },
  { id: 'a2', name: 'Scalp Detox Scrub', price: 400, icon: '💆' },
  { id: 'a3', name: 'Paraffin Wax Treatment', price: 350, icon: '✨' },
  { id: 'a4', name: 'Collagen Eye Mask', price: 300, icon: '👁️' }
];

export const GALLERY_ITEMS = [
  { before: "https://images.unsplash.com/photo-1595476108010-b4d1f8c2b1b1?auto=format&fit=crop&q=80&w=400", after: "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&q=80&w=400", type: "Hair Color" },
  { before: "https://images.unsplash.com/photo-1512496011212-62b24b8bc71f?auto=format&fit=crop&q=80&w=400", after: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=80&w=400", type: "Facial" },
];

export const BLOG_POSTS = [
  {
    id: 1,
    title: "5 Tips for Long-Lasting Hair Color",
    excerpt: "Discover the secrets to keeping your balayage vibrant for months.",
    image: "https://images.unsplash.com/photo-1527799822367-a233b47b0ee6?auto=format&fit=crop&q=80&w=400",
    date: "Oct 24, 2024"
  },
  {
    id: 2,
    title: "Skincare Routine for Manila Humidity",
    excerpt: "How to stay glowing without the unwanted shine in our tropical weather.",
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=400",
    date: "Oct 20, 2024"
  },
  {
    id: 3,
    title: "The Benefits of Regular Scalp Massage",
    excerpt: "It's not just relaxing—it's essential for hair health and growth.",
    image: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&q=80&w=400",
    date: "Oct 15, 2024"
  }
];

export const FAQS = [
  { q: "Do you accept walk-ins?", a: "While we prioritize booked appointments, we accept walk-ins depending on expert availability." },
  { q: "What is your cancellation policy?", a: "Cancellations must be made at least 24 hours before the appointment to avoid a 20% convenience fee." },
  { q: "Are your products cruelty-free?", a: "Yes! We only use premium, organic, and cruelty-free products for all our treatments." },
  { q: "Can I choose my specific stylist?", a: "Absolutely! You can select your preferred expert during the booking process." }
];

export const STAFF: Staff[] = [
  { id: 'st1', name: 'Maria Santos', role: 'Senior Stylist', rating: 4.9, avatar: 'https://i.pravatar.cc/150?u=maria' },
  { id: 'st2', name: 'James Wilson', role: 'Massage Therapist', rating: 4.8, avatar: 'https://i.pravatar.cc/150?u=james' },
  { id: 'st3', name: 'Elena Cruz', role: 'Skincare Specialist', rating: 5.0, avatar: 'https://i.pravatar.cc/150?u=elena' }
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'app-001',
    clientName: 'Ana Reyes',
    clientEmail: 'ana@example.com',
    clientPhone: '09171234567',
    serviceId: 's1',
    staffId: 'st1',
    date: '2024-05-20',
    time: '10:00 AM',
    status: AppointmentStatus.CONFIRMED,
    paymentMethod: 'GCASH',
    totalAmount: 850,
    createdAt: new Date().toISOString()
  }
];
