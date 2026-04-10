// supabase/functions/send-notification/index.ts
// Sends push notifications via the Expo Push API.
// Called by other edge functions (find-matches) or directly.
//
// Body: { user_id, title, body, data? }
//   or: { user_ids: string[], title, body, data? }

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound: "default";
}

serve(async (req) => {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let payload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
    });
  }

  const { title, body, data } = payload;
  const userIds: string[] = payload.user_ids ?? (payload.user_id ? [payload.user_id] : []);

  if (userIds.length === 0 || !title || !body) {
    return new Response(
      JSON.stringify({ error: "user_id(s), title, and body are required" }),
      { status: 400 }
    );
  }

  // Look up push tokens
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, push_token")
    .in("id", userIds)
    .not("push_token", "is", null);

  if (!profiles || profiles.length === 0) {
    return new Response(
      JSON.stringify({ sent: 0, reason: "no push tokens found" }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  const messages: PushMessage[] = profiles
    .filter((p) => p.push_token?.startsWith("ExponentPushToken"))
    .map((p) => ({
      to: p.push_token!,
      title,
      body,
      data: data ?? {},
      sound: "default" as const,
    }));

  if (messages.length === 0) {
    return new Response(
      JSON.stringify({ sent: 0, reason: "no valid Expo push tokens" }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // Send via Expo Push API
  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messages),
  });

  const result = await response.json();

  return new Response(
    JSON.stringify({ sent: messages.length, result }),
    { headers: { "Content-Type": "application/json" } }
  );
});
