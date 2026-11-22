import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAnalyticsAuthenticated } from "@/lib/analytics-auth";

export const runtime = "nodejs";

const MAX_EVENTS = 50_000;
const PAGE_SIZE = 1000;

type AnalyticsEvent = {
  visitor_id: string;
  event_name: string;
  gift_id: string | null;
  source: string | null;
  created_at: string;
};

const giftNames: Record<string, string> = {
  macbook: "MacBook",
  bag: "Handbag",
  perfumes: "Perfumes",
  shoes: "New shoes",
  slippers: "New slippers",
  bra: "Big-size bra",
  clothes: "Clothes",
  "new-hair": "New hair",
  nails: "Nails",
  clement: "Clement Isong",
  azikiwe: "Nnamdi Azikiwe",
  "item-7": "Food from Item 7 Go",
  turkey: "Molabat peppered turkey",
  yam: "Big tubers of yam",
  eggs: "A crate of eggs",
  "rice-stew": "Rice, stew and soup ingredients",
  pots: "Set of non-stick pots",
  gas: "Cooking gas refill",
  gym: "Gym membership",
  "gift-cards": "Gift cards",
  surprises: "Surprises",
  "palmpay-loan": "PalmPay loan repayment",
  "fairmoney-loan": "FairMoney loan repayment",
  "opay-loan": "OPay loan repayment",
};

export async function GET() {
  try {
    const authenticated = await isAnalyticsAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        { error: "Please log in to view analytics." },
        { status: 401 },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseSecret = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseSecret) {
      console.error("Analytics Supabase configuration is missing.");

      return NextResponse.json(
        { error: "Analytics service is not configured." },
        { status: 500 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseSecret, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const startDate = new Date();
    startDate.setUTCDate(startDate.getUTCDate() - 29);

    const events: AnalyticsEvent[] = [];

    for (let offset = 0; offset < MAX_EVENTS; offset += PAGE_SIZE) {
      const { data, error } = await supabase
        .from("analytics_events")
        .select("visitor_id,event_name,gift_id,source,created_at")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) {
        console.error("Analytics database query failed:", error.message);

        return NextResponse.json(
          { error: "Could not load analytics data." },
          { status: 500 },
        );
      }

      const batch = (data ?? []) as AnalyticsEvent[];

      events.push(...batch);

      if (batch.length < PAGE_SIZE) break;
    }

    const limited = events.length >= MAX_EVENTS;

    const pageViewEvents = events.filter(
      (event) => event.event_name === "page_view",
    );

    const uniqueVisitors = new Set(
      pageViewEvents.map((event) => event.visitor_id),
    );

    const giftStats = new Map<
      string,
      {
        giftId: string;
        name: string;
        views: number;
        contributionClicks: number;
        deliveryClicks: number;
      }
    >();

    for (const event of events) {
      if (!event.gift_id) continue;

      if (!giftStats.has(event.gift_id)) {
        giftStats.set(event.gift_id, {
          giftId: event.gift_id,
          name: giftNames[event.gift_id] ?? event.gift_id,
          views: 0,
          contributionClicks: 0,
          deliveryClicks: 0,
        });
      }

      const gift = giftStats.get(event.gift_id)!;

      if (event.event_name === "gift_view") {
        gift.views += 1;
      }

      if (event.event_name === "contribute_click") {
        gift.contributionClicks += 1;
      }

      if (event.event_name === "buy_deliver_click") {
        gift.deliveryClicks += 1;
      }
    }

    const dailyCounts = new Map<string, number>();

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const dailyViews = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(today);
      date.setUTCDate(date.getUTCDate() - (29 - index));

      const key = date.toISOString().slice(0, 10);

      dailyCounts.set(key, 0);

      return {
        date: key,
        label: new Intl.DateTimeFormat("en-NG", {
          day: "numeric",
          month: "short",
          timeZone: "UTC",
        }).format(date),
        views: 0,
      };
    });

    for (const event of pageViewEvents) {
      const key = new Date(event.created_at).toISOString().slice(0, 10);

      if (dailyCounts.has(key)) {
        dailyCounts.set(key, (dailyCounts.get(key) ?? 0) + 1);
      }
    }

    for (const day of dailyViews) {
      day.views = dailyCounts.get(day.date) ?? 0;
    }

    const sourceCounts = new Map<string, number>();

    for (const event of pageViewEvents) {
      const source = event.source || "unknown";

      sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1);
    }

    const trafficSources = Array.from(sourceCounts.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const popularGifts = Array.from(giftStats.values())
      .sort(
        (a, b) =>
          b.contributionClicks - a.contributionClicks ||
          b.views - a.views ||
          b.deliveryClicks - a.deliveryClicks,
      )
      .slice(0, 10);

    return NextResponse.json({
      period: "Last 30 days",

      overview: {
        totalPageViews: pageViewEvents.length,
        uniqueVisitors: uniqueVisitors.size,
        giftInteractions: events.filter(
          (event) => event.event_name === "gift_view",
        ).length,
        contributionClicks: events.filter(
          (event) => event.event_name === "contribute_click",
        ).length,
        deliveryClicks: events.filter(
          (event) => event.event_name === "buy_deliver_click",
        ).length,
      },

      dailyViews,
      popularGifts,
      trafficSources,

      limited,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Analytics summary error:", error);

    return NextResponse.json(
      { error: "Unable to load the analytics dashboard." },
      { status: 500 },
    );
  }
}