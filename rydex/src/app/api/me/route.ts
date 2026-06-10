import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";
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

export async function GET(req: NextRequest) {
    try {
        await connectDb()
        const session = await auth()
        if (!session || !session.user) {
            return NextResponse.json(
                { message: "user is not authenticated" },
                { status: 400 }
            )
        }

        let user = await User.findOne({ email: session.user.email }).select("-password")
        if (!user) {
            return NextResponse.json(
                { message: "user not found" },
                { status: 400 }
            )
        }

        // Lazy initialization of referralCode for existing users or Google signups
        if (!user.referralCode) {
            user.referralCode = await generateUniqueReferralCode(user.name);
            await user.save();
        }

        return NextResponse.json(
            user,
            { status: 200 }
        )

    } catch (error) {
        return NextResponse.json(
            { message: `get me error : ${error}` },
            { status: 500 }
        )
    }
}