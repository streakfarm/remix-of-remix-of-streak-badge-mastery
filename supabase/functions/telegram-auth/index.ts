import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

function validateTelegramData(initData: string, botToken: string): TelegramUser | null {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) return null;
    params.delete("hash");
    const dataCheckArr: string[] = [];
    params.forEach((value, key) => {
      dataCheckArr.push(`${key}=${value}`);
    });
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join("\n");
    const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
    const calculatedHash = createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");
    if (calculatedHash !== hash) {
      console.error("Hash mismatch:", { calculated: calculatedHash, received: hash });
      return null;
    }
    const userJson = params.get("user");
    if (!userJson) return null;
    return JSON.parse(userJson) as TelegramUser;
  } catch (error) {
    console.error("Error validating Telegram data:", error);
    return null;
  }
}

async function processReferral(supabaseAdmin: any, referrerProfileId: string, refereeProfileId: string) {
  const REFERRER_BONUS = 100;
  const REFEREE_BONUS = 50;

  // Check if referral already exists
  const { data: existing } = await supabaseAdmin
    .from("referrals")
    .select("id")
    .eq("referee_id", refereeProfileId)
    .maybeSingle();

  if (existing) return; // Already referred

  // Create referral entry
  await supabaseAdmin.from("referrals").insert({
    referrer_id: referrerProfileId,
    referee_id: refereeProfileId,
    referrer_bonus: REFERRER_BONUS,
    referee_bonus: REFEREE_BONUS,
  });

  // Update referred_by on referee
  await supabaseAdmin
    .from("profiles")
    .update({ referred_by: referrerProfileId })
    .eq("id", refereeProfileId);

  // Get referrer current points
  const { data: referrerProfile } = await supabaseAdmin
    .from("profiles")
    .select("raw_points, total_referrals")
    .eq("id", referrerProfileId)
    .single();

  if (referrerProfile) {
    const newReferrerPoints = (referrerProfile.raw_points || 0) + REFERRER_BONUS;
    const newTotalReferrals = (referrerProfile.total_referrals || 0) + 1;

    // Update referrer points + referral count
    await supabaseAdmin
      .from("profiles")
      .update({ raw_points: newReferrerPoints, total_referrals: newTotalReferrals })
      .eq("id", referrerProfileId);

    // Log referrer points in ledger
    await supabaseAdmin.from("points_ledger").insert({
      user_id: referrerProfileId,
      amount: REFERRER_BONUS,
      balance_after: newReferrerPoints,
      source: "referral",
      source_id: refereeProfileId,
      description: `Referral bonus for inviting a friend`,
    });

    // Update referrer leaderboard
    await supabaseAdmin
      .from("leaderboards")
      .update({
        points_all_time: newReferrerPoints,
        referral_count: newTotalReferrals,
      })
      .eq("user_id", referrerProfileId);
  }

  // Get referee current points
  const { data: refereeProfile } = await supabaseAdmin
    .from("profiles")
    .select("raw_points")
    .eq("id", refereeProfileId)
    .single();

  if (refereeProfile) {
    const newRefereePoints = (refereeProfile.raw_points || 0) + REFEREE_BONUS;

    // Update referee points
    await supabaseAdmin
      .from("profiles")
      .update({ raw_points: newRefereePoints })
      .eq("id", refereeProfileId);

    // Log referee points in ledger
    await supabaseAdmin.from("points_ledger").insert({
      user_id: refereeProfileId,
      amount: REFEREE_BONUS,
      balance_after: newRefereePoints,
      source: "referral_bonus",
      source_id: referrerProfileId,
      description: `Welcome bonus from referral`,
    });
  }

  // Check referral tier upgrades for referrer
  const newCount = (referrerProfile?.total_referrals || 0) + 1;
  const { data: tiers } = await supabaseAdmin
    .from("referral_tiers")
    .select("*")
    .lte("min_referrals", newCount)
    .order("min_referrals", { ascending: false })
    .limit(1);

  if (tiers && tiers.length > 0) {
    const tier = tiers[0];
    // Check if tier bonus already awarded
    const { data: existingLedger } = await supabaseAdmin
      .from("points_ledger")
      .select("id")
      .eq("user_id", referrerProfileId)
      .eq("source", "referral_tier")
      .eq("source_id", tier.id)
      .maybeSingle();

    if (!existingLedger && tier.bonus_points > 0 && tier.min_referrals === newCount) {
      // Award tier bonus
      const { data: latestProfile } = await supabaseAdmin
        .from("profiles")
        .select("raw_points")
        .eq("id", referrerProfileId)
        .single();

      if (latestProfile) {
        const updatedPoints = (latestProfile.raw_points || 0) + tier.bonus_points;
        await supabaseAdmin
          .from("profiles")
          .update({ raw_points: updatedPoints })
          .eq("id", referrerProfileId);

        await supabaseAdmin.from("points_ledger").insert({
          user_id: referrerProfileId,
          amount: tier.bonus_points,
          balance_after: updatedPoints,
          source: "referral_tier",
          source_id: tier.id,
          description: `Referral tier "${tier.name}" bonus`,
        });
      }
    }

    // Award tier badge if applicable
    if (tier.badge_reward) {
      const { data: existingBadge } = await supabaseAdmin
        .from("user_badges")
        .select("id")
        .eq("user_id", referrerProfileId)
        .eq("badge_id", tier.badge_reward)
        .maybeSingle();

      if (!existingBadge) {
        await supabaseAdmin.from("user_badges").insert({
          user_id: referrerProfileId,
          badge_id: tier.badge_reward,
        });
      }
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { initData, startParam } = await req.json();

    if (!initData || typeof initData !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid initData" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const telegramUser = validateTelegramData(initData, botToken);
    if (!telegramUser) {
      return new Response(
        JSON.stringify({ error: "Invalid Telegram authentication data" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, user_id")
      .eq("telegram_id", telegramUser.id)
      .single();

    let userId: string;
    let profileId: string;
    const email = `tg_${telegramUser.id}@streakfarm.app`;
    const password = `tg_${telegramUser.id}_${botToken.slice(-8)}`;

    if (existingProfile) {
      userId = existingProfile.user_id;
      profileId = existingProfile.id;

      await supabaseAdmin
        .from("profiles")
        .update({
          username: telegramUser.username || null,
          first_name: telegramUser.first_name || null,
          avatar_url: telegramUser.photo_url || null,
          language_code: telegramUser.language_code || "en",
          last_active_at: new Date().toISOString(),
        })
        .eq("id", profileId);

      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        await supabaseAdmin.auth.admin.updateUserById(userId, { password });
        const { data: retryData, error: retryError } = await supabaseAdmin.auth.signInWithPassword({
          email,
          password,
        });

        if (retryError) {
          return new Response(
            JSON.stringify({ error: "Authentication failed" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            user_id: userId,
            profile_id: profileId,
            telegram_id: telegramUser.id,
            username: telegramUser.username,
            first_name: telegramUser.first_name,
            access_token: retryData.session?.access_token,
            refresh_token: retryData.session?.refresh_token,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          user_id: userId,
          profile_id: profileId,
          telegram_id: telegramUser.id,
          username: telegramUser.username,
          first_name: telegramUser.first_name,
          access_token: signInData.session?.access_token,
          refresh_token: signInData.session?.refresh_token,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Create new user
      const { data: authUser, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          telegram_id: telegramUser.id,
          username: telegramUser.username,
          first_name: telegramUser.first_name,
        },
      });

      if (signUpError || !authUser.user) {
        return new Response(
          JSON.stringify({ error: "Failed to create user" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = authUser.user.id;

      const { data: existingProfileForUser } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (existingProfileForUser) {
        const { data: updatedProfile } = await supabaseAdmin
          .from("profiles")
          .update({
            telegram_id: telegramUser.id,
            username: telegramUser.username || null,
            first_name: telegramUser.first_name || null,
            avatar_url: telegramUser.photo_url || null,
            language_code: telegramUser.language_code || "en",
          })
          .eq("user_id", userId)
          .select("id")
          .single();

        profileId = existingProfileForUser.id;
      } else {
        const { data: newProfile, error: profileError } = await supabaseAdmin
          .from("profiles")
          .insert({
            user_id: userId,
            telegram_id: telegramUser.id,
            username: telegramUser.username || null,
            first_name: telegramUser.first_name || null,
            avatar_url: telegramUser.photo_url || null,
            language_code: telegramUser.language_code || "en",
          })
          .select("id")
          .single();

        if (profileError || !newProfile) {
          return new Response(
            JSON.stringify({ error: "Failed to create profile" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        profileId = newProfile.id;

        await supabaseAdmin.from("leaderboards").insert({ user_id: profileId });
      }

      // Handle referral with full point awarding
      if (startParam) {
        const { data: referrer } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("ref_code", startParam)
          .single();

        if (referrer && referrer.id !== profileId) {
          await processReferral(supabaseAdmin, referrer.id, profileId);
        }
      }

      // Sign in the new user
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        return new Response(
          JSON.stringify({ error: "Authentication failed" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          user_id: userId,
          profile_id: profileId,
          telegram_id: telegramUser.id,
          username: telegramUser.username,
          first_name: telegramUser.first_name,
          is_new_user: true,
          access_token: signInData.session?.access_token,
          refresh_token: signInData.session?.refresh_token,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in telegram-auth:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
