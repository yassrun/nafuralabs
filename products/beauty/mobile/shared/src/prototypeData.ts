/* Salon Types */
export type ServiceCategory = 'coiffure' | 'esthetique' | 'ongles' | 'hammam' | 'barbier'

export interface Service {
  id: string
  name: string
  category: ServiceCategory
  description: string
  duration: number // in minutes
  minBookingMinutes: number
  price: number
  image?: string
}

export interface ServiceTemplate {
  id: string
  name: string
  category: ServiceCategory
  description: string
  defaultDuration: number
  minBookingMinutes: number
  defaultPrice: number
}

export interface Staff {
  id: string
  name: string
  specialties: ServiceCategory[]
  bio?: string
  rating: number
  image?: string
}

export interface Salon {
  id: string
  name: string
  description: string
  image: string
  address: string
  city: string
  coordinates: { lat: number; lng: number }
  distanceKm?: number
  startingPrice?: number
  nextAvailable?: string
  rating: number
  reviewCount: number
  phone: string
  email: string
  website?: string
  openingHours: {
    [key: string]: { open: string; close: string }
  }
  categories: ServiceCategory[]
  services: Service[]
  staff: Staff[]
  loyaltyProgram?: {
    name: string
    pointsPerDirham: number
    rewardThreshold: number
  }
}

export interface TimeSlot {
  time: string
  available: boolean
  staffId?: string
}

export interface Booking {
  id: string
  bookingRef: string
  salonId: string
  salonName: string
  serviceId: string
  serviceName: string
  staffId?: string
  staffName?: string
  date: string
  time: string
  duration: number
  totalPrice: number
  status: 'confirmed' | 'completed' | 'cancelled' | 'no-show'
  customerName: string
  customerPhone: string
  customerEmail: string
  notes?: string
  createdAt: string
}

export interface SalonReview {
  id: string
  salonId: string
  rating: number
  title: string
  comment: string
  authorName: string
  createdAt: string
  verified: boolean
}

export interface CustomerProfile {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  loyaltyPoints: number
  favoriteServices: ServiceCategory[]
  bookingHistory: Booking[]
  reviews: SalonReview[]
}

export interface SalonOwnerProfile {
  id: string
  name: string
  email: string
  phone: string
  salonIds: string[]
  role: 'owner' | 'admin' | 'staff'
}

export interface AdminTenant {
  id: string
  name: string
  city: string
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING'
  slug: string
}

export interface ManagerCustomer {
  id: string
  name: string
  phone: string
  email: string
  visits: number
  loyaltyPoints: number
  lastVisit?: string
}

export interface LoyaltyTransaction {
  id: string
  label: string
  points: number
  date: string
}

export interface AgendaSlot {
  id: string
  time: string
  customerName: string
  serviceName: string
  staffName: string
  status: 'confirmed' | 'pending' | 'completed'
}

/* Mock Data */
export const allSalons: Salon[] = [
  {
    id: 'salon-01',
    name: 'Silhouette Beauty',
    description: 'Salon haut de gamme spécialisé en coiffure et esthétique',
    image: 'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=500',
    address: '123 Rue Mohammed V',
    city: 'Casablanca',
    coordinates: { lat: 33.5731, lng: -7.5898 },
    distanceKm: 1.4,
    startingPrice: 150,
    nextAvailable: 'Aujourd’hui 16:30',
    rating: 4.8,
    reviewCount: 156,
    phone: '+212 5 22 12 34 56',
    email: 'contact@silhouettebeauty.ma',
    website: 'https://silhouettebeauty.ma',
    categories: ['coiffure', 'esthetique', 'ongles'],
    openingHours: {
      monday: { open: '09:00', close: '20:00' },
      tuesday: { open: '09:00', close: '20:00' },
      wednesday: { open: '09:00', close: '20:00' },
      thursday: { open: '09:00', close: '20:00' },
      friday: { open: '10:00', close: '21:00' },
      saturday: { open: '09:00', close: '21:00' },
      sunday: { open: 'Fermé', close: 'Fermé' },
    },
    services: [
      {
        id: 'svc-01',
        name: 'Coupe Femme',
        category: 'coiffure',
        description: 'Coupe professionnelle avec conseil coiffeur',
        duration: 45,
        minBookingMinutes: 30,
        price: 150,
      },
      {
        id: 'svc-02',
        name: 'Lissage Brésilien',
        category: 'coiffure',
        description: 'Traitement lissage brésilien haut de gamme',
        duration: 120,
        minBookingMinutes: 90,
        price: 400,
      },
      {
        id: 'svc-03',
        name: 'Soin du Visage Complet',
        category: 'esthetique',
        description: 'Soin du visage personnalisé 60 min',
        duration: 60,
        minBookingMinutes: 45,
        price: 350,
      },
      {
        id: 'svc-04',
        name: 'Pose Ongles Gel',
        category: 'ongles',
        description: 'Pose de gel semi-permanent avec design',
        duration: 45,
        minBookingMinutes: 30,
        price: 200,
      },
      {
        id: 'svc-12',
        name: 'Pédicure Complète',
        category: 'ongles',
        description: 'Soin pieds + coupe + vernis semi-permanent',
        duration: 60,
        minBookingMinutes: 45,
        price: 220,
      },
      {
        id: 'svc-13',
        name: 'Épilation Cire Jambes',
        category: 'esthetique',
        description: 'Épilation à la cire jambes complètes',
        duration: 40,
        minBookingMinutes: 30,
        price: 160,
      },
    ],
    staff: [
      {
        id: 'staff-01',
        name: 'Fatima Bennani',
        specialties: ['coiffure'],
        bio: 'Coiffeuse expérimentée, 15 ans de métier',
        rating: 4.9,
      },
      {
        id: 'staff-02',
        name: 'Yasmine Hasemi',
        specialties: ['esthetique'],
        bio: 'Esthéticienne diplômée, spécialiste soins visage',
        rating: 4.8,
      },
      {
        id: 'staff-03',
        name: 'Amira Mansouri',
        specialties: ['ongles'],
        bio: 'Prothésiste ongles certifiée',
        rating: 4.7,
      },
    ],
    loyaltyProgram: {
      name: 'Points Beauté',
      pointsPerDirham: 1,
      rewardThreshold: 500,
    },
  },
  {
    id: 'salon-02',
    name: 'Jamila Spa & Beauty',
    description: 'Spa luxe avec hammam, soins et beauté',
    image: 'https://images.unsplash.com/photo-1573495627361-c8b1a0176582?w=500',
    address: '45 Avenue Lalla Yacout',
    city: 'Rabat',
    coordinates: { lat: 34.0209, lng: -6.8416 },
    distanceKm: 2.1,
    startingPrice: 180,
    nextAvailable: 'Aujourd’hui 17:00',
    rating: 4.9,
    reviewCount: 203,
    phone: '+212 5 37 68 90 12',
    email: 'contact@jamilaspa.ma',
    website: 'https://jamilaspa.ma',
    categories: ['hammam', 'esthetique', 'ongles'],
    openingHours: {
      monday: { open: '10:00', close: '21:00' },
      tuesday: { open: '10:00', close: '21:00' },
      wednesday: { open: '10:00', close: '21:00' },
      thursday: { open: '10:00', close: '21:00' },
      friday: { open: '14:00', close: '22:00' },
      saturday: { open: '10:00', close: '22:00' },
      sunday: { open: '10:00', close: '21:00' },
    },
    services: [
      {
        id: 'svc-05',
        name: 'Hammam + Gommage',
        category: 'hammam',
        description: 'Hammam traditionnel + gommage kessoul',
        duration: 60,
        minBookingMinutes: 45,
        price: 250,
      },
      {
        id: 'svc-06',
        name: 'Massage Relaxant',
        category: 'hammam',
        description: 'Massage relaxant 60 minutes',
        duration: 60,
        minBookingMinutes: 45,
        price: 400,
      },
      {
        id: 'svc-07',
        name: 'Épilation Intégrale',
        category: 'esthetique',
        description: 'Épilation à la cire',
        duration: 45,
        minBookingMinutes: 30,
        price: 200,
      },
      {
        id: 'svc-08',
        name: 'Manucure Spa',
        category: 'ongles',
        description: 'Manucure avec massage des mains',
        duration: 45,
        minBookingMinutes: 30,
        price: 180,
      },
      {
        id: 'svc-14',
        name: 'Pédicure Spa',
        category: 'ongles',
        description: 'Pédicure relaxante avec exfoliation',
        duration: 50,
        minBookingMinutes: 40,
        price: 190,
      },
      {
        id: 'svc-15',
        name: 'Cire Sourcils + Lèvre',
        category: 'esthetique',
        description: 'Épilation cire zones visage',
        duration: 20,
        minBookingMinutes: 15,
        price: 80,
      },
    ],
    staff: [
      {
        id: 'staff-04',
        name: 'Samira El Fassi',
        specialties: ['hammam'],
        bio: 'Masseuse professionnelle certifiée',
        rating: 4.9,
      },
      {
        id: 'staff-05',
        name: 'Nadia Bekkali',
        specialties: ['esthetique', 'ongles'],
        bio: 'Esthéticienne polyvalente',
        rating: 4.8,
      },
    ],
    loyaltyProgram: {
      name: 'Club Jamila',
      pointsPerDirham: 2,
      rewardThreshold: 300,
    },
  },
  {
    id: 'salon-03',
    name: 'Barbershop Elite',
    description: 'Barbershop moderne avec services haut de gamme',
    image: 'https://images.unsplash.com/photo-1585747860715-cd4628902d4a?w=500',
    address: '78 Boulevard Zerktouni',
    city: 'Casablanca',
    coordinates: { lat: 33.5731, lng: -7.5898 },
    distanceKm: 0.8,
    startingPrice: 60,
    nextAvailable: 'Aujourd’hui 15:30',
    rating: 4.6,
    reviewCount: 98,
    phone: '+212 5 22 45 67 89',
    email: 'contact@elitebarber.ma',
    categories: ['barbier'],
    openingHours: {
      monday: { open: '09:00', close: '19:00' },
      tuesday: { open: '09:00', close: '19:00' },
      wednesday: { open: '09:00', close: '19:00' },
      thursday: { open: '09:00', close: '19:00' },
      friday: { open: '10:00', close: '19:00' },
      saturday: { open: '09:00', close: '20:00' },
      sunday: { open: 'Fermé', close: 'Fermé' },
    },
    services: [
      {
        id: 'svc-09',
        name: 'Coupe Classique',
        category: 'barbier',
        description: 'Coupe barbier classique',
        duration: 30,
        minBookingMinutes: 20,
        price: 80,
      },
      {
        id: 'svc-10',
        name: 'Coupe + Barbe',
        category: 'barbier',
        description: 'Coupe + rasage et soin barbe',
        duration: 45,
        minBookingMinutes: 30,
        price: 120,
      },
      {
        id: 'svc-11',
        name: 'Soin Barbe Premium',
        category: 'barbier',
        description: 'Soin barbe avec huile premium',
        duration: 20,
        minBookingMinutes: 15,
        price: 60,
      },
    ],
    staff: [
      {
        id: 'staff-06',
        name: 'Mohamed Alami',
        specialties: ['barbier'],
        bio: 'Maître barbier diplômé internationalement',
        rating: 4.8,
      },
      {
        id: 'staff-07',
        name: 'Karim Bennani',
        specialties: ['barbier'],
        bio: 'Barbier passionné, 8 ans d\'expérience',
        rating: 4.6,
      },
    ],
  },
]

export const beautyHomeFeed = [
  { type: 'banner', title: 'Offre du jour', description: '-20% sur les soins du visage' },
  { type: 'featured', salonId: 'salon-01' },
  { type: 'featured', salonId: 'salon-02' },
  { type: 'promo', title: 'Nouveaux clients', description: '100 points de bienvenue' },
]

export const mockCustomerBookings: Booking[] = [
  {
    id: 'booking-01',
    bookingRef: 'BEAUTY-001',
    salonId: 'salon-01',
    salonName: 'Silhouette Beauty',
    serviceId: 'svc-01',
    serviceName: 'Coupe Femme',
    staffId: 'staff-01',
    staffName: 'Fatima Bennani',
    date: '2026-06-25',
    time: '14:00',
    duration: 45,
    totalPrice: 150,
    status: 'confirmed',
    customerName: 'Layla Bennani',
    customerPhone: '+212 6 12 34 56 78',
    customerEmail: 'layla@email.com',
    notes: 'Coupe moderne avec dégradé',
    createdAt: '2026-06-20T10:30:00',
  },
  {
    id: 'booking-02',
    bookingRef: 'BEAUTY-002',
    salonId: 'salon-02',
    salonName: 'Jamila Spa & Beauty',
    serviceId: 'svc-05',
    serviceName: 'Hammam + Gommage',
    date: '2026-06-22',
    time: '15:00',
    duration: 60,
    totalPrice: 250,
    status: 'completed',
    customerName: 'Layla Bennani',
    customerPhone: '+212 6 12 34 56 78',
    customerEmail: 'layla@email.com',
    createdAt: '2026-06-10T09:15:00',
  },
]

export const mockCustomerProfile: CustomerProfile = {
  id: 'customer-01',
  name: 'Layla Bennani',
  email: 'layla@email.com',
  phone: '+212 6 12 34 56 78',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  loyaltyPoints: 320,
  favoriteServices: ['coiffure', 'esthetique'],
  bookingHistory: mockCustomerBookings,
  reviews: [
    {
      id: 'review-01',
      salonId: 'salon-01',
      rating: 5,
      title: 'Excellent service',
      comment: 'Très satisfaite de ma coupe et du service',
      authorName: 'Layla Bennani',
      createdAt: '2026-06-22T16:00:00',
      verified: true,
    },
  ],
}

export const mockSalonOwnerProfile: SalonOwnerProfile = {
  id: 'owner-01',
  name: 'Fatima Bennani',
  email: 'fatima@silhouettebeauty.ma',
  phone: '+212 5 22 12 34 56',
  salonIds: ['salon-01'],
  role: 'owner',
}

export const mockManagerBookings: Booking[] = [
  mockCustomerBookings[0],
  {
    id: 'booking-03',
    bookingRef: 'BEAUTY-003',
    salonId: 'salon-01',
    salonName: 'Silhouette Beauty',
    serviceId: 'svc-02',
    serviceName: 'Lissage Brésilien',
    staffId: 'staff-01',
    staffName: 'Fatima Bennani',
    date: '2026-06-23',
    time: '10:00',
    duration: 120,
    totalPrice: 400,
    status: 'confirmed',
    customerName: 'Amira Hassan',
    customerPhone: '+212 6 98 76 54 32',
    customerEmail: 'amira@email.com',
    createdAt: '2026-06-19T14:20:00',
  },
]

export const mockSalonReviews: SalonReview[] = [
  {
    id: 'review-01',
    salonId: 'salon-01',
    rating: 5,
    title: 'Excellent service',
    comment: 'Très satisfaite de ma coupe et du service',
    authorName: 'Layla Bennani',
    createdAt: '2026-06-22T16:00:00',
    verified: true,
  },
  {
    id: 'review-02',
    salonId: 'salon-01',
    rating: 4,
    title: 'Bon accueil',
    comment: 'Salon très propre et personnel accueillant',
    authorName: 'Sara Khalil',
    createdAt: '2026-06-20T14:00:00',
    verified: true,
  },
]

export const serviceLabels: Record<ServiceCategory, string> = {
  coiffure: 'Coiffure',
  esthetique: 'Esthétique',
  ongles: 'Ongles',
  hammam: 'Hammam & Spa',
  barbier: 'Barbier',
}

export const beautyServiceTemplates: ServiceTemplate[] = [
  {
    id: 'tpl-01',
    name: 'Manucure Express',
    category: 'ongles',
    description: 'Nettoyage, mise en forme et vernis classique',
    defaultDuration: 30,
    minBookingMinutes: 20,
    defaultPrice: 120,
  },
  {
    id: 'tpl-02',
    name: 'Pédicure Complète',
    category: 'ongles',
    description: 'Soin des pieds + vernis semi-permanent',
    defaultDuration: 60,
    minBookingMinutes: 45,
    defaultPrice: 220,
  },
  {
    id: 'tpl-03',
    name: 'Épilation Cire Jambes',
    category: 'esthetique',
    description: 'Épilation cire jambes complètes',
    defaultDuration: 40,
    minBookingMinutes: 30,
    defaultPrice: 160,
  },
  {
    id: 'tpl-04',
    name: 'Épilation Cire Maillot',
    category: 'esthetique',
    description: 'Épilation cire zone maillot',
    defaultDuration: 30,
    minBookingMinutes: 20,
    defaultPrice: 140,
  },
  {
    id: 'tpl-05',
    name: 'Soin Visage Hydra',
    category: 'esthetique',
    description: 'Hydratation intense et nettoyage profond',
    defaultDuration: 50,
    minBookingMinutes: 30,
    defaultPrice: 260,
  },
  {
    id: 'tpl-06',
    name: 'Brushing + Styling',
    category: 'coiffure',
    description: 'Brushing professionnel et mise en forme',
    defaultDuration: 45,
    minBookingMinutes: 30,
    defaultPrice: 150,
  },
  {
    id: 'tpl-07',
    name: 'Coloration Racines',
    category: 'coiffure',
    description: 'Coloration racines avec produits premium',
    defaultDuration: 90,
    minBookingMinutes: 60,
    defaultPrice: 320,
  },
  {
    id: 'tpl-08',
    name: 'Hammam Royal',
    category: 'hammam',
    description: 'Hammam traditionnel avec savon noir et gommage',
    defaultDuration: 75,
    minBookingMinutes: 60,
    defaultPrice: 300,
  },
]

export const mockAdminTenants: AdminTenant[] = [
  { id: 'tenant-silhouette', name: 'Silhouette Beauty', city: 'Casablanca', status: 'ACTIVE', slug: 'silhouette-beauty' },
  { id: 'tenant-jamila', name: 'Jamila Spa & Beauty', city: 'Casablanca', status: 'ACTIVE', slug: 'jamila-spa' },
  { id: 'tenant-urban', name: 'Urban Barber Club', city: 'Rabat', status: 'SUSPENDED', slug: 'urban-barber' },
]

export const mockManagerCustomers: ManagerCustomer[] = [
  { id: 'cust-01', name: 'Layla Bennani', phone: '+212 6 12 34 56 78', email: 'layla@email.com', visits: 12, loyaltyPoints: 320, lastVisit: '2026-06-22' },
  { id: 'cust-02', name: 'Amira Hassan', phone: '+212 6 98 76 54 32', email: 'amira@email.com', visits: 5, loyaltyPoints: 140, lastVisit: '2026-06-19' },
  { id: 'cust-03', name: 'Sara Khalil', phone: '+212 6 55 44 33 22', email: 'sara@email.com', visits: 3, loyaltyPoints: 80, lastVisit: '2026-06-15' },
]

export const mockLoyaltyHistory: LoyaltyTransaction[] = [
  { id: 'loy-01', label: 'Réservation Coupe Femme', points: 15, date: '2026-06-20' },
  { id: 'loy-02', label: 'Bonus bienvenue', points: 100, date: '2026-05-01' },
  { id: 'loy-03', label: 'Échange récompense -10%', points: -50, date: '2026-04-12' },
]

export const mockAgendaSlots: AgendaSlot[] = [
  { id: 'ag-01', time: '09:00', customerName: 'Amira Hassan', serviceName: 'Lissage Brésilien', staffName: 'Fatima Bennani', status: 'confirmed' },
  { id: 'ag-02', time: '10:30', customerName: 'Sara Khalil', serviceName: 'Pose Ongles Gel', staffName: 'Nadia Alaoui', status: 'pending' },
  { id: 'ag-03', time: '14:00', customerName: 'Layla Bennani', serviceName: 'Coupe Femme', staffName: 'Fatima Bennani', status: 'confirmed' },
  { id: 'ag-04', time: '16:30', customerName: '—', serviceName: 'Créneau libre', staffName: 'Nadia Alaoui', status: 'pending' },
]

export interface BookingDraftInput {
  salonId: string
  serviceId: string
  staffId?: string
  date: string
  time: string
  paymentMethod: 'cash' | 'online'
}

let bookingSeq = mockCustomerBookings.length + 1

export function commitBookingToHistory(
  draft: BookingDraftInput,
  customer: Pick<CustomerProfile, 'name' | 'phone' | 'email'>,
): Booking {
  const salon = allSalons.find((s) => s.id === draft.salonId)
  const service = salon?.services.find((s) => s.id === draft.serviceId)
  const staff = draft.staffId ? salon?.staff.find((s) => s.id === draft.staffId) : undefined
  const ref = `BK-${String(bookingSeq++).padStart(4, '0')}`

  const booking: Booking = {
    id: `booking-${Date.now()}`,
    bookingRef: ref,
    salonId: draft.salonId,
    salonName: salon?.name ?? 'Salon',
    serviceId: draft.serviceId,
    serviceName: service?.name ?? 'Service',
    staffId: draft.staffId,
    staffName: staff?.name ?? (draft.staffId ? undefined : 'Indifférent'),
    date: draft.date,
    time: draft.time,
    duration: service?.duration ?? 45,
    totalPrice: service?.price ?? 0,
    status: 'confirmed',
    customerName: customer.name,
    customerPhone: customer.phone,
    customerEmail: customer.email,
    createdAt: new Date().toISOString(),
  }

  mockCustomerBookings.unshift(booking)
  mockManagerBookings.unshift(booking)
  return booking
}

export const MOCK_OTP = '123456'
