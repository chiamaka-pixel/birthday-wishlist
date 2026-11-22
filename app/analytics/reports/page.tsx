import { redirect } from "next/navigation";
import { isAnalyticsAuthenticated } from "@/lib/analytics-auth";
import ReportExportClient from "./ReportExportClient";

export const metadata = {
  title: "Analytics Reports | Birthday Wishlist",
  robots: { index: false, follow: false },
};

export default async function AnalyticsReportsPage() {
  const authenticated = await isAnalyticsAuthenticated();

  if (!authenticated) {
    redirect("/analytics");
  }

  return <ReportExportClient />;
}
