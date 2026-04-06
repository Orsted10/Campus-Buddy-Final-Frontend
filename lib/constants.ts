export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'] as const

export const REQUEST_TYPES = ['maintenance', 'food_complaint', 'laundry'] as const

export const REQUEST_STATUS = ['pending', 'in_progress', 'resolved', 'cancelled'] as const

export const PRIORITY_LEVELS = ['low', 'medium', 'high'] as const

export const LOCATION_CATEGORIES = [
  'library',
  'lab',
  'classroom',
  'sports',
  'cafeteria',
  'office',
  'other',
] as const

export const NOTIFICATION_TYPES = [
  'assignment',
  'event',
  'maintenance',
  'general',
  'booking',
] as const

export const RESOURCE_TYPES = ['pdf', 'link', 'video', 'document'] as const

export const BOOKING_STATUS = ['confirmed', 'cancelled', 'completed'] as const

export const VISITOR_PASS_STATUS = ['active', 'expired', 'used'] as const

export const LAUNDRY_STATUS = ['confirmed', 'completed', 'cancelled'] as const

export const ASSIGNMENT_STATUS = ['pending', 'completed'] as const

export const BOOK_RESERVATION_STATUS = [
  'active',
  'picked_up',
  'cancelled',
  'expired',
] as const

// Detailed Campus Points of Interest (POIs)
export const CAMPUS_POI = [
  {
    id: 'admission-cell',
    name: 'Admission Cell',
    block: 'Block E',
    floor: 'Ground',
    side: 'Front',
    category: 'Administrative',
    description: 'Just front of Main Gate to the left',
    keywords: ['admission', 'office', 'helpdesk']
  },
  {
    id: 'amphitheatre',
    name: 'Amphitheatre',
    block: 'Block E',
    floor: 'Ground',
    side: 'Front',
    category: 'Services & Life',
    description: 'Just Front of Main Gate',
    keywords: ['events', 'gathering', 'stage']
  },
  {
    id: 'library',
    name: 'Library',
    block: 'Block E',
    floor: '4th',
    side: 'LHS',
    category: 'Academics',
    description: 'Towards Main Gate',
    keywords: ['books', 'study', 'research']
  },
  {
    id: 'canteen-lhs-rhs',
    name: 'Canteen',
    block: 'Block E',
    floor: '4th',
    side: 'LHS & RHS',
    category: 'Food & Drinks',
    description: 'Away from Main Gate',
    keywords: ['food', 'lunch', 'break']
  },
  {
    id: 'seminar-hall',
    name: 'Seminar Hall',
    block: 'Block E',
    floor: '5th',
    side: 'LHS',
    category: 'Academics',
    description: 'Away from Main Gate',
    keywords: ['events', 'talks', 'guest session']
  },
  {
    id: 'registrar-exam-cell',
    name: 'Registrar & Exam Dept.',
    block: 'Block E',
    floor: '1st',
    side: 'RHS',
    category: 'Administrative',
    description: 'Right Side',
    keywords: ['exam', 'marks', 'registrar']
  },
  {
    id: 'vending-machine',
    name: 'Vending Machine',
    block: 'Block E',
    floor: '1st',
    side: 'LHS',
    category: 'Food & Drinks',
    description: '1st Floor LHS',
    keywords: ['snacks', 'drinks', 'quick bite']
  },
  {
    id: 'tuf-shop',
    name: 'Tuf & Snacks Shop',
    block: 'Block E',
    floor: 'Ground',
    side: 'RHS',
    category: 'Food & Drinks',
    description: 'Away from Main Gate, Top Right from Amphitheatre',
    keywords: ['ice cream', 'snack', 'tuf']
  },
  {
    id: 'dcpd-office',
    name: 'DCPD Office',
    block: 'Block E',
    floor: 'Ground',
    side: 'RHS',
    category: 'Administrative',
    description: 'Front of Tuf Shop',
    keywords: ['dcpd', 'placement', 'office']
  },
  {
    id: 'iedc-cell',
    name: 'IEDC Cell',
    block: 'Block E',
    floor: 'Ground',
    side: 'RHS',
    category: 'Administrative',
    description: 'Away from Main Gate, Just Right before Amphitheatre',
    keywords: ['startup', 'entrepreneurship', 'iedc']
  },
  {
    id: 'nescafe',
    name: 'Nescafe',
    block: 'Outside',
    floor: 'Ground',
    side: 'LHS',
    category: 'Food & Drinks',
    description: 'From University Outside Gate, Towards Block E (Left)',
    keywords: ['coffee', 'tea', 'cafe']
  },
  {
    id: 'hostel',
    name: 'Hostel',
    block: 'Hostel Area',
    floor: 'N/A',
    side: 'Behind Block E',
    category: 'Services & Life',
    description: 'Behind of Block E',
    keywords: ['residence', 'room', 'hostel']
  },
  {
    id: 'cafeteria-hostel',
    name: 'Cafeteria (Hostel)',
    block: 'Hostel Area',
    floor: 'Ground',
    side: 'Right',
    category: 'Food & Drinks',
    description: 'Right before Hostel Entrance',
    keywords: ['mess', 'food', 'hostel cafe']
  },
  {
    id: 'cafeteria-non-veg',
    name: 'Cafeteria (Non-Veg)',
    block: 'Hostel Area',
    floor: 'Ground',
    side: 'Left',
    category: 'Food & Drinks',
    description: 'Left before Hostel Entrance',
    keywords: ['non-veg', 'chicken', 'food']
  },
  {
    id: 'medical-room',
    name: 'Medical Room',
    block: 'Hostel Area',
    floor: 'Ground',
    side: 'Left',
    category: 'Services & Life',
    description: 'Left of Non-Veg Cafe',
    keywords: ['health', 'doctor', 'clinic']
  },
  {
    id: 'laundry-services',
    name: 'Laundry Services',
    block: 'Hostel Area',
    floor: 'Ground',
    side: 'Left',
    category: 'Services & Life',
    description: 'Left of Medical Room',
    keywords: ['clothes', 'wash', 'laundry']
  }
]
