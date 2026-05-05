import { auth } from "@/auth";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import VendorDashboard from "@/components/VendorDashboard";
import User from "@/models/user.model";
import connectDb from "@/lib/db";
import { redirect } from "next/navigation";

export default async function PartnerProfilePage() {
  const session = await auth();
  if (!session?.user?.id) return redirect("/login");

  await connectDb();
  const user = await User.findById(session.user.id)
    .select("role vendorOnboardingStep vendorStatus")
    .lean();

  if (user?.role !== "vendor") {
    return redirect("/");
  }

  const vendorData = {
    vendorStep: user.vendorOnboardingStep ?? 0,
    vendorStatus: user.vendorStatus ?? "pending",
  };

  return (
    <div className="w-full min-h-screen bg-white">
      <Nav />
      <VendorDashboard
        vendorStep={vendorData.vendorStep}
        vendorStatus={vendorData.vendorStatus}
      />
      <Footer />
    </div>
  );
}
