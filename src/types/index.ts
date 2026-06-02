// ============================================================
//  BarberOS — Global TypeScript Types
// ============================================================

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'other'
export type PaymentStatus = 'pending' | 'paid' | 'debt'
export type UserRole = 'owner' | 'barber'
export type ExpenseCategory =
  | 'rent'
  | 'utilities'
  | 'supplies'
  | 'salary'
  | 'marketing'
  | 'equipment'
  | 'other'

// ── Core entities ────────────────────────────────────────────

export interface Shop {
  id: string
  name: string
  slug: string
  phone?: string
  address?: string
  city?: string
  timezone: string
  logoUrl?: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Profile {
  id: string
  shopId: string
  role: UserRole
  fullName: string
  avatarUrl?: string
  phone?: string
  createdAt: string
  updatedAt: string
}

export interface Barber {
  id: string
  shopId: string
  profileId?: string
  name: string
  bio?: string
  avatarUrl?: string
  color: string
  isActive: boolean
  commissionPct: number   // 0–100 %
  createdAt: string
  updatedAt: string
  // Relations
  schedules?: BarberSchedule[]
}

export interface BarberSchedule {
  id: string
  barberId: string
  dayOfWeek: number   // 0 = Sunday, 6 = Saturday
  startTime: string   // HH:mm
  endTime: string     // HH:mm
  isActive: boolean
}

export interface Service {
  id: string
  shopId: string
  name: string
  description?: string
  duration: number    // minutes
  price: number
  color: string
  isActive: boolean
  createdAt: string
}

export interface Client {
  id: string
  shopId: string
  fullName: string
  phone: string
  email?: string
  notes?: string
  loyaltyPoints: number
  lastVisitAt?: string
  createdAt: string
  updatedAt: string
}

export interface Appointment {
  id: string
  shopId: string
  barberId: string
  clientId?: string
  serviceId: string
  clientName: string
  clientPhone: string
  serviceName: string
  servicePrice: number
  duration: number
  startsAt: string
  endsAt: string
  status: AppointmentStatus
  notes?: string
  createdVia: 'dashboard' | 'whatsapp' | 'booking_page'
  createdAt: string
  updatedAt: string
  // Relations
  barber?: Pick<Barber, 'id' | 'name' | 'avatarUrl' | 'color'>
  service?: Pick<Service, 'id' | 'name' | 'price' | 'duration'>
  payment?: Payment
}

export interface Payment {
  id: string
  shopId: string
  appointmentId: string
  barberId: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  discountAmount: number
  commissionRate: number
  notes?: string
  paidAt?: string
  createdAt: string
}

export interface InventoryItem {
  id: string
  shopId: string
  name: string
  brand?: string
  unit: string
  stock: number
  minStock: number
  costPerUnit?: number
  supplier?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface InventoryMovement {
  id: string
  shopId: string
  itemId: string
  quantity: number      // positive = in, negative = out
  reason: string
  totalCost?: number
  notes?: string
  createdBy?: string
  createdAt: string
}

export interface Expense {
  id: string
  shopId: string
  category: ExpenseCategory
  description: string
  amount: number
  date: string
  receiptUrl?: string
  createdBy?: string
  createdAt: string
}

// ── Dashboard / UI types ─────────────────────────────────────

export interface DailySummary {
  date: string
  totalAppointments: number
  completedAppointments: number
  totalRevenue: number
  cashRevenue: number
  cardRevenue: number
  transferRevenue: number
  noShows: number
  cancellations: number
}

export interface LowStockAlert {
  item: InventoryItem
  shortage: number   // how much below min_stock
}

// ── API / Form types ─────────────────────────────────────────

export interface CreateAppointmentInput {
  barberId: string
  serviceId: string
  clientName: string
  clientPhone: string
  startsAt: string
  notes?: string
}

export interface RegisterPaymentInput {
  appointmentId: string
  amount: number
  method: PaymentMethod
  discountAmount?: number
  notes?: string
}

export interface CreateInventoryMovementInput {
  itemId: string
  quantity: number
  reason: string
  totalCost?: number
  notes?: string
}
