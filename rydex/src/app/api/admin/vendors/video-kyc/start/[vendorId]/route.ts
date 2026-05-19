import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import axios from "axios";

export async function PATCH(
  req: Request,
 context:{params: Promise<{ vendorId: string; }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const vendor = await User.findById((await context.params).vendorId);

    if (!vendor || vendor.role !== "vendor") {
      return NextResponse.json({ message: "Vendor not found" }, { status: 404 });
    }

    const roomId = `kyc-${vendor._id}-${Date.now()}`;

    vendor.videoKycStatus = "in_progress";
    vendor.videoKycRoomId = roomId;
    vendor.vendorOnboardingStep = 4;

    await vendor.save();
    
    // 🔥 NOTIFY VENDOR
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit`, {
        userId: vendor._id,
        event: "vendor-status-changed",
        data: { message: "Admin has started Video KYC" },
      });
    } catch (err) {
      console.error("Socket emit error:", err);
    }

    return NextResponse.json({ roomId });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
