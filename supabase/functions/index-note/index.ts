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
    const { noteId, content } = await req.json();

    console.log(`Indexing note: ${noteId}`);

    // Get Pinecone credentials from environment
    const PINECONE_API_KEY = Deno.env.get('PINECONE_API_KEY');
    const PINECONE_INDEX_NAME = Deno.env.get('PINECONE_INDEX_NAME');
    const PINECONE_ENVIRONMENT = Deno.env.get('PINECONE_ENVIRONMENT');
    const PINECONE_HOST = Deno.env.get('PINECONE_HOST');

    // If Pinecone is not configured, just log and return success
    if (!PINECONE_API_KEY || (!PINECONE_INDEX_NAME && !PINECONE_HOST)) {
      console.log('Pinecone not configured (missing key or host/name), skipping vector indexing');
      return new Response(
        JSON.stringify({ success: true, message: 'Pinecone not configured, note saved without vector indexing' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a simple embedding (in production, use OpenAI or similar)
    // This is a placeholder - replace with real embedding generation
    const generateSimpleEmbedding = (text: string): number[] => {
      const embedding = new Array(1536).fill(0);
      const words = text.toLowerCase().split(/\s+/);
      words.forEach((word, i) => {
        const hash = word.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        embedding[hash % 1536] += 1 / (i + 1);
      });
      // Normalize
      const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0)) || 1;
      return embedding.map(val => val / magnitude);
    };

    const embedding = generateSimpleEmbedding(content);

    // Construct Pinecone URL: Prefer HOST if available
    let pineconeUrl = '';
    if (PINECONE_HOST) {
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
          id: noteId,
          values: embedding,
          metadata: { content: content.substring(0, 1000) }
        }]
      }),
    });

    if (!pineconeResponse.ok) {
      const errorText = await pineconeResponse.text();
      console.error('Pinecone error:', errorText);
      // Don't fail the request, just log
    } else {
      // Update note with pinecone_id
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase
        .from('notes')
        .update({ pinecone_id: noteId })
        .eq('id', noteId);

      console.log('Note indexed in Pinecone successfully');
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in index-note:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});