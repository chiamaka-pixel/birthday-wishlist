"use client";

import { useState } from "react";
import type { FormEvent } from "react";

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function ReportExportClient() {
  const [from, setFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 29);
    return formatDateInput(date);
  });

  const [to, setTo] = useState(() => formatDateInput(new Date()));

  const invalidRange = !from || !to || from > to;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (invalidRange) return;

    const params = new URLSearchParams({ from, to });

    window.location.assign(
      `/api/analytics/export?${params.toString()}`
    );
  }

  const inputStyle = {
    display: "block",
    width: "100%",
    boxSizing: "border-box" as const,
    marginTop: "8px",
    padding: "13px",
    border: "1px solid #D8D2CE",
    borderRadius: "5px",
    background: "#FFFFFF",
    color: "#111111",
    fontSize: "15px",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F4F1",
        color: "#111111",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>
        <a
          href="/analytics"
          style={{
            display: "inline-block",
            marginBottom: "24px",
            color: "#A31621",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          ← Back to analytics
        </a>

        <section
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E0DC",
            borderRadius: "8px",
            padding: "30px",
          }}
        >
          <p
            style={{
              color: "#A31621",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "1.5px",
              marginBottom: "12px",
            }}
          >
            PRIVATE ANALYTICS
          </p>

          <h1
            style={{
              fontSize: "30px",
              lineHeight: 1.2,
              fontWeight: 700,
              marginBottom: "12px",
            }}
          >
            Export analytics
          </h1>

          <p
            style={{
              color: "#625D59",
              fontSize: "15px",
              lineHeight: 1.7,
              marginBottom: "28px",
            }}
          >
            Choose a date range to download your wishlist activity as a
            CSV file. Dates are interpreted using Nigeria time.
          </p>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(210px, 1fr))",
                gap: "18px",
              }}
            >
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                From date
                <input
                  type="date"
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                  required
                  style={inputStyle}
                />
              </label>

              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                To date
                <input
                  type="date"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                  required
                  style={inputStyle}
                />
              </label>
            </div>

            {invalidRange && from && to && (
              <p
                style={{
                  color: "#A31621",
                  fontSize: "13px",
                  marginTop: "14px",
                }}
              >
                The start date must not be after the end date.
              </p>
            )}

            <button
              type="submit"
              disabled={invalidRange}
              style={{
                width: "100%",
                marginTop: "24px",
                padding: "15px 20px",
                border: "none",
                borderRadius: "5px",
                background: invalidRange ? "#B9B3AF" : "#A31621",
                color: "#FFFFFF",
                fontSize: "15px",
                fontWeight: 700,
                cursor: invalidRange ? "not-allowed" : "pointer",
              }}
            >
              Download CSV
            </button>
          </form>

          <div
            style={{
              borderTop: "1px solid #EAE5E1",
              marginTop: "28px",
              paddingTop: "20px",
              color: "#625D59",
              fontSize: "13px",
              lineHeight: 1.8,
            }}
          >
            <p>
              The export includes event date and time, event type,
              wishlist item and traffic source.
            </p>
            <p>
              Visitor IDs and private payment details are not included.
            </p>
            <p>
              Each export supports up to 50,000 events. Use a shorter
              date range for larger datasets.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
