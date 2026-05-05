import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    await connectDb();

    let filter: any = { role: "vendor" };
    if (status && status !== "all") {
      filter.vendorStatus = status;
    }

    const vendors = await User.find(filter)
      .select("name email vendorStatus createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, vendors });
  } catch (error) {
    console.error("ADMIN VENDORS ERROR:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
