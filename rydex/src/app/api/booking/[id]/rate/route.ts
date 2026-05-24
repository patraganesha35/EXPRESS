import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDb();
    
    const body = await req.json();
    const { rating } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, message: "Invalid rating" }, { status: 400 });
    }

    const booking = await Booking.findById(params.id);
    if (!booking) {
      return NextResponse.json({ success: false, message: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "completed") {
      return NextResponse.json({ success: false, message: "Ride is not completed yet" }, { status: 400 });
    }

    if (booking.rating) {
      return NextResponse.json({ success: false, message: "Ride is already rated" }, { status: 400 });
    }

    booking.rating = rating;
    await booking.save();

    // Update vendor's average rating
    if (booking.driver) {
      const vendor = await User.findById(booking.driver);
      if (vendor) {
        const totalRatings = vendor.totalRatings || 0;
        const currentAverage = vendor.averageRating || 0;
        
        // Calculate new average
        const newTotalRatings = totalRatings + 1;
        const newAverage = ((currentAverage * totalRatings) + rating) / newTotalRatings;
        
        vendor.totalRatings = newTotalRatings;
        // round to 1 decimal place
        vendor.averageRating = Math.round(newAverage * 10) / 10; 
        
        await vendor.save();
      }
    }

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    console.error("Error rating booking:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
