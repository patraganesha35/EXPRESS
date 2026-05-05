"use client";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { useState } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FAQS = [
  {
    q: "How do I book a ride?",
    a: "You can easily book a ride by entering your pickup and drop-off locations on the home screen, selecting your preferred vehicle type, and confirming your booking."
  },
  {
    q: "Can I pay with cash?",
    a: "Yes, we support both online payments (via Razorpay) and cash payments. You can select your preferred payment method during checkout."
  },
  {
    q: "How do I become a vendor/driver?",
    a: "Click on the 'Login' button, create an account, and navigate to the 'Become a Partner' section in your profile to submit your vehicle and document details."
  },
  {
    q: "What types of vehicles are available?",
    a: "We offer Bikes, Autos, Cars, Loading Autos, and Trucks to cater to both passenger and goods transport needs."
  },
  {
    q: "Are the drivers verified?",
    a: "Absolutely. All our partners undergo a strict verification process including document checks and Video KYC before they can accept rides."
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="w-full min-h-screen flex flex-col bg-white">
      <Nav />
      <main className="flex-grow pt-32 pb-20 px-4 md:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 text-sm font-semibold tracking-widest uppercase text-violet-600 bg-violet-50 px-4 py-1.5 rounded-full mb-4">
              <MessageCircle size={16} /> FAQ
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-gray-500 text-lg">
              Got questions? We've got answers.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <div 
                key={i} 
                className={`border rounded-2xl overflow-hidden transition-colors ${openIndex === i ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100'}`}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none"
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.q}</span>
                  <ChevronDown 
                    size={20} 
                    className={`text-gray-400 transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {openIndex === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-5 text-gray-500 leading-relaxed"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
