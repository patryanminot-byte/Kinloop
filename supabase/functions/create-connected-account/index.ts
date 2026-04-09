// supabase/functions/create-connected-account/index.ts
// Deno Edge Function — creates a Stripe Connect Express account and returns
// an onboarding link so the seller can complete identity verification.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-04-10",
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { userId, email, name } = await req.json();

    if (!userId || !email) {
      return new Response(
        JSON.stringify({ error: "userId and email are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Create a Connect Express account
    const account = await stripe.accounts.create({
      type: "express",
      email,
      metadata: { watasu_user_id: userId },
      business_profile: { name: name ?? undefined },
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
    });

    // Generate an onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${Deno.env.get("APP_URL")}/stripe/refresh`,
      return_url: `${Deno.env.get("APP_URL")}/stripe/return`,
      type: "account_onboarding",
    });

    // TODO: persist account.id to the profiles table
    // e.g. supabase.from("profiles").update({ stripe_account_id: account.id }).eq("id", userId)

    return new Response(
      JSON.stringify({
        accountId: account.id,
        onboardingUrl: accountLink.url,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
