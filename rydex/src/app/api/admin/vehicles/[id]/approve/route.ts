import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Vehicle from "@/models/vehicle.model";
import User from "@/models/user.model";
import axios from "axios";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    const vehicleId = (await context.params).id;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return NextResponse.json({ message: "Vehicle not found" }, { status: 404 });
    }

    vehicle.status = "approved";
    vehicle.rejectionReason = undefined;
    await vehicle.save();

    // 🔥 Move vendor to LIVE step (7)
    await User.findByIdAndUpdate(vehicle.owner, {
      vendorOnboardingStep: 7,
    });

    // 🔥 NOTIFY VENDOR
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit`, {
        userId: vehicle.owner,
        event: "vendor-status-changed",
        data: { message: "Your vehicle pricing has been approved" },
      });
    } catch (err) {
      console.error("Socket emit error:", err);
    }

    return NextResponse.json({
      message: "Vehicle pricing approved",
    });
  } catch (error) {
    console.error("VEHICLE APPROVE ERROR:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
