import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(
  req: Request,
  context: { params:Promise< { id: string } >}
) {
  await connectDb();
   const id=(await context.params).id
  const { method } = await req.json();
  const booking = await Booking.findById(id);

  if (!booking || booking.status !== "awaiting_payment")
    return NextResponse.json({ message: "Invalid" }, { status: 400 });

  booking.status = "confirmed";
  booking.paymentStatus = method === "cash" ? "cash" : "paid";
  booking.paymentDeadline = undefined;

  await booking.save();

  try {
    if (process.env.NEXT_PUBLIC_SOCKET_SERVER) {
      await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit-room`, {
        roomId: `booking-${id}`,
        event: "booking-updated",
        data: { 
          status: "confirmed", 
          paymentStatus: booking.paymentStatus,
          paymentMethod: method 
        }
      });
    }
  } catch (err) {
    console.error("Socket emit failed", err);
  }

  return NextResponse.json({ success: true });
}