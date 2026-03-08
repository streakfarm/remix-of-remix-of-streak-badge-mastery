import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.user.id;
    const { eventId } = await req.json();

    if (!eventId) {
      return new Response(JSON.stringify({ error: "eventId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, raw_points")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already joined
    const { data: existing } = await supabaseAdmin
      .from("event_participations")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", profile.id)
      .single();

    if (existing) {
      return new Response(JSON.stringify({ error: "Already joined this event" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get event
    const { data: event, error: eventError } = await supabaseAdmin
      .from("seasonal_events")
      .select("*")
      .eq("id", eventId)
      .eq("is_active", true)
      .single();

    if (eventError || !event) {
      return new Response(JSON.stringify({ error: "Event not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate join bonus points
    const joinBonus = (event.rewards as any)?.bonus_points || 0;
    const newRawPoints = (profile.raw_points || 0) + joinBonus;

    // Insert participation
    await supabaseAdmin.from("event_participations").insert({
      event_id: eventId,
      user_id: profile.id,
      points_earned: joinBonus,
    });

    // Update participant count
    await supabaseAdmin
      .from("seasonal_events")
      .update({ current_participants: (event.current_participants || 0) + 1 })
      .eq("id", eventId);

    // Award points if any
    if (joinBonus > 0) {
      await supabaseAdmin
        .from("profiles")
        .update({ raw_points: newRawPoints })
        .eq("id", profile.id);

      await supabaseAdmin.from("points_ledger").insert({
        user_id: profile.id,
        amount: joinBonus,
        balance_after: newRawPoints,
        source: "event_join",
        description: `Joined event: ${event.name}`,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        points_awarded: joinBonus,
        new_balance: newRawPoints,
        event_name: event.name,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in join-event:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
