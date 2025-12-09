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
    const { tasks, timeFrame } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Generating plan for ${tasks?.length || 0} tasks, timeFrame: ${timeFrame}`);

    // Format tasks for the AI
    const taskList = tasks?.map((t: any, i: number) => 
      `${i + 1}. [${t.priority?.toUpperCase()}] ${t.title}${t.due_date ? ` (Due: ${t.due_date})` : ''} - ${t.status}`
    ).join('\n') || 'No tasks provided';

    const systemPrompt = `You are a productivity expert and task management AI. Your job is to create clear, actionable daily plans based on the user's tasks. Consider task priorities, due dates, and optimal work patterns.

Guidelines:
- Prioritize high-priority and time-sensitive tasks
- Group related tasks together when possible
- Include short breaks between intensive work sessions
- Be specific about timing and duration
- Keep the plan realistic and achievable`;

    const userPrompt = `Create a productivity plan for ${timeFrame || 'today'} based on these tasks:

${taskList}

Please provide:
1. A prioritized order of tasks
2. Suggested time blocks for each task
3. Any tips for staying focused
4. Estimated completion times

Keep the response concise but actionable.`;

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
    const plan = data.choices?.[0]?.message?.content || 'Unable to generate plan';

    console.log('Plan generated successfully');

    return new Response(
      JSON.stringify({ plan }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-plan:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});