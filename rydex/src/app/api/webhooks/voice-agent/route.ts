import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import axios from "axios";

export async function POST(req: Request) {
  try {
    await connectDb();

    // Bland AI sends the payload as JSON
    const body = await req.json();

    // Extract custom variables we passed in the call
    // Bland AI returns variables in `variables` or we can extract data if we set up an extraction node
    // For simplicity, we assume we used Bland's conversational extraction:
    const { call_id, variables, answers } = body;

    // Usually, the bookingId is passed as part of the initial variables/metadata
    const bookingId = variables?.bookingId || body.bookingId;
    
    if (!bookingId) {
      console.error("No bookingId found in webhook payload", body);
      return NextResponse.json({ success: false, message: "Missing bookingId" }, { status: 400 });
    }

    // Determine if accepted from extracted answers
    // Example: If we prompted "Extract if driver accepted as ride_accepted (boolean)"
    let isAccepted = false;
    
    // Fallback parsing (Bland AI format may vary based on exact endpoint config)
    if (answers?.ride_accepted === true || answers?.ride_accepted === "true" || answers?.ride_accepted === "Yes") {
      isAccepted = true;
    } else if (body.transcript && body.transcript.toLowerCase().includes("yes")) {
      // Fallback: check transcript
      isAccepted = true;
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json({ success: false, message: "Booking not found" }, { status: 404 });
    }

    if (isAccepted) {
      // Mimic the manual accept logic
      booking.status = "awaiting_payment";
      booking.paymentDeadline = new Date(Date.now() + 5 * 60 * 1000);
      await booking.save();

      console.log(`AI Agent accepted ride for booking ${bookingId}`);

      // Emit socket event to update user UI
      await axios.post(
        `${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit-room`,
        {
          roomId: `booking-${bookingId}`,
          event: "booking-updated",
          data: {
            bookingId: bookingId,
            status: "awaiting_payment",
          },
        }
      );
    } else {
      // Driver rejected via phone
      booking.status = "rejected";
      await booking.save();
      
      console.log(`AI Agent rejected ride for booking ${bookingId}`);

      await axios.post(
        `${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit-room`,
        {
          roomId: `booking-${bookingId}`,
          event: "booking-updated",
          data: {
            bookingId: bookingId,
            status: "rejected",
          },
        }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Webhook Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
