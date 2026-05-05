import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Feedback from "@/models/feedback.model";
import User from "@/models/user.model";
import axios from "axios";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { message: "All fields are required." },
        { status: 400 }
      );
    }

    await connectDb();

    // 1. Save feedback to MongoDB
    const feedback = await Feedback.create({
      name,
      email,
      message,
    });

    // 2. Fetch all admin IDs to emit socket event
    const admins = await User.find({ role: "admin" }).select("_id").lean();

    // 3. Emit real-time event to all active admins
    for (const admin of admins) {
      await axios
        .post(`${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit`, {
          userId: admin._id,
          event: "new-feedback",
          data: feedback,
        })
        .catch((err) => console.error("Socket emit error:", err.message));
    }

    return NextResponse.json(
      { success: true, message: "Feedback sent successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("FEEDBACK POST ERROR:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
