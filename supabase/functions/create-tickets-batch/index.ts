import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import QRCode from 'https://esm.sh/qrcode@1.5.3'

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

    const { ticketTypeId, quantity } = await req.json()

    if (!ticketTypeId || !quantity || quantity <= 0) {
      throw new Error('Invalid parameters')
    }

    // Get ticket type details
    const { data: ticketType, error: ticketTypeError } = await supabaseClient
      .from('ticket_types')
      .select('*, events!inner(user_id)')
      .eq('id', ticketTypeId)
      .single()

    if (ticketTypeError || !ticketType) {
      throw new Error('Ticket type not found')
    }

    // Verify user owns the event
    if (ticketType.events.user_id !== user.id) {
      throw new Error('Unauthorized')
    }

    // Check if we have enough capacity
    const remainingCapacity = ticketType.quantity_total - (ticketType.quantity_sold || 0)
    if (quantity > remainingCapacity) {
      throw new Error(`Only ${remainingCapacity} tickets available`)
    }

    // Generate ticket instances
    const ticketInstances = []
    const qrCodePromises = []

    for (let i = 0; i < quantity; i++) {
      const ticketId = crypto.randomUUID()
      const qrCodeHash = `${ticketTypeId}-${ticketId}-${Date.now()}-${i}`
      
      ticketInstances.push({
        id: ticketId,
        ticket_type_id: ticketTypeId,
        event_id: ticketType.event_id,
        qr_code_hash: qrCodeHash,
        status: 'available'
      })

      // Generate QR code
      const qrCodePromise = QRCode.toDataURL(qrCodeHash, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).then(async (dataUrl) => {
        // Convert data URL to blob
        const response = await fetch(dataUrl)
        const blob = await response.blob()
        
        // Upload to Supabase Storage
        const fileName = `${qrCodeHash}.png`
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
          .from('tickets')
          .upload(`qr/${fileName}`, blob, {
            contentType: 'image/png',
            upsert: true
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          return null
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseClient.storage
          .from('tickets')
          .getPublicUrl(`qr/${fileName}`)

        return {
          ticketId,
          qrCodeUrl: publicUrl
        }
      })

      qrCodePromises.push(qrCodePromise)
    }

    // Wait for all QR codes to be generated and uploaded
    const qrCodeResults = await Promise.all(qrCodePromises)
    
    // Update ticket instances with QR code URLs
    ticketInstances.forEach((ticket, index) => {
      const qrResult = qrCodeResults[index]
      if (qrResult && qrResult.ticketId === ticket.id) {
        ticket.qr_code_url = qrResult.qrCodeUrl
      }
    })

    // Insert ticket instances
    const { data: insertedTickets, error: insertError } = await supabaseClient
      .from('ticket_instances')
      .insert(ticketInstances)
      .select()

    if (insertError) {
      throw new Error(`Failed to create tickets: ${insertError.message}`)
    }

    // Update ticket type quantity_sold
    const { error: updateError } = await supabaseClient
      .from('ticket_types')
      .update({ 
        quantity_sold: (ticketType.quantity_sold || 0) + quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketTypeId)

    if (updateError) {
      console.error('Failed to update ticket type:', updateError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        tickets: insertedTickets,
        message: `Successfully created ${quantity} tickets`
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