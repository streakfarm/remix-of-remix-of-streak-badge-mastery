import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ref_code } = await req.json();

    if (!ref_code || typeof ref_code !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing ref_code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get referee profile
    const { data: refereeProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, referred_by")
      .eq("user_id", user.id)
      .single();

    if (!refereeProfile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Already has a referrer
    if (refereeProfile.referred_by) {
      return new Response(
        JSON.stringify({ error: "Already referred", already_referred: true }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if referral already exists
    const { data: existingReferral } = await supabaseAdmin
      .from("referrals")
      .select("id")
      .eq("referee_id", refereeProfile.id)
      .maybeSingle();

    if (existingReferral) {
      return new Response(
        JSON.stringify({ error: "Already referred", already_referred: true }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find referrer by ref_code
    const { data: referrer } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("ref_code", ref_code)
      .single();

    if (!referrer) {
      return new Response(
        JSON.stringify({ error: "Invalid referral code" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (referrer.id === refereeProfile.id) {
      return new Response(
        JSON.stringify({ error: "Cannot refer yourself" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const REFERRER_BONUS = 100;
    const REFEREE_BONUS = 50;

    // Create referral record
    await supabaseAdmin.from("referrals").insert({
      referrer_id: referrer.id,
      referee_id: refereeProfile.id,
      referrer_bonus: REFERRER_BONUS,
      referee_bonus: REFEREE_BONUS,
    });

    // Update referred_by
    await supabaseAdmin
      .from("profiles")
      .update({ referred_by: referrer.id })
      .eq("id", refereeProfile.id);

    // Award referrer points
    const { data: referrerProfile } = await supabaseAdmin
      .from("profiles")
      .select("raw_points, total_referrals")
      .eq("id", referrer.id)
      .single();

    if (referrerProfile) {
      const newPoints = (referrerProfile.raw_points || 0) + REFERRER_BONUS;
      const newReferrals = (referrerProfile.total_referrals || 0) + 1;

      await supabaseAdmin
        .from("profiles")
        .update({ raw_points: newPoints, total_referrals: newReferrals })
        .eq("id", referrer.id);

      await supabaseAdmin.from("points_ledger").insert({
        user_id: referrer.id,
        amount: REFERRER_BONUS,
        balance_after: newPoints,
        source: "referral",
        source_id: refereeProfile.id,
        description: "Referral bonus for inviting a friend",
      });

      // Update leaderboard
      await supabaseAdmin
        .from("leaderboards")
        .update({ points_all_time: newPoints, referral_count: newReferrals })
        .eq("user_id", referrer.id);

      // Check tier upgrade
      const { data: tiers } = await supabaseAdmin
        .from("referral_tiers")
        .select("*")
        .eq("min_referrals", newReferrals)
        .maybeSingle();

      if (tiers && tiers.bonus_points > 0) {
        const tierPoints = (referrerProfile.raw_points || 0) + REFERRER_BONUS + tiers.bonus_points;
        await supabaseAdmin
          .from("profiles")
          .update({ raw_points: tierPoints })
          .eq("id", referrer.id);

        await supabaseAdmin.from("points_ledger").insert({
          user_id: referrer.id,
          amount: tiers.bonus_points,
          balance_after: tierPoints,
          source: "referral_tier",
          source_id: tiers.id,
          description: `Referral tier "${tiers.name}" bonus`,
        });
      }

      if (tiers?.badge_reward) {
        const { data: existingBadge } = await supabaseAdmin
          .from("user_badges")
          .select("id")
          .eq("user_id", referrer.id)
          .eq("badge_id", tiers.badge_reward)
          .maybeSingle();

        if (!existingBadge) {
          await supabaseAdmin.from("user_badges").insert({
            user_id: referrer.id,
            badge_id: tiers.badge_reward,
          });
        }
      }
    }

    // Award referee bonus
    const { data: refProfile } = await supabaseAdmin
      .from("profiles")
      .select("raw_points")
      .eq("id", refereeProfile.id)
      .single();

    if (refProfile) {
      const newRefPoints = (refProfile.raw_points || 0) + REFEREE_BONUS;
      await supabaseAdmin
        .from("profiles")
        .update({ raw_points: newRefPoints })
        .eq("id", refereeProfile.id);

      await supabaseAdmin.from("points_ledger").insert({
        user_id: refereeProfile.id,
        amount: REFEREE_BONUS,
        balance_after: newRefPoints,
        source: "referral_bonus",
        source_id: referrer.id,
        description: "Welcome bonus from referral",
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        referrer_bonus: REFERRER_BONUS,
        referee_bonus: REFEREE_BONUS,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in process-referral:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
