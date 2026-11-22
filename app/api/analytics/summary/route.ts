import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAnalyticsAuthenticated } from "@/lib/analytics-auth";

type AnalyticsRow = {
  visitor_id: string;
  event_name: string;
  gift_id: string | null;
  source: string | null;
  created_at: string;
};

type PaymentRow = {
  amount_kobo: number | string | null;
  gift_id: string | null;
  status: string | null;
  paid_at: string | null;
};

const GIFT_LABELS: Record<string, string> = {
  macbook: "MacBook",
  bag: "Handbag",
  perfumes: "Perfumes",
  shoes: "Shoes",
  slippers: "Slippers",
  bra: "Bra",
  clothes: "Clothes",
  "new-hair": "New hair",
  nails: "Nails",
  clement: "Clement Isong",
  azikiwe: "Nnamdi Azikiwe",
  "item-7": "Item 7",
  turkey: "Peppered turkey",
  yam: "Yam",
  eggs: "Eggs",
  "rice-stew": "Rice and stew ingredients",
  pots: "Non-stick pots",
  gas: "Gas refill",
  gym: "Gym membership",
  "gift-cards": "Gift cards",
  surprises: "Surprises",
  "palmpay-loan": "PalmPay loan repayment",
  "fairmoney-loan": "FairMoney loan repayment",
  "opay-loan": "OPay loan repayment",
};

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function lagosDateKey(value: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

export async function GET(request: Request) {
  try {
    if (!(await isAnalyticsAuthenticated())) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") ?? "";
    const to = searchParams.get("to") ?? "";

    if (!isValidDate(from) || !isValidDate(to) || from > to) {
      return NextResponse.json(
        { error: "Please provide a valid date range." },
        { status: 400 }
      );
    }

    const dayDifference =
      (Date.parse(`${to}T00:00:00Z`) -
        Date.parse(`${from}T00:00:00Z`)) /
      86400000;

    if (dayDifference > 365) {
      return NextResponse.json(
        { error: "Please select a date range of 366 days or less." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseSecretKey) {
      throw new Error("Analytics database configuration is missing.");
    }

    const supabase = createClient(supabaseUrl, supabaseSecretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const startDate = new Date(
      `${from}T00:00:00.000+01:00`
    ).toISOString();

    const endDate = new Date(
      `${to}T23:59:59.999+01:00`
    ).toISOString();

    const PAGE_SIZE = 1000;
    const MAX_ROWS = 50000;
    const rows: AnalyticsRow[] = [];

    for (let offset = 0; offset <= MAX_ROWS; offset += PAGE_SIZE) {
      const lastRow = Math.min(
        offset + PAGE_SIZE - 1,
        MAX_ROWS
      );

      const { data, error } = await supabase
        .from("analytics_events")
        .select("visitor_id,event_name,gift_id,source,created_at")
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .order("created_at", { ascending: false })
        .range(offset, lastRow);

      if (error) {
        console.error(
          "Analytics database query failed:",
          error.message
        );

        return NextResponse.json(
          { error: "Could not load analytics data." },
          { status: 500 }
        );
      }

      const batch = (data ?? []) as AnalyticsRow[];
      rows.push(...batch);

      if (batch.length < lastRow - offset + 1) {
        break;
      }
    }

    const limited = rows.length > MAX_ROWS;

    if (limited) {
      rows.length = MAX_ROWS;
    }

    // Retrieve verified payment records separately from click events.
    // No donor email addresses or transaction references are selected.
    const paymentRows: PaymentRow[] = [];
    let paymentsAvailable = true;
    let paymentsLimited = false;

    for (let offset = 0; offset <= MAX_ROWS; offset += PAGE_SIZE) {
      const lastRow = Math.min(
        offset + PAGE_SIZE - 1,
        MAX_ROWS
      );

      const { data: paymentBatch, error: paymentError } = await supabase
        .from("payments")
        .select("amount_kobo,gift_id,status,paid_at")
        .gte("paid_at", startDate)
        .lte("paid_at", endDate)
        .order("paid_at", { ascending: false })
        .range(offset, lastRow);

      if (paymentError) {
        console.error(
          "Analytics payment query failed:",
          paymentError.message
        );

        paymentsAvailable = false;
        break;
      }

      const batch = (paymentBatch ?? []) as PaymentRow[];
      paymentRows.push(...batch);

      if (batch.length < lastRow - offset + 1) {
        break;
      }

      if (offset + PAGE_SIZE > MAX_ROWS) {
        paymentsLimited = true;
      }
    }

    // Accept common successful payment status labels.
    const successfulPayments = paymentRows.filter((payment) =>
      ["success", "successful", "paid", "completed", "succeeded"].includes(
        (payment.status ?? "").toLowerCase()
      )
    );

    const totalReceivedKobo = successfulPayments.reduce(
      (total, payment) => {
        const amount = Number(payment.amount_kobo);

        return total + (
          Number.isFinite(amount) && amount > 0 ? amount : 0
        );
      },
      0
    );

    const paymentGiftTotals: Record<
      string,
      { count: number; totalReceivedKobo: number }
    > = {};

    for (const payment of successfulPayments) {
      if (!payment.gift_id) continue;

      const amount = Number(payment.amount_kobo);
      const validAmount =
        Number.isFinite(amount) && amount > 0 ? amount : 0;

      const current = paymentGiftTotals[payment.gift_id] ?? {
        count: 0,
        totalReceivedKobo: 0,
      };

      paymentGiftTotals[payment.gift_id] = {
        count: current.count + 1,
        totalReceivedKobo: current.totalReceivedKobo + validAmount,
      };
    }

    const pageViews = rows.filter(
      (row) => row.event_name === "page_view"
    );

    const uniqueVisitors = new Set(
      pageViews.map((row) => row.visitor_id)
    ).size;

    const giftViews = rows.filter(
      (row) => row.event_name === "gift_view"
    ).length;

    const contributionClicks = rows.filter(
      (row) => row.event_name === "contribute_click"
    ).length;

    const deliveryClicks = rows.filter(
      (row) => row.event_name === "buy_deliver_click"
    ).length;

    // Daily page views.
    const dailyCounts: Record<string, number> = {};

    for (const row of pageViews) {
      const dateKey = lagosDateKey(row.created_at);
      dailyCounts[dateKey] = (dailyCounts[dateKey] ?? 0) + 1;
    }

    const dailyViews: { date: string; views: number }[] = [];
    const cursor = new Date(`${from}T00:00:00.000Z`);
    const lastDate = new Date(`${to}T00:00:00.000Z`);

    while (cursor <= lastDate) {
      const key = cursor.toISOString().slice(0, 10);

      dailyViews.push({
        date: key,
        views: dailyCounts[key] ?? 0,
      });

      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    // Most interacted-with wishlist items.
    const giftCounts: Record<string, number> = {};

    for (const row of rows) {
      if (
        row.gift_id &&
        ["gift_view", "contribute_click", "buy_deliver_click"].includes(
          row.event_name
        )
      ) {
        giftCounts[row.gift_id] =
          (giftCounts[row.gift_id] ?? 0) + 1;
      }
    }

    const popularGifts = Object.entries(giftCounts)
      .map(([giftId, count]) => ({
        giftId,
        label: GIFT_LABELS[giftId] ?? giftId,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Traffic sources, counted from page views.
    const sourceCounts: Record<string, number> = {};

    for (const row of pageViews) {
      const source = row.source?.trim() || "direct";
      sourceCounts[source] = (sourceCounts[source] ?? 0) + 1;
    }

    const trafficSources = Object.entries(sourceCounts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json(
      {
        period: { from, to },
        overview: {
          pageViews: pageViews.length,
          uniqueVisitors,
          giftViews,
          contributionClicks,
          deliveryClicks,
        },
        dailyViews,
        popularGifts,
        trafficSources,
        payments: {
          available: paymentsAvailable,
          limited: paymentsLimited,
          confirmedCount: successfulPayments.length,
          totalReceivedKobo,
          byGift: Object.entries(paymentGiftTotals)
            .map(([giftId, totals]) => ({
              giftId,
              label: GIFT_LABELS[giftId] ?? giftId,
              count: totals.count,
              totalReceivedKobo: totals.totalReceivedKobo,
            }))
            .sort(
              (a, b) =>
                b.totalReceivedKobo - a.totalReceivedKobo
            ),
        },
        limited,
        lastUpdated: new Date().toISOString(),
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Analytics summary error:", error);

    return NextResponse.json(
      { error: "Could not load analytics data." },
      { status: 500 }
    );
  }
}


