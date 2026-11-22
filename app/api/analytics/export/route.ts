import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAnalyticsAuthenticated } from "@/lib/analytics-auth";

type AnalyticsExportRow = {
  event_name: string;
  gift_id: string | null;
  source: string | null;
  created_at: string;
};

const EVENT_LABELS: Record<string, string> = {
  page_view: "Page view",
  gift_view: "Gift viewed",
  contribute_click: "Contribution click",
  buy_deliver_click: "Buy and deliver click",
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

  const parsed = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function csvCell(value: unknown): string {
  let text = String(value ?? "");

  // Prevent spreadsheet formula injection.
  if (/^[\u0009\u000A\u000D ]*[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  try {
    const authenticated = await isAnalyticsAuthenticated();

    if (!authenticated) {
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseSecretKey) {
      console.error("Analytics export database configuration is missing.");

      return NextResponse.json(
        { error: "Analytics export is not configured." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseSecretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Africa/Lagos uses UTC+1. The selected dates are interpreted
    // as calendar days in Nigeria.
    const startDate = new Date(
      `${from}T00:00:00.000+01:00`
    ).toISOString();

    const endDate = new Date(
      `${to}T23:59:59.999+01:00`
    ).toISOString();

    const PAGE_SIZE = 1000;
    const MAX_ROWS = 50000;
    const rows: AnalyticsExportRow[] = [];

    // Fetch in pages so larger exports are not silently truncated
    // by Supabase's default response limit.
    for (let offset = 0; offset <= MAX_ROWS; offset += PAGE_SIZE) {
      const pageEnd = Math.min(offset + PAGE_SIZE - 1, MAX_ROWS);

      const { data, error } = await supabase
        .from("analytics_events")
        .select("event_name,gift_id,source,created_at")
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .order("created_at", { ascending: true })
        .range(offset, pageEnd);

      if (error) {
        console.error("Analytics export query failed:", error.message);

        return NextResponse.json(
          { error: "Could not retrieve analytics data." },
          { status: 500 }
        );
      }

      const batch = (data ?? []) as AnalyticsExportRow[];
      rows.push(...batch);

      const requestedCount = pageEnd - offset + 1;

      if (batch.length < requestedCount) {
        break;
      }
    }

    const limited = rows.length > MAX_ROWS;

    if (limited) {
      rows.length = MAX_ROWS;
    }

    const dateFormatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Lagos",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });

    const csvRows = [
      [
        "Date and time (Nigeria)",
        "Event",
        "Wishlist item",
        "Traffic source",
      ],
      ...rows.map((row) => [
        dateFormatter.format(new Date(row.created_at)),
        EVENT_LABELS[row.event_name] ?? row.event_name,
        row.gift_id
          ? GIFT_LABELS[row.gift_id] ?? row.gift_id
          : "",
        row.source ?? "",
      ]),
    ];

    const csv =
      "\uFEFF" +
      csvRows
        .map((row) => row.map(csvCell).join(","))
        .join("\r\n");

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="wishlist-analytics-${from}-to-${to}.csv"`,
        "Cache-Control": "no-store",
        "X-Analytics-Export-Limited": limited ? "true" : "false",
      },
    });
  } catch (error) {
    console.error("Analytics export error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred during export." },
      { status: 500 }
    );
  }
}
