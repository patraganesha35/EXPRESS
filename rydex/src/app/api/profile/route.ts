import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import uploadOnCloudinary from "@/lib/cloudinary";

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    
    const name = formData.get("name") as string;
    const mobileNumber = formData.get("mobileNumber") as string;
    const gender = formData.get("gender") as string;
    const dateOfBirth = formData.get("dateOfBirth") as string;
    
    const profilePictureFile = formData.get("profilePicture") as File | null;

    await connectDb();

    let profilePictureUrl;
    
    if (profilePictureFile && profilePictureFile.size > 0) {
      try {
        // Upload the new picture to Cloudinary
        const url = await uploadOnCloudinary(profilePictureFile);
        if (url) {
          profilePictureUrl = url;
        }
      } catch (uploadError) {
        console.error("Profile picture upload failed:", uploadError);
        return NextResponse.json(
          { message: "Failed to upload profile picture" },
          { status: 500 }
        );
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (mobileNumber) updateData.mobileNumber = mobileNumber;
    if (gender) updateData.gender = gender;
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
    if (profilePictureUrl) updateData.profilePicture = profilePictureUrl;

    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: updateData },
      { new: true }
    ).select("-password").lean();

    if (!updatedUser) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "Profile updated successfully"
    });

  } catch (error: any) {
    console.error("PROFILE UPDATE ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
