"use client";

import { useEffect, useMemo, useState } from "react";
import { trackEvent } from "../lib/analytics";

type Category =
  | "tech"
  | "fashion"
  | "beauty"
  | "cash"
  | "groceries"
  | "home"
  | "experiences"
  | "loans";

type Gift = {
  id: string;
  name: string;
  category: Category;
  description?: string;
  image: string;
  physical?: boolean;
  featured?: boolean;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);

const gifts: Gift[] = [
  {
    id: "macbook",
    name: "MacBook",
    category: "tech",
    image: "/images/macbook.jpg",
    physical: true,
    featured: true,
  },
  {
    id: "bag",
    name: "Handbag",
    category: "fashion",
    image: "/images/handbag.jpg",
    physical: true,
  },
  {
    id: "perfumes",
    name: "Perfumes",
    category: "fashion",
    image: "/images/perfumes.jpg",
    physical: true,
  },
  {
    id: "shoes",
    name: "New shoes",
    category: "fashion",
    image: "/images/shoes.jpg",
    physical: true,
  },
  {
    id: "slippers",
    name: "New slippers",
    category: "fashion",
    image: "/images/slippers.jpg",
    physical: true,
  },
  {
    id: "bra",
    name: "Big-size bra",
    category: "fashion",
    image: "/images/bra.jpg",
    physical: true,
  },
  {
    id: "clothes",
    name: "Clothes",
    category: "fashion",
    image: "/images/clothes.jpg",
    physical: true,
  },
  {
    id: "new-hair",
    name: "New hair",
    category: "beauty",
    image: "/images/new-hair.jpg",
    physical: true,
  },
  {
    id: "nails",
    name: "Nails",
    category: "beauty",
    image: "/images/nails.jpg",
    physical: true,
  },
  {
    id: "clement",
    name: "Clement Isong",
    category: "cash",
    image: "/images/clement-isong.jpg",
    description: "Five bundles of ₦1,000 notes.",
  },
  {
    id: "azikiwe",
    name: "Nnamdi Azikiwe",
    category: "cash",
    image: "/images/nnamdi-azikiwe.jpg",
    description: "Six bundles of ₦500 notes.",
  },
  {
    id: "item-7",
    name: "Food from Item 7 Go",
    category: "groceries",
    image: "/images/item-7-food.jpg",
    physical: true,
  },
  {
    id: "turkey",
    name: "Molabat peppered turkey",
    category: "groceries",
    image: "/images/peppered-turkey.jpg",
    physical: true,
    description: "Five pieces.",
  },
  {
    id: "yam",
    name: "Big tubers of yam",
    category: "groceries",
    image: "/images/yam.jpg",
    physical: true,
  },
  {
    id: "eggs",
    name: "A crate of eggs",
    category: "groceries",
    image: "/images/eggs.jpg",
    physical: true,
  },
  {
    id: "rice-stew",
    name: "Half bag of rice, stew and soup ingredients",
    category: "groceries",
    image: "/images/rice-stew-ingredients.jpg",
    physical: true,
  },
  {
    id: "pots",
    name: "Set of non-stick pots",
    category: "home",
    image: "/images/non-stick-pots.jpg",
    physical: true,
  },
  {
    id: "gas",
    name: "Abeg, fill my gas",
    category: "home",
    image: "/images/gas-refill.jpg",
    description: "Help me refill my cooking gas.",
  },
  {
    id: "gym",
    name: "Gym membership",
    category: "experiences",
    image: "/images/gym-membership.jpg",
    description: "I wan start soon!",
  },
  {
    id: "gift-cards",
    name: "Gift cards",
    category: "experiences",
    image: "/images/gift-cards.jpg",
  },
  {
    id: "surprises",
    name: "Surprises",
    category: "experiences",
    image: "/images/surprises.jpg",
  },
  {
    id: "palmpay-loan",
    name: "PalmPay loan repayment",
    category: "loans",
    image: "/images/palmpay-loan.jpg",
    description: "Amount to clear: ₦30,000.",
  },
  {
    id: "fairmoney-loan",
    name: "FairMoney loan repayment",
    category: "loans",
    image: "/images/fairmoney-loan.jpg",
    description: "Amount to clear: ₦40,000.",
  },
  {
    id: "opay-loan",
    name: "OPay loan repayment",
    category: "loans",
    image: "/images/opay-loan.jpg",
    description: "Amount to clear: ₦10,000.",
  },
];

const categories: { id: "all" | Category; label: string }[] = [
  { id: "all", label: "All gifts" },
  { id: "tech", label: "Tech" },
  { id: "fashion", label: "Fashion" },
  { id: "beauty", label: "Hair & beauty" },
  { id: "cash", label: "Cash gifts" },
  { id: "groceries", label: "Groceries" },
  { id: "home", label: "Home" },
  { id: "experiences", label: "Experiences" },
  { id: "loans", label: "Loan repayments" },
];

export default function BirthdayWishlistPage() {
  const [category, setCategory] = useState<"all" | Category>("all");
  const [selected, setSelected] = useState<Gift | null>(null);
  const [amount, setAmount] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestMessage, setGuestMessage] = useState("");
  const [wishes, setWishes] = useState<{ name: string; message: string }[]>(
    [],
  );

  const filtered = useMemo(
    () => gifts.filter((gift) => category === "all" || gift.category === category),
    [category],
  );

  // Record a visit and reset the payment button when visitors return
  // from the Paystack checkout page.
  useEffect(() => {
    void trackEvent("page_view");

    function handlePageShow() {
      setBusy(false);
    }

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  function notify(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 4000);
  }

  async function startPayment() {
    if (!selected) return;

    const numericAmount = Number(amount);

    if (!Number.isInteger(numericAmount) || numericAmount < 100) {
      notify("Enter an amount of at least ₦100.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      notify("Enter a valid email address for your payment receipt.");
      return;
    }

    setBusy(true);

    try {
      const response = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giftId: selected.id,
          amount: numericAmount,
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.authorizationUrl) {
        throw new Error(
          data.error || "We couldn't start checkout. Please try again.",
        );
      }

      window.location.assign(data.authorizationUrl);
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Payment could not be started.",
      );

      setBusy(false);
    }
  }

  function sendDeliveryRequest(gift: Gift) {
    const subject = encodeURIComponent(
      `Birthday gift delivery: ${gift.name}`,
    );

    const body = encodeURIComponent(
      `Hi Julia,\n\nI'd like to arrange to buy and deliver: ${gift.name}.\nPlease let me know how we can arrange delivery.\n\nThank you.`,
    );

    window.location.href = `mailto:chiamakaehise@gmail.com?subject=${subject}&body=${body}`;
  }

  function postWish() {
    if (!guestMessage.trim()) {
      notify("Please write a birthday wish first.");
      return;
    }

    setWishes((current) => [
      {
        name: guestName.trim() || "A well-wisher",
        message: guestMessage.trim(),
      },
      ...current,
    ]);

    setGuestName("");
    setGuestMessage("");

    notify("Your message has been added on this visit.");
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F7F4F1] text-[#111111]">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-black/10 bg-[#F7F4F1]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#" className="font-serif text-lg font-semibold">
            My Birthday Wishlist
          </a>

          <a
            href="#guestbook"
            className="rounded-full bg-[#111111] px-4 py-2 text-sm font-semibold text-white"
          >
            Send a wish
          </a>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-4 pb-28 pt-24 sm:px-6">
        <section className="rounded-3xl border border-black/10 bg-white px-5 py-9 text-center sm:px-10 sm:py-12">
          <img
            src="/images/julia-birthday.jpg"
            alt="Julia"
            className="mx-auto h-36 w-36 rounded-full border-4 border-[#A31621] object-cover shadow-md sm:h-44 sm:w-44"
          />

          <p className="mt-6 inline-flex rounded-full bg-[#A31621]/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#A31621]">
            November 27, 2026 · Turning 21
          </p>

          <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight sm:text-6xl">
            My Birthday Wishlist
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-black/65 sm:text-base">
            My birthday is coming, and I’ve put together a little list of
            things that would make me very happy. Whether you choose to get me
            a gift, contribute towards something special, send me a surprise or
            simply say a prayer, I appreciate you.
          </p>

          <div className="mx-auto mt-7 flex max-w-md flex-col gap-3 sm:flex-row">
            <a
              href="#wishlist"
              className="flex-1 rounded-full bg-[#A31621] px-6 py-3.5 text-sm font-bold text-white"
            >
              Explore my wishlist
            </a>

            <a
              href="#bank-transfer"
              className="flex-1 rounded-full border border-black/20 bg-white px-6 py-3.5 text-sm font-bold"
            >
              Direct bank transfer
            </a>
          </div>
        </section>

        <section id="wishlist" className="scroll-mt-24">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#A31621]">
              Curated registry
            </p>

            <h2 className="mt-1 font-serif text-3xl font-semibold sm:text-4xl">
              Things on my birthday list
            </h2>
          </div>

          <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
            {categories.map((item) => (
              <button
                key={item.id}
                onClick={() => setCategory(item.id)}
                className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold ${
                  category === item.id
                    ? "bg-[#111111] text-white"
                    : "border border-black/10 bg-white text-black/70"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((gift) => (
              <article
                key={gift.id}
                className={`overflow-hidden rounded-2xl border border-black/10 bg-white ${
                  gift.featured ? "sm:col-span-2" : ""
                }`}
              >
                <div
                  className={`w-full overflow-hidden bg-[#E9E4DF] ${
                    gift.featured ? "h-64 sm:h-80" : "h-44"
                  }`}
                >
                  <img
                    src={gift.image}
                    alt={gift.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.visibility = "hidden";
                    }}
                  />
                </div>

                <div className="flex min-h-44 flex-col p-4">
                  <h3 className="font-serif text-xl font-semibold">
                    {gift.name}
                  </h3>

                  {gift.description && (
                    <p className="mt-2 text-sm leading-6 text-black/60">
                      {gift.description}
                    </p>
                  )}

                  <div className="mt-auto flex flex-wrap gap-2 pt-5">
                    <button
                      onClick={() => {
                        void trackEvent("gift_view", gift.id);
                        void trackEvent("contribute_click", gift.id);

                        setSelected(gift);
                        setAmount("");
                        setEmail("");
                      }}
                      className="flex-1 rounded-full bg-[#A31621] px-4 py-3 text-sm font-bold text-white hover:bg-[#86111A]"
                    >
                      Contribute money
                    </button>

                    {gift.physical && (
                      <button
                        onClick={() => {
                          void trackEvent("buy_deliver_click", gift.id);
                          sendDeliveryRequest(gift);
                        }}
                        className="flex-1 rounded-full border border-black/20 px-4 py-3 text-sm font-semibold hover:bg-black/5"
                      >
                        Buy &amp; deliver
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="bank-transfer"
          className="scroll-mt-24 rounded-3xl border border-black/10 bg-white p-5 sm:p-8"
        >
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#A31621]">
            Direct bank transfer
          </p>

          <h2 className="mt-2 font-serif text-3xl font-semibold">
            Want to send a birthday gift?
          </h2>

          <p className="mt-2 text-sm leading-6 text-black/65">
            Transfer directly to either account below. Please confirm the
            account name before sending.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <AccountCard
              bank="United Bank for Africa (UBA)"
              account="2197674482"
            />

            <AccountCard bank="OPay" account="9154106435" />
          </div>

          <p className="mt-4 text-sm text-black/60">
            Account name: CHIAMAKA JULIA KENNETH
          </p>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-5 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#A31621]">
            Collaborations & referrals
          </p>

          <h2 className="mt-2 font-serif text-3xl font-semibold">
            Want to make me even happier?
          </h2>

          <p className="mt-2 font-serif text-xl text-[#A31621]">
            Let’s build something exceptional together.
          </p>

          <p className="mt-3 text-sm leading-7 text-black/65">
            Beyond gifts, the most fulfilling birthday present is sharing my
            craft with the world. Know anyone launching a startup, revamping an
            online boutique, or needing high-converting digital design? Refer
            me or let’s work together!
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {[
              "Business websites",
              "E-commerce stores",
              "Bespoke portfolios",
              "Personal branding",
              "Web design & development",
            ].map((item) => (
              <span
                key={item}
                className="rounded-full bg-[#F7F4F1] px-4 py-2 text-sm"
              >
                {item}
              </span>
            ))}
          </div>

          <a
            href="mailto:chiamakaehise@gmail.com?subject=Birthday%20Project%20Inquiry"
            className="mt-6 inline-flex rounded-full bg-[#111111] px-5 py-3.5 text-sm font-bold text-white"
          >
            Work with me or send a referral
          </a>

          <p className="mt-3 text-sm text-black/60">
            Email:{" "}
            <a
              href="mailto:chiamakaehise@gmail.com"
              className="underline"
            >
              chiamakaehise@gmail.com
            </a>
          </p>
        </section>

        <section>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#A31621]">
            Real talk & soft life
          </p>

          <h2 className="mt-2 font-serif text-3xl font-semibold">
            Abeg, make these happen!
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              [
                "Abeg make una beg my HR to increase my salary",
                "Please, I need this salary increase.",
              ],
              ["Vote Peter Obi abeg", "Abeg."],
              ["Abeg, fill my gas", "Please help me refill it."],
              ["Gym membership — I wan start soon!", "I wan start soon!"],
            ].map(([title, description]) => (
              <div
                key={title}
                className="rounded-2xl border border-black/10 bg-white p-4"
              >
                <h3 className="text-sm font-bold">{title}</h3>

                <p className="mt-1 text-sm leading-6 text-black/60">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#A31621]">
            Prayers
          </p>

          <h2 className="mt-2 font-serif text-3xl font-semibold">
            Please remember me in your prayers
          </h2>
        </section>

        <section id="guestbook" className="scroll-mt-24">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#A31621]">
            Warm affections
          </p>

          <h2 className="mt-2 font-serif text-3xl font-semibold">
            Birthday wishes & guestbook
          </h2>

          <div className="mt-5 rounded-3xl border border-black/10 bg-white p-4 sm:p-6">
            <label
              htmlFor="guest-name"
              className="mb-2 block text-sm font-semibold"
            >
              Your name or nickname
            </label>

            <input
              id="guest-name"
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
              placeholder="Your name or nickname"
              className="w-full rounded-xl border border-black/15 bg-[#F7F4F1] px-4 py-3 text-sm outline-none focus:border-[#A31621]"
            />

            <label
              htmlFor="guest-message"
              className="mb-2 mt-4 block text-sm font-semibold"
            >
              Your birthday message
            </label>

            <textarea
              id="guest-message"
              rows={4}
              value={guestMessage}
              onChange={(event) => setGuestMessage(event.target.value)}
              placeholder="Leave a heartfelt prayer, funny memory, or birthday greeting..."
              className="w-full resize-y rounded-xl border border-black/15 bg-[#F7F4F1] px-4 py-3 text-sm outline-none focus:border-[#A31621]"
            />

            <button
              onClick={postWish}
              className="mt-4 w-full rounded-full bg-[#111111] px-5 py-3.5 text-sm font-bold text-white"
            >
              Send birthday wish
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {wishes.map((wish, index) => (
              <article
                key={`${wish.name}-${index}`}
                className="rounded-2xl border border-black/10 bg-white p-4"
              >
                <strong className="text-sm">{wish.name}</strong>

                <p className="mt-2 text-sm leading-6 text-black/65">
                  {wish.message}
                </p>
              </article>
            ))}
          </div>

          <p className="mt-8 text-center font-serif text-lg italic leading-7 text-black/60">
            “Thank you for being part of my story. Every gift, contribution,
            referral, kind word and prayer means the whole universe to me.”
          </p>

          <p className="mt-3 text-center text-xs font-bold uppercase tracking-[.2em] text-[#A31621]">
            Blessed · Loved · Radiant
          </p>
        </section>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelected(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-title"
            className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-[#F7F4F1] p-5 shadow-2xl sm:rounded-3xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-[#A31621]">
                  Contribution
                </p>

                <h2
                  id="payment-title"
                  className="mt-1 font-serif text-2xl font-semibold"
                >
                  {selected.name}
                </h2>
              </div>

              <button
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="rounded-full bg-black/5 px-3 py-2 text-lg"
              >
                ×
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-black/65">
              Choose any amount you'd like to contribute. Your contribution
              details are not displayed publicly.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[5000, 10000, 20000, 50000].map((value) => (
                <button
                  key={value}
                  onClick={() => setAmount(String(value))}
                  className={`rounded-full px-2 py-3 text-xs font-bold ${
                    amount === String(value)
                      ? "bg-[#A31621] text-white"
                      : "bg-white text-black"
                  }`}
                >
                  {money(value)}
                </button>
              ))}
            </div>

            <label
              htmlFor="amount"
              className="mb-2 mt-4 block text-sm font-semibold"
            >
              Custom amount (₦)
            </label>

            <input
              id="amount"
              inputMode="numeric"
              value={amount}
              onChange={(event) =>
                setAmount(event.target.value.replace(/[^\d]/g, ""))
              }
              placeholder="Enter amount"
              className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-[#A31621]"
            />

            <label
              htmlFor="payer-email"
              className="mb-2 mt-4 block text-sm font-semibold"
            >
              Email for payment receipt
            </label>

            <input
              id="payer-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-[#A31621]"
            />

            <button
              disabled={busy}
              onClick={startPayment}
              className="mt-5 w-full rounded-full bg-[#A31621] px-5 py-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy
                ? "Connecting to Paystack..."
                : "Continue to secure payment"}
            </button>

            <p className="mt-3 text-center text-xs text-black/55">
              Payment confirmation is handled by the website after checkout.
            </p>
          </div>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-full bg-[#111111] px-5 py-3 text-center text-sm font-semibold text-white shadow-xl"
        >
          {notice}
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-[#F7F4F1]/95 px-3 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around">
          <a href="#wishlist" className="px-3 py-2 text-xs font-semibold">
            Wishlist
          </a>

          <a
            href="#bank-transfer"
            className="px-3 py-2 text-xs font-semibold"
          >
            Bank details
          </a>

          <a href="#guestbook" className="px-3 py-2 text-xs font-semibold">
            Guestbook
          </a>
        </div>
      </nav>
    </main>
  );
}

function AccountCard({
  bank,
  account,
}: {
  bank: string;
  account: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyAccount() {
    try {
      await navigator.clipboard.writeText(account);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-2xl bg-[#F7F4F1] p-4">
      <p className="text-sm font-bold">{bank}</p>

      <p className="mt-1 text-xs text-black/60">
        Account holder: CHIAMAKA JULIA KENNETH
      </p>

      <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-white p-3">
        <span className="font-mono text-lg font-bold tracking-wider">
          {account}
        </span>

        <button
          onClick={copyAccount}
          className="rounded-full bg-[#111111] px-4 py-2 text-xs font-bold text-white"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}