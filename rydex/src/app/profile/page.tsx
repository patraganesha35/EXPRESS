"use client";

import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Camera, Save, ArrowLeft, User, Phone, Mail, Calendar, Loader2 } from "lucide-react";
import axios from "axios";
import { setUserData } from "@/redux/userSlice";

import { useSession } from "next-auth/react";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { userData } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  
  // Image State
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    if (userData) {
      setName(userData.name || "");
      setMobileNumber(userData.mobileNumber || "");
      setGender(userData.gender || "");
      
      if (userData.dateOfBirth) {
        const date = new Date(userData.dateOfBirth);
        setDateOfBirth(date.toISOString().split("T")[0]);
      }
      
      if (userData.profilePicture) {
        setPreviewUrl(userData.profilePicture);
      }
    }
  }, [userData, status, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePictureFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("mobileNumber", mobileNumber);
      formData.append("gender", gender);
      if (dateOfBirth) formData.append("dateOfBirth", dateOfBirth);
      
      if (profilePictureFile) {
        formData.append("profilePicture", profilePictureFile);
      }

      const res = await axios.put("/api/profile", formData);

      if (res.data.success) {
        dispatch(setUserData(res.data.user));
        alert("Profile updated successfully!");
      }
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || !userData) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center text-white">
        <Loader2 className="animate-spin text-white w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white py-20 px-4 md:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-10 mt-6">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
            <p className="text-sm text-gray-400 mt-1">Manage your personal information</p>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111] border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl"
        >
          <form onSubmit={handleSave} className="flex flex-col md:flex-row gap-10">
            
            {/* Left: Avatar Upload */}
            <div className="flex flex-col items-center gap-6">
              <div className="relative group">
                <div className="w-36 h-36 rounded-full border-4 border-[#222] overflow-hidden bg-[#222] shadow-inner relative">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-gray-600">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  {/* Hover Overlay */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                  >
                    <Camera size={24} className="text-white mb-2" />
                    <span className="text-xs font-semibold">Change Photo</span>
                  </div>
                </div>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageChange}
                  accept="image/jpeg, image/png, image/webp" 
                  className="hidden" 
                />
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-500">Allowed: JPG, PNG, WEBP</p>
                <p className="text-xs text-gray-500">Max size: 5MB</p>
              </div>
            </div>

            {/* Right: Form Fields */}
            <div className="flex-1 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <User size={14} /> Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/40 transition"
                    placeholder="Enter your name"
                    required
                  />
                </div>

                {/* Email (Read Only) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Mail size={14} /> Email Address
                  </label>
                  <input
                    type="email"
                    value={userData.email}
                    readOnly
                    className="w-full bg-[#1A1A1A]/50 border border-transparent rounded-xl px-4 py-3 text-gray-500 outline-none cursor-not-allowed"
                  />
                </div>

                {/* Mobile */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Phone size={14} /> Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/40 transition"
                    placeholder="Enter mobile number"
                  />
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Calendar size={14} /> Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/40 transition [color-scheme:dark]"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Gender
                  </label>
                  <div className="flex gap-4">
                    {["male", "female", "other"].map((g) => (
                      <label key={g} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value={g}
                          checked={gender === g}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-4 h-4 accent-white bg-[#1A1A1A] border-white/20"
                        />
                        <span className="text-sm capitalize">{g}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6 mt-6 border-t border-white/10 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-white text-black px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl hover:bg-gray-100 transition disabled:opacity-70 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} /> Save Changes
                    </>
                  )}
                </button>
              </div>

            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
