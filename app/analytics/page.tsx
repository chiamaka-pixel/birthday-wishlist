import AnalyticsClient from "./AnalyticsClient";

export const metadata = {
  title: "Private Analytics | Birthday Wishlist",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AnalyticsPage() {
  return <AnalyticsClient />;
}