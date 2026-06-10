"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  Loader2,
  PhoneOff,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import axios from "axios";

export default function VideoKYCPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const zpRef = useRef<any>(null);
  const joinedRef = useRef(false);

  const params = useParams();
  const router = useRouter();
  const { userData } = useSelector((state: RootState) => state.user);

  const roomId =
    typeof params?.roomId === "string"
      ? params.roomId
      : Array.isArray(params?.roomId)
      ? params.roomId[0]
      : null;

  const isAdmin = userData?.role === "admin";

  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [vendorData, setVendorData] = useState<any>(null);

  /* ================= FETCH VENDOR DOCS & DETAILS ================= */
  useEffect(() => {
    if (isAdmin && roomId) {
      const vendorId = roomId.split("-")[1];
      if (vendorId) {
        axios
          .get(`/api/admin/vendors/${vendorId}`)
          .then((res) => {
            if (res.data.success) {
              setVendorData(res.data.vendor);
            }
          })
          .catch((err) => console.error("Failed to fetch vendor data:", err));
      }
    }
  }, [isAdmin, roomId]);

  /* ================= CAMERA PREVIEW ================= */


const handleApprove = async () => {
  try {
    setActionLoading(true);

    const res = await fetch("/api/admin/vendors/video-kyc/complete", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roomId,
        action: "approve",
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    zpRef.current?.destroy(); // auto end call
    router.push("/admin/dashboard");
  } catch (err: any) {
    alert(err.message);
  } finally {
    setActionLoading(false);
  }
};

const handleReject = async () => {
  if (!rejectReason.trim()) {
    alert("Rejection reason required");
    return;
  }

  try {
    setActionLoading(true);

    const res = await fetch("/api/admin/vendors/video-kyc/complete", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roomId,
        action: "reject",
        reason: rejectReason,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    zpRef.current?.destroy();
    router.push("/admin/dashboard");
  } catch (err: any) {
    alert(err.message);
  } finally {
    setActionLoading(false);
  }
};

  useEffect(() => {
    if (joined) return;

    let localStream: MediaStream;

    const init = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        setStream(localStream);
        if (previewRef.current) {
          previewRef.current.srcObject = localStream;
        }
      } catch (err) {
        console.error(err);
      }
    };

    init();

    return () => {
      localStream?.getTracks().forEach((t) => t.stop());
    };
  }, [joined]);

  const toggleCamera = () => {
    if (!stream) return;
    stream.getVideoTracks().forEach(
      (track) => (track.enabled = !cameraOn)
    );
    setCameraOn(!cameraOn);
  };

  const toggleMic = () => {
    if (!stream) return;
    stream.getAudioTracks().forEach(
      (track) => (track.enabled = !micOn)
    );
    setMicOn(!micOn);
  };

  /* ================= START CALL ================= */

  const startCall = async () => {
    if (!roomId || !containerRef.current) return;
    if (joinedRef.current) return;

    joinedRef.current = true;
    setLoading(true);

    try {
      const appID = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID?.replace(/['"]/g, ""));
      const serverSecret =
        process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET?.replace(/['"]/g, "");

      const displayName = isAdmin
        ? "Admin"
        : `${userData?.name} (${userData?.email})`;

      const userId = userData?._id.toString()!;

      const kitToken =
        ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID,
          serverSecret!,
          roomId,
          userId,
          displayName
        );

      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zpRef.current = zp;

      zp.joinRoom({
        container: containerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.OneONoneCall,
        },
        showPreJoinView: false,
      });

      setJoined(true);
    } catch (err) {
      console.error(err);
      joinedRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  /* ================= ADMIN ACTIONS ================= */

  

 

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">

      {/* HEADER */}
      <header className="px-6 py-4 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">

        <div>
          <p className="font-semibold tracking-wider">
            RYDEX
          </p>
          <p className="text-xs text-gray-400">
            {isAdmin ? "Admin Verification" : "Vendor Video KYC"}
          </p>
        </div>

        {/* HEADER ACTIONS */}
        {joined && (
          <div className="flex flex-wrap gap-3">

            {isAdmin && (
              <>
                <button
                  onClick={() => setShowApproveModal(true)}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-full text-sm flex items-center gap-2"
                >
                  <CheckCircle size={16} />
                  Approve
                </button>

                <button
                  onClick={() => setShowRejectModal(true)}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-full text-sm flex items-center gap-2"
                >
                  <XCircle size={16} />
                  Reject
                </button>
              </>
            )}

            <button
              onClick={() => router.push("/")}
              className="bg-red-700 hover:bg-red-800 px-4 py-2 rounded-full text-sm flex items-center gap-2"
            >
              <PhoneOff size={16} />
              End Call
            </button>

          </div>
        )}
      </header>

      {/* BODY */}
      <div className={`flex-1 relative flex ${joined && isAdmin && vendorData ? "flex-col lg:flex-row" : "flex-col"} overflow-hidden`}>

        {/* LEFT COLUMN (Video + Details) */}
        <div className={`flex flex-col ${joined && isAdmin && vendorData ? "w-full lg:w-2/3 h-full overflow-y-auto" : "w-full h-full"}`}>
          
          <div
            ref={containerRef}
            className={`relative w-full ${joined && isAdmin && vendorData ? "h-[60vh] lg:h-[70vh] shrink-0" : "h-full"} ${
              joined ? "block" : "hidden"
            }`}
          />

          {joined && isAdmin && vendorData && (
            <div className="p-6 bg-black grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/10">
              {/* VEHICLE INFO */}
              {vendorData.vehicle && (
                <div className="bg-white/10 rounded-xl p-6 border border-white/10">
                  <h3 className="text-lg font-bold mb-4 border-b border-white/20 pb-2 text-white">
                    Vehicle Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Type</span>
                      <span className="font-semibold">{vendorData.vehicle.type || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Model</span>
                      <span className="font-semibold">{vendorData.vehicle.model || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Number Plate</span>
                      <span className="font-semibold text-yellow-400 tracking-wider">
                        {vendorData.vehicle.number || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* BANK INFO */}
              {vendorData.bank && (
                <div className="bg-white/10 rounded-xl p-6 border border-white/10">
                  <h3 className="text-lg font-bold mb-4 border-b border-white/20 pb-2 text-white">
                    Bank Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Account Holder</span>
                      <span className="font-semibold">{vendorData.bank.accountHolderName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">IFSC Code</span>
                      <span className="font-semibold tracking-widest">{vendorData.bank.ifsc || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">UPI ID</span>
                      <span className="font-semibold text-blue-300">{vendorData.bank.upi || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (Documents) */}
        {joined && isAdmin && vendorData && (
          <div className="w-full lg:w-1/3 h-full overflow-y-auto px-6 py-6 bg-[#111] border-l border-white/10">
            
            {/* DOCUMENTS */}
            {vendorData.documents && (
              <div className="mb-10">
                <h2 className="text-lg font-bold mb-4 border-b border-white/20 pb-2">
                  Vendor Documents
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                  {vendorData.documents.aadhaarUrl && (
                    <div className="bg-white/10 rounded-xl p-4 flex flex-col items-center">
                      <p className="text-sm font-semibold mb-3 text-gray-300">Aadhaar Card</p>
                      <img
                        src={vendorData.documents.aadhaarUrl}
                        alt="Aadhaar"
                        className="w-full h-48 object-cover rounded-lg border border-white/20"
                      />
                      <a href={vendorData.documents.aadhaarUrl} target="_blank" rel="noreferrer" className="mt-3 text-xs text-blue-400 hover:underline">
                        View Full Size
                      </a>
                    </div>
                  )}
                  {vendorData.documents.licenseUrl && (
                    <div className="bg-white/10 rounded-xl p-4 flex flex-col items-center">
                      <p className="text-sm font-semibold mb-3 text-gray-300">Driving License</p>
                      <img
                        src={vendorData.documents.licenseUrl}
                        alt="License"
                        className="w-full h-48 object-cover rounded-lg border border-white/20"
                      />
                      <a href={vendorData.documents.licenseUrl} target="_blank" rel="noreferrer" className="mt-3 text-xs text-blue-400 hover:underline">
                        View Full Size
                      </a>
                    </div>
                  )}
                  {vendorData.documents.rcUrl && (
                    <div className="bg-white/10 rounded-xl p-4 flex flex-col items-center">
                      <p className="text-sm font-semibold mb-3 text-gray-300">Vehicle RC</p>
                      <img
                        src={vendorData.documents.rcUrl}
                        alt="RC"
                        className="w-full h-48 object-cover rounded-lg border border-white/20"
                      />
                      <a href={vendorData.documents.rcUrl} target="_blank" rel="noreferrer" className="mt-3 text-xs text-blue-400 hover:underline">
                        View Full Size
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}

        {!joined && (
          <div className="h-full flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                <video
                  ref={previewRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-[300px] sm:h-[400px] object-cover"
                />

                {!cameraOn && (
                  <div className="absolute inset-0 bg-black flex items-center justify-center">
                    <VideoOff size={40} />
                  </div>
                )}
              </div>

              <div className="space-y-8 text-center lg:text-left">
                <h1 className="text-3xl sm:text-4xl font-bold">
                  Secure Video KYC
                </h1>

                <div className="flex justify-center lg:justify-start gap-6">
                  <button
                    onClick={toggleCamera}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition ${
                      cameraOn
                        ? "bg-white text-black"
                        : "bg-white/10 border border-white/20"
                    }`}
                  >
                    {cameraOn ? <Video /> : <VideoOff />}
                  </button>

                  <button
                    onClick={toggleMic}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition ${
                      micOn
                        ? "bg-white text-black"
                        : "bg-white/10 border border-white/20"
                    }`}
                  >
                    {micOn ? <Mic /> : <MicOff />}
                  </button>
                </div>

                <button
                  onClick={startCall}
                  disabled={loading}
                  className="w-full bg-white text-black py-4 rounded-xl font-semibold"
                >
                  {loading ? (
                    <span className="flex justify-center items-center gap-2">
                      <Loader2 className="animate-spin" size={18} />
                      Connecting...
                    </span>
                  ) : (
                    "Join Secure Call"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* APPROVE MODAL */}
      <AnimatePresence>
        {showApproveModal && (
          <Modal onClose={() => setShowApproveModal(false)}>
            <h2 className="text-lg font-semibold mb-4">
              Confirm Approval
            </h2>
            <div className="flex gap-4">
              <button
                onClick={() => setShowApproveModal(false)}
                className="flex-1 border rounded-xl py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 bg-green-600 rounded-xl py-2"
              >
                {actionLoading ? "Processing..." : "Approve"}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* REJECT MODAL */}
      <AnimatePresence>
        {showRejectModal && (
          <Modal onClose={() => setShowRejectModal(false)}>
            <h2 className="text-lg font-semibold mb-4">
              Reject Vendor
            </h2>
            <textarea
              value={rejectReason}
              onChange={(e) =>
                setRejectReason(e.target.value)
              }
              className="w-full bg-white/10 border border-white/20 rounded-xl p-3 mb-4 text-sm"
            />
            <div className="flex gap-4">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 border rounded-xl py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 bg-red-600 rounded-xl py-2"
              >
                {actionLoading ? "Processing..." : "Reject"}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="relative bg-[#111] w-full max-w-md rounded-2xl p-6 shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400"
        >
          <X size={16} />
        </button>

        {children}
      </motion.div>
    </motion.div>
  );
}