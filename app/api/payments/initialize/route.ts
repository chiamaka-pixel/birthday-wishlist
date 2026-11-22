import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

const allowedGiftIds = new Set([
  "macbook",
  "bag",
  "perfumes",
  "shoes",
  "slippers",
  "bra",
  "clothes",
  "new-hair",
  "nails",
  "clement",
  "azikiwe",
  "item-7",
  "turkey",
  "yam",
  "eggs",
  "rice-stew",
  "pots",
  "gas",
  "gym",
  "gift-cards",
  "surprises",
  "palmpay-loan",
  "fairmoney-loan",
  "opay-loan",
]);

export async function POST(request: Request) {
  try {
    const {
      giftId,
      amount,
      email,
    }: {
      giftId?: string;
      amount?: number;
      email?: string;
    } = await request.json();

    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    if (
      !giftId ||
      !allowedGiftIds.has(giftId) ||
      typeof amount !== "number" ||
      !Number.isSafeInteger(amount) ||
      amount < 100 ||
      amount > 10_000_000 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return NextResponse.json(
        { error: "Please provide a valid gift, amount and email." },
        { status: 400 }
      );
    }

    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseSecret = process.env.SUPABASE_SECRET_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    if (!paystackKey || !supabaseUrl || !supabaseSecret || !siteUrl) {
      console.error("Payment configuration is incomplete.");

      return NextResponse.json(
        { error: "Payment service is not configured." },
        { status: 500 }
      );
    }

    // Build the exact destination, regardless of trailing slashes.
    const callbackUrl = new URL(
      "/payment/callback",
      siteUrl
    ).toString();

    console.info("PAYSTACK CALLBACK URL:", callbackUrl);

    const supabase = createClient(supabaseUrl, supabaseSecret);

    const reference = `julia_${randomUUID().replaceAll("-", "")}`;
    const amountKobo = amount * 100;

    const { error: insertError } = await supabase
      .from("payment_intents")
      .insert({
        reference,
        gift_id: giftId,
        email: normalizedEmail,
        amount_kobo: amountKobo,
        status: "pending",
      });

    if (insertError) {
      console.error("Payment record error:", insertError.message);

      return NextResponse.json(
        { error: "Could not prepare your payment. Please try again." },
        { status: 500 }
      );
    }

    const paystackResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          amount: amountKobo,
          currency: "NGN",
          reference,
          callback_url: callbackUrl,
          metadata: {
            gift_id: giftId,
            custom_fields: [
              {
                display_name: "Birthday wishlist gift",
                variable_name: "gift_id",
                value: giftId,
              },
            ],
          },
        }),
      }
    );

    const result = await paystackResponse.json();

    if (
      !paystackResponse.ok ||
      !result.status ||
      !result.data?.authorization_url
    ) {
      console.error("Paystack initialization failed:", {
        status: paystackResponse.status,
        message: result.message,
      });

      await supabase
        .from("payment_intents")
        .update({ status: "failed" })
        .eq("reference", reference);

      return NextResponse.json(
        { error: "Paystack could not start this payment." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      authorizationUrl: result.data.authorization_url,
      reference: result.data.reference || reference,
    });
  } catch (error) {
    console.error("Payment initialization error:", error);

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}