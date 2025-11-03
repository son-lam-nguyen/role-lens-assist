import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

interface CalendarEventPayload {
  client: string;
  title: string;
  risk: 'low' | 'moderate' | 'high';
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify webhook secret
    const webhookSecret = req.headers.get('x-webhook-secret');
    const expectedSecret = Deno.env.get('CALENDAR_WEBHOOK_SECRET');

    if (!webhookSecret || webhookSecret !== expectedSecret) {
      console.error('Invalid or missing webhook secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid webhook secret' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get userId from query parameters
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing userId query parameter' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const payload: CalendarEventPayload = await req.json();
    console.log('Received calendar event:', payload);

    // Validate required fields
    if (!payload.client || !payload.title || !payload.risk || !payload.date || !payload.startTime || !payload.endTime) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields. Required: client, title, risk, date, startTime, endTime' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate risk level
    if (!['low', 'moderate', 'high'].includes(payload.risk)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid risk level. Must be: low, moderate, or high' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create ISO timestamps
    const startISO = `${payload.date}T${payload.startTime}:00`;
    const endISO = `${payload.date}T${payload.endTime}:00`;

    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert calendar event
    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        user_id: userId,
        client: payload.client.trim(),
        title: payload.title.trim(),
        risk: payload.risk,
        start_time: startISO,
        end_time: endISO,
        notes: payload.notes?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create calendar event', 
          details: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Calendar event created successfully:', data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Calendar event created successfully',
        data: data
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error processing webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
