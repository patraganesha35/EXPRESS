"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getSocket } from "@/lib/socket";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { MapPin, Navigation, IndianRupee, X, BellRing, Loader2 } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";

type Booking = {
  _id: string;
  pickupAddress: string;
  dropAddress: string;
  fare: number;
};

export default function VendorNotification() {
  const { userData } = useSelector((state: RootState) => state.user);
  const [incomingBookings, setIncomingBookings] = useState<Booking[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Only run for vendors
    if (userData?.role !== "vendor") return;

    const socket = getSocket();

    const emitIdentity = () => {
      if (userData?._id) {
        socket.emit("identity", userData._id);
      }
    };

    if (socket.connected) {
      emitIdentity();
    }
    
    socket.on("connect", emitIdentity);

    const handleNewBooking = (booking: Booking) => {
      setIncomingBookings((prev) => {
        if (prev.some((b) => b._id === booking._id)) return prev;
        return [booking, ...prev]; // Add to queue
      });
    };

    socket.on("new-booking", handleNewBooking);

    // Also listen if another vendor accepts or if booking is cancelled to remove the notification
    const handleBookingUpdated = (data: { bookingId: string }) => {
      setIncomingBookings((prev) => prev.filter((b) => b._id !== data.bookingId));
    };

    socket.on("booking-updated", handleBookingUpdated);

    return () => {
      socket.off("connect", emitIdentity);
      socket.off("new-booking", handleNewBooking);
      socket.off("booking-updated", handleBookingUpdated);
    };
  }, [userData]);

  const handleAction = async (bookingId: string, action: "accept" | "reject") => {
    try {
      setProcessingId(bookingId);
      await axios.post(`/api/booking/${bookingId}/${action}`);
      
      // Remove from queue
      setIncomingBookings((prev) => prev.filter((b) => b._id !== bookingId));

      if (action === "accept") {
        router.push("/partner/active-ride");
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Action failed");
    } finally {
      setProcessingId(null);
    }
  };

  const dismissNotification = (bookingId: string) => {
    setIncomingBookings((prev) => prev.filter((b) => b._id !== bookingId));
  };

  // Render the top-most booking notification (or a stacked UI)
  return (
    <div className="fixed top-24 right-4 z-[9999] flex flex-col gap-4 w-full max-w-sm">
      <AnimatePresence>
        {incomingBookings.map((booking) => (
          <motion.div
            key={booking._id}
            initial={{ opacity: 0, x: 100, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className="bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border border-gray-100 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-black text-white px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing size={16} className="animate-pulse text-green-400" />
                <span className="font-semibold text-sm">New Ride Request</span>
              </div>
              <button 
                onClick={() => dismissNotification(booking._id)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              
              <div className="flex gap-3">
                <div className="mt-1">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <MapPin size={12} />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Pickup</p>
                  <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight mt-0.5">{booking.pickupAddress}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="mt-1">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <Navigation size={12} />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Dropoff</p>
                  <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight mt-0.5">{booking.dropAddress}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
                <p className="text-xs font-semibold text-gray-500 uppercase">Est. Fare</p>
                <div className="flex items-center text-xl font-bold text-black">
                  <IndianRupee size={16} strokeWidth={3} />
                  {booking.fare}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => handleAction(booking._id, "reject")}
                  disabled={processingId === booking._id}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleAction(booking._id, "accept")}
                  disabled={processingId === booking._id}
                  className="flex-1 py-2.5 rounded-xl bg-black text-white font-semibold text-sm shadow-md hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingId === booking._id ? <Loader2 size={16} className="animate-spin" /> : "Accept"}
                </button>
              </div>

            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
