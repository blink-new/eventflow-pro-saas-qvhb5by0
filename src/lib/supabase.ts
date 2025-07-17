import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ubjbfdhwfszfmlulqxrg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViamJmZGh3ZnN6Zm1sdWxxeHJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NDA0MzMsImV4cCI6MjA2ODMxNjQzM30.X24TkaxQqcdhTa_lgHJLI7Do40CeIdlkp_Gp7_kdx64'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for TypeScript (using snake_case for Supabase)
export interface User {
  id: string
  user_id: string
  email: string
  full_name?: string
  avatar_url?: string
  role: 'organizer' | 'admin' | 'team_member' | 'client'
  company?: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  user_id: string
  title: string
  description?: string
  event_type: 'conference' | 'wedding' | 'festival' | 'corporate' | 'concert' | 'workshop' | 'other'
  status: 'planning' | 'active' | 'completed' | 'cancelled'
  start_date?: string
  end_date?: string
  venue_name?: string
  venue_address?: string
  max_capacity?: number
  budget_total: number
  budget_spent: number
  ticket_sales_total: number
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface EventTeamMember {
  id: string
  event_id: string
  user_id: string
  role: 'organizer' | 'finance' | 'tech_lead' | 'marketing' | 'external_partner' | 'client_view'
  permissions: Record<string, any>
  invited_by?: string
  joined_at: string
}

export interface Ticket {
  id: string
  user_id: string
  event_id: string
  name: string
  description?: string
  price: number
  quantity_total: number
  quantity_sold: number
  ticket_type: 'early_bird' | 'regular' | 'vip' | 'group' | 'free'
  sale_start_date?: string
  sale_end_date?: string
  is_active: boolean
  qr_code_data?: string
  created_at: string
  updated_at: string
}

export interface TicketSale {
  id: string
  user_id: string
  ticket_id: string
  event_id: string
  buyer_name: string
  buyer_email: string
  buyer_phone?: string
  quantity: number
  total_amount: number
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded'
  payment_method?: string
  affiliate_code?: string
  checked_in: boolean
  checked_in_at?: string
  created_at: string
}

export interface BudgetItem {
  id: string
  user_id: string
  event_id: string
  category: string
  item_name: string
  description?: string
  estimated_cost: number
  actual_cost: number
  vendor_name?: string
  vendor_contact?: string
  payment_status: 'pending' | 'paid' | 'overdue'
  payment_due_date?: string
  tax_rate: number
  is_fixed_cost: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface ArtistBooking {
  id: string
  user_id: string
  event_id: string
  name: string
  type: 'artist' | 'speaker' | 'performer' | 'dj' | 'band'
  contact_email?: string
  contact_phone?: string
  agent_name?: string
  agent_contact?: string
  fee_amount?: number
  fee_currency: string
  booking_status: 'inquiry' | 'negotiating' | 'confirmed' | 'cancelled'
  performance_date?: string
  performance_duration?: number
  technical_requirements?: string
  contract_signed: boolean
  payment_schedule: any[]
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  user_id: string
  event_id: string
  title: string
  description?: string
  category?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled'
  due_date?: string
  estimated_hours?: number
  actual_hours?: number
  depends_on?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface EventFile {
  id: string
  user_id: string
  event_id: string
  file_name: string
  file_path: string
  file_size?: number
  file_type?: string
  category?: string
  is_public: boolean
  version: number
  uploaded_by?: string
  created_at: string
}

// Database service functions using Supabase
export class DatabaseService {
  // User functions
  static async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        return {
          id: user.id,
          user_id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.user_metadata?.name,
          avatar_url: user.user_metadata?.avatar_url,
          role: 'organizer' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
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
      const { data, error } = await supabase
        .from('users')
        .upsert({
          id: userData.id,
          user_id: userData.user_id,
          email: userData.email,
          full_name: userData.full_name,
          avatar_url: userData.avatar_url,
          role: userData.role || 'organizer',
          company: userData.company,
          phone: userData.phone,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to create/update user:', error)
      throw error
    }
  }

  // Event functions
  static async getEvents(userId: string) {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get events:', error)
      throw error
    }
  }

  static async getEvent(id: string) {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to get event:', error)
      throw error
    }
  }

  static async createEvent(eventData: Partial<Event>) {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          id: eventData.id || crypto.randomUUID(),
          user_id: eventData.user_id,
          title: eventData.title,
          description: eventData.description,
          event_type: eventData.event_type,
          status: eventData.status,
          start_date: eventData.start_date,
          end_date: eventData.end_date,
          venue_name: eventData.venue_name,
          venue_address: eventData.venue_address,
          max_capacity: eventData.max_capacity,
          budget_total: eventData.budget_total || 0,
          budget_spent: eventData.budget_spent || 0,
          ticket_sales_total: eventData.ticket_sales_total || 0,
          is_public: eventData.is_public || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to create event:', error)
      throw error
    }
  }

  static async updateEvent(id: string, eventData: Partial<Event>) {
    try {
      const { data, error } = await supabase
        .from('events')
        .update({
          ...eventData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to update event:', error)
      throw error
    }
  }

  static async deleteEvent(id: string) {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      console.error('Failed to delete event:', error)
      throw error
    }
  }

  // Ticket functions
  static async getTickets(eventId: string) {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get tickets:', error)
      throw error
    }
  }

  static async createTicket(ticketData: Partial<Ticket>) {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .insert({
          ...ticketData,
          id: ticketData.id || crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to create ticket:', error)
      throw error
    }
  }

  static async updateTicket(id: string, ticketData: Partial<Ticket>) {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .update({
          ...ticketData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to update ticket:', error)
      throw error
    }
  }

  // Budget functions
  static async getBudgetItems(eventId: string) {
    try {
      const { data, error } = await supabase
        .from('budget_items')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get budget items:', error)
      throw error
    }
  }

  static async createBudgetItem(budgetData: Partial<BudgetItem>) {
    try {
      const { data, error } = await supabase
        .from('budget_items')
        .insert({
          ...budgetData,
          id: budgetData.id || crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to create budget item:', error)
      throw error
    }
  }

  static async updateBudgetItem(id: string, budgetData: Partial<BudgetItem>) {
    try {
      const { data, error } = await supabase
        .from('budget_items')
        .update({
          ...budgetData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to update budget item:', error)
      throw error
    }
  }

  // Artist booking functions
  static async getArtistBookings(eventId: string) {
    try {
      const { data, error } = await supabase
        .from('artist_bookings')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get artist bookings:', error)
      throw error
    }
  }

  static async createArtistBooking(bookingData: Partial<ArtistBooking>) {
    try {
      const { data, error } = await supabase
        .from('artist_bookings')
        .insert({
          ...bookingData,
          id: bookingData.id || crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to create artist booking:', error)
      throw error
    }
  }

  static async updateArtistBooking(id: string, bookingData: Partial<ArtistBooking>) {
    try {
      const { data, error } = await supabase
        .from('artist_bookings')
        .update({
          ...bookingData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to update artist booking:', error)
      throw error
    }
  }

  // Task functions
  static async getTasks(eventId: string) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('event_id', eventId)
        .order('due_date', { ascending: true })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get tasks:', error)
      throw error
    }
  }

  static async createTask(taskData: Partial<Task>) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          id: taskData.id || crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to create task:', error)
      throw error
    }
  }

  static async updateTask(id: string, taskData: Partial<Task>) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...taskData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to update task:', error)
      throw error
    }
  }

  // Analytics functions
  static async getEventAnalytics(eventId: string) {
    try {
      const [ticketsResult, salesResult, budgetResult, tasksResult] = await Promise.all([
        supabase.from('tickets').select('*').eq('event_id', eventId),
        supabase.from('ticket_sales').select('*').eq('event_id', eventId),
        supabase.from('budget_items').select('*').eq('event_id', eventId),
        supabase.from('tasks').select('*').eq('event_id', eventId)
      ])

      const tickets = ticketsResult.data || []
      const sales = salesResult.data || []
      const budget = budgetResult.data || []
      const tasks = tasksResult.data || []

      const totalTicketsSold = sales.reduce((sum, sale) => sum + sale.quantity, 0)
      const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0)
      const totalBudget = budget.reduce((sum, item) => sum + item.estimated_cost, 0)
      const totalSpent = budget.reduce((sum, item) => sum + item.actual_cost, 0)
      const completedTasks = tasks.filter(task => task.status === 'completed').length
      const totalTasks = tasks.length

      return {
        tickets: {
          total: tickets.reduce((sum, ticket) => sum + ticket.quantity_total, 0),
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