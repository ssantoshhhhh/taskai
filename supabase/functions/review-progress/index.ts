import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { tasks } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Reviewing progress for ${tasks?.length || 0} tasks`);

    // Calculate stats
    const total = tasks?.length || 0;
    const done = tasks?.filter((t: any) => t.status === 'done').length || 0;
    const inProgress = tasks?.filter((t: any) => t.status === 'in-progress').length || 0;
    const todo = tasks?.filter((t: any) => t.status === 'todo').length || 0;
    const highPriority = tasks?.filter((t: any) => t.priority === 'high' && t.status !== 'done').length || 0;

    const systemPrompt = `You are a supportive productivity coach. Analyze the user's task progress and provide encouraging, constructive feedback. Be specific about accomplishments and gentle with areas for improvement.`;

    const userPrompt = `Please review my productivity progress:

Task Statistics:
- Total tasks: ${total}
- Completed: ${done}
- In Progress: ${inProgress}  
- To Do: ${todo}
- High Priority Remaining: ${highPriority}

Completion Rate: ${total > 0 ? Math.round((done / total) * 100) : 0}%

Please provide:
1. What's going well (be specific and encouraging)
2. Areas that might need attention
3. One actionable tip for tomorrow
4. An overall productivity score (1-10) with brief explanation

Keep the response warm, supportive, and under 200 words.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const review = data.choices?.[0]?.message?.content || 'Unable to generate review';

    console.log('Review generated successfully');

    return new Response(
      JSON.stringify({ review }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in review-progress:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});