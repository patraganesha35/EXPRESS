import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import { sendMail } from "@/lib/mailer";
import axios from "axios";


export async function POST(req: Request) {

  await connectDB();

  try {

    const { bookingId } = await req.json();

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    console.log("Raw Booking User ID:", booking.user);

    await booking.populate("user");

    /* Generate OTP */
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    booking.dropOtp = otp;
    booking.dropOtpExpires = new Date(Date.now() + 5 * 60 * 1000);

    await booking.save();

    /* Emit Socket Event for real-time UI update */
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit-room`, {
        roomId: `booking-${bookingId}`,
        event: "booking-updated",
        data: {
          bookingId: bookingId,
          dropOtp: otp
        }
      });
    } catch (socketError) {
      console.error("Socket Emission Error:", socketError);
    }

    /* Send Mail */
    console.log("Attempting to send drop OTP for booking:", bookingId);
    console.log("Populated User Data:", booking.user);

    if (booking.user?.email) {
      console.log("Sending drop OTP email to:", booking.user.email);
      await sendMail(
        booking.user.email,
        "Your Drop OTP - RYDEX",
        `
        <div style="font-family:sans-serif;padding:20px">
          <h2>Ride OTP</h2>

          <p>Your Drop OTP is:</p>

          <h1 style="letter-spacing:6px">${otp}</h1>

          <p>This OTP is valid for 5 minutes.</p>

          <p>Share this OTP with your driver to complete the ride.</p>

          <br/>

          <b>RYDEX</b>
        </div>
        `
      );
    } else {
      console.warn("⚠️ Cannot send drop OTP: User email is missing for booking", bookingId);
    }

    return NextResponse.json({
      success: true,
      message: "drop OTP sent",
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      { message: "OTP send failed" },
      { status: 500 }
    );

  }

}