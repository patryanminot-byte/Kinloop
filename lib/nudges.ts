import { supabase } from "./supabase";

/**
 * Nudge types and their messages.
 * All nudges are stored in the `nudges` table to prevent duplicates.
 */

export interface Nudge {
  type: "birthday_quarter" | "post_give" | "post_receive" | "friend_joined";
  title: string;
  message: string;
  emoji: string;
  actionLabel: string;
  actionRoute: string;
}

// ---- Birthday quarter nudges ----

/**
 * Check if any of the user's kids hit a birthday quarter (3-month mark).
 * Returns a nudge if one is due and hasn't been sent yet.
 */
export async function checkBirthdayQuarterNudge(
  userId: string,
  children: { id: string; name: string; dob: string }[]
): Promise<Nudge | null> {
  const now = new Date();

  for (const child of children) {
    const born = new Date(child.dob + "T00:00:00");
    const ageMonths =
      (now.getFullYear() - born.getFullYear()) * 12 +
      (now.getMonth() - born.getMonth());

    // Check if we're within the first week of a birthday quarter
    if (ageMonths > 0 && ageMonths % 3 === 0) {
      const dayInMonth = now.getDate();
      const birthDay = born.getDate();
      const daysSinceBirthdayThisMonth = dayInMonth - birthDay;

      // Only trigger within 7 days of the quarter mark
      if (daysSinceBirthdayThisMonth < 0 || daysSinceBirthdayThisMonth > 7) {
        continue;
      }

      const refId = `${child.id}_${ageMonths}`;

      // Check if we already sent this nudge
      const { data: existing } = await supabase
        .from("nudges")
        .select("id")
        .eq("user_id", userId)
        .eq("type", "birthday_quarter")
        .eq("ref_id", refId)
        .maybeSingle();

      if (existing) continue;

      // Record the nudge
      await supabase.from("nudges").insert({
        user_id: userId,
        type: "birthday_quarter",
        ref_id: refId,
      });

      const ageLabel =
        ageMonths < 24
          ? `${ageMonths} months`
          : `${Math.floor(ageMonths / 12)} years`;

      return {
        type: "birthday_quarter",
        title: `${child.name} just hit ${ageLabel}!`,
        message: "Time to check if anything's ready to move on. You're doing great.",
        emoji: "\u{1F382}",
        actionLabel: "Review your stuff",
        actionRoute: "/(tabs)/stuff",
      };
    }
  }

  return null;
}

// ---- Post-give nudge (2-3 days after a handoff) ----

export async function checkPostGiveNudge(userId: string): Promise<Nudge | null> {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

  const { data: recentHandoffs } = await supabase
    .from("matches")
    .select("id, completed_at")
    .eq("giver_id", userId)
    .eq("status", "handed-off")
    .gte("completed_at", threeDaysAgo)
    .lte("completed_at", twoDaysAgo)
    .limit(1);

  if (!recentHandoffs || recentHandoffs.length === 0) return null;

  const matchId = recentHandoffs[0].id;

  const { data: existing } = await supabase
    .from("nudges")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "post_give")
    .eq("ref_id", matchId)
    .maybeSingle();

  if (existing) return null;

  await supabase.from("nudges").insert({
    user_id: userId,
    type: "post_give",
    ref_id: matchId,
  });

  return {
    type: "post_give",
    title: "That felt good, right?",
    message: "You just made someone's day. Got anything else ready to pass along?",
    emoji: "\u{1F49C}",
    actionLabel: "Check your stuff",
    actionRoute: "/(tabs)/stuff",
  };
}

// ---- Post-receive nudge (2-3 days after accepting something) ----

export async function checkPostReceiveNudge(userId: string): Promise<Nudge | null> {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

  const { data: recentReceived } = await supabase
    .from("matches")
    .select("id, accepted_at")
    .eq("receiver_id", userId)
    .eq("status", "handed-off")
    .gte("accepted_at", threeDaysAgo)
    .lte("accepted_at", twoDaysAgo)
    .limit(1);

  if (!recentReceived || recentReceived.length === 0) return null;

  const matchId = recentReceived[0].id;

  const { data: existing } = await supabase
    .from("nudges")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "post_receive")
    .eq("ref_id", matchId)
    .maybeSingle();

  if (existing) return null;

  await supabase.from("nudges").insert({
    user_id: userId,
    type: "post_receive",
    ref_id: matchId,
  });

  return {
    type: "post_receive",
    title: "How's the new stuff?",
    message: "Got anything your kiddo outgrew that someone else could use?",
    emoji: "\u{1F4E6}",
    actionLabel: "Add items to share",
    actionRoute: "/(tabs)/stuff",
  };
}

// ---- Friend joined nudge ----

export async function checkFriendJoinedNudge(
  userId: string
): Promise<Nudge | null> {
  // Find friends who joined in the last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: friendships } = await supabase
    .from("friendships")
    .select("user_a, user_b, created_at")
    .eq("status", "active")
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .gte("created_at", oneDayAgo);

  if (!friendships || friendships.length === 0) return null;

  for (const f of friendships) {
    const friendId = f.user_a === userId ? f.user_b : f.user_a;

    const { data: existing } = await supabase
      .from("nudges")
      .select("id")
      .eq("user_id", userId)
      .eq("type", "friend_joined")
      .eq("ref_id", friendId)
      .maybeSingle();

    if (existing) continue;

    const { data: friend } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", friendId)
      .single();

    const { data: friendKids } = await supabase
      .from("children")
      .select("name, dob")
      .eq("user_id", friendId)
      .limit(1);

    const friendName = friend?.name?.split(" ")[0] ?? "A friend";
    let kidInfo = "";
    if (friendKids && friendKids.length > 0) {
      const kid = friendKids[0];
      const born = new Date(kid.dob + "T00:00:00");
      const ageMonths =
        (new Date().getFullYear() - born.getFullYear()) * 12 +
        (new Date().getMonth() - born.getMonth());
      const ageLabel =
        ageMonths < 24
          ? `a ${ageMonths}-month-old`
          : `a ${Math.floor(ageMonths / 12)}-year-old`;
      kidInfo = ` with ${ageLabel}`;
    }

    await supabase.from("nudges").insert({
      user_id: userId,
      type: "friend_joined",
      ref_id: friendId,
    });

    return {
      type: "friend_joined",
      title: `${friendName} just joined Watasu!`,
      message: `${friendName}${kidInfo} is now in your circle. Got anything they could use?`,
      emoji: "\u{1F44B}",
      actionLabel: "See your matches",
      actionRoute: "/(tabs)",
    };
  }

  return null;
}

/**
 * Check all nudge types and return the most relevant one (if any).
 * Call this when the home screen loads.
 */
export async function getActiveNudge(
  userId: string,
  children: { id: string; name: string; dob: string }[]
): Promise<Nudge | null> {
  // Priority order: friend joined > post-receive > post-give > birthday quarter
  return (
    (await checkFriendJoinedNudge(userId)) ??
    (await checkPostReceiveNudge(userId)) ??
    (await checkPostGiveNudge(userId)) ??
    (await checkBirthdayQuarterNudge(userId, children))
  );
}
