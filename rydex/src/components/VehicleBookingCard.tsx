"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bike, Car, Truck, Zap,
  IndianRupee, Clock, Gauge,
  ArrowRight, Star, ChevronDown
} from "lucide-react";

interface VehicleProps {
  vehicle: {
    _id: string;
    type: "bike" | "auto" | "car" | "loading" | "truck";
    vehicleModel: string;
    number: string;
    imageUrl?: string;
    baseFare?: number;
    pricePerKm?: number;
    waitingCharge?: number;
    owner?: {
      _id: string;
      name?: string;
      profilePicture?: string;
      averageRating?: number;
    };
  };
  distanceKm?: number;
  isRecommended?: boolean;
  onBook?: () => void;
}

const TYPE_CONFIG = {
  bike:    { label: "Bike",    Icon: Bike  },
  auto:    { label: "Auto",    Icon: Car   },
  car:     { label: "Car",     Icon: Car   },
  loading: { label: "Loading", Icon: Truck },
  truck:   { label: "Truck",   Icon: Truck },
};

export default function VehicleBookingCard({
  vehicle, distanceKm = 0, isRecommended, onBook,
}: VehicleProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    type, vehicleModel, number,
    imageUrl, baseFare = 0, pricePerKm = 0, waitingCharge = 0,
  } = vehicle;

  const { label, Icon } = TYPE_CONFIG[type] ?? TYPE_CONFIG.car;
  const estimated = Math.round(baseFare + distanceKm * pricePerKm);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="bg-white border border-zinc-200 rounded-2xl overflow-hidden flex flex-col group shadow-sm hover:shadow-md transition-shadow"
    >
      {/* COMPACT BANNER (Always visible) */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-50 transition-colors relative"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* BEST PICK BADGE (Small version for banner) */}
        {isRecommended && (
          <div className="absolute top-0 left-0 bg-zinc-900 text-white text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-br-lg z-10 flex items-center gap-1">
            <Zap size={8} className="fill-white" />
            Best
          </div>
        )}

        <div className="flex items-center gap-3 min-w-0">
          {/* Profile Pic */}
          {vehicle.owner?.profilePicture ? (
            <img 
              src={vehicle.owner.profilePicture} 
              alt={vehicle.owner.name}
              className="w-11 h-11 rounded-full object-cover border border-zinc-200 flex-shrink-0" 
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200 flex-shrink-0">
              <span className="font-bold text-zinc-600 text-sm">
                {vehicle.owner?.name?.charAt(0).toUpperCase() || "V"}
              </span>
            </div>
          )}

          <div className="min-w-0 pt-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-black text-zinc-900 truncate">
                {vehicle.owner?.name?.split(" ")[0] || "Vendor"}
              </p>
              {vehicle.owner?.averageRating && (
                <div className="flex items-center gap-0.5 text-[10px] font-bold text-zinc-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100">
                  <Star size={9} className="fill-amber-400 text-amber-400" />
                  {vehicle.owner.averageRating}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Icon size={10} className="text-zinc-400" />
              <p className="text-xs text-zinc-500 font-medium truncate">{vehicleModel}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0 pl-2">
          <div className="text-right">
            <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold mb-0.5">Est. Fare</p>
            <p className="text-lg font-black text-zinc-900 leading-none">₹{estimated}</p>
          </div>
          <div className={`w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>
            <ChevronDown size={16} className="text-zinc-500" />
          </div>
        </div>
      </div>

      {/* EXPANDED CONTENT */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-zinc-100">
              
              {/* IMAGE AREA */}
              <div className="relative h-40 bg-zinc-50 flex items-center justify-center overflow-hidden">
                <div
                  className="absolute inset-0 opacity-[0.04]"
                  style={{
                    backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                  }}
                />
                <motion.img
                  src={imageUrl || "https://images.unsplash.com/photo-1549924231-f129b911e442?w=400&q=80"}
                  alt={vehicleModel}
                  className="relative z-10 h-32 w-full object-contain"
                  style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.14))" }}
                />
                {/* Type pill — bottom right */}
                <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1 bg-white/80 backdrop-blur-sm border border-zinc-200 text-zinc-800 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow-sm">
                  <Icon size={9} />
                  {label}
                </div>
              </div>

              {/* STATS & BOOK */}
              <div className="p-4 bg-white flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center bg-zinc-100 px-2.5 py-1 rounded-lg border border-zinc-200">
                    <span className="text-zinc-600 text-xs font-black tracking-[0.2em] font-mono uppercase">
                      {number}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="bg-zinc-50 border border-zinc-100 rounded-lg px-2.5 py-1.5 text-center">
                      <p className="text-zinc-400 text-[8px] uppercase tracking-widest font-bold">Per km</p>
                      <p className="text-zinc-900 text-xs font-black">₹{pricePerKm}</p>
                    </div>
                    <div className="bg-zinc-50 border border-zinc-100 rounded-lg px-2.5 py-1.5 text-center">
                      <p className="text-zinc-400 text-[8px] uppercase tracking-widest font-bold">Waiting</p>
                      <p className="text-zinc-900 text-xs font-black">₹{waitingCharge}<span className="text-[8px] font-normal text-zinc-500">/min</span></p>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={onBook}
                  className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-black text-white text-sm font-black py-3.5 rounded-xl transition-colors shadow-md mt-1"
                >
                  Book Now
                  <ArrowRight size={14} />
                </motion.button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}