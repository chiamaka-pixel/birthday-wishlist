
"use client";

import { supabase } from "./supabase";

type AnalyticsEvent =
  | "page_view"
  | "gift_view"
  | "contribute_click"
  | "buy_deliver_click";

function getVisitorId(): string {
  const storageKey = "julia_wishlist_visitor_id";

  let visitorId = localStorage.getItem(storageKey);

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(storageKey, visitorId);
  }

  return visitorId;
}

function getTrafficSource(): string {
  const params = new URLSearchParams(window.location.search);
  const campaignSource = params.get("utm_source");

  if (campaignSource) return campaignSource.slice(0, 100);

  const referrer = document.referrer;

  if (!referrer) return "direct";

  try {
    return new URL(referrer).hostname.slice(0, 100);
  } catch {
    return "other";
  }
}

export async function trackEvent(
  eventName: AnalyticsEvent,
  giftId?: string
): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const { error } = await supabase
      .from("analytics_events")
      .insert({
        visitor_id: getVisitorId(),
        event_name: eventName,
        gift_id: giftId ?? null,
        source: getTrafficSource(),
      });

    if (error) {
      console.error("Analytics event could not be saved:", error.message);
    }
  } catch (error) {
    console.error("Analytics tracking error:", error);
  }
}
