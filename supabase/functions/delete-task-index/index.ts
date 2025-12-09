import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { taskId } = await req.json();

    console.log(`Deleting task from index: ${taskId}`);

    const PINECONE_API_KEY = Deno.env.get('PINECONE_API_KEY');
    const PINECONE_INDEX_NAME = Deno.env.get('PINECONE_INDEX_NAME');
    const PINECONE_ENVIRONMENT = Deno.env.get('PINECONE_ENVIRONMENT');
    const PINECONE_HOST = Deno.env.get('PINECONE_HOST');

    if (!PINECONE_API_KEY || (!PINECONE_INDEX_NAME && !PINECONE_HOST)) {
      console.log('Pinecone not configured, skipping vector deletion');
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let pineconeUrl = '';
    if (PINECONE_HOST) {
      const host = PINECONE_HOST.startsWith('http') ? PINECONE_HOST : `https://${PINECONE_HOST}`;
      pineconeUrl = `${host}/vectors/delete`;
    } else {
      pineconeUrl = `https://${PINECONE_INDEX_NAME}-${PINECONE_ENVIRONMENT}.svc.pinecone.io/vectors/delete`;
    }

    const pineconeId = `task_${taskId}`;

    const pineconeResponse = await fetch(pineconeUrl, {
      method: 'POST',
      headers: {
        'Api-Key': PINECONE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ids: [pineconeId]
      }),
    });

    if (!pineconeResponse.ok) {
      const errorText = await pineconeResponse.text();
      console.error('Pinecone delete error:', errorText);
    } else {
      console.log('Task deleted from Pinecone successfully');
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in delete-task-index:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
