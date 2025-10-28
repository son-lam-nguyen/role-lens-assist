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
    const { conversation_id, worker_session_id, content } = await req.json();

    if (!conversation_id || !worker_session_id || !content) {
      throw new Error('Missing required fields');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify the conversation belongs to this worker
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('worker_id')
      .eq('id', conversation_id)
      .single();

    if (convError || !conversation) {
      throw new Error('Conversation not found');
    }

    if (conversation.worker_id !== worker_session_id) {
      throw new Error('Unauthorized');
    }

    // Send the message
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id,
        sender_id: worker_session_id,
        content,
        sender_type: 'worker'
      })
      .select()
      .single();

    if (error) throw error;

    console.log('Worker message sent:', data);

    return new Response(
      JSON.stringify({ success: true, message: data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error sending worker message:', error);
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
