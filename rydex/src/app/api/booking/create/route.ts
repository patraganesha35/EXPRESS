import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import { auth } from "@/auth";
import axios from "axios";

export async function POST(req: Request) {
  await connectDb();

  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const {
    driverId,
    vehicleId,
    pickupAddress,
    dropAddress,
    pickupLocation,
    dropLocation,
    fare,
    mobileNumber, // This is user's mobile number from frontend
  } = body;

  if (
    !driverId ||
    !vehicleId ||
    !pickupLocation?.coordinates ||
    !dropLocation?.coordinates
  ) {
    return NextResponse.json(
      { message: "Missing required fields" },
      { status: 400 }
    );
  }

  // Get driver's details from database
  const driver = await User.findById(driverId).select("mobileNumber isOnline name");
  
  if (!driver) {
    return NextResponse.json(
      { message: "Driver not found" },
      { status: 404 }
    );
  }

  // Prevent duplicate active booking
  const existing = await Booking.findOne({
    user: session.user.id,
    status: {
      $in: ["requested", "awaiting_payment", "confirmed", "started"],
    },
  });

  if (existing) {
    return NextResponse.json(
      { message: "You already have an active ride" },
      { status: 400 }
    );
  }

  const booking = await Booking.create({
    user: session.user.id,
    driver: driverId,
    vehicle: vehicleId,
    pickupAddress,
    dropAddress,
    pickupLocation,
    dropLocation,
    fare,
    userMobileNumber: mobileNumber, // Mobile number from frontend (user's)
    driverMobileNumber: driver.mobileNumber, // Mobile number from database (driver's)
    status: "requested",
  });
  
  if (driver.isOnline) {
    // Driver is online, emit socket event immediately
    await axios.post(
      `${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit`,
      {
        userId: driverId,
        event: "new-booking",
        data: booking,
      }
    );
  } else {
    // Driver is offline, trigger AI Voice call via Bland AI
    try {
      const blandApiKey = process.env.BLAND_AI_API_KEY;
      const webhookUrl = process.env.WEBHOOK_BASE_URL 
        ? `${process.env.WEBHOOK_BASE_URL}/api/webhooks/voice-agent` 
        : `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/voice-agent`;

      let formattedPhone = driver.mobileNumber;
      if (formattedPhone && !formattedPhone.startsWith("+")) {
        // Default to +91 for India if no country code is provided
        formattedPhone = `+91${formattedPhone}`;
      }

      if (blandApiKey && formattedPhone) {
        await axios.post('https://api.bland.ai/v1/calls', {
          phone_number: formattedPhone,
          task: `You are an automated dispatch assistant for RYDEX. You are calling a driver named ${driver.name || 'Driver'} to offer them a new ride. The pickup location is ${pickupAddress}. The drop off location is ${dropAddress}. The estimated fare is ${fare} rupees. When the user answers, politely say: 'Hello ${driver.name || ''}, you have a new ride request on RYDEX. Pickup is at ${pickupAddress}, dropping off at ${dropAddress}. The fare is ${fare} rupees. Would you like to accept this ride? Please say Yes or No.' If they say yes, say 'Great! The ride is accepted. Please open your RYDEX app to start the trip.' and hang up. If they say no, say 'No problem, have a good day.' and hang up.`,
          voice: "nat",
          wait_for_greeting: true,
          record: false,
          reduce_latency: true,
          interruption_threshold: 50,
          max_duration: 3,
          webhook: webhookUrl,
          metadata: {
            bookingId: booking._id,
          },
          analysis_schema: {
            ride_accepted: "boolean - true if the driver explicitly said yes or agreed to accept the ride, false otherwise"
          }
        }, {
          headers: {
            'authorization': blandApiKey,
            'content-type': 'application/json'
          }
        });
        console.log(`Dispatched AI call to offline driver ${driverId}`);
      } else {
        console.warn("BLAND_AI_API_KEY is not set. Cannot call offline driver.");
      }
    } catch (error: any) {
      console.error("Failed to trigger Bland AI call:", error.response?.data || error.message);
    }
  }

  return NextResponse.json({ success: true, booking });
}