import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { worker_session_id } = await req.json();

    if (!worker_session_id) {
      throw new Error('Missing worker_session_id');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get waiting conversations
    const { data: waiting, error: waitingError } = await supabase
      .from('conversations')
      .select('*')
      .eq('status', 'waiting')
      .order('created_at', { ascending: true });

    if (waitingError) throw waitingError;

    // Get active conversations for this worker
    const { data: active, error: activeError } = await supabase
      .from('conversations')
      .select('*')
      .eq('worker_id', worker_session_id)
      .order('updated_at', { ascending: false });

    if (activeError) throw activeError;

    console.log('Worker conversations fetched:', { waiting: waiting?.length, active: active?.length });

    return new Response(
      JSON.stringify({ 
        waiting: waiting || [],
        active: active || []
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error fetching worker conversations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
