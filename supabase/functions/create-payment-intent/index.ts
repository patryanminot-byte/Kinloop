// supabase/functions/create-payment-intent/index.ts
// Deno Edge Function — creates a Stripe PaymentIntent with application fee
// and transfer to the seller's connected account.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-04-10",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

/** Kinloop fee tier (mirrors lib/utils.ts) */
function kinloopFee(price: number): number {
  if (price < 50) return 2;
  if (price <= 150) return 5;
  return 8;
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { itemId, buyerId, sellerId, amount } = await req.json();

    if (!itemId || !buyerId || !sellerId || !amount) {
      return new Response(
        JSON.stringify({ error: "itemId, buyerId, sellerId, and amount are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Look up seller's connected Stripe account
    const { data: seller, error: sellerError } = await supabase
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", sellerId)
      .single();

    if (sellerError || !seller?.stripe_account_id) {
      return new Response(
        JSON.stringify({ error: "Seller has no connected Stripe account" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const fee = kinloopFee(amount);
    const totalCents = Math.round((amount + fee) * 100);
    const feeCents = Math.round(fee * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: "usd",
      application_fee_amount: feeCents,
      transfer_data: {
        destination: seller.stripe_account_id,
      },
      metadata: {
        kinloop_item_id: itemId,
        kinloop_buyer_id: buyerId,
        kinloop_seller_id: sellerId,
      },
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
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
