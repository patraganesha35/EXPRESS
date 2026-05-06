import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import { auth } from "@/auth";
import axios from "axios";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await connectDb();
  const id = (await context.params).id;
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const driverId = session.user.id;

  const booking = await Booking.findOneAndUpdate(
    {
      _id: id,
      driver: driverId,
      status: "requested",
    },
    {
      status: "rejected",
    },
    { new: true }
  );

  if (!booking) {
    return NextResponse.json(
      { message: "Ride already processed or invalid" },
      { status: 400 }
    );
  }

  try {
    if (process.env.NEXT_PUBLIC_SOCKET_SERVER) {
      await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit-room`, {
        roomId: `booking-${id}`,
        event: "booking-updated",
        data: { status: "rejected" }
      });
    }
  } catch (err) {
    console.error("Socket emit failed", err);
  }

  return NextResponse.json({ success: true });
}