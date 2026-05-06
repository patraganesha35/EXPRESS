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

    if (!booking.dropOtp) {
      return NextResponse.json(
        { message: "OTP not generated" },
        { status: 400 }
      );
    }

    if (booking.dropOtp !== otp) {
      return NextResponse.json(
        { message: "Invalid OTP" },
        { status: 400 }
      );
    }

    if (booking.dropExpires < new Date()) {
      return NextResponse.json(
        { message: "OTP expired" },
        { status: 400 }
      );
    }

    /* update status */

    booking.status = "completed";

    booking.dropOtp = "";
    booking.dropOtpExpires = undefined as any;

    if (!booking.partnerAmount) {
      const adminCommission = booking.fare * 0.10;
      const partnerAmount = booking.fare - adminCommission;
      booking.adminCommission = adminCommission;
      booking.partnerAmount = partnerAmount;
    }

    await booking.save();

    // Emit socket event to update everyone in the booking room
    try {
      if (process.env.NEXT_PUBLIC_SOCKET_SERVER) {
        await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit-room`, {
          roomId: `booking-${bookingId}`,
          event: "booking-updated",
          data: { status: "completed" }
        });

        // Notify Admins to update their earnings dashboard
        const User = (await import("@/models/user.model")).default;
        const admins = await User.find({ role: "admin" });
        for (const admin of admins) {
          await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit`, {
            userId: admin._id,
            event: "admin-earnings-updated",
            data: {}
          }).catch(() => {}); // ignore individual admin emit failures
        }
      }
    } catch (socketErr) {
      console.error("Socket emit failed", socketErr);
    }

    return NextResponse.json({
      success: true,
      message: "OTP verified. Ride completed."
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      { message: "OTP verification failed" },
      { status: 500 }
    );

  }

}