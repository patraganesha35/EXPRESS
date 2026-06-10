import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";

export async function GET(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await User.findOne({ email: session.user.email }).select("_id referralCode");
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const userId = user._id;

    // Level 1 Referrals: referredBy matches current user ID
    const level1Users = await User.find({ referredBy: userId })
      .select("name email createdAt")
      .sort({ createdAt: -1 })
      .lean();
    const level1Ids = level1Users.map((u: any) => u._id);

    // Level 2 Referrals: referredBy matches any level 1 user ID
    let level2Users: any[] = [];
    let level2Ids: any[] = [];
    if (level1Ids.length > 0) {
      level2Users = await User.find({ referredBy: { $in: level1Ids } })
        .select("name email createdAt")
        .sort({ createdAt: -1 })
        .lean();
      level2Ids = level2Users.map((u: any) => u._id);
    }

    // Level 3 Referrals: referredBy matches any level 2 user ID
    let level3Users: any[] = [];
    if (level2Ids.length > 0) {
      level3Users = await User.find({ referredBy: { $in: level2Ids } })
        .select("name email createdAt")
        .sort({ createdAt: -1 })
        .lean();
    }

    // Obfuscate emails slightly for privacy, keeping the domain visible
    const obfuscateEmail = (email: string) => {
      if (!email) return "";
      const [local, domain] = email.split("@");
      if (local.length <= 2) return `*@${domain}`;
      return `${local.slice(0, 2)}***@${domain}`;
    };

    const formatUser = (u: any) => ({
      _id: u._id.toString(),
      name: u.name,
      email: obfuscateEmail(u.email),
      createdAt: u.createdAt,
    });

    const formattedLevel1 = level1Users.map(formatUser);
    const formattedLevel2 = level2Users.map(formatUser);
    const formattedLevel3 = level3Users.map(formatUser);

    return NextResponse.json({
      referralCode: user.referralCode,
      levels: {
        level1: formattedLevel1,
        level2: formattedLevel2,
        level3: formattedLevel3,
      },
      summary: {
        level1Count: formattedLevel1.length,
        level2Count: formattedLevel2.length,
        level3Count: formattedLevel3.length,
        totalReferrals: formattedLevel1.length + formattedLevel2.length + formattedLevel3.length,
      },
    });
  } catch (error: any) {
    console.error("REFERRALS FETCH ERROR:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
