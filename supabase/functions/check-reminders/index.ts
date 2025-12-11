import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import nodemailer from "npm:nodemailer@6.9.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const transporter = nodemailer.createTransport({
  host: Deno.env.get("SMTP_HOST") || "smtp.gmail.com",
  port: parseInt(Deno.env.get("SMTP_PORT") || "587"),
  secure: false,
  auth: {
    user: Deno.env.get("SMTP_USER"),
    pass: Deno.env.get("SMTP_PASS"),
  },
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get current time in HH:MM format (UTC)
    // Note: To support user local times, we'd need timezone info in the DB.
    // For now, we will log the time being checked.
    const now = new Date();

    // We can allow passing a specific time via query param for testing purposes
    // ?time=14:30
    const url = new URL(req.url);
    const timeParam = url.searchParams.get("time");

    let hours = String(now.getUTCHours()).padStart(2, '0');
    let minutes = String(now.getUTCMinutes()).padStart(2, '0');
    let currentTime = `${hours}:${minutes}`;

    if (timeParam) {
      currentTime = timeParam;
      console.log(`Using provided time param: ${currentTime}`);
    } else {
      console.log(`Checking for reminders at UTC time: ${currentTime}`);
    }

    // 1. Get profiles that have a reminder set for this time
    // Note: This relies on the user setting their 'reminder_time' to match the server check time
    // or us adjusting for it. If the server is UTC, users setting 09:00 will get it at 09:00 UTC.
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('reminder_time', currentTime);

    if (profileError) {
      throw new Error(`Error fetching profiles: ${profileError.message}`);
    }

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: `No reminders scheduled for ${currentTime}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log(`Found ${profiles.length} users to remind.`);
    let sentCount = 0;

    // 2. For each profile, get pending tasks and send email
    for (const profile of profiles) {
      if (!profile.email) continue;

      const { data: tasks, error: tasksError } = await supabaseAdmin
        .from('tasks')
        .select('*')
        .eq('user_id', profile.user_id)
        .neq('status', 'done');

      if (tasksError) {
        console.error(`Error fetching tasks for user ${profile.user_id}:`, tasksError);
        continue;
      }

      if (!tasks || tasks.length === 0) {
        console.log(`User ${profile.email} has no pending tasks.`);
        continue;
      }

      // Construct Email Content
      const taskListHtml = tasks.map((t: any) => `
            <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                <strong style="font-size: 16px;">${t.title}</strong>
                <br/>
                <span style="color: #666; font-size: 14px;">Status: ${t.status} | Priority: ${t.priority}</span>
                ${t.due_date ? `<br/><span style="color: #e53935; font-size: 12px;">Due: ${new Date(t.due_date).toLocaleDateString()}</span>` : ''}
            </div>
        `).join('');

      const mailOptions = {
        from: Deno.env.get("SMTP_FROM") || '"TaskAI" <no-reply@taskai.app>',
        to: profile.email,
        subject: `You have ${tasks.length} pending tasks`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Daily Task Reminder</h2>
                <p>Hello ${profile.name || 'User'},</p>
                <p>Here are your tasks for today:</p>
                <div style="background-color: #fafafa; padding: 20px; border-radius: 8px; border: 1px solid #eee;">
                    ${taskListHtml}
                </div>
                <p style="margin-top: 20px; color: #888; font-size: 12px;">
                    You received this email because you enabled daily reminders at ${currentTime}.
                </p>
            </div>
            `,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`Reminder email sent to ${profile.email}`);
        sentCount++;
      } catch (mailError) {
        console.error(`Failed to send email to ${profile.email}:`, mailError);
      }
    }

    return new Response(JSON.stringify({ message: `Processed ${profiles.length} profiles, sent ${sentCount} emails.` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
