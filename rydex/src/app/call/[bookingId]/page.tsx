"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { PhoneOff, Loader2, User2, ArrowLeft, Mic, MicOff, PhoneCall } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { motion, AnimatePresence } from "framer-motion";

interface BookingDetails {
  _id: string;
  user?: { _id: string; name: string; mobileNumber?: string };
  driver?: { _id: string; name: string; mobileNumber?: string };
  status: string;
  userMobileNumber?: string;
  driverMobileNumber?: string;
}

export default function CallPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const zpRef = useRef<any>(null);
  const joinedRef = useRef(false);

  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userData } = useSelector((state: RootState) => state.user);

  const bookingId = typeof params?.bookingId === "string" ? params.bookingId : null;
  const role = searchParams?.get("role") || "user"; // 'driver' or 'user'

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [callJoined, setCallJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch booking details to display participant names
  useEffect(() => {
    if (!bookingId) return;

    const fetchBookingDetails = async () => {
      try {
        const res = await fetch(`/api/booking/${bookingId}`);
        if (!res.ok) throw new Error("Failed to load booking details");
        const data = await res.json();
        setBooking(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  // Handle call setup and teardown within the same effect to prevent StrictMode race conditions
  useEffect(() => {
    let active = true;

    const startCall = async () => {
      if (!bookingId || !containerRef.current || !userData) return;
      if (joinedRef.current) return;
      joinedRef.current = true;

      try {
        const res = await fetch("/api/zego/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ roomId: bookingId }),
        });

        if (!res.ok) {
          throw new Error("Failed to retrieve Zego token from server");
        }

        const { token, appID } = await res.json();

        // If the component has unmounted during the async fetch, stop initialization
        if (!active) {
          joinedRef.current = false;
          return;
        }

        const userID = userData._id?.toString() || userData.id?.toString() || "";
        const userName = userData.name || "User";

        // Generate the Kit Token expected by the Zego Web SDK using generateKitTokenForProduction
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForProduction(
          appID,
          token,
          bookingId,
          userID,
          userName
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zpRef.current = zp;

        zp.joinRoom({
          container: containerRef.current,
          scenario: {
            mode: ZegoUIKitPrebuilt.OneONoneCall,
          },
          showPreJoinView: false,
          turnOnCameraWhenJoining: false,
          turnOnMicrophoneWhenJoining: true,
          showMyCameraToggleButton: false,
          showMyMicrophoneToggleButton: true,
          showAudioVideoSettingsButton: false,
          showScreenSharingButton: false,
          showTextChat: false,
          showUserList: false,
          onLeaveRoom: () => {
            router.back();
          },
        });

        if (active) {
          setCallJoined(true);
        }
      } catch (err) {
        console.error("Zego connection failed:", err);
        if (active) {
          joinedRef.current = false;
        }
      }
    };

    if (userData && booking && !loading && !joinedRef.current) {
      startCall();
    }

    return () => {
      active = false;
      if (zpRef.current) {
        try {
          zpRef.current.destroy();
          zpRef.current = null;
        } catch (e) {
          // Quietly catch unmount errors from Zego Express SDK
        }
      }
      joinedRef.current = false;
    };
  }, [userData, booking, loading, bookingId, router]);

  const handleEndCall = () => {
    if (zpRef.current) {
      try {
        zpRef.current.destroy();
      } catch (e) {
        // Quietly catch unmount errors from Zego Express SDK
      }
    }
    router.back();
  };

  const getCallParticipantName = () => {
    if (!booking) return "Connecting...";
    if (role === "driver") {
      return booking.user?.name || "Customer";
    } else {
      return booking.driver?.name || "Driver";
    }
  };

  const getParticipantLabel = () => {
    return role === "driver" ? "Rider" : "Driver";
  };

  if (loading || !userData) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-zinc-400 mb-4" />
        <p className="text-zinc-500 text-sm font-medium tracking-wide uppercase">Connecting call service...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white p-6">
        <p className="text-red-500 font-semibold mb-4">Error: {error}</p>
        <button
          onClick={() => router.back()}
          className="bg-white text-zinc-950 px-6 py-3 rounded-xl font-bold flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between items-center px-6 py-12 relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-zinc-800/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="w-full max-w-md flex justify-between items-center z-10">
        <button
          onClick={handleEndCall}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <p className="text-xs text-zinc-500 tracking-[0.2em] uppercase font-bold">In-App Voice Call</p>
          <p className="text-[10px] text-zinc-600 font-mono mt-0.5">Room ID: {bookingId?.slice(-6)}</p>
        </div>
        <div className="w-10 h-10" /> {/* Spacer */}
      </div>

      {/* Profile Card & Pulse Animation */}
      <div className="flex flex-col items-center z-10 my-auto">
        <div className="relative mb-8">
          {/* Ring 1 */}
          <motion.div
            animate={{ scale: [1, 1.6, 1], opacity: [0.15, 0, 0.15] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full border border-white/20"
          />
          {/* Ring 2 */}
          <motion.div
            animate={{ scale: [1.3, 2.2, 1.3], opacity: [0.08, 0, 0.08] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute -inset-4 rounded-full border border-white/10"
          />
          {/* Avatar Container */}
          <div className="relative w-28 h-28 rounded-full bg-zinc-900 border-2 border-white/10 flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.03)]">
            <User2 size={44} className="text-zinc-400" />
          </div>
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-white mb-1">
          {getCallParticipantName()}
        </h2>
        <p className="text-xs text-zinc-500 font-semibold tracking-wider uppercase bg-white/5 border border-white/10 px-3 py-1 rounded-full">
          {getParticipantLabel()}
        </p>

        <p className="text-zinc-400 text-sm mt-6 animate-pulse">
          {!callJoined ? "Connecting Call..." : "Call Connected"}
        </p>

        {!callJoined && booking && (() => {
          const userMobile = booking.userMobileNumber || booking.user?.mobileNumber || "";
          const driverMobile = booking.driverMobileNumber || booking.driver?.mobileNumber || "";
          const fallbackNumber = role === "driver" ? userMobile : driverMobile;
          return fallbackNumber ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center max-w-sm"
            >
              <p className="text-amber-400 text-xs font-semibold mb-2">Connecting in-app call... You can also call directly:</p>
              <a
                href={`tel:${fallbackNumber}`}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-lg shadow-amber-500/10"
              >
                <PhoneCall size={14} /> Call via Phone Dialer
              </a>
            </motion.div>
          ) : null;
        })()}
      </div>

      {/* Hidden Zego Video/Audio container */}
      <div 
        ref={containerRef} 
        className="w-full max-w-xs h-16 bg-white/5 rounded-2xl border border-white/10 flex justify-center items-center z-10"
      />

      {/* Manual End Call / Status Controls */}
      <div className="w-full max-w-md flex flex-col items-center gap-4 z-10">
        <button
          onClick={handleEndCall}
          className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg active:scale-95 transition-all text-white"
        >
          <PhoneOff size={24} />
        </button>
        <p className="text-[10px] text-zinc-600 tracking-wide">
          Your conversation is secured using end-to-end encryption.
        </p>
      </div>

    </div>
  );
}
