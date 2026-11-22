
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { reference } = await request.json();

    if (
      typeof reference !== "string" ||
      !/^julia_[a-f0-9]{32}$/.test(reference)
    ) {
      return NextResponse.json(
        { error: "Invalid payment reference." },
        { status: 400 }
      );
    }

    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseSecret = process.env.SUPABASE_SECRET_KEY;

    if (!paystackKey || !supabaseUrl || !supabaseSecret) {
      return NextResponse.json(
        { error: "Payment verification is not configured." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseSecret);

    // Find the original payment request.
    const { data: intent, error: intentError } = await supabase
      .from("payment_intents")
      .select("reference, gift_id, email, amount_kobo, status")
      .eq("reference", reference)
      .single();

    if (intentError || !intent) {
      console.error("Payment intent lookup failed:", intentError?.message);

      return NextResponse.json(
        { error: "Payment record not found." },
        { status: 404 }
      );
    }

    // Verify directly with Paystack.
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${paystackKey}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const result = await response.json();

    if (!response.ok || !result.status || !result.data) {
      console.error("Paystack verification response:", result);

      return NextResponse.json(
        { error: "Could not verify this payment yet." },
        { status: 502 }
      );
    }

    const transaction = result.data;

    // Validate the transaction against the original request.
    const validPayment =
      transaction.status === "success" &&
      transaction.reference === intent.reference &&
      transaction.amount === intent.amount_kobo &&
      transaction.currency === "NGN" &&
      transaction.customer?.email?.toLowerCase() ===
        intent.email.toLowerCase() &&
      typeof transaction.paid_at === "string";

    if (!validPayment) {
      console.error("Payment validation failed:", {
        status: transaction.status,
        referenceMatches: transaction.reference === intent.reference,
        amountMatches: transaction.amount === intent.amount_kobo,
        currency: transaction.currency,
        emailMatches:
          transaction.customer?.email?.toLowerCase() ===
          intent.email.toLowerCase(),
      });

      return NextResponse.json(
        { error: "Payment has not been confirmed." },
        { status: 400 }
      );
    }

    // Save the verified payment.
    // Existing records are updated rather than ignored.
    const { error: paymentError } = await supabase
      .from("payments")
      .upsert(
        {
          reference: intent.reference,
          gift_id: intent.gift_id,
          email: intent.email,
          amount_kobo: intent.amount_kobo,
          status: "success",
          paid_at: transaction.paid_at,
        },
        {
          onConflict: "reference",
        }
      );

    if (paymentError) {
      console.error(
        "Verified payment could not be saved:",
        paymentError.message
      );

      return NextResponse.json(
        { error: "Payment was verified but could not be recorded." },
        { status: 500 }
      );
    }

    // Update the original payment intent.
    const { error: updateError } = await supabase
      .from("payment_intents")
      .update({ status: "success" })
      .eq("reference", reference);

    if (updateError) {
      console.error(
        "Payment intent status update failed:",
        updateError.message
      );

      return NextResponse.json(
        { error: "Payment was saved but its confirmation status could not be updated." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your payment has been verified.",
      giftId: intent.gift_id,
    });
  } catch (error) {
    console.error("Payment verification error:", error);

    return NextResponse.json(
      { error: "Something went wrong while verifying payment." },
      { status: 500 }
    );
  }
}
