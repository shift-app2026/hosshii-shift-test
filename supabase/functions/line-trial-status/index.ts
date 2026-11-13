import { isolatedEnvironmentReady } from '../_shared/isolation.ts';
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const LINE_CHANNEL_ID = "2011929118";
const TRIAL_DAYS = 21;
const TERMS_VERSION = "2026-10-29";
const PRIVACY_VERSION = "2026-10-29";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://shift-app2026.github.io",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400"
};

const reply = (data: Record<string, unknown>, status = 200) =>
  Response.json(data, { status, headers: corsHeaders });

Deno.serve(async (req) => {
  if (!isolatedEnvironmentReady((name: string) => Deno.env.get(name))) {
    return reply({ error: "Isolated environment is not configured" }, 503);
  }

  if (req.method === "OPTIONS")
    return new Response(null, { status: 204, headers: corsHeaders });

  if (req.method !== "POST")
    return reply({ error: "POST required" }, 405);

  try {
    const body = await req.json();
    const { idToken, consentAccepted, termsVersion, privacyVersion } = body;

    if (typeof idToken !== "string" || !idToken)
      return reply({ error: "ID token required" }, 400);

    const params = new URLSearchParams({
      id_token: idToken,
      client_id: LINE_CHANNEL_ID
    });

    const verification = await fetch(
      "https://api.line.me/oauth2/v2.1/verify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
      }
    );

    if (!verification.ok)
      return reply({ error: "LINE authentication failed" }, 401);

    const verified = await verification.json();

    if (verified.aud !== LINE_CHANNEL_ID || !verified.sub)
      return reply({ error: "Invalid LINE user" }, 401);

    const lineUserId: string = verified.sub;

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    let secretKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!secretKey) {
      const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
      if (raw) {
        const keys = JSON.parse(raw);
        secretKey =
          Object.values(keys).find(
            (v): v is string => typeof v === "string" && v.length > 0
          ) || "";
      }
    }

    if (!supabaseUrl || !secretKey)
      throw new Error("Supabase configuration missing");

    const db = createClient(supabaseUrl, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const columns =
      "trial_started_at,trial_ends_at,purchased_at,consent_accepted_at,terms_version,privacy_version,application_code,subscription_id,subscription_status,payment_status";

    const fetchUser = async () => {
      const { data, error } = await db
        .from("app_users")
        .select(columns)
        .eq("line_user_id", lineUserId)
        .maybeSingle();

      if (error) throw error;
      return data;
    };

    let user = await fetchUser();

    const consentRecorded = !!(
      user?.consent_accepted_at &&
      user?.terms_version &&
      user?.privacy_version
    );

    if (!consentRecorded) {
      if (consentAccepted !== true)
        return reply({
          authenticated: true,
          consentRequired: true,
          status: "new"
        });

      if (
        termsVersion !== TERMS_VERSION ||
        privacyVersion !== PRIVACY_VERSION
      )
        return reply({ error: "Document versions do not match" }, 409);

      const now = new Date().toISOString();

      if (!user) {
        const { error } = await db.from("app_users").insert({
          line_user_id: lineUserId,
          trial_started_at: now,
          consent_accepted_at: now,
          terms_version: TERMS_VERSION,
          privacy_version: PRIVACY_VERSION
        });

        if (error && error.code !== "23505") throw error;
      } else {
        const update: Record<string, string> = {
          consent_accepted_at: now,
          terms_version: TERMS_VERSION,
          privacy_version: PRIVACY_VERSION
        };

        if (!user.trial_started_at)
          update.trial_started_at = now;

        const { error } = await db
          .from("app_users")
          .update(update)
          .eq("line_user_id", lineUserId)
          .is("consent_accepted_at", null);

        if (error) throw error;
      }

      user = await fetchUser();

      if (!user?.consent_accepted_at)
        throw new Error("Consent record unavailable");
    }

    if (!user?.trial_started_at)
      throw new Error("Trial record unavailable");

    const startedAt = new Date(user.trial_started_at);

    const expiresAt = user.trial_ends_at
      ? new Date(user.trial_ends_at)
      : new Date(startedAt.getTime() + TRIAL_DAYS * 86400000);

    const trialActive = Date.now() < expiresAt.getTime();
    const paid = Boolean(user.purchased_at);

    return reply({
      authenticated: true,
      consentRequired: false,
      status: paid ? "paid" : trialActive ? "trialing" : "expired",
      trialStartedAt: startedAt.toISOString(),
      trialExpiresAt: expiresAt.toISOString(),
      trialActive,
      remainingDays: Math.max(
        0,
        Math.ceil((expiresAt.getTime() - Date.now()) / 86400000)
      ),
      purchaseRecorded: paid,
      applicationCode: user.application_code
    });
  } catch (error) {
    console.error("Trial status error", error);
    return reply({ error: "Internal server error" }, 500);
  }
});
