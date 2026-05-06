import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import axios from "axios";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await connectDb();
  const id = (await context.params).id;
  
  const booking = await Booking.findOneAndUpdate(
    { _id: id, status: "requested" },
    { status: "cancelled" },
    { new: true }
  );

  if (!booking) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  try {
    if (process.env.NEXT_PUBLIC_SOCKET_SERVER) {
      await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit-room`, {
        roomId: `booking-${id}`,
        event: "booking-updated",
        data: { status: "cancelled" }
      });
    }
  } catch (err) {
    console.error("Socket emit failed", err);
  }

  return NextResponse.json({ success: true });
}