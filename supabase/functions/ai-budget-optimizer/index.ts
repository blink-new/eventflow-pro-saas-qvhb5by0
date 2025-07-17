import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Set the auth context
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { eventId } = await req.json()

    if (!eventId) {
      throw new Error('Event ID is required')
    }

    // Get event details
    const { data: event, error: eventError } = await supabaseClient
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('user_id', user.id)
      .single()

    if (eventError || !event) {
      throw new Error('Event not found or unauthorized')
    }

    // Get budget items
    const { data: budgetItems, error: budgetError } = await supabaseClient
      .from('budget_items')
      .select('*')
      .eq('event_id', eventId)

    if (budgetError) {
      throw new Error('Failed to fetch budget items')
    }

    // Get ticket sales for revenue calculation
    const { data: ticketTypes, error: ticketError } = await supabaseClient
      .from('ticket_types')
      .select('*')
      .eq('event_id', eventId)

    if (ticketError) {
      throw new Error('Failed to fetch ticket data')
    }

    // Calculate revenue
    const totalRevenue = ticketTypes?.reduce((sum, ticket) => 
      sum + (ticket.price * (ticket.quantity_sold || 0)), 0) || 0

    // Calculate total budget and spending
    const totalBudget = budgetItems?.reduce((sum, item) => sum + item.estimated_cost, 0) || 0
    const totalSpent = budgetItems?.reduce((sum, item) => sum + (item.actual_cost || 0), 0) || 0

    // Identify overspend items
    const overspendItems = budgetItems?.filter(item => 
      (item.actual_cost || 0) > item.estimated_cost
    ) || []

    // Prepare data for AI analysis
    const analysisData = {
      event: {
        title: event.title,
        type: event.event_type,
        budget_total: event.budget_total,
        capacity: event.max_capacity
      },
      financials: {
        total_revenue: totalRevenue,
        total_budget: totalBudget,
        total_spent: totalSpent,
        margin: totalRevenue - totalSpent,
        margin_percentage: totalRevenue > 0 ? ((totalRevenue - totalSpent) / totalRevenue) * 100 : 0
      },
      budget_items: budgetItems?.map(item => ({
        category: item.category,
        name: item.item_name,
        estimated: item.estimated_cost,
        actual: item.actual_cost || 0,
        overspend: (item.actual_cost || 0) - item.estimated_cost,
        vendor: item.vendor_name
      })),
      overspend_items: overspendItems.map(item => ({
        category: item.category,
        name: item.item_name,
        overspend_amount: (item.actual_cost || 0) - item.estimated_cost,
        percentage_over: ((item.actual_cost || 0) / item.estimated_cost - 1) * 100
      }))
    }

    // Call OpenAI API
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const prompt = `
You are an expert event budget optimizer. Analyze the following event budget data and provide 3 specific, actionable cost optimization suggestions.

Event Data:
${JSON.stringify(analysisData, null, 2)}

Please provide exactly 3 suggestions in the following JSON format:
{
  "suggestions": [
    {
      "title": "Brief title of the suggestion",
      "description": "Detailed explanation of the optimization",
      "potential_savings": "Estimated savings amount or percentage",
      "priority": "high|medium|low",
      "category": "Category this affects"
    }
  ]
}

Focus on:
1. Items that are over budget
2. Categories with high spending
3. Opportunities to improve profit margins
4. Vendor negotiations or alternatives
5. Process improvements

Make suggestions specific to the event type and realistic for the budget scale.
`

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert event budget optimizer. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    if (!openaiResponse.ok) {
      throw new Error('Failed to get AI suggestions')
    }

    const openaiData = await openaiResponse.json()
    const aiContent = openaiData.choices[0]?.message?.content

    if (!aiContent) {
      throw new Error('No AI response received')
    }

    // Parse AI response
    let suggestions
    try {
      const parsed = JSON.parse(aiContent)
      suggestions = parsed.suggestions || []
    } catch (e) {
      // Fallback if JSON parsing fails
      suggestions = [
        {
          title: "Review Vendor Contracts",
          description: "Negotiate better rates with vendors or find alternative suppliers for overspend categories.",
          potential_savings: "10-20%",
          priority: "high",
          category: "Vendor Management"
        },
        {
          title: "Optimize Resource Allocation",
          description: "Reallocate budget from underutilized categories to areas that drive more value.",
          potential_savings: "5-15%",
          priority: "medium",
          category: "Budget Planning"
        },
        {
          title: "Implement Cost Controls",
          description: "Set up approval processes for expenses above certain thresholds to prevent overspending.",
          potential_savings: "Variable",
          priority: "medium",
          category: "Process Improvement"
        }
      ]
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisData,
        suggestions: suggestions.slice(0, 3), // Ensure only 3 suggestions
        generated_at: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})