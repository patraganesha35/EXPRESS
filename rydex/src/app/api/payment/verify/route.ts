import connectDb from "@/lib/db"
import Booking from "@/models/booking.model"
import crypto from "crypto"



export async function POST(req: Request) {

  await connectDb()

  const {
    bookingId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  } = await req.json()

  const body = razorpay_order_id + "|" + razorpay_payment_id

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex")

  if (expectedSignature !== razorpay_signature) {
    return Response.json({ success:false, message:"Invalid signature" })
  }

  const booking = await Booking.findById(bookingId)

  if (!booking) {
    return Response.json({ success:false })
  }

  /* SPLIT CALCULATION */

  const adminCommission = booking.fare * 0.10
  const partnerAmount = booking.fare - adminCommission

  booking.paymentStatus = "paid"
  booking.status = "confirmed"

  booking.adminCommission = adminCommission
  booking.partnerAmount = partnerAmount

  await booking.save()

  try {
    if (process.env.NEXT_PUBLIC_SOCKET_SERVER) {
      const axios = (await import("axios")).default;
      await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit`, {
        userId: booking.driver,
        event: "booking-updated",
        data: { 
          bookingId: booking._id, 
          status: "confirmed", 
          paymentStatus: "paid",
          paymentMethod: "online"
        }
      });
      await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit`, {
        userId: booking.user,
        event: "booking-updated",
        data: { 
          bookingId: booking._id, 
          status: "confirmed",
          paymentStatus: "paid",
          paymentMethod: "online"
        }
      });

      // Notify Admins to update their earnings dashboard
      const User = (await import("@/models/user.model")).default;
      const admins = await User.find({ role: "admin" });
      for (const admin of admins) {
        await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit`, {
          userId: admin._id,
          event: "admin-earnings-updated",
          data: {}
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.error("Socket emit failed", err);
  }

  return Response.json({
    success:true,
    adminCommission,
    partnerAmount
  })
}