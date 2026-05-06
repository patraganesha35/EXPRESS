import { NextResponse } from "next/server";

import connectDB from "@/lib/db";
import User from "@/models/user.model";

import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const vendors = await User.find({
      role: "vendor",
      videoKycStatus: { $in: ["pending", "in_progress"] },
    });

    return NextResponse.json(vendors);
  } catch (error) {
    console.error("ADMIN KYC PENDING ERROR:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
