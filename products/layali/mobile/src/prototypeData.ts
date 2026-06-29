export interface FeedChip {
  label: string
  isActive?: boolean
}

export type AccessMode = 'TABLE' | 'GUEST_LIST' | 'COUNTER' | 'TICKET' | 'HYBRID' | 'WALK_IN'
export type Occasion = 'STANDARD' | 'BIRTHDAY' | 'OTHER'
export type ApprovalStatus = 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED'
export type PaymentTiming = 'ADVANCE' | 'ON_SITE'
export type TableZone = 'MAIN' | 'VIP' | 'TERRACE' | 'STAGE_FRONT'
export type TableStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'BLOCKED' | 'ARCHIVED'

export const accessModeLabels: Record<AccessMode, string> = {
  TABLE: 'Table',
  GUEST_LIST: 'Guest list',
  COUNTER: 'Comptoir',
  TICKET: 'Ticket',
  HYBRID: 'Hybride',
  WALK_IN: 'Walk-in',
}

export const occasionLabels: Record<Occasion, string> = {
  STANDARD: 'Standard',
  BIRTHDAY: 'Anniversaire',
  OTHER: 'Occasion spéciale',
}

export interface HeroCard {
  title: string
  subtitle: string
  badge: string
  metric: string
}

export interface VenueCard {
  title: string
  district: string
  rating: string
  minSpend: string
  vibe: string
  accessModes: AccessMode[]
  accessSummary: string
  featuredAction: string
}

export interface ActivityItem {
  who: string
  action: string
  when: string
}

export interface BookingDraft {
  venueId: string
  venueName: string
  eventId?: string
  eventTitle?: string
  date: string
  time: string
  groupSize: number
  accessMode: AccessMode
  accessLabel: string
  accessResourceType?: 'TABLE' | 'COUNTER_ZONE' | 'ENTRY_QUOTA'
  accessResourceId?: string
  accessResourceLabel?: string
  tableId: string
  tableName: string
  counterSpotId?: string
  counterSpotName?: string
  specialNight: boolean
  ticketRequired: boolean
  occasion: Occasion
  celebrantName?: string
  requiresApproval: boolean
  approvalStatus: ApprovalStatus
  notes: string
  minSpend: number
  depositAmount: number
  status: 'draft' | 'pending' | 'confirmed'
  qrCode?: string
  reference?: string
}

export interface LayaliHomeFeed {
  city: string
  chips: FeedChip[]
  heroCards: HeroCard[]
  venues: VenueCard[]
  activity: ActivityItem[]
}

export const layaliHomeFeed: LayaliHomeFeed = {
  city: 'Casablanca',
  chips: [
    { label: 'Ce soir', isActive: true },
    { label: 'Guest list' },
    { label: 'Comptoir' },
    { label: 'Anniversaire' },
    { label: 'Moins de 2000 MAD' },
  ],
  heroCards: [
    {
      title: 'Les spots chauds de ce soir',
      subtitle: '22 lieux ouverts avec table, guest list, comptoir et billet dans Casablanca.',
      badge: 'LIVE',
      metric: '156 demandes d\'accès cette heure',
    },
    {
      title: 'La guest list s\'accélère',
      subtitle: 'Meilleures confirmations avant 21:00, ensuite les soirees speciales deviennent plus strictes.',
      badge: 'HOT',
      metric: '28 tables VIP et 14 places comptoir restantes',
    },
    {
      title: 'Mode anniversaire',
      subtitle: 'Lieux avec bottle show, service gâteau et horaires d\'arrivée conseillés ce week-end',
      badge: 'SEASON',
      metric: '9 lieux prets pour les celebrations',
    },
  ],
  venues: [
    {
      title: 'Aether Rooftop',
      district: 'Maarif',
      rating: '4.8',
      minSpend: 'Minimum 1500 MAD',
      vibe: 'Tapas sunset et nightlife, DJ à partir de 22:30',
      accessModes: ['TABLE', 'COUNTER'],
      accessSummary: 'Tables et comptoir ce soir',
      featuredAction: 'Table premium',
    },
    {
      title: 'Le Mirage Club',
      district: 'Corniche',
      rating: '4.7',
      minSpend: 'Minimum 1800 MAD',
      vibe: 'Boîte de nuit ouverte tard, house et hip-hop',
      accessModes: ['GUEST_LIST', 'TABLE', 'COUNTER', 'TICKET'],
      accessSummary: 'Guest list, tables, comptoir, ticket selon la soirée',
      featuredAction: 'Guest list rapide',
    },
    {
      title: 'Palmeraie Terrace',
      district: 'Ain Diab',
      rating: '4.6',
      minSpend: 'Minimum 1300 MAD',
      vibe: 'Terrasse dinner seafood, live band le week-end',
      accessModes: ['TABLE', 'GUEST_LIST', 'COUNTER'],
      accessSummary: 'Table, guest list sunset, comptoir lounge',
      featuredAction: 'Comptoir sunset',
    },
  ],
  activity: [
    {
      who: 'Sara B.',
      action: 'a reserve une table anniversaire a Aether Rooftop',
      when: 'il y a 2 min',
    },
    {
      who: 'Yanis K.',
      action: 'a rejoint la guest list de Le Mirage Club',
      when: 'il y a 6 min',
    },
    {
      who: 'Nora A.',
      action: 'a bloque une place comptoir a Palmeraie Terrace',
      when: 'il y a 11 min',
    },
  ],
}

// Extended venue directory with full details
export interface AccessRulesSummary {
  guestListApproval: 'AUTO' | 'MANUAL'
  counterNamedZones: boolean
  qrCheckin: boolean
  fallbackLookup: boolean
  ticketRequiredTonight?: boolean
}

export interface CounterSpot {
  id: string
  name: string
  capacity: number
  minSpend: number
  available: boolean
}

export interface VenueDetail extends VenueCard {
  id: string
  description: string
  phone: string
  address: string
  city: string
  openTime: string
  closeTime: string
  images: string[]
  accessModesDefault: AccessMode[]
  operationalTags: string[]
  accessRulesSummary: AccessRulesSummary
  guestListGroupMax: number
  featuredEventId?: string
  tables: Table[]
  counterSpots: CounterSpot[]
  reviews: Review[]
  budgetCategory: 'budget' | 'medium' | 'premium'
  dressCode?: string
  minAge?: number
  parking?: string
  paymentMethods?: string[]
  lastUpdated?: string
}

export interface Table {
  id: string
  name: string
  capacity: number
  minSpend: number
  available: boolean
  zone?: string
}

export interface Review {
  author: string
  rating: number
  text: string
}

export const allVenues: VenueDetail[] = [
  {
    id: 'v1',
    title: 'Aether Rooftop',
    district: 'Maarif',
    rating: '4.8',
    minSpend: 'Minimum 1500 MAD',
    vibe: 'Tapas sunset et nightlife, DJ a partir de 22:30',
    accessModes: ['TABLE', 'COUNTER'],
    accessSummary: 'Tables et comptoir ce soir',
    featuredAction: 'Table premium',
    description: 'Rooftop emblématique avec vue panoramique sur la ville, parfait pour le dîner-coucher de soleil et les cocktails tard le soir',
    phone: '+212 5 22 98 76 54',
    address: 'Bd Zerktouni, Maarif, Casablanca',
    city: 'Casablanca',
    openTime: '18:00',
    closeTime: '04:00',
    images: ['aether-1.jpg', 'aether-2.jpg'],
    accessModesDefault: ['TABLE', 'COUNTER'],
    operationalTags: ['TABLE_BOOKING', 'COUNTER_BOOKING', 'SPECIAL_NIGHT'],
    accessRulesSummary: {
      guestListApproval: 'MANUAL',
      counterNamedZones: true,
      qrCheckin: true,
      fallbackLookup: true,
      ticketRequiredTonight: false,
    },
    guestListGroupMax: 0,
    featuredEventId: 'e1',
    tables: [
      { id: 't1', name: 'Table 01', capacity: 2, minSpend: 800, available: true, zone: 'Sunset rail' },
      { id: 't2', name: 'Table 02', capacity: 4, minSpend: 1500, available: true, zone: 'Main deck' },
      { id: 't3', name: 'VIP Corner', capacity: 6, minSpend: 3000, available: false, zone: 'VIP' },
    ],
    counterSpots: [
      { id: 'c1', name: 'Sky bar rail', capacity: 2, minSpend: 600, available: true },
      { id: 'c2', name: 'DJ counter side', capacity: 3, minSpend: 900, available: true },
    ],
    reviews: [
      { author: 'Nora M.', rating: 5, text: 'Amazing sunset views and impeccable service!' },
      { author: 'Hassan B.', rating: 4, text: 'Great atmosphere, a bit pricey but worth it.' },
    ],
    budgetCategory: 'premium',
    dressCode: 'Décontracté (pas de short)',
    minAge: 18,
    parking: 'Parking gratuit sur place',
    paymentMethods: ['Carte bancaire', 'CMI', 'Espèces'],
    lastUpdated: 'il y a 15 min',
  },
  {
    id: 'v2',
    title: 'Le Mirage Club',
    district: 'Corniche',
    rating: '4.7',
    minSpend: 'Minimum 1800 MAD',
    vibe: 'Club late-night, house et hip-hop',
    accessModes: ['GUEST_LIST', 'TABLE', 'COUNTER', 'TICKET'],
    accessSummary: 'Guest list, tables, comptoir, ticket selon la soirée',
    featuredAction: 'Guest list rapide',
    description: 'Boîte de nuit dynamique avec les meilleurs DJs, spectacles laser et salon VIP exclusif',
    phone: '+212 5 22 87 65 43',
    address: 'Corniche, Casablanca',
    city: 'Casablanca',
    openTime: '22:00',
    closeTime: '05:00',
    images: ['mirage-1.jpg', 'mirage-2.jpg'],
    accessModesDefault: ['GUEST_LIST', 'TABLE', 'COUNTER'],
    operationalTags: ['GUEST_LIST', 'TABLE_BOOKING', 'COUNTER_BOOKING', 'SPECIAL_NIGHT'],
    accessRulesSummary: {
      guestListApproval: 'AUTO',
      counterNamedZones: false,
      qrCheckin: true,
      fallbackLookup: true,
      ticketRequiredTonight: true,
    },
    guestListGroupMax: 6,
    featuredEventId: 'e2',
    tables: [
      { id: 't5', name: 'Table A1', capacity: 4, minSpend: 1800, available: true, zone: 'Dance floor' },
      { id: 't6', name: 'VIP Booth', capacity: 8, minSpend: 4500, available: true, zone: 'VIP' },
      { id: 't7', name: 'Table A2', capacity: 4, minSpend: 1800, available: false, zone: 'Dance floor' },
    ],
    counterSpots: [
      { id: 'c3', name: 'Main bar quota', capacity: 4, minSpend: 1200, available: true },
    ],
    reviews: [
      { author: 'Karim Z.', rating: 5, text: 'Best DJ set of the season!' },
    ],
    budgetCategory: 'premium',
    dressCode: 'Chic (pas de sneakers)',
    minAge: 21,
    parking: 'Parking payant à proximité',
    paymentMethods: ['Carte bancaire', 'CMI'],
    lastUpdated: 'il y a 8 min',
  },
  {
    id: 'v3',
    title: 'Palmeraie Terrace',
    district: 'Ain Diab',
    rating: '4.6',
    minSpend: 'Minimum 1300 MAD',
      vibe: 'Terrasse dîner fruits de mer, groupe live le week-end',
    accessModes: ['TABLE', 'GUEST_LIST', 'COUNTER'],
    accessSummary: 'Table, guest list sunset, comptoir lounge',
    featuredAction: 'Comptoir sunset',
    description: 'Terrasse en bord de mer spécialisée dans les fruits de mer frais avec jazz live et sets acoustiques',
    phone: '+212 5 22 76 54 32',
    address: 'Ain Diab, Casablanca',
    city: 'Casablanca',
    openTime: '19:00',
    closeTime: '23:30',
    images: ['palmeraie-1.jpg', 'palmeraie-2.jpg'],
    accessModesDefault: ['TABLE', 'GUEST_LIST', 'COUNTER'],
    operationalTags: ['TABLE_BOOKING', 'GUEST_LIST', 'COUNTER_BOOKING', 'WALK_IN'],
    accessRulesSummary: {
      guestListApproval: 'MANUAL',
      counterNamedZones: true,
      qrCheckin: true,
      fallbackLookup: true,
      ticketRequiredTonight: false,
    },
    guestListGroupMax: 4,
    featuredEventId: 'e3',
    tables: [
      { id: 't8', name: 'Sea View 01', capacity: 2, minSpend: 900, available: true, zone: 'Sea view' },
      { id: 't9', name: 'Sea View 02', capacity: 4, minSpend: 1300, available: true, zone: 'Sea view' },
      { id: 't10', name: 'Terrace Standard', capacity: 6, minSpend: 1900, available: true, zone: 'Terrace' },
    ],
    counterSpots: [
      { id: 'c4', name: 'Sunset bar rail', capacity: 2, minSpend: 500, available: true },
      { id: 'c5', name: 'Live band counter', capacity: 3, minSpend: 700, available: false },
    ],
    reviews: [
      { author: 'Fatima L.', rating: 5, text: 'Fresh seafood and romantic ambiance, perfect for couples.' },
    ],
    budgetCategory: 'medium',
    dressCode: 'Décontracté',
    minAge: 16,
    parking: 'Parking gratuit dans l\'établissement',
    paymentMethods: ['Carte bancaire', 'CMI', 'Espèces'],
    lastUpdated: 'il y a 3 min',
  },
]

export const mockBooking: BookingDraft = {
  venueId: 'v1',
  venueName: 'Aether Rooftop',
  eventId: 'e1',
  eventTitle: 'Nuit Électronique – Aether',
  date: '2026-06-13',
  time: '20:00',
  groupSize: 4,
  accessMode: 'TABLE',
  accessLabel: 'Table sunset',
  accessResourceType: 'TABLE',
  accessResourceId: 't2',
  accessResourceLabel: 'Table 02',
  tableId: 't2',
  tableName: 'Table 02',
  specialNight: true,
  ticketRequired: false,
  occasion: 'BIRTHDAY',
  celebrantName: 'Sara',
  requiresApproval: false,
  approvalStatus: 'NOT_REQUIRED',
  notes: 'Bottle show at 21:30 if possible',
  minSpend: 1500,
  depositAmount: 500,
  status: 'draft',
}

// ─── Events ───────────────────────────────────────────────────────────────────

export interface TicketCategory {
  name: string
  price: number
  remaining: number
  drinkIncluded: boolean
  paymentTiming: PaymentTiming
}

export interface EventDetail {
  id: string
  title: string
  venueId: string
  venueName: string
  district: string
  date: string
  time: string
  genre: string
  posterEmoji: string
  ageRestriction?: string
  specialNight: boolean
  accessModes: AccessMode[]
  ticketRequired: boolean
  guestListEnabled: boolean
  counterEnabled: boolean
  bookingHint: string
  entryPolicy: string
  lineup: string[]
  ticketCategories: TicketCategory[]
}

export const mockEvents: EventDetail[] = [
  {
    id: 'e1',
    title: 'Nuit Électronique – Aether',
    venueId: 'v1',
    venueName: 'Aether Rooftop',
    district: 'Maarif',
    date: '2026-06-20',
    time: '22:00',
    genre: 'House / Techno',
    posterEmoji: '🎶',
    ageRestriction: '18+',
    specialNight: true,
    accessModes: ['TICKET', 'TABLE', 'GUEST_LIST'],
    ticketRequired: false,
    guestListEnabled: true,
    counterEnabled: false,
    bookingHint: 'Tables et reservations anniversaire disponibles avant 21:00.',
    entryPolicy: 'QR ou recherche a l\'entree. Guest list validee manuellement apres 21:30',
    lineup: ['DJ Karim B.', 'Nora Soundwave', 'Resident Mix'],
    ticketCategories: [
      { name: 'Standard', price: 200, remaining: 42, drinkIncluded: false, paymentTiming: 'ADVANCE' as PaymentTiming },
      { name: 'VIP', price: 500, remaining: 8, drinkIncluded: true, paymentTiming: 'ADVANCE' as PaymentTiming },
    ],
  },
  {
    id: 'e2',
    title: 'Hip-Hop Summer Night',
    venueId: 'v2',
    venueName: 'Le Mirage Club',
    district: 'Corniche',
    date: '2026-06-21',
    time: '23:00',
    genre: 'Hip-Hop / R&B',
    posterEmoji: '🎤',
    ageRestriction: '18+',
    specialNight: true,
    accessModes: ['TICKET', 'TABLE', 'COUNTER', 'HYBRID'],
    ticketRequired: true,
    guestListEnabled: false,
    counterEnabled: true,
    bookingHint: 'Les entrees table et comptoir exigent aussi un billet payant pour cette soiree.',
    entryPolicy: 'Billet obligatoire. QR ou recherche par telephone acceptes a l\'entree',
    lineup: ['MC Youssef', 'DJ Sniper', 'Lina V.'],
    ticketCategories: [
      { name: 'Standard', price: 300, remaining: 20, drinkIncluded: false, paymentTiming: 'ADVANCE' as PaymentTiming },
      { name: 'VIP Booth', price: 1200, remaining: 3, drinkIncluded: true, paymentTiming: 'ADVANCE' as PaymentTiming },
    ],
  },
  {
    id: 'e3',
    title: 'Jazz & Seafood Evening',
    venueId: 'v3',
    venueName: 'Palmeraie Terrace',
    district: 'Ain Diab',
    date: '2026-06-22',
    time: '20:00',
    genre: 'Jazz / Soul',
    posterEmoji: '🎷',
    specialNight: false,
    accessModes: ['TABLE', 'COUNTER', 'GUEST_LIST'],
    ticketRequired: false,
    guestListEnabled: true,
    counterEnabled: true,
    bookingHint: 'Comptoir sunset et tables diner ouverts ce soir.',
    entryPolicy: 'Recherche par téléphone toujours disponible. Guest list sunset fermée à 20:30',
    lineup: ['Quartet El Andalous', 'Sara B. Vocals'],
    ticketCategories: [
      { name: 'Entrée libre (consommation)', price: 0, remaining: 99, drinkIncluded: false, paymentTiming: 'ON_SITE' as PaymentTiming },
      { name: 'Dîner spécial jazz', price: 450, remaining: 12, drinkIncluded: true, paymentTiming: 'ADVANCE' as PaymentTiming },
    ],
  },
]

// ─── User Profile ─────────────────────────────────────────────────────────────

export interface UserProfile {
  firstName: string
  lastName: string
  email: string
  phone: string
  city: string
  language: string
  marketingOptIn: boolean
}

export const mockUserProfile: UserProfile = {
  firstName: 'Omar',
  lastName: 'Tazi',
  email: 'omar.tazi@gmail.com',
  phone: '+212 6 61 23 45 67',
  city: 'Casablanca',
  language: 'Français',
  marketingOptIn: true,
}

// ─── Booking History ──────────────────────────────────────────────────────────

export interface BookingHistoryItem {
  id: string
  venueName: string
  date: string
  time: string
  partySize: number
  status: 'confirmed' | 'pending' | 'cancelled'
  reference: string
  accessMode: AccessMode
  accessLabel: string
  approvalStatus: ApprovalStatus
  occasion: Occasion
  tableName: string
  minSpend: number
  depositPaid: number
}

export const mockBookingHistory: BookingHistoryItem[] = [
  {
    id: '1',
    venueName: 'Aether Rooftop',
    date: '2026-06-20',
    time: '20:00',
    partySize: 4,
    status: 'confirmed',
    reference: 'LAY-ABC123DE',
    accessMode: 'TABLE',
    accessLabel: 'Table 02',
    approvalStatus: 'NOT_REQUIRED',
    occasion: 'BIRTHDAY',
    tableName: 'Table 02',
    minSpend: 1500,
    depositPaid: 500,
  },
  {
    id: '2',
    venueName: 'Le Mirage Club',
    date: '2026-06-21',
    time: '23:15',
    partySize: 3,
    status: 'pending',
    reference: 'LAY-GLS456PQ',
    accessMode: 'GUEST_LIST',
    accessLabel: 'Guest list standard',
    approvalStatus: 'PENDING',
    occasion: 'STANDARD',
    tableName: 'Guest list',
    minSpend: 0,
    depositPaid: 0,
  },
  {
    id: '3',
    venueName: 'Palmeraie Terrace',
    date: '2026-06-22',
    time: '19:30',
    partySize: 2,
    status: 'confirmed',
    reference: 'LAY-CNT789AB',
    accessMode: 'COUNTER',
    accessLabel: 'Sunset bar rail',
    approvalStatus: 'NOT_REQUIRED',
    occasion: 'STANDARD',
    tableName: 'Sunset bar rail',
    minSpend: 500,
    depositPaid: 0,
  },
]

export function commitBookingToHistory(booking: BookingDraft): string {
  const id = `bk-${Date.now()}`
  const status = booking.status === 'pending' ? 'pending' : 'confirmed'

  mockBookingHistory.unshift({
    id,
    venueName: booking.venueName,
    date: booking.date,
    time: booking.time,
    partySize: booking.groupSize,
    status,
    reference: booking.reference ?? id,
    accessMode: booking.accessMode,
    accessLabel: booking.accessLabel,
    approvalStatus: booking.approvalStatus,
    occasion: booking.occasion,
    tableName: booking.counterSpotName ?? booking.tableName,
    minSpend: booking.minSpend,
    depositPaid: booking.depositAmount > 0 && status === 'confirmed' ? booking.depositAmount : 0,
  })

  return id
}

// ─── Pro Manager – Tables ─────────────────────────────────────────────────────

export interface ProTable {
  id: string
  label: string
  zone: TableZone
  seats: number
  minSpendMinor: number
  depositMinor: number
  status: TableStatus
}

export const mockProTables: ProTable[] = [
  { id: 'pt-001', label: 'T1', zone: 'MAIN', seats: 4, minSpendMinor: 150000, depositMinor: 50000, status: 'AVAILABLE' },
  { id: 'pt-002', label: 'T2', zone: 'MAIN', seats: 6, minSpendMinor: 200000, depositMinor: 80000, status: 'RESERVED' },
  { id: 'pt-003', label: 'VIP-A', zone: 'VIP', seats: 8, minSpendMinor: 400000, depositMinor: 150000, status: 'AVAILABLE' },
  { id: 'pt-004', label: 'VIP-B', zone: 'VIP', seats: 10, minSpendMinor: 500000, depositMinor: 200000, status: 'OCCUPIED' },
  { id: 'pt-005', label: 'Terrasse-1', zone: 'TERRACE', seats: 4, minSpendMinor: 180000, depositMinor: 70000, status: 'AVAILABLE' },
]

// ─── Pro Manager – Events ─────────────────────────────────────────────────────

export type ProEventStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'CANCELLED'

export interface ProTicketCategory {
  code: string
  name: string
  priceMinor: number
  quota: number
  remaining: number
  drinkIncluded: boolean
  paymentTiming: PaymentTiming
}

export interface ProManagedEvent {
  id: string
  title: string
  startAt: string
  endAt: string
  specialNight: boolean
  posterEmoji: string
  accessModes: AccessMode[]
  ticketRequired: boolean
  ticketCategories: ProTicketCategory[]
  tablesEnabled: boolean
  tablesDepositMinor: number
  tablesMinSpendMinor: number
  guestListEnabled: boolean
  status: ProEventStatus
}

export const mockProEvents: ProManagedEvent[] = [
  {
    id: 'pe-001',
    title: 'Nuit Électronique – Aether',
    startAt: '2026-06-20T22:00:00+01:00',
    endAt: '2026-06-21T04:00:00+01:00',
    specialNight: true,
    posterEmoji: '🎶',
    accessModes: ['TICKET', 'TABLE', 'GUEST_LIST'],
    ticketRequired: false,
    ticketCategories: [
      { code: 'STD', name: 'Standard', priceMinor: 20000, quota: 200, remaining: 142, drinkIncluded: false, paymentTiming: 'ADVANCE' },
      { code: 'VIP', name: 'VIP', priceMinor: 50000, quota: 50, remaining: 8, drinkIncluded: true, paymentTiming: 'ADVANCE' },
    ],
    tablesEnabled: true,
    tablesDepositMinor: 100000,
    tablesMinSpendMinor: 200000,
    guestListEnabled: true,
    status: 'PUBLISHED',
  },
  {
    id: 'pe-002',
    title: 'Hip-Hop Summer Night',
    startAt: '2026-06-21T23:00:00+01:00',
    endAt: '2026-06-22T05:00:00+01:00',
    specialNight: true,
    posterEmoji: '🎤',
    accessModes: ['TICKET', 'TABLE', 'COUNTER'],
    ticketRequired: true,
    ticketCategories: [
      { code: 'STD', name: 'Standard', priceMinor: 30000, quota: 300, remaining: 20, drinkIncluded: false, paymentTiming: 'ADVANCE' },
      { code: 'VIP', name: 'VIP Table', priceMinor: 120000, quota: 10, remaining: 3, drinkIncluded: true, paymentTiming: 'ADVANCE' },
    ],
    tablesEnabled: true,
    tablesDepositMinor: 200000,
    tablesMinSpendMinor: 500000,
    guestListEnabled: false,
    status: 'PUBLISHED',
  },
  {
    id: 'pe-003',
    title: 'Soirée Privée VIP (Brouillon)',
    startAt: '2026-07-04T21:00:00+01:00',
    endAt: '2026-07-05T03:00:00+01:00',
    specialNight: true,
    posterEmoji: '✨',
    accessModes: ['TICKET', 'GUEST_LIST'],
    ticketRequired: false,
    ticketCategories: [
      { code: 'STD', name: 'Entrée + 1 conso', priceMinor: 15000, quota: 100, remaining: 100, drinkIncluded: true, paymentTiming: 'ADVANCE' },
      { code: 'VIP', name: 'VIP + open bar', priceMinor: 80000, quota: 20, remaining: 20, drinkIncluded: true, paymentTiming: 'ADVANCE' },
    ],
    tablesEnabled: false,
    tablesDepositMinor: 0,
    tablesMinSpendMinor: 0,
    guestListEnabled: true,
    status: 'DRAFT',
  },
]

export interface MembershipAccessRequest {
  id: string
  userId: string
  userName: string
  userEmail: string
  requestedRole: 'HOST' | 'ADMIN' | 'BAR_MANAGER'
  message: string
  createdAt: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

export const mockMembershipAccessRequests: MembershipAccessRequest[] = [
  {
    id: 'req-001',
    userId: 'usr-001',
    userName: 'Mohamed Ben',
    userEmail: 'med@example.ma',
    requestedRole: 'HOST',
    message: 'Je serai a la porte le vendredi et samedi',
    createdAt: '2026-06-15T10:30:00Z',
    status: 'PENDING',
  },
  {
    id: 'req-002',
    userId: 'usr-002',
    userName: 'Amira Sola',
    userEmail: 'amira@example.ma',
    requestedRole: 'BAR_MANAGER',
    message: 'Chef de bar experience 5 ans',
    createdAt: '2026-06-14T14:15:00Z',
    status: 'PENDING',
  },
]

export function submitMembershipAccessRequest(input: {
  userName: string
  userEmail: string
  requestedRole: MembershipAccessRequest['requestedRole']
  message: string
}) {
  mockMembershipAccessRequests.unshift({
    id: `req-${Date.now()}`,
    userId: `usr-${Date.now()}`,
    userName: input.userName,
    userEmail: input.userEmail,
    requestedRole: input.requestedRole,
    message: input.message,
    createdAt: new Date().toISOString(),
    status: 'PENDING',
  })
}

export interface AdminTenant {
  id: string
  name: string
  city: string
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING'
  slug: string
}

export const mockAdminTenants: AdminTenant[] = [
  { id: 'tenant-sky31', name: 'Sky31 Casablanca', city: 'Casablanca', status: 'ACTIVE', slug: 'sky31' },
  { id: 'tenant-mirage', name: 'Le Mirage Club', city: 'Casablanca', status: 'ACTIVE', slug: 'le-mirage-club' },
  { id: 'tenant-palmeraie', name: 'Palmeraie Terrace', city: 'Casablanca', status: 'SUSPENDED', slug: 'palmeraie-terrace' },
]

export interface ProTicketSale {
  id: string
  reference: string
  customerName: string
  eventTitle: string
  categoryName: string
  quantity: number
  totalMad: number
  status: 'PAID' | 'REFUNDED' | 'PENDING'
}

export const mockProTicketSales: ProTicketSale[] = [
  { id: 'ts-1', reference: 'TKT-LAY-22A1', customerName: 'Sara M.', eventTitle: 'Hip-Hop Summer Night', categoryName: 'Standard', quantity: 2, totalMad: 600, status: 'PAID' },
  { id: 'ts-2', reference: 'TKT-LAY-91B7', customerName: 'Karim L.', eventTitle: 'Jazz Sunset', categoryName: 'Early Bird', quantity: 1, totalMad: 150, status: 'REFUNDED' },
  { id: 'ts-3', reference: 'TKT-LAY-44C2', customerName: 'Ines B.', eventTitle: 'Hip-Hop Summer Night', categoryName: 'VIP', quantity: 4, totalMad: 4800, status: 'PAID' },
]

export interface ProReviewItem {
  id: string
  author: string
  rating: number
  text: string
  status: 'PENDING' | 'PUBLISHED' | 'HIDDEN'
}

export const mockProReviewsPending: ProReviewItem[] = [
  { id: 'rv-1', author: 'Amine K.', rating: 2, text: 'Attente longue a l entree malgre reservation.', status: 'PENDING' },
  { id: 'rv-2', author: 'Lina R.', rating: 5, text: 'Service impeccable et ambiance top.', status: 'PUBLISHED' },
]

export interface CustomerTicketAccess {
  id: string
  eventId: string
  type: 'ticket'
  title: string
  venueName: string
  date: string
  time: string
  status: 'confirmed' | 'cancelled' | 'pending'
  accessLabel: string
  accessMode: AccessMode
  reference: string
  details: string
}

export const mockCustomerTicketAccesses: CustomerTicketAccess[] = [
  {
    id: 'ticket-e2-1',
    eventId: 'e2',
    type: 'ticket',
    title: 'Hip-Hop Summer Night',
    venueName: 'Le Mirage Club',
    date: '2026-06-23',
    time: '23:00',
    status: 'confirmed',
    accessLabel: 'Early Bird',
    accessMode: 'TICKET',
    reference: 'TKT-LAY-22A1',
    details: '2 billets · Entree avant 00:00',
  },
]

export function commitTicketToAccesses(input: {
  eventId: string
  eventTitle: string
  venueName: string
  categoryName: string
  quantity: number
  total: number
  reference: string
  date: string
  time: string
}) {
  mockCustomerTicketAccesses.unshift({
    id: `ticket-${Date.now()}`,
    eventId: input.eventId,
    type: 'ticket',
    title: input.eventTitle,
    venueName: input.venueName,
    date: input.date,
    time: input.time,
    status: 'confirmed',
    accessLabel: input.categoryName,
    accessMode: 'TICKET',
    reference: input.reference,
    details: `${input.quantity} billet(s) · ${input.total} MAD`,
  })
}
