"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";

type DashboardData = {
  period: { from: string; to: string };
  overview: {
    pageViews: number;
    uniqueVisitors: number;
    giftViews: number;
    contributionClicks: number;
    deliveryClicks: number;
  };
  dailyViews: { date: string; views: number }[];
  popularGifts: {
    giftId: string;
    label: string;
    count: number;
  }[];
  trafficSources: {
    source: string;
    count: number;
  }[];
  payments: {
    available: boolean;
    limited: boolean;
    confirmedCount: number;
    totalReceivedKobo: number;
    byGift: {
      giftId: string;
      label: string;
      count: number;
    }[];
  };
  limited: boolean;
  lastUpdated: string;
};

type Preset = "today" | "7d" | "30d" | "custom";

function nigeriaDateString(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function subtractDays(dateString: string, amount: number): string {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - amount);
  return date.toISOString().slice(0, 10);
}

function initialRange() {
  const today = nigeriaDateString(new Date());

  return {
    today,
    from: subtractDays(today, 29),
    to: today,
  };
}

function prettyDate(value: string): string {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Lagos",
  });
}

const numberFormat = new Intl.NumberFormat("en-NG");

const moneyFormat = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const colors = {
  red: "#A31621",
  black: "#111111",
  ivory: "#F7F4F1",
  white: "#FFFFFF",
  muted: "#68615D",
  border: "#E5E0DC",
};

export default function AnalyticsClient() {
  const initial = initialRange();

  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);

  const [preset, setPreset] = useState<Preset>("30d");
  const [startDate, setStartDate] = useState(initial.from);
  const [endDate, setEndDate] = useState(initial.to);
  const [draftFrom, setDraftFrom] = useState(initial.from);
  const [draftTo, setDraftTo] = useState(initial.to);
  const [logoutBusy, setLogoutBusy] = useState(false);

  const loadAnalytics = useCallback(async () => {
    if (!startDate || !endDate) return;

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        from: startDate,
        to: endDate,
      });

      const response = await fetch(
        `/api/analytics/summary?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
        }
      );

      if (response.status === 401) {
        setAuthenticated(false);
        setData(null);
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load analytics data.");
      }

      setData(result as DashboardData);
      setAuthenticated(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load analytics data."
      );
    } finally {
      setLoading(false);
      setChecking(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  function selectPreset(value: Preset) {
    setPreset(value);

    if (value === "custom") return;

    const today = nigeriaDateString(new Date());

    let from = today;

    if (value === "7d") {
      from = subtractDays(today, 6);
    }

    if (value === "30d") {
      from = subtractDays(today, 29);
    }

    setDraftFrom(from);
    setDraftTo(today);
    setStartDate(from);
    setEndDate(today);
  }

  function applyCustomRange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draftFrom || !draftTo || draftFrom > draftTo) {
      setError("Please choose a valid date range.");
      return;
    }

    const difference =
      (Date.parse(`${draftTo}T00:00:00Z`) -
        Date.parse(`${draftFrom}T00:00:00Z`)) /
      86400000;

    if (difference > 365) {
      setError("Please choose a date range of 366 days or less.");
      return;
    }

    setError("");
    setStartDate(draftFrom);
    setEndDate(draftTo);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoginBusy(true);
    setLoginError("");

    try {
      const response = await fetch("/api/analytics/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Incorrect dashboard password.");
      }

      setPassword("");
      await loadAnalytics();
    } catch (err) {
      setLoginError(
        err instanceof Error
          ? err.message
          : "Login failed. Please try again."
      );
    } finally {
      setLoginBusy(false);
    }
  }

  async function handleLogout() {
    setLogoutBusy(true);

    try {
      await fetch("/api/analytics/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      setAuthenticated(false);
      setData(null);
      setPassword("");
      setLoginError("");
      setError("");
    } catch {
      setError("Could not log out. Please try again.");
    } finally {
      setLogoutBusy(false);
    }
  }

  const cardStyle = {
    background: colors.white,
    border: `1px solid ${colors.border}`,
    borderRadius: "7px",
    padding: "20px",
    minWidth: 0,
  } as const;

  const labelStyle = {
    fontSize: "13px",
    color: colors.muted,
    marginBottom: "12px",
  } as const;

  const valueStyle = {
    fontSize: "30px",
    lineHeight: 1.15,
    fontWeight: 700,
    color: colors.black,
    overflowWrap: "anywhere" as const,
  };

  if (checking) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: colors.ivory,
          color: colors.black,
        }}
      >
        Loading private analytics...
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          background: colors.ivory,
          color: colors.black,
        }}
      >
        <section
          style={{
            width: "100%",
            maxWidth: "420px",
            padding: "32px",
            background: colors.white,
            border: `1px solid ${colors.border}`,
            borderRadius: "8px",
          }}
        >
          <p
            style={{
              color: colors.red,
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "1.5px",
              marginBottom: "12px",
            }}
          >
            PRIVATE AREA
          </p>

          <h1 style={{ fontSize: "28px", marginBottom: "10px" }}>
            Wishlist analytics
          </h1>

          <p
            style={{
              fontSize: "14px",
              lineHeight: 1.7,
              color: colors.muted,
              marginBottom: "24px",
            }}
          >
            Enter your dashboard password to view your private wishlist
            activity.
          </p>

          <form onSubmit={handleLogin}>
            <label
              htmlFor="analytics-password"
              style={{ display: "block", fontSize: "14px", fontWeight: 600 }}
            >
              Dashboard password
            </label>

            <input
              id="analytics-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              style={{
                width: "100%",
                boxSizing: "border-box",
                marginTop: "8px",
                padding: "13px",
                border: `1px solid ${colors.border}`,
                borderRadius: "5px",
                fontSize: "15px",
              }}
            />

            {loginError && (
              <p
                role="alert"
                style={{
                  color: colors.red,
                  fontSize: "13px",
                  marginTop: "12px",
                }}
              >
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={loginBusy}
              style={{
                width: "100%",
                marginTop: "20px",
                padding: "14px",
                border: "none",
                borderRadius: "5px",
                background: colors.red,
                color: colors.white,
                fontSize: "15px",
                fontWeight: 700,
                cursor: loginBusy ? "wait" : "pointer",
              }}
            >
              {loginBusy ? "Signing in..." : "Open dashboard"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: colors.ivory,
        color: colors.black,
        padding: "34px 20px 60px",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <div>
            <p
              style={{
                color: colors.red,
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "1.5px",
                marginBottom: "8px",
              }}
            >
              PRIVATE ANALYTICS
            </p>

            <h1 style={{ fontSize: "30px", lineHeight: 1.2 }}>
              Wishlist overview
            </h1>

            <p
              style={{
                color: colors.muted,
                fontSize: "13px",
                marginTop: "8px",
              }}
            >
              Your private website activity report.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <a
              href="/analytics/reports"
              style={{
                display: "inline-block",
                padding: "11px 15px",
                background: colors.white,
                color: colors.red,
                border: `1px solid ${colors.red}`,
                borderRadius: "5px",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              Export CSV
            </a>

            <button
              type="button"
              onClick={() => void loadAnalytics()}
              disabled={loading}
              style={{
                padding: "11px 15px",
                background: colors.black,
                color: colors.white,
                border: "none",
                borderRadius: "5px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              disabled={logoutBusy}
              style={{
                padding: "11px 15px",
                background: colors.white,
                color: colors.black,
                border: `1px solid ${colors.border}`,
                borderRadius: "5px",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              {logoutBusy ? "Logging out..." : "Log out"}
            </button>
          </div>
        </header>

        <section
          style={{
            ...cardStyle,
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <h2 style={{ fontSize: "17px", marginBottom: "6px" }}>
                Date range
              </h2>

              <p style={{ color: colors.muted, fontSize: "13px" }}>
                Choose which activity you want to view.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              {(
                [
                  ["today", "Today"],
                  ["7d", "Last 7 days"],
                  ["30d", "Last 30 days"],
                  ["custom", "Custom range"],
                ] as [Preset, string][]
              ).map(([value, label]) => {
                const selected = preset === value;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => selectPreset(value)}
                    style={{
                      padding: "10px 13px",
                      border: `1px solid ${
                        selected ? colors.red : colors.border
                      }`,
                      borderRadius: "5px",
                      background: selected ? colors.red : colors.white,
                      color: selected ? colors.white : colors.black,
                      fontSize: "13px",
                      fontWeight: selected ? 700 : 500,
                      cursor: "pointer",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {preset === "custom" && (
            <form
              onSubmit={applyCustomRange}
              style={{
                display: "flex",
                alignItems: "end",
                flexWrap: "wrap",
                gap: "14px",
                marginTop: "22px",
                paddingTop: "18px",
                borderTop: `1px solid ${colors.border}`,
              }}
            >
              <label
                style={{
                  display: "grid",
                  gap: "7px",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                From
                <input
                  type="date"
                  value={draftFrom}
                  max={draftTo}
                  onChange={(event) => setDraftFrom(event.target.value)}
                  required
                  style={{
                    padding: "10px",
                    border: `1px solid ${colors.border}`,
                    borderRadius: "5px",
                    background: colors.white,
                    color: colors.black,
                  }}
                />
              </label>

              <label
                style={{
                  display: "grid",
                  gap: "7px",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                To
                <input
                  type="date"
                  value={draftTo}
                  min={draftFrom}
                  max={nigeriaDateString(new Date())}
                  onChange={(event) => setDraftTo(event.target.value)}
                  required
                  style={{
                    padding: "10px",
                    border: `1px solid ${colors.border}`,
                    borderRadius: "5px",
                    background: colors.white,
                    color: colors.black,
                  }}
                />
              </label>

              <button
                type="submit"
                style={{
                  padding: "11px 18px",
                  background: colors.red,
                  color: colors.white,
                  border: "none",
                  borderRadius: "5px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Apply dates
              </button>
            </form>
          )}

          <p
            style={{
              color: colors.muted,
              fontSize: "12px",
              marginTop: "16px",
            }}
          >
            Showing {prettyDate(startDate)} – {prettyDate(endDate)} ·
            Nigeria time
          </p>
        </section>

        {error && (
          <div
            role="alert"
            style={{
              padding: "14px 16px",
              marginBottom: "18px",
              background: "#FFF0F0",
              border: "1px solid #E8B9BC",
              borderRadius: "5px",
              color: colors.red,
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {loading && (
          <p
            style={{
              color: colors.muted,
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            Updating analytics...
          </p>
        )}

        {data && (
          <>
            {data.limited && (
              <p
                style={{
                  padding: "12px 15px",
                  background: "#FFF4E5",
                  color: "#76501C",
                  borderRadius: "5px",
                  fontSize: "13px",
                  marginBottom: "18px",
                }}
              >
                This report reached the 50,000-event display limit. Use
                a shorter date range to see a more complete report.
              </p>
            )}

            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                gap: "14px",
                marginBottom: "20px",
              }}
            >
              {[
                {
                  label: "Page views",
                  value: data.overview.pageViews,
                },
                {
                  label: "Unique visitors",
                  value: data.overview.uniqueVisitors,
                },
                {
                  label: "Gift views",
                  value: data.overview.giftViews,
                },
                {
                  label: "Contribution clicks",
                  value: data.overview.contributionClicks,
                },
                {
                  label: "Buy & Deliver clicks",
                  value: data.overview.deliveryClicks,
                },
                {
                  label: "Confirmed contributions",
                  value: data.payments.available
                    ? data.payments.confirmedCount
                    : "Unavailable",
                },
                {
                  label: "Amount received",
                  value: data.payments.available
                    ? moneyFormat.format(data.payments.totalReceivedKobo / 100)
                    : "Unavailable",
                },
              ].map((stat) => (
                <article key={stat.label} style={cardStyle}>
                  <p style={labelStyle}>{stat.label}</p>
                  <p style={valueStyle}>
                    {typeof stat.value === "number"
                      ? numberFormat.format(stat.value)
                      : stat.value}
                  </p>
                </article>
              ))}
            </section>

            {!data.payments.available && (
              <div
                role="alert"
                style={{
                  padding: "14px 16px",
                  background: "#FFF4E5",
                  color: "#76501C",
                  borderRadius: "5px",
                  fontSize: "13px",
                  marginBottom: "20px",
                }}
              >
                Payment statistics could not be retrieved. Your visitor
                analytics are still available. Check the Supabase
                payments table permissions and payment records.
              </div>
            )}

            {data.payments.available && data.payments.limited && (
              <div
                style={{
                  padding: "14px 16px",
                  background: "#FFF4E5",
                  color: "#76501C",
                  borderRadius: "5px",
                  fontSize: "13px",
                  marginBottom: "20px",
                }}
              >
                Payment statistics reached the 50,000-record limit.
                Choose a shorter date range for a more complete report.
              </div>
            )}

            <section style={{ ...cardStyle, marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                  marginBottom: "22px",
                }}
              >
                <div>
                  <h2 style={{ fontSize: "18px", marginBottom: "5px" }}>
                    Page views over time
                  </h2>
                  <p style={{ color: colors.muted, fontSize: "13px" }}>
                    Daily website visits within this date range.
                  </p>
                </div>
                <p
                  style={{
                    fontSize: "13px",
                    color: colors.muted,
                  }}
                >
                  {numberFormat.format(data.overview.pageViews)} total
                </p>
              </div>

              {data.dailyViews.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "end",
                    gap: "5px",
                    height: "185px",
                    overflowX: "auto",
                    padding: "8px 2px 0",
                    borderBottom: `1px solid ${colors.border}`,
                  }}
                >
                  {data.dailyViews.map((day) => {
                    const maximum = Math.max(
                      1,
                      ...data.dailyViews.map((item) => item.views)
                    );

                    const height =
                      day.views === 0
                        ? 2
                        : Math.max(7, (day.views / maximum) * 135);

                    return (
                      <div
                        key={day.date}
                        title={`${prettyDate(day.date)}: ${day.views} page views`}
                        style={{
                          flex: "1 0 15px",
                          minWidth: "15px",
                          height: `${height}px`,
                          background: colors.red,
                          borderRadius: "3px 3px 0 0",
                        }}
                      />
                    );
                  })}
                </div>
              ) : (
                <p style={{ color: colors.muted, fontSize: "14px" }}>
                  No page-view activity in this period.
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: colors.muted,
                  fontSize: "11px",
                  marginTop: "8px",
                }}
              >
                <span>{prettyDate(startDate)}</span>
                <span>{prettyDate(endDate)}</span>
              </div>
            </section>

            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "16px",
                marginBottom: "20px",
              }}
            >
              <article style={cardStyle}>
                <h2 style={{ fontSize: "17px", marginBottom: "18px" }}>
                  Popular wishlist items
                </h2>

                {data.popularGifts.length === 0 ? (
                  <p style={{ color: colors.muted, fontSize: "13px" }}>
                    No gift interactions recorded in this period.
                  </p>
                ) : (
                  <div style={{ display: "grid", gap: "15px" }}>
                    {data.popularGifts.map((gift) => {
                      const maximum = Math.max(
                        1,
                        ...data.popularGifts.map((item) => item.count)
                      );

                      return (
                        <div key={gift.giftId}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: "12px",
                              fontSize: "13px",
                              marginBottom: "7px",
                            }}
                          >
                            <span>{gift.label}</span>
                            <strong>{numberFormat.format(gift.count)}</strong>
                          </div>
                          <div
                            style={{
                              height: "6px",
                              background: "#EEE9E5",
                              borderRadius: "10px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${(gift.count / maximum) * 100}%`,
                                height: "100%",
                                background: colors.red,
                                borderRadius: "10px",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <p
                  style={{
                    color: colors.muted,
                    fontSize: "11px",
                    marginTop: "18px",
                  }}
                >
                  Based on gift views and gift-related clicks, not completed
                  payments.
                </p>
              </article>

              <article style={cardStyle}>
                <h2 style={{ fontSize: "17px", marginBottom: "18px" }}>
                  Traffic sources
                </h2>

                {data.trafficSources.length === 0 ? (
                  <p style={{ color: colors.muted, fontSize: "13px" }}>
                    No traffic sources recorded in this period.
                  </p>
                ) : (
                  <div style={{ display: "grid", gap: "0" }}>
                    {data.trafficSources.map((source) => (
                      <div
                        key={source.source}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px 0",
                          borderBottom: `1px solid ${colors.border}`,
                          fontSize: "13px",
                        }}
                      >
                        <span style={{ overflowWrap: "anywhere" }}>
                          {source.source}
                        </span>
                        <strong>{numberFormat.format(source.count)}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </section>

            <footer
              style={{
                color: colors.muted,
                fontSize: "12px",
                lineHeight: 1.8,
              }}
            >
              <p>
                Last updated:{" "}
                {new Date(data.lastUpdated).toLocaleString("en-GB", {
                  timeZone: "Africa/Lagos",
                })}{" "}
                (Nigeria time).
              </p>
              <p>
                Unique visitors are estimated from browser identifiers.
                Contribution clicks do not confirm that a payment was
                completed.
              </p>
            </footer>
          </>
        )}
      </div>
    </main>
  );
}

