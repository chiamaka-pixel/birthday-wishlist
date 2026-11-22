
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PaymentState = "checking" | "success" | "failed";

export default function PaymentCallbackPage() {
  const [status, setStatus] = useState<PaymentState>("checking");
  const [message, setMessage] = useState(
    "Please wait while we confirm your payment."
  );

  useEffect(() => {
    let cancelled = false;

    async function verifyPayment() {
      const params = new URLSearchParams(window.location.search);
      const reference = params.get("reference");

      if (!reference) {
        setStatus("failed");
        setMessage("We couldn't find your payment reference.");
        return;
      }

      try {
        const response = await fetch("/api/payments/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reference }),
        });

        const result = await response.json();

        if (cancelled) return;

        if (response.ok && result.success) {
          setStatus("success");
          setMessage("Your payment has been verified successfully. Thank you!");
        } else {
          setStatus("failed");
          setMessage(
            result.error ||
              "We couldn't confirm your payment. Please contact us before trying again."
          );
        }
      } catch {
        if (cancelled) return;

        setStatus("failed");
        setMessage(
          "We couldn't reach the payment verification service. Please try again."
        );
      }
    }

    verifyPayment();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#F7F4F1] px-5 py-20 text-[#111111]">
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#A31621]">
          Julia's Birthday Wishlist
        </p>

        <div className="mt-8 w-full border border-[#E8DADA] bg-white p-8 sm:p-10">
          {status === "checking" && (
            <>
              <div className="mx-auto mb-6 h-8 w-8 animate-spin rounded-full border-2 border-[#E8DADA] border-t-[#A31621]" />
              <h1 className="text-2xl font-semibold">Verifying payment</h1>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mb-6 text-4xl font-semibold text-[#A31621]">
                ✓
              </div>
              <h1 className="text-2xl font-semibold">Payment confirmed</h1>
            </>
          )}

          {status === "failed" && (
            <>
              <h1 className="text-2xl font-semibold">
                Payment not confirmed
              </h1>
            </>
          )}

          <p className="mt-4 text-sm leading-7 text-gray-600">
            {message}
          </p>

          <Link
            href="/"
            className="mt-8 inline-flex min-h-12 items-center justify-center bg-[#A31621] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#82111A]"
          >
            Return to wishlist
          </Link>
        </div>
      </div>
    </main>
  );
}
