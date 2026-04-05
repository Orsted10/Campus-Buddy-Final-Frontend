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

// Default campus locations (example - customize for your university)
export const DEFAULT_CAMPUS_LOCATIONS = [
  {
    name: 'Main Library',
    category: 'library',
    latitude: 28.6139,
    longitude: 77.209,
    description: 'Central library with study rooms',
    floor: 3,
    capacity: 500,
  },
  {
    name: 'Computer Science Lab',
    category: 'lab',
    latitude: 28.6145,
    longitude: 77.2095,
    description: 'CS department computer lab',
    floor: 2,
    capacity: 60,
  },
  {
    name: 'Sports Complex',
    category: 'sports',
    latitude: 28.613,
    longitude: 77.2085,
    description: 'Indoor and outdoor sports facilities',
    capacity: 200,
  },
  {
    name: 'Main Cafeteria',
    category: 'cafeteria',
    latitude: 28.6142,
    longitude: 77.2088,
    description: 'Main dining hall',
    capacity: 300,
  },
]
