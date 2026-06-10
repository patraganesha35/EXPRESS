import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "@/models/user.model";
import connectDb from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import crypto from "crypto";

async function generateUniqueReferralCode(name: string): Promise<string> {
  const prefix = name.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase() || "RYDX";
  let isUnique = false;
  let code = "";
  let attempts = 0;
  while (!isUnique && attempts < 10) {
    const randomVal = Math.floor(1000 + Math.random() * 9000);
    code = `${prefix}${randomVal}`;
    const existing = await User.findOne({ referralCode: code });
    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }
  if (!isUnique) {
    code = `${prefix}${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  }
  return code;
}

/* ---------------- POST: REGISTER ---------------- */

export async function POST(req: NextRequest) {
  try {
    await connectDb();

    const body = await req.json();
    const { name, email, password, referredByCode } = body;

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

    /* ---------- CHECK REFERRER ---------- */

    let referrerId: mongoose.Types.ObjectId | undefined;
    if (referredByCode) {
      const referrer = await User.findOne({ referralCode: referredByCode.trim().toUpperCase() });
      if (referrer) {
        referrerId = referrer._id as mongoose.Types.ObjectId;
      }
    }

    // Generate unique referral code for the new user
    const userReferralCode = await generateUniqueReferralCode(name);

    /* ---------- CREATE / UPDATE USER ---------- */

    if (existingUser && !existingUser.isEmailVerified) {
      // Update OTP for unverified user
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.otp = otp;
      existingUser.otpExpiresAt = otpExpiresAt;
      if (!existingUser.referralCode) {
        existingUser.referralCode = userReferralCode;
      }
      if (referrerId) {
        existingUser.referredBy = referrerId;
      }

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
        referralCode: userReferralCode,
        referredBy: referrerId,
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

