import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { sendMail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    // Send Email
    try {
      await sendMail(
        email,
        "Password Reset OTP - RYDEX",
        `<h4>Your OTP for password reset is <strong>${otp}</strong></h4>
         <p>This code will expire in 10 minutes.</p>`
      );
    } catch (mailError) {
      console.error("Mail error:", mailError);
      // In dev mode, we log the OTP so we can test without working email
      console.log(`DEBUG: OTP for ${email} is ${otp}`);
    }

    return NextResponse.json({ message: "OTP sent to your email" }, { status: 200 });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
