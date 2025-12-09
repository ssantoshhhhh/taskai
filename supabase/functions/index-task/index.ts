import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { taskId, title, description, status, priority } = await req.json();

    console.log(`Indexing task: ${taskId}`);

    // Get Pinecone credentials from environment
    const PINECONE_API_KEY = Deno.env.get('PINECONE_API_KEY');
    const PINECONE_INDEX_NAME = Deno.env.get('PINECONE_INDEX_NAME');
    const PINECONE_ENVIRONMENT = Deno.env.get('PINECONE_ENVIRONMENT');
    const PINECONE_HOST = Deno.env.get('PINECONE_HOST');

    // If Pinecone is not configured, just log and return success
    if (!PINECONE_API_KEY || (!PINECONE_INDEX_NAME && !PINECONE_HOST)) {
      console.log('Pinecone not configured (missing key or host/name), skipping vector indexing');
      return new Response(
        JSON.stringify({ success: true, message: 'Pinecone not configured, task saved without vector indexing' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a simple embedding (in production, use OpenAI or similar)
    const generateSimpleEmbedding = (text: string): number[] => {
      const embedding = new Array(1536).fill(0); // 1536 dims
      const words = text.toLowerCase().split(/\s+/);
      words.forEach((word, i) => {
        const hash = word.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        embedding[hash % 1536] += 1 / (i + 1);
      });
      // Normalize
      const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0)) || 1;
      return embedding.map(val => val / magnitude);
    };

    const taskContent = `Title: ${title}\nDescription: ${description || ''}\nStatus: ${status}\nPriority: ${priority}`;
    const embedding = generateSimpleEmbedding(taskContent);

    // Construct Pinecone URL: Prefer HOST if available (New Serverless Index style), else fallback to Pod style
    let pineconeUrl = '';
    if (PINECONE_HOST) {
      // If host doesn't start with https, add it
      const host = PINECONE_HOST.startsWith('http') ? PINECONE_HOST : `https://${PINECONE_HOST}`;
      pineconeUrl = `${host}/vectors/upsert`;
    } else {
      pineconeUrl = `https://${PINECONE_INDEX_NAME}-${PINECONE_ENVIRONMENT}.svc.pinecone.io/vectors/upsert`;
    }

    console.log(`Sending to Pinecone URL: ${pineconeUrl}`);

    const pineconeResponse = await fetch(pineconeUrl, {
      method: 'POST',
      headers: {
        'Api-Key': PINECONE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vectors: [{
          id: `task_${taskId}`,
          values: embedding,
          metadata: {
            type: 'task',
            taskId,
            title,
            description: description || '',
            status,
            priority
          }
        }]
      }),
    });

    if (!pineconeResponse.ok) {
      const errorText = await pineconeResponse.text();
      console.error('Pinecone Upsert Error:', pineconeResponse.status, errorText);
    } else {
      console.log('Task indexed in Pinecone successfully');
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in index-task:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
