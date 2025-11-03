import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

interface CalendarEventPayload {
  client: string;
  title: string;
  risk: 'low' | 'moderate' | 'high';
  date?: string;
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

    // Get userId from query parameters (optional)
    const url = new URL(req.url);
    let userId = url.searchParams.get('userId');

    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // If no userId provided, get the first available user
    if (!userId) {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .single();

      if (profileError || !profiles) {
        return new Response(
          JSON.stringify({ 
            error: 'No user found. Please provide userId query parameter or ensure at least one user exists.' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      userId = profiles.id;
      console.log('No userId provided, using default user:', userId);
    }

    // Parse request body - expecting an array of events
    const rawBody = await req.json();
    const payloads: CalendarEventPayload[] = Array.isArray(rawBody) ? rawBody : [rawBody];
    console.log('Received calendar events:', payloads);

    const results = [];
    const errors = [];

    for (const payload of payloads) {
      try {
        // Validate required fields
        if (!payload.client || !payload.title || !payload.risk || !payload.startTime || !payload.endTime) {
          errors.push({
            payload,
            error: 'Missing required fields. Required: client, title, risk, startTime, endTime'
          });
          continue;
        }

        // Validate risk level
        if (!['low', 'moderate', 'high'].includes(payload.risk)) {
          errors.push({
            payload,
            error: 'Invalid risk level. Must be: low, moderate, or high'
          });
          continue;
        }

        // Use ISO timestamps directly from payload
        const startISO = payload.startTime;
        const endISO = payload.endTime;

        // Check if client exists, if not create one
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', userId)
          .eq('name', payload.client.trim())
          .single();

        if (!existingClient) {
          const { error: clientError } = await supabase
            .from('clients')
            .insert({
              user_id: userId,
              name: payload.client.trim(),
              age: 0,
              gender: 'Unknown',
              contact: 'N/A',
              risk_level: payload.risk,
              assigned_worker: 'Unassigned',
              notes: 'Auto-created from webhook'
            });

          if (clientError) {
            console.error('Error creating client:', clientError);
          } else {
            console.log('Auto-created client:', payload.client.trim());
          }
        }

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
            notes: payload.notes && payload.notes !== 'None' ? payload.notes.trim() : null,
          })
          .select()
          .single();

        if (error) {
          console.error('Database error:', error);
          errors.push({
            payload,
            error: error.message
          });
          continue;
        }

        console.log('Calendar event created:', data);
        results.push(data);
      } catch (eventError) {
        console.error('Error processing event:', eventError);
        errors.push({
          payload,
          error: eventError instanceof Error ? eventError.message : 'Unknown error'
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${results.length} event(s)`,
        created: results.length,
        failed: errors.length,
        data: results,
        errors: errors.length > 0 ? errors : undefined
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
