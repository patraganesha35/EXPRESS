import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "@/models/user.model";
import connectDb from "@/lib/db";
import { sendMail } from "@/lib/mailer";
; // 👈 DB connection helper

/* ---------------- POST: REGISTER ---------------- */

export async function POST(req: NextRequest) {
  try {
    await connectDb();

    const body = await req.json();
    const { name, email, password } = body;

    /* ---------- VALIDATION ---------- */

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    /* ---------- CHECK EXISTING USER ---------- */

    const existingUser = await User.findOne({ email });

    if (existingUser && existingUser.isEmailVerified) {
      return NextResponse.json(
        { message: "User already exists. Please login." },
        { status: 409 }
      );
    }

    /* ---------- HASH PASSWORD ---------- */

    const hashedPassword = await bcrypt.hash(password, 10);

    /* ---------- GENERATE OTP ---------- */

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
    const otpExpiresAt = new Date(Date.now() + 1 * 60 * 1000); // 1 minute

    /* ---------- CREATE / UPDATE USER ---------- */

    if (existingUser && !existingUser.isEmailVerified) {
      // Update OTP for unverified user
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.otp = otp;
      existingUser.otpExpiresAt = otpExpiresAt;

      await existingUser.save();
    } else {
      await User.create({
        name,
        email,
        password: hashedPassword,
        role: "user",
        isEmailVerified: false,
        otp,
        otpExpiresAt,
      });
    }

    /* ---------- SEND OTP ---------- */
    console.log("\n=========================================");
    console.log(`🔑 OTP for ${email}: ${otp}`);
    console.log("=========================================\n");
    
    
    try {
      if (process.env.EMAIL && process.env.EMAIL !== "add your email") {
        await sendMail(
           email,
            "Your OTP for Email Verification",
            `<h4>Hey ${name},<h4>
            <br>
            <h4>Your Email Verification OTP is <strong>${otp}</strong></h4>
            <h4>please enter this code to verify your email and join with us </h4>`
        );
      } else {
        console.warn("Skipping email send because EMAIL is not configured in .env.local");
      }
    } catch (mailError) {
      console.error("Failed to send email:", mailError);
      // We can still proceed to the OTP step even if email fails in dev mode.
    }

    return NextResponse.json(
      {
        message: "OTP sent to email. Please verify.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("REGISTER ERROR:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

