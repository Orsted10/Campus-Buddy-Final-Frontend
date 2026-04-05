export type UserRole = 'student' | 'admin' | 'hostel_staff'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  student_id: string | null
  phone: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Chat {
  id: string
  user_id: string
  title: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  chat_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface HostelRequest {
  id: string
  user_id: string
  type: 'maintenance' | 'food_complaint' | 'laundry'
  title: string
  description: string | null
  status: 'pending' | 'in_progress' | 'resolved' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  assigned_to: string | null
  images: string[] | null
  resolved_notes: string | null
  created_at: string
  updated_at: string
}

export interface MessMenu {
  id: string
  date: string
  meal_type: 'breakfast' | 'lunch' | 'dinner'
  menu_items: any
  created_by: string | null
  created_at: string
}

export interface VisitorPass {
  id: string
  student_id: string
  visitor_name: string
  visitor_phone: string | null
  visit_date: string
  purpose: string | null
  qr_code: string | null
  status: 'active' | 'expired' | 'used'
  created_at: string
}

export interface LaundryBooking {
  id: string
  user_id: string
  slot_date: string
  slot_time: string
  machine_number: number
  status: 'confirmed' | 'completed' | 'cancelled'
  created_at: string
}

export interface Assignment {
  id: string
  user_id: string
  subject: string
  title: string
  description: string | null
  due_date: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'completed'
  attachments: string[] | null
  created_at: string
  updated_at: string
}

export interface Timetable {
  id: string
  user_id: string
  day_of_week: number
  start_time: string
  end_time: string
  subject: string
  room: string | null
  professor: string | null
  created_at: string
}

export interface StudyResource {
  id: string
  title: string
  subject: string
  resource_type: 'pdf' | 'link' | 'video' | 'document'
  url: string
  description: string | null
  uploaded_by: string | null
  downloads: number
  created_at: string
}

export interface CampusLocation {
  id: string
  name: string
  category: 'library' | 'lab' | 'classroom' | 'sports' | 'cafeteria' | 'office' | 'other'
  latitude: number
  longitude: number
  description: string | null
  floor: number | null
  capacity: number | null
  available: boolean
  image_url: string | null
  created_at: string
}

export interface Booking {
  id: string
  user_id: string
  location_id: string
  start_time: string
  end_time: string
  purpose: string | null
  status: 'confirmed' | 'cancelled' | 'completed'
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'assignment' | 'event' | 'maintenance' | 'general' | 'booking'
  read: boolean
  link: string | null
  created_at: string
}

export interface Event {
  id: string
  title: string
  description: string | null
  event_date: string
  location: string | null
  organizer_id: string | null
  image_url: string | null
  created_at: string
}

export interface Book {
  id: string
  title: string
  author: string
  isbn: string | null
  category: string | null
  total_copies: number
  available_copies: number
  location: string | null
  description: string | null
  created_at: string
}

export interface BookReservation {
  id: string
  user_id: string
  book_id: string
  reserved_at: string
  pickup_deadline: string | null
  status: 'active' | 'picked_up' | 'cancelled' | 'expired'
}
