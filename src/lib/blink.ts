import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: 'eventflow-pro-saas-qvhb5by0',
  authRequired: true
})

// Database types for TypeScript (using camelCase for Blink SDK)
export interface User {
  id: string
  email: string
  fullName?: string
  avatarUrl?: string
  role: 'organizer' | 'admin' | 'team_member' | 'client'
  company?: string
  phone?: string
  createdAt: string
  updatedAt: string
}

export interface Event {
  id: string
  userId: string
  title: string
  description?: string
  eventType: 'conference' | 'wedding' | 'festival' | 'corporate' | 'concert' | 'workshop' | 'other'
  status: 'planning' | 'active' | 'completed' | 'cancelled'
  startDate?: string
  endDate?: string
  venueName?: string
  venueAddress?: string
  maxCapacity?: number
  budgetTotal: number
  budgetSpent: number
  ticketSalesTotal: number
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export interface EventTeamMember {
  id: string
  eventId: string
  userId: string
  role: 'organizer' | 'finance' | 'tech_lead' | 'marketing' | 'external_partner' | 'client_view'
  permissions: Record<string, any>
  invitedBy?: string
  joinedAt: string
}

export interface Ticket {
  id: string
  eventId: string
  name: string
  description?: string
  price: number
  quantityTotal: number
  quantitySold: number
  ticketType: 'early_bird' | 'regular' | 'vip' | 'group' | 'free'
  saleStartDate?: string
  saleEndDate?: string
  isActive: boolean
  qrCodeData?: string
  createdAt: string
  updatedAt: string
}

export interface TicketSale {
  id: string
  ticketId: string
  eventId: string
  buyerName: string
  buyerEmail: string
  buyerPhone?: string
  quantity: number
  totalAmount: number
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded'
  paymentMethod?: string
  affiliateCode?: string
  checkedIn: boolean
  checkedInAt?: string
  createdAt: string
}

export interface BudgetItem {
  id: string
  eventId: string
  category: string
  itemName: string
  description?: string
  estimatedCost: number
  actualCost: number
  vendorName?: string
  vendorContact?: string
  paymentStatus: 'pending' | 'paid' | 'overdue'
  paymentDueDate?: string
  taxRate: number
  isFixedCost: boolean
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export interface ArtistBooking {
  id: string
  eventId: string
  name: string
  type: 'artist' | 'speaker' | 'performer' | 'dj' | 'band'
  contactEmail?: string
  contactPhone?: string
  agentName?: string
  agentContact?: string
  feeAmount?: number
  feeCurrency: string
  bookingStatus: 'inquiry' | 'negotiating' | 'confirmed' | 'cancelled'
  performanceDate?: string
  performanceDuration?: number
  technicalRequirements?: string
  contractSigned: boolean
  paymentSchedule: any[]
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  eventId: string
  title: string
  description?: string
  category?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled'
  dueDate?: string
  estimatedHours?: number
  actualHours?: number
  dependsOn?: string
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export interface EventFile {
  id: string
  eventId: string
  fileName: string
  filePath: string
  fileSize?: number
  fileType?: string
  category?: string
  isPublic: boolean
  version: number
  uploadedBy?: string
  createdAt: string
}

// Database service functions using Blink SDK
export class DatabaseService {
  // User functions
  static async getCurrentUser() {
    try {
      const blinkUser = await blink.auth.me()
      if (blinkUser) {
        return {
          id: blinkUser.id,
          email: blinkUser.email,
          fullName: blinkUser.displayName || blinkUser.name,
          avatarUrl: blinkUser.avatar,
          role: 'organizer' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
      return null
    } catch (error) {
      console.error('Failed to get current user:', error)
      return null
    }
  }

  static async createOrUpdateUser(userData: Partial<User>) {
    try {
      const result = await blink.db.users.upsert({
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName,
        avatarUrl: userData.avatarUrl,
        role: userData.role || 'organizer',
        company: userData.company,
        phone: userData.phone
      })
      return result
    } catch (error) {
      console.error('Failed to create/update user:', error)
      throw error
    }
  }

  // Event functions
  static async getEvents(userId: string) {
    try {
      const events = await blink.db.events.list({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })
      return events || []
    } catch (error) {
      console.error('Failed to get events:', error)
      throw error
    }
  }

  static async getEvent(id: string) {
    try {
      const events = await blink.db.events.list({
        where: { id },
        limit: 1
      })
      return events?.[0] || null
    } catch (error) {
      console.error('Failed to get event:', error)
      throw error
    }
  }

  static async createEvent(eventData: Partial<Event>) {
    try {
      const result = await blink.db.events.create({
        id: eventData.id || crypto.randomUUID(),
        userId: eventData.userId,
        title: eventData.title,
        description: eventData.description,
        eventType: eventData.eventType,
        status: eventData.status,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        venueName: eventData.venueName,
        venueAddress: eventData.venueAddress,
        maxCapacity: eventData.maxCapacity,
        budgetTotal: eventData.budgetTotal || 0,
        budgetSpent: eventData.budgetSpent || 0,
        ticketSalesTotal: eventData.ticketSalesTotal || 0,
        isPublic: eventData.isPublic || false
      })
      return result
    } catch (error) {
      console.error('Failed to create event:', error)
      throw error
    }
  }

  static async updateEvent(id: string, eventData: Partial<Event>) {
    try {
      const result = await blink.db.events.update(id, eventData)
      return result
    } catch (error) {
      console.error('Failed to update event:', error)
      throw error
    }
  }

  static async deleteEvent(id: string) {
    try {
      await blink.db.events.delete(id)
    } catch (error) {
      console.error('Failed to delete event:', error)
      throw error
    }
  }

  // Ticket functions
  static async getTickets(eventId: string) {
    try {
      const tickets = await blink.db.tickets.list({
        where: { eventId },
        orderBy: { createdAt: 'desc' }
      })
      return tickets || []
    } catch (error) {
      console.error('Failed to get tickets:', error)
      throw error
    }
  }

  static async createTicket(ticketData: Partial<Ticket>) {
    try {
      const result = await blink.db.tickets.create(ticketData)
      return result
    } catch (error) {
      console.error('Failed to create ticket:', error)
      throw error
    }
  }

  static async updateTicket(id: string, ticketData: Partial<Ticket>) {
    try {
      const result = await blink.db.tickets.update(id, ticketData)
      return result
    } catch (error) {
      console.error('Failed to update ticket:', error)
      throw error
    }
  }

  // Budget functions
  static async getBudgetItems(eventId: string) {
    try {
      const budgetItems = await blink.db.budgetItems.list({
        where: { eventId },
        orderBy: { createdAt: 'desc' }
      })
      return budgetItems || []
    } catch (error) {
      console.error('Failed to get budget items:', error)
      throw error
    }
  }

  static async createBudgetItem(budgetData: Partial<BudgetItem>) {
    try {
      const result = await blink.db.budgetItems.create(budgetData)
      return result
    } catch (error) {
      console.error('Failed to create budget item:', error)
      throw error
    }
  }

  static async updateBudgetItem(id: string, budgetData: Partial<BudgetItem>) {
    try {
      const result = await blink.db.budgetItems.update(id, budgetData)
      return result
    } catch (error) {
      console.error('Failed to update budget item:', error)
      throw error
    }
  }

  // Artist booking functions
  static async getArtistBookings(eventId: string) {
    try {
      const artistBookings = await blink.db.artistBookings.list({
        where: { eventId },
        orderBy: { createdAt: 'desc' }
      })
      return artistBookings || []
    } catch (error) {
      console.error('Failed to get artist bookings:', error)
      throw error
    }
  }

  static async createArtistBooking(bookingData: Partial<ArtistBooking>) {
    try {
      const result = await blink.db.artistBookings.create(bookingData)
      return result
    } catch (error) {
      console.error('Failed to create artist booking:', error)
      throw error
    }
  }

  static async updateArtistBooking(id: string, bookingData: Partial<ArtistBooking>) {
    try {
      const result = await blink.db.artistBookings.update(id, bookingData)
      return result
    } catch (error) {
      console.error('Failed to update artist booking:', error)
      throw error
    }
  }

  // Task functions
  static async getTasks(eventId: string) {
    try {
      const tasks = await blink.db.tasks.list({
        where: { eventId },
        orderBy: { dueDate: 'asc' }
      })
      return tasks || []
    } catch (error) {
      console.error('Failed to get tasks:', error)
      throw error
    }
  }

  static async createTask(taskData: Partial<Task>) {
    try {
      const result = await blink.db.tasks.create(taskData)
      return result
    } catch (error) {
      console.error('Failed to create task:', error)
      throw error
    }
  }

  static async updateTask(id: string, taskData: Partial<Task>) {
    try {
      const result = await blink.db.tasks.update(id, taskData)
      return result
    } catch (error) {
      console.error('Failed to update task:', error)
      throw error
    }
  }

  // Analytics functions
  static async getEventAnalytics(eventId: string) {
    try {
      const [tickets, sales, budget, tasks] = await Promise.all([
        this.getTickets(eventId),
        blink.db.ticketSales.list({ where: { eventId } }),
        this.getBudgetItems(eventId),
        this.getTasks(eventId)
      ])

      const salesData = sales || []
      const totalTicketsSold = salesData.reduce((sum, sale) => sum + sale.quantity, 0)
      const totalRevenue = salesData.reduce((sum, sale) => sum + sale.totalAmount, 0)
      const totalBudget = budget.reduce((sum, item) => sum + item.estimatedCost, 0)
      const totalSpent = budget.reduce((sum, item) => sum + item.actualCost, 0)
      const completedTasks = tasks.filter(task => task.status === 'completed').length
      const totalTasks = tasks.length

      return {
        tickets: {
          total: tickets.reduce((sum, ticket) => sum + ticket.quantityTotal, 0),
          sold: totalTicketsSold,
          revenue: totalRevenue
        },
        budget: {
          total: totalBudget,
          spent: totalSpent,
          remaining: totalBudget - totalSpent
        },
        tasks: {
          completed: completedTasks,
          total: totalTasks,
          progress: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
        }
      }
    } catch (error) {
      console.error('Failed to get event analytics:', error)
      throw error
    }
  }
}