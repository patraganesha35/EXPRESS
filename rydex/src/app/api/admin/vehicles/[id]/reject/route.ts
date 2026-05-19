import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Vehicle from "@/models/vehicle.model";
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
    const { reason } = await req.json();

    if (!reason) {
      return NextResponse.json(
        { message: "Rejection reason required" },
        { status: 400 }
      );
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return NextResponse.json({ message: "Vehicle not found" }, { status: 404 });
    }

    vehicle.status = "rejected";
    vehicle.rejectionReason = reason;
    await vehicle.save();

    // 🔥 NOTIFY VENDOR
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit`, {
        userId: vehicle.owner,
        event: "vendor-status-changed",
        data: { message: "Your vehicle pricing has been rejected" },
      });
    } catch (err) {
      console.error("Socket emit error:", err);
    }

    return NextResponse.json({
      message: "Vehicle pricing rejected",
    });
  } catch (error) {
    console.error("VEHICLE REJECT ERROR:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
