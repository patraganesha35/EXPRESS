import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Booking from "@/models/booking.model";
import axios from "axios";

export async function POST(req: Request) {

  await connectDB();

  try {

    const { bookingId, otp } = await req.json();

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return NextResponse.json(
        { message: "Booking not found" },
        { status: 404 }
      );
    }

    if (!booking.pickupOtp) {
      return NextResponse.json(
        { message: "OTP not generated" },
        { status: 400 }
      );
    }

    if (booking.pickupOtp !== otp) {
      return NextResponse.json(
        { message: "Invalid OTP" },
        { status: 400 }
      );
    }

    if (booking.pickupOtpExpires < new Date()) {
      return NextResponse.json(
        { message: "OTP expired" },
        { status: 400 }
      );
    }

    /* update status */

    booking.status = "started";

    booking.pickupOtp = "";
    booking.pickupOtpExpires = undefined as any;

    await booking.save();

    // Emit socket event to update everyone in the booking room
    try {
      if (process.env.NEXT_PUBLIC_SOCKET_SERVER) {
        await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit-room`, {
          roomId: `booking-${bookingId}`,
          event: "booking-updated",
          data: { 
            bookingId: bookingId,
            status: "started" 
          }
        });
      }
    } catch (socketErr) {
      console.error("Socket emit failed", socketErr);
    }

    return NextResponse.json({
      success: true,
      message: "OTP verified. Ride started."
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      { message: "OTP verification failed" },
      { status: 500 }
    );

  }

}