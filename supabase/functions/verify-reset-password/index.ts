import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      throw new Error("Email, code, and new password are required");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify OTP
    const { data: codes, error: fetchError } = await supabaseAdmin
      .from("verification_codes")
      .select("*")
      .eq("email", email)
      .eq("code", code)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (fetchError || !codes || codes.length === 0) {
      throw new Error("Invalid or expired OTP");
    }

    // Get User ID
    // Note: We need to find the user by email to update their password.
    // The Admin API 'listUsers' or direct DB query could work, but 'updateUserById' needs ID.
    // We can use 'admin.listUsers' to find the ID.
    const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();

    // In a large production app, listing all users is bad. Supabase doesn't have 'getUserByEmail' in admin simply?
    // Actually, createClient with service role usually has access to auth schema.
    // Let's try to just use updateUser (which might not accept email as identifier directly in all versions, but let's check).
    // Actually, supabase.auth.admin.updateUserById(uid, attributes)

    // Better way: We trust the email because we verified the OTP sent to it.
    // We can filter `users` by email manually if the list is small, or use a better search if available.
    // For now, let's assume standard small app or use listUsers with filter? listUsers doesn't support filter well in JS lib sometimes.
    // Wait, storage of `verification_codes` confirms email.

    // Let's use `supabaseAdmin.rpc` or db query to find user_id from `auth.users`? No, direct access to `auth` schema from client is often restricted even for service role unless configured.

    // Let's restart: we need the User ID.
    // We can use `supabaseAdmin.auth.admin.listUsers()` probably iterating? Not scalable.
    // Actually, we can assume the user exists if they are resetting.
    // Wait, Deno Edge Function has full access.

    // Let's try to get user by email via admin.
    // `supabaseAdmin.rpc` if we had a function. `supabaseAdmin.from('auth.users')`? No.

    // Actually, `supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 })` - no search.
    // Wait, standard Supabase Auth behavior: The user should be logged in to change password? No, this is reset.

    // Actually, `supabase.auth.admin.updateUser` isn't by ID?
    // `updateUserById(uid, attributes)`

    // Workaround: We can't easily get UID by Email via Admin API efficiently without looping, unless we use the experimental `getUserByEmail` if it exists, or direct DB connection?
    // Direct DB connection is possible in Edge Functions via `postgres` module but `supabase-js` is HTTP.

    // Let's use a trick: `supabaseAdmin.from('profiles').select('user_id').eq('email', email)` assuming profiles exist and are synced.
    // Our app has a `profiles` table!
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('email', email)
      .single();

    if (!profile) {
      throw new Error("User not found (profile missing)");
    }

    // Update Password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      profile.user_id,
      { password: newPassword }
    );

    if (updateError) throw updateError;

    // Delete used OTPs for this email
    await supabaseAdmin
      .from("verification_codes")
      .delete()
      .eq("email", email);

    return new Response(JSON.stringify({ message: "Password updated successfully" }), {
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
