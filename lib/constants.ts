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

export const REQUEST_STATUS = [
  'pending',
  'in_progress',
  'resolved',
  'cancelled',
] as const

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

// Detailed Hostel Mess Menu
export const MESS_MENU = {
  timings: {
    breakfast: '07:30 AM - 09:00 AM',
    lunch: '12:00 PM - 02:00 PM',
    snacks: '04:30 PM - 05:30 PM',
    dinner: '07:00 PM - 09:00 PM',
  },
  common: {
    lunch: 'Rice, Pickle, Chapati, Salad & Chach',
    dinner: 'Rice, Pickle, Chapati, Salad',
  },
  schedule: [
    {
      day: 'Monday',
      breakfast: 'Sprouts, Bread with Jam/Butter, Cornflakes, Tea, Milk',
      lunch: 'Black Chana, Nutri Keema',
      snacks: 'Sandwich Coleslaw, Roohafza',
      dinner: 'Arhar Dal Tadka, Aloo Tamatra Sbji, Gulab Jamun',
    },
    {
      day: 'Tuesday',
      breakfast: 'Sambhar, Uttapam, Coconut Chutney, Milk, Tea',
      lunch: 'Rajma, Lauki Chana, Jeera Rice',
      snacks: 'Poha, Green Chutney, Coffee',
      dinner: 'Handi Paneer, Moong Masoor Dal',
    },
    {
      day: 'Wednesday',
      breakfast: 'Pav Bhaji, Banana, Milk, Tea',
      lunch: 'Lesuni Arhar Dal Tadka, Aloo Capsicum',
      snacks: 'Dhokla & Tea',
      dinner: 'Veg. Briyani, Tomato Chutney/Salan',
    },
    {
      day: 'Thursday',
      breakfast: 'Lemon Vermicelli, Bread, Jam, Butter & Tea',
      lunch: 'Urdh Chana Dal, Kadai Soya',
      snacks: 'Veg Macroni, Coffee',
      dinner: 'Black Masoor Dal, Mix Veg, Jeera Rice, Fruit Custard',
    },
    {
      day: 'Friday',
      breakfast: 'Aloo Bhaji, Ajwain Parantha, Milk, Tea',
      lunch: 'Phindi Choley, Aloo Matar',
      snacks: 'Dal Kachori, Saunth Chutney, Tea',
      dinner: 'Veg. machurian, Fried Rice, Arhar Dal, Ice Cream',
    },
    {
      day: 'Saturday',
      breakfast: 'Sambhar, Idli, Coconut Chutney, Tea',
      lunch: 'Lobiya Dal, Jeera Aloo',
      snacks: 'Papadi Chat & Tea',
      dinner: 'Kadahi Paneer, Green Moong Dal',
    },
    {
      day: 'Sunday',
      breakfast: 'Aloo Parantha, Pickle & Tea',
      lunch: 'Aloo Chole, Veg Briyani, Green Chutney, Onion Laccha, Lassi',
      snacks: 'Biscuits/Rusk & Tea',
      dinner: 'Dal makhani, Bhindi Do Pyaza, Onion Rice',
    },
  ],
}

// 2026 Academic Calendar Events (Even Semester)
export interface CalendarEvent {
  date: string; // YYYY-MM-DD
  type: 'teaching' | 'holiday' | 'exam' | 'special';
  event: string;
  timetableOverride?: string;
}

export const ACADEMIC_CALENDAR_2026: CalendarEvent[] = [
  // January
  { date: '2026-01-05', type: 'teaching', event: 'Commencement of Classes' },
  { date: '2026-01-10', type: 'special', event: 'Saturday: Wednesday Timetable', timetableOverride: 'Wednesday' },
  { date: '2026-01-14', type: 'holiday', event: 'Makar Sankranti' },
  { date: '2026-01-24', type: 'special', event: 'Saturday: Monday Timetable', timetableOverride: 'Monday' },
  { date: '2026-01-26', type: 'holiday', event: 'Republic Day' },
  { date: '2026-01-31', type: 'special', event: 'Saturday: Wednesday Timetable', timetableOverride: 'Wednesday' },
  
  // February
  { date: '2026-02-14', type: 'special', event: 'Saturday: Friday Timetable', timetableOverride: 'Friday' },
  { date: '2026-02-17', type: 'exam', event: '1st-Mid Semester Test (MST-1)' },
  { date: '2026-02-18', type: 'exam', event: '1st-Mid Semester Test (MST-1)' },
  { date: '2026-02-19', type: 'exam', event: '1st-Mid Semester Test (MST-1)' },
  { date: '2026-02-20', type: 'exam', event: '1st-Mid Semester Test (MST-1)' },
  { date: '2026-02-28', type: 'special', event: 'Saturday: Wednesday Timetable', timetableOverride: 'Wednesday' },

  // March
  { date: '2026-03-04', type: 'holiday', event: 'Holi' },
  { date: '2026-03-14', type: 'special', event: 'Saturday: Thursday Timetable', timetableOverride: 'Thursday' },
  { date: '2026-03-20', type: 'holiday', event: 'Eid ul Fitr' },
  { date: '2026-03-27', type: 'holiday', event: 'Ram Navmi' },
  { date: '2026-03-28', type: 'special', event: 'Saturday: Friday Timetable', timetableOverride: 'Friday' },

  // April
  { date: '2026-04-08', type: 'exam', event: '2nd-Mid Semester Test (MST-2)' },
  { date: '2026-04-09', type: 'exam', event: '2nd-Mid Semester Test (MST-2)' },
  { date: '2026-04-10', type: 'exam', event: '2nd-Mid Semester Test (MST-2)' },
  { date: '2026-04-11', type: 'exam', event: '2nd-Mid Semester Test (MST-2)' },
  { date: '2026-04-14', type: 'holiday', event: 'Dr. Ambedkar Jayanti' },
  { date: '2026-04-25', type: 'special', event: 'Saturday: Tuesday Timetable', timetableOverride: 'Tuesday' },

  // May
  { date: '2026-05-05', type: 'teaching', event: 'Last Teaching Day' },
  { date: '2026-05-06', type: 'exam', event: 'End Sem Practical Examination' },
  { date: '2026-05-07', type: 'exam', event: 'End Sem Practical Examination' },
  { date: '2026-05-08', type: 'exam', event: 'End Sem Practical Examination' },
  { date: '2026-05-09', type: 'exam', event: 'End Sem Practical Examination' },
  { date: '2026-05-11', type: 'exam', event: 'End Sem Theory Examination' },
  { date: '2026-05-12', type: 'exam', event: 'End Sem Theory Examination' },
  { date: '2026-05-13', type: 'exam', event: 'End Sem Theory Examination' },
  { date: '2026-05-14', type: 'exam', event: 'End Sem Theory Examination' },
  { date: '2026-05-15', type: 'exam', event: 'End Sem Theory Examination' },
  { date: '2026-05-18', type: 'exam', event: 'End Sem Theory Examination' },
  { date: '2026-05-19', type: 'exam', event: 'End Sem Theory Examination' },
  { date: '2026-05-20', type: 'exam', event: 'End Sem Theory Examination' },
  { date: '2026-05-21', type: 'exam', event: 'End Sem Theory Examination' },
  { date: '2026-05-22', type: 'exam', event: 'End Sem Theory Examination' },
  { date: '2026-05-27', type: 'holiday', event: 'Bakrid / Eid al Adha' },

  // June/July
  { date: '2026-06-01', type: 'holiday', event: 'Commencement of Summer Break' },
  { date: '2026-07-15', type: 'teaching', event: 'Commencement of next Session 2026-27' },
]
