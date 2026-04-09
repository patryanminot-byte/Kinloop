/** Notification content helpers for Watasu push notifications. */

interface NotificationContent {
  title: string;
  body: string;
}

export function matchFoundNotification(
  itemName: string,
  friendName: string,
  kidName: string
): NotificationContent {
  return {
    title: "It's a match!",
    body: `Your ${itemName} is a perfect fit for ${friendName}'s ${kidName}.`,
  };
}

export function itemClaimedNotification(
  friendName: string,
  itemName: string
): NotificationContent {
  return {
    title: "Item claimed!",
    body: `${friendName} claimed your ${itemName}.`,
  };
}

export function offerReceivedNotification(
  friendName: string,
  itemName: string
): NotificationContent {
  return {
    title: "New offer received",
    body: `${friendName} wants to give you their ${itemName}.`,
  };
}

export function rateHandoffNotification(
  friendName: string
): NotificationContent {
  return {
    title: "How did it go?",
    body: `Rate your handoff with ${friendName}.`,
  };
}
