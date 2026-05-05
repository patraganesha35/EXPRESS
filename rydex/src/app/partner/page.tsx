import { redirect } from "next/navigation";

export default function PartnerDashboardRedirect() {
  redirect("/partner/pending-requests");
}
