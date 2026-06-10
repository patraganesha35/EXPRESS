"use client";

import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Camera, Save, ArrowLeft, User, Phone, Mail, Calendar, Loader2, Star, Gift, Copy, Check, Users, Share2 } from "lucide-react";
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
  
  // Referral State
  const [referralData, setReferralData] = useState<any>(null);
  const [fetchingReferrals, setFetchingReferrals] = useState(true);
  const [activeTab, setActiveTab] = useState<"level1" | "level2" | "level3">("level1");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (userData) {
      const fetchReferrals = async () => {
        try {
          const res = await axios.get("/api/referrals");
          setReferralData(res.data);
        } catch (err) {
          console.error("Failed to load referrals:", err);
        } finally {
          setFetchingReferrals(false);
        }
      };
      fetchReferrals();
    }
  }, [userData]);

  const handleCopyLink = () => {
    if (!referralData?.referralCode) return;
    const link = `${window.location.origin}/?ref=${referralData.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          {userData.role === "vendor" && (
            <div className="ml-auto bg-amber-400/10 border border-amber-400/20 px-4 py-2 rounded-2xl flex items-center gap-3">
              <div className="bg-amber-400 text-zinc-900 w-10 h-10 rounded-xl flex items-center justify-center">
                <Star size={20} className="fill-zinc-900" />
              </div>
              <div>
                <p className="text-amber-400 font-black text-lg leading-none">{userData.averageRating || 0}</p>
                <p className="text-amber-400/60 text-[10px] uppercase tracking-wider font-bold">{userData.totalRatings || 0} Ratings</p>
              </div>
            </div>
          )}
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

        {/* Referral Program Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-[#111] border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl mt-10"
        >
          <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 text-white">
              <Gift size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Referral Program</h2>
              <p className="text-xs text-gray-400 mt-0.5">Invite your friends and grow your 3-level network.</p>
            </div>
          </div>

          {fetchingReferrals ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-white w-8 h-8" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Invite link container */}
              <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-1.5 flex-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Unique Referral Link</p>
                  <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-xl px-4 py-3 select-all overflow-x-auto text-sm text-gray-300 font-mono">
                    {typeof window !== "undefined"
                      ? `${window.location.origin}/?ref=${referralData?.referralCode || ""}`
                      : `/?ref=${referralData?.referralCode || ""}`}
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full md:w-auto bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition shadow-lg active:scale-95 shrink-0"
                >
                  {copied ? (
                    <>
                      <Check size={16} /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={16} /> Copy Link
                    </>
                  )}
                </button>
              </div>

              {/* Levels Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black text-white">{referralData?.summary?.level1Count || 0}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Level 1 (Direct)</p>
                </div>
                <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black text-white">{referralData?.summary?.level2Count || 0}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Level 2</p>
                </div>
                <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black text-white">{referralData?.summary?.level3Count || 0}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Level 3</p>
                </div>
                <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-4 text-center col-span-2 md:col-span-1 border-white/10 bg-white/5">
                  <p className="text-2xl font-black text-white">{referralData?.summary?.totalReferrals || 0}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Total Network</p>
                </div>
              </div>

              {/* Tabbed view for levels */}
              <div className="space-y-4">
                <div className="flex border-b border-white/10">
                  {(["level1", "level2", "level3"] as const).map((lvl, index) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setActiveTab(lvl)}
                      className={`flex-1 pb-3 text-sm font-bold capitalize border-b-2 transition ${
                        activeTab === lvl
                          ? "border-white text-white"
                          : "border-transparent text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      Level {index + 1}
                    </button>
                  ))}
                </div>

                {/* Referred list */}
                <div className="min-h-[160px] flex flex-col justify-center">
                  {referralData?.levels[activeTab]?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-6 text-gray-500">
                      <Users size={36} className="text-gray-600 mb-3" />
                      <p className="text-sm font-semibold">No referrals at this level yet</p>
                      <p className="text-xs text-gray-600 mt-1">Share your link to invite friends and build your network.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                      {referralData?.levels[activeTab]?.map((referredUser: any) => (
                        <div
                          key={referredUser._id}
                          className="bg-[#1A1A1A] border border-white/5 rounded-xl p-4 flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white font-bold text-sm">
                              {referredUser.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">{referredUser.name}</p>
                              <p className="text-xs text-gray-400 font-mono">{referredUser.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Joined Date</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(referredUser.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
