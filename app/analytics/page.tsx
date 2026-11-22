import AnalyticsClient from "./AnalyticsClient";

export const metadata = {
  title: "Private Analytics | Birthday Wishlist",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AnalyticsPage() {
  return (
    <>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px 24px 0", textAlign: "right" }}>
        <a
          href="/analytics/reports"
          style={{
            display: "inline-block",
            padding: "10px 16px",
            border: "1px solid #A31621",
            borderRadius: "5px",
            color: "#A31621",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 600
          }}
        >
          Export CSV
        </a>
      </div>
      <AnalyticsClient />
    </>
  );
}
