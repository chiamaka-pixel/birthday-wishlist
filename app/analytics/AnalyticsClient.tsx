"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";


type Overview = {
  totalPageViews: number;
  uniqueVisitors: number;
  giftInteractions: number;
  contributionClicks: number;
  deliveryClicks: number;
};

type DailyView = {
  date: string;
  label: string;
  views: number;
};

type PopularGift = {
  giftId: string;
  name: string;
  views: number;
  contributionClicks: number;
  deliveryClicks: number;
};

type TrafficSource = {
  source: string;
  count: number;
};

type AnalyticsSummary = {
  period: string;
  overview: Overview;
  dailyViews: DailyView[];
  popularGifts: PopularGift[];
  trafficSources: TrafficSource[];
  limited: boolean;
  lastUpdated: string;
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-NG").format(value);
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-black/10 bg-white p-5">
      <p className="text-sm font-medium text-black/55">{title}</p>

      <p className="mt-3 text-3xl font-semibold tabular-nums">
        {formatNumber(value)}
      </p>

      <p className="mt-2 text-xs leading-5 text-black/45">
        {description}
      </p>
    </article>
  );
}

export default function AnalyticsClient() {
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    setRefreshing(true);

    try {
      const response = await fetch("/api/analytics/summary", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (response.status === 401) {
        setLoggedIn(false);
        setSummary(null);
        setError("");
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Could not load analytics.");
      }

      setSummary(data as AnalyticsSummary);
      setLoggedIn(true);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading analytics.",
      );
    } finally {
      setChecking(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!password) {
      setError("Enter your dashboard password.");
      return;
    }

    setRefreshing(true);

    try {
      const response = await fetch("/api/analytics/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed.");
      }

      setPassword("");
      await loadAnalytics();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to log in.",
      );
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/analytics/logout", {
        method: "POST",
      });
    } finally {
      setLoggedIn(false);
      setSummary(null);
      setPassword("");
      setError("");
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F4F1] px-5 text-[#111111]">
        <p className="text-sm text-black/55">
          Checking dashboard access...
        </p>
      </main>
    );
  }

  if (!loggedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F4F1] px-4 py-12 text-[#111111]">
        <section className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#A31621]">
            Private area
          </p>

          <h1 className="mt-3 font-serif text-3xl font-semibold">
            Wishlist analytics
          </h1>

          <p className="mt-3 text-sm leading-6 text-black/60">
            Sign in to view activity on your birthday wishlist.
            This dashboard is private.
          </p>

          <form onSubmit={handleLogin} className="mt-7">
            <label
              htmlFor="dashboard-password"
              className="mb-2 block text-sm font-semibold"
            >
              Dashboard password
            </label>

            <input
              id="dashboard-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-xl border border-black/15 bg-[#F7F4F1] px-4 py-3 text-sm outline-none focus:border-[#A31621]"
            />

            {error && (
              <p
                role="alert"
                className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={refreshing}
              className="mt-5 w-full rounded-full bg-[#A31621] px-5 py-3.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {refreshing ? "Checking..." : "Open dashboard"}
            </button>
          </form>

          <a
            href="/"
            className="mt-6 block text-center text-sm text-black/55 underline"
          >
            Return to birthday wishlist
          </a>
        </section>
      </main>
    );
  }

  const maximumDailyViews = Math.max(
    1,
    ...(summary?.dailyViews.map((day) => day.views) ?? [1]),
  );

  return (
    <main className="min-h-screen bg-[#F7F4F1] text-[#111111]">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#A31621]">
              Private dashboard
            </p>

            <h1 className="mt-1 font-serif text-2xl font-semibold sm:text-3xl">
              Wishlist analytics
            </h1>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-full border border-black/15 px-4 py-2.5 text-sm font-semibold hover:bg-black/5"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
        <section className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">
              Your website activity
            </h2>

            <p className="mt-1 text-sm text-black/55">
              {summary?.period ?? "Last 30 days"}
            </p>
          </div>

          <button
            onClick={() => void loadAnalytics()}
            disabled={refreshing}
            className="rounded-full bg-[#111111] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {refreshing ? "Refreshing..." : "Refresh data"}
          </button>
        </section>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {summary && (
          <>
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                title="Total page views"
                value={summary.overview.totalPageViews}
                description="Recorded visits to your wishlist page."
              />

              <StatCard
                title="Unique browsers"
                value={summary.overview.uniqueVisitors}
                description="Distinct browser visitor IDs, not verified individual people."
              />

              <StatCard
                title="Gift interactions"
                value={summary.overview.giftInteractions}
                description="Recorded gift interaction events."
              />

              <StatCard
                title="Contribution form opens"
                value={summary.overview.contributionClicks}
                description="Times visitors clicked Contribute money."
              />

              <StatCard
                title="Buy & deliver clicks"
                value={summary.overview.deliveryClicks}
                description="Times visitors clicked Buy & deliver."
              />
            </section>

            <section className="rounded-2xl border border-black/10 bg-white p-5 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    Daily page views
                  </h2>

                  <p className="mt-1 text-sm text-black/50">
                    Activity over the last 30 days
                  </p>
                </div>

                <p className="text-xs text-black/45">
                  All times shown by calendar date
                </p>
              </div>

              <div className="mt-8 flex h-48 items-end gap-1 border-b border-black/10 pb-2 sm:gap-2">
                {summary.dailyViews.map((day, index) => {
                  const barHeight =
                    day.views === 0
                      ? 0
                      : Math.max(
                          5,
                          (day.views / maximumDailyViews) * 100,
                        );

                  const showLabel =
                    index % 5 === 0 ||
                    index === summary.dailyViews.length - 1;

                  return (
                    <div
                      key={day.date}
                      className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                      title={`${day.label}: ${formatNumber(day.views)} page views`}
                    >
                      <div className="flex h-36 w-full items-end justify-center rounded-t bg-[#F7F4F1]">
                        <div
                          className="w-full max-w-5 rounded-t bg-[#A31621]"
                          style={{ height: `${barHeight}%` }}
                        />
                      </div>

                      <span className="h-4 text-[9px] text-black/50 sm:text-[10px]">
                        {showLabel ? day.label : ""}
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className="mt-4 text-xs text-black/45">
                Hover over a bar to see its date and page-view count.
              </p>
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-black/10 bg-white p-5 sm:p-7">
                <h2 className="text-lg font-semibold">
                  Popular gifts
                </h2>

                <p className="mt-1 text-sm text-black/50">
                  Ranked by contribution-form interest, then gift interactions.
                </p>

                {summary.popularGifts.length === 0 ? (
                  <p className="mt-6 text-sm text-black/50">
                    No gift interactions recorded yet.
                  </p>
                ) : (
                  <div className="mt-5 divide-y divide-black/10">
                    {summary.popularGifts.map((gift) => (
                      <div
                        key={gift.giftId}
                        className="flex items-center justify-between gap-4 py-4"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {gift.name}
                          </p>

                          <p className="mt-1 text-xs text-black/50">
                            {formatNumber(gift.views)} gift interactions
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-lg font-semibold tabular-nums">
                            {formatNumber(gift.contributionClicks)}
                          </p>

                          <p className="text-[11px] text-black/50">
                            contribution clicks
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-black/10 bg-white p-5 sm:p-7">
                <h2 className="text-lg font-semibold">
                  Where visitors came from
                </h2>

                <p className="mt-1 text-sm text-black/50">
                  Traffic sources recorded on page visits.
                </p>

                {summary.trafficSources.length === 0 ? (
                  <p className="mt-6 text-sm text-black/50">
                    No traffic sources recorded yet.
                  </p>
                ) : (
                  <div className="mt-5 divide-y divide-black/10">
                    {summary.trafficSources.map((source) => (
                      <div
                        key={source.source}
                        className="flex items-center justify-between gap-4 py-4"
                      >
                        <p className="min-w-0 truncate text-sm font-semibold">
                          {source.source}
                        </p>

                        <p className="shrink-0 text-sm font-semibold tabular-nums">
                          {formatNumber(source.count)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-black/10 bg-white p-5 sm:p-7">
              <h2 className="text-lg font-semibold">
                About these numbers
              </h2>

              <p className="mt-3 text-sm leading-7 text-black/60">
                These statistics show browsing and button activity. A
                contribution-form click does not prove that someone paid.
                Successful payments must be checked separately in your
                payment records. Unique browsers are estimated using a
                browser ID, so one person using multiple devices may
                count more than once.
              </p>

              {summary.limited && (
                <p className="mt-3 text-sm text-[#A31621]">
                  The report reached its 50,000-event processing limit.
                  Some activity may not be included.
                </p>
              )}

              <p className="mt-4 text-xs text-black/40">
                Last refreshed:{" "}
                {new Date(summary.lastUpdated).toLocaleString("en-NG")}
              </p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}