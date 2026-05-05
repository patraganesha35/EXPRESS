import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Feedback from "@/models/feedback.model";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    const feedbacks = await Feedback.find()
      .sort({ createdAt: -1 }) // newest first
      .lean();

    return NextResponse.json({ success: true, feedbacks });
  } catch (error) {
    console.error("ADMIN FEEDBACK ERROR:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
